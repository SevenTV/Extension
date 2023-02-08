<template>
	<SettingsMenuButton @toggle="toggle" />

	<UiDraggable
		:handle="dragHandle"
		:initial-anchor="root"
		:initial-middleware="[shift({ crossAxis: true, mainAxis: true, padding: { top: 50 } })]"
		:initial-placement="'top'"
	>
		<div v-if="show" class="seventv-settings-menu-container">
			<div class="settings-menu">
				<div class="header">
					<div ref="dragHandle" class="header-left">
						<div class="header-icon">
							<Logo7TV />
						</div>
						<h4>{{ appName }} Settings</h4>
					</div>
					<button class="header-icon header-button close-icon" @click.prevent="toggle">
						<TwClose />
					</button>
				</div>
				<div class="body">
					<!-- Sidebar -->
					<div class="seventv-settings-sidebar">
						<div class="settings-search">
							<input v-model="filter" class="settings-search-input" />
							<div class="search-icon">
								<SearchIcon />
							</div>
						</div>
						<UiScrollable>
							<CategoryDropdown category="Home" :subs="{}" @category-click="setViewToHome()" />
							<template v-for="[category, subs] of Object.entries(mappedNodes)" :key="category">
								<CategoryDropdown
									:category="category"
									:subs="subs"
									@category-click="setViewToSettings(category)"
									@subcategory-click="(s) => setViewToSettings(category, s)"
								/>
							</template>
						</UiScrollable>
						<div class="sidebar-profile">
							<div class="sidebar-profile-left" @click="setViewToProfile">
								<div class="sidebar-profile-picture">
									<template v-if="user?.avatar_url">
										<img :src="user!.avatar_url" />
									</template>
								</div>
								<span class="sidebar-profile-text expanded">
									{{ user ? "Profile" : "Login" }}
								</span>
							</div>
							<div v-if="user" class="sidebar-profile-logout expanded" @click="logOut">
								<LogoutIcon />
							</div>
						</div>
					</div>
					<!-- Setting area -->
					<div class="settings-area">
						<KeepAlive>
							<HomeView v-if="area.type == AreaTypes.FRONTPAGE" />
						</KeepAlive>
						<SettingsView
							v-if="area.type == AreaTypes.SETTINGS"
							:category="area.category!"
							:scrollpoint="area.scrollpoint"
							:nodes="mappedNodes"
						/>
						<KeepAlive>
							<ProfileView v-if="area.type == AreaTypes.PROFILE" :user="user" />
						</KeepAlive>
					</div>
				</div>
			</div>
		</div>
	</UiDraggable>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { until, watchThrottled } from "@vueuse/shared";
import { DecimalToStringRGBA } from "@/common/Color";
import { getModule } from "@/composable/useModule";
import { useConfig, useSettings } from "@/composable/useSettings";
import LogoutIcon from "@/assets/svg/icons/LogoutIcon.vue";
import SearchIcon from "@/assets/svg/icons/SearchIcon.vue";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
import TwClose from "@/assets/svg/twitch/TwClose.vue";
import CategoryDropdown from "./CategoryDropdown.vue";
import { Area, AreaTypes, getOrder } from "./SettingNames";
import SettingsMenuButton from "./SettingsMenuButton.vue";
import { HomeView, ProfileView, SettingsView } from "./areas";
import { GetCurrentUser, sendRequest } from "./areas/profile/gql";
import UiDraggable from "@/ui/UiDraggable.vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import { shift } from "@floating-ui/core";

const appName = import.meta.env.VITE_APP_NAME;

const authToken = useConfig<string>("app.seventv_bearer_token");

const mod = getModule("settings");

const { getNodes } = useSettings();

const allNodes = ref(getNodes());
const sortedNodes = ref<SevenTV.SettingNode[]>([]);
const mappedNodes = ref<Record<string, Record<string, SevenTV.SettingNode[]>>>({
	Home: {},
});

// The useDraggable needs an element to use middleware
const root = document.getElementById("root") ?? undefined;
const show = ref(false);
const dragHandle = ref<HTMLDivElement | undefined>();

const area = ref({ type: AreaTypes.FRONTPAGE } as Area);
const filter = ref("");

const user = ref<SevenTV.User>();

function toggle() {
	show.value = !show.value;
}

function setArea(newArea: Area) {
	show.value = true;
	area.value = newArea;
}

function setViewToHome() {
	setArea({
		type: AreaTypes.FRONTPAGE,
	});
}

function setViewToSettings(c: string, s?: string) {
	setArea({
		type: AreaTypes.SETTINGS,
		category: c,
		scrollpoint: s,
	});
}

function setViewToProfile() {
	setArea({ type: AreaTypes.PROFILE });
}

function logOut() {
	const confirmed = window.confirm("Are you sure you want to log out?");
	if (!confirmed) return;
	authToken.value = "";
	user.value = undefined;
}

function sortNodes(nodes: typeof allNodes.value) {
	sortedNodes.value = Object.values(nodes)
		.filter((node) => {
			return node.type != "NONE" && node.path && node.path.length == 2;
		})
		.sort((a, b) => {
			if (!a.path) return -1;
			if (!b.path) return 1;

			const oa = getOrder(a.path[0]);
			const ob = getOrder(b.path[0]);
			return oa == ob ? a.path[1].localeCompare(b.path[1]) : oa - ob;
		});
}

