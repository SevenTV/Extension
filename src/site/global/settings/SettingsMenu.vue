<template>
	<UiDraggable
		:handle="dragHandle"
		:initial-anchor="root"
		:initial-middleware="[shift({ crossAxis: true, mainAxis: true, padding: { top: 50 } })]"
		:initial-placement="'top'"
	>
		<div v-if="ctx.open" class="seventv-settings-menu-container">
			<div class="seventv-settings-menu">
				<div class="seventv-settings-header">
					<div ref="dragHandle" class="header-left">
						<div class="seventv-settings-header-icon">
							<Logo7TV />
						</div>
					</div>
					<button
						class="seventv-settings-header-icon seventv-header-button close-icon"
						@click.prevent="ctx.open = false"
					>
						<TwClose />
					</button>
				</div>
				<div class="body">
					<!-- Sidebar -->
					<div class="seventv-settings-sidebar">
						<div class="seventv-settings-search">
							<input v-model="filter" class="seventv-settings-search-input" />
							<div class="seventv-settings-search-icon">
								<SearchIcon />
							</div>
						</div>
						<UiScrollable>
							<CategoryDropdown
								category="Home"
								:subs="{}"
								@open-category="() => ctx.switchView('home')"
							/>
							<template v-for="[category, subs] of Object.entries(ctx.mappedNodes)" :key="category">
								<CategoryDropdown
									:category="category"
									:subs="subs"
									@open-category="navigateToCategory(category)"
									@open-subcategory="(s) => navigateToCategory(category, s)"
								/>
							</template>
						</UiScrollable>
						<div class="seventv-settings-sidebar-profile">
							<div class="seventv-settings-sidebar-profile-left" @click="ctx.switchView('profile')">
								<div class="seventv-settings-sidebar-profile-picture">
									<template v-if="actor.user?.avatar_url">
										<img :src="actor.user!.avatar_url" />
									</template>
								</div>
								<span class="seventv-settings-sidebar-profile-text seventv-expanded">
									{{ actor.user ? actor.user.display_name : "Login" }}
								</span>
							</div>
							<div v-if="actor.user" class="seventv-settings-sidebar-profile-logout seventv-expanded">
								<LogoutIcon />
							</div>
						</div>
					</div>
					<!-- Setting area -->
					<div class="seventv-settings-settings-area">
						<component :is="ctx.view" />
					</div>
				</div>
			</div>
		</div>
	</UiDraggable>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { watchThrottled } from "@vueuse/shared";
import { useActor } from "@/composable/useActor";
import { useSettings } from "@/composable/useSettings";
import CategoryDropdown from "@/site/global/settings/CategoryDropdown.vue";
import LogoutIcon from "@/assets/svg/icons/LogoutIcon.vue";
import SearchIcon from "@/assets/svg/icons/SearchIcon.vue";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
import TwClose from "@/assets/svg/twitch/TwClose.vue";
import { useSettingsMenu } from "./Settings";
import UiDraggable from "@/ui/UiDraggable.vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import { shift } from "@floating-ui/core";

const ctx = useSettingsMenu();
const settings = useSettings();
const actor = useActor();

// The useDraggable needs an element to use middleware
const root = document.getElementById("root") ?? undefined;
const dragHandle = ref<HTMLDivElement | undefined>();

const filter = ref("");

function navigateToCategory(name: string, scrollpoint?: string) {
	ctx.switchView("config");
	ctx.category = name;

	if (scrollpoint) ctx.scrollpoint = scrollpoint;
}

function sortNodes(nodes: typeof settings.nodes) {
	ctx.sortedNodes = Object.values(nodes)
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
	for (const node of ctx.sortedNodes) {
		// Search in label
		// Search in hint
		if (!node.label.toLowerCase().includes(f) && node.hint?.toLowerCase().includes(f) === false) continue;

		const c = node.path![0];
		const s = node.path![1];

		if (!temp[c]) temp[c] = {};
		if (!temp[c][s]) temp[c][s] = [];

		temp[c][s].push(node);
	}

	ctx.mappedNodes = temp;
}

function getOrder(c: string | undefined) {
	return c && isOrdered(c) ? categoryOrder[c] : -1;
}

function isOrdered(c: string): c is keyof typeof categoryOrder {
	return c in categoryOrder;
}

const categoryOrder = {
	General: 0,
	Chat: 1,
	Appearance: 2,
};

watch(settings.nodes, sortNodes, { immediate: true });
watchThrottled(filter, filterAndMapNodes, { throttle: 250, immediate: true });
</script>

<style scoped lang="scss">
@media (max-width: 70rem) {
	:deep(.seventv-settings-expanded) {
		display: none !important;
	}

	.seventv-settings-sidebar {
		max-width: 5rem;
		display: flex;
		flex-direction: column;

		.seventv-settings-search:focus-within {
			width: 18rem;
			margin-right: -18rem;
		}
	}
}

@media (max-width: 60rem) {
	:deep(.area-compact) {
		display: none !important;
	}
	.seventv-settings-settings-area {
		width: 27rem !important;
	}
}

.seventv-settings-menu {
	display: flex;
	flex-direction: column;
	max-height: calc(100vh - 10rem);
	pointer-events: all;

	background: var(--seventv-background-lesser-transparent-1);
	border-radius: 0.25rem;
	border: 1px solid var(--seventv-border-transparent-1);
}

.seventv-settings-header {
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
	.seventv-settings-header-icon {
		display: flex;
		height: 100%;
		border-radius: 0.25rem;
		margin: 0.5rem;

		> svg {
			height: 3rem;
			width: 3rem;
		}
	}
	.seventv-header-button {
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

	.seventv-settings-search {
		padding: 0.5rem 0.5rem 0;
		width: 100%;
		position: relative;
		transition: width 0.2s ease;
		z-index: 999;

		.seventv-settings-search-icon {
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

		.seventv-settings-search-input {
			background-color: var(--seventv-background-shade-1);
			border-radius: 0.25rem;
			height: 4rem;
			width: 100%;
			border: 1px solid var(--seventv-border-transparent-1);
			padding-left: 3rem;
			color: currentColor;
		}
	}

	.seventv-settings-sidebar-profile {
		display: flex;
		height: 5rem;
		border-top: 1px solid var(--seventv-border-transparent-1);
		flex-shrink: 0;
		margin-top: auto;
		align-items: center;
		float: bottom;
		padding: 1rem;

		.seventv-settings-sidebar-profile-left {
			cursor: pointer;
			display: flex;
			align-items: center;
			.seventv-settings-sidebar-profile-picture {
				height: 3rem;
				width: 3rem;
				clip-path: circle(50% at 50% 50%);
			}
			.seventv-settings-sidebar-profile-text {
				margin-left: 1rem;
				font-size: 1.6rem;
			}
		}

		.seventv-settings-sidebar-profile-logout {
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
.seventv-settings-settings-area {
	width: 80rem;
	max-height: 60rem;
}
</style>