function filterAndMapNodes(filter: string) {
	const temp = {} as Record<string, Record<string, SevenTV.SettingNode[]>>;
	const f = filter.toLowerCase();
	for (const node of sortedNodes.value) {
		// Search in label
		// Search in hint
		if (!node.label.toLowerCase().includes(f) && node.hint?.toLowerCase().includes(f) === false) continue;

		const c = node.path![0];
		const s = node.path![1];

		if (!temp[c]) temp[c] = {};
		if (!temp[c][s]) temp[c][s] = [];

		temp[c][s].push(node);
	}
	mappedNodes.value = temp;
}

watch(allNodes, sortNodes, { immediate: true });
watchThrottled(filter, filterAndMapNodes, { throttle: 250, immediate: true });

watch(
	authToken,
	async () => {
		if (!authToken.value) return;

		const res = await sendRequest(authToken.value, GetCurrentUser, {});
		if (!res) return;
		const json = await res.json();

		user.value = json.data.user as SevenTV.User;
	},
	{ immediate: true },
);

document.body.style.setProperty(
	"--seventv-current-user-profile-color",
	user.value?.style?.color ? DecimalToStringRGBA(user.value.style.color ?? 0) : "#888888c4",
);

onMounted(() => {
	until(mod)
		.toMatch((v) => !!v?.instance)
		.then(() => {
			if (!mod?.instance) return;

			mod.instance.toggle = toggle;
			mod.instance.setArea = setArea;
			mod.instance.setFrontpageArea = setViewToHome;
			mod.instance.setSettingsArea = setViewToSettings;
			mod.instance.setProfileArea = setViewToProfile;
		});
});
</script>

<style scoped lang="scss">
@media (max-width: 70rem) {
	:deep(.expanded) {
		display: none !important;
	}

	.seventv-settings-sidebar {
		max-width: 5rem;
		display: flex;
		flex-direction: column;

		.settings-search:focus-within {
			width: 18rem;
			margin-right: -18rem;
		}
	}
}

@media (max-width: 60rem) {
	:deep(.area-compact) {
		display: none !important;
	}
	.settings-area {
		width: 27rem !important;
	}
}

.settings-menu {
	display: flex;
	flex-direction: column;
	max-height: calc(100vh - 10rem);
	pointer-events: all;

	background: var(--seventv-background-lesser-transparent-1);
	border-radius: 0.25rem;
	border: 1px solid var(--seventv-border-transparent-1);
}

.header {
	border-bottom: 1px solid var(--seventv-border-transparent-1);
	display: flex;
	width: 100%;
	align-items: center;
	justify-content: center;
	background: var(--seventv-background-transparent-2);
	flex-shrink: 0;

	> .header-left {
		display: flex;
		cursor: move;
		align-items: center;
		flex-shrink: 0;
		flex-grow: 1;
		column-gap: 1rem;
		padding-left: 0.5rem;
	}

	> .draggable {
		cursor: move;
		height: 4rem;
		flex-grow: 1;
	}
	.header-icon {
		display: flex;
		height: 100%;
		border-radius: 0.25rem;
		margin: 0.5rem;

		> svg {
			height: 3rem;
			width: 3rem;
		}
	}
	.header-button {
		cursor: pointer;
		color: currentColor;

		&:hover {
			background: hsla(0deg, 0%, 30%, 32%);
		}
	}

	.close-icon {
		float: right;
	}
}

.body {
	display: flex;
	height: 60rem;
	overflow: hidden;
	flex-shrink: 1;
}

.seventv-settings-sidebar {
	width: 20rem;

	display: flex;
	flex-direction: column;
	flex-shrink: 0;
	flex-grow: 1;
	box-sizing: content-box;
	border-right: 1px solid var(--seventv-border-transparent-1);

	.settings-search {
		padding: 0.5rem 0.5rem 0;
		width: 100%;
		position: relative;
		transition: width 0.2s ease;
		z-index: 999;

		.search-icon {
			position: absolute;
			display: flex;
			align-items: center;
			top: 0;
			left: 0;
			height: 5rem;
			width: 5rem;
			user-select: none;
			pointer-events: none;
			padding: 1.75rem;

			> svg {
				height: 100%;
				width: 100%;
			}
		}

		.settings-search-input {
			background-color: var(--seventv-background-shade-1);
			border-radius: 0.25rem;
			height: 4rem;
			width: 100%;
			border: 1px solid var(--seventv-border-transparent-1);
			padding-left: 3rem;
			color: currentColor;
		}
	}

	.sidebar-profile {
		display: flex;
		height: 5rem;
		border-top: 1px solid var(--seventv-border-transparent-1);
		flex-shrink: 0;
		margin-top: auto;
		align-items: center;
		float: bottom;
		padding: 1rem;

		.sidebar-profile-left {
			cursor: pointer;
			display: flex;
			align-items: center;
			.sidebar-profile-picture {
				height: 3rem;
				width: 3rem;
				border: 1px solid var("--seventv-current-user-profile-color");
				border-radius: 3rem;
				overflow: hidden;

				> img {
					height: 3rem;
					width: 3rem;
				}
			}
			.sidebar-profile-text {
				margin-left: 1rem;
				font-size: 1.6rem;
			}
		}

		.sidebar-profile-logout {
			padding: 0.5rem 0;
			display: flex;
			margin-left: auto;
			cursor: pointer;
			> svg {
				height: 2rem;
				width: 100%;
			}
		}
	}
}
.settings-area {
	width: 80rem;
	max-height: 60rem;
}
</style>
