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
							<SettingsUpdateButton v-if="!updater.isUpToDate" />
							<CategoryDropdown
								category="Home"
								:sub-categories="[]"
								@open-category="() => ctx.switchView('home')"
							/>
							<template v-for="[n, subCategories] of Object.entries(ctx.mappedNodes)" :key="n.key">
								<CategoryDropdown
									:category="n"
									:sub-categories="Object.keys(subCategories)"
									:show-sub-categories="isExpanded"
									@open-category="navigateToCategory(n)"
									@open-subcategory="(s) => navigateToCategory(n, s)"
								/>
							</template>
							<CategoryDropdown
								category="Compatibility"
								:sub-categories="[]"
								@open-category="() => ctx.switchView('compat')"
							/>
						</UiScrollable>
						<div
							class="seventv-settings-sidebar-profile"
							@click="[openAuthWindow(), ctx.switchView('profile')]"
						>
							<div class="seventv-settings-sidebar-profile-left">
								<div class="seventv-settings-sidebar-profile-picture">
									<template v-if="actor.user?.avatar_url">
										<img :src="actor.user!.avatar_url" />
									</template>
								</div>
								<span class="seventv-settings-sidebar-profile-text seventv-settings-expanded">
									{{ actor.user ? actor.user.display_name : "SIGN IN" }}
								</span>
							</div>
							<div
								v-if="actor.user"
								class="seventv-settings-sidebar-profile-logout seventv-settings-expanded"
								@click="actor.logout()"
							>
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
import { inject, nextTick, ref, watch } from "vue";
import { useBreakpoints, useMagicKeys } from "@vueuse/core";
import { SITE_CURRENT_PLATFORM } from "@/common/Constant";
import { useActor } from "@/composable/useActor";
import { useSettings } from "@/composable/useSettings";
import useUpdater from "@/composable/useUpdater";
import LogoutIcon from "@/assets/svg/icons/LogoutIcon.vue";
import SearchIcon from "@/assets/svg/icons/SearchIcon.vue";
import Logo7TV from "@/assets/svg/logos/Logo7TV.vue";
import TwClose from "@/assets/svg/twitch/TwClose.vue";
import { useSettingsMenu } from "./Settings";
import SettingsUpdateButton from "./SettingsUpdateButton.vue";
import CategoryDropdown from "@/app/settings/CategoryDropdown.vue";
import UiDraggable from "@/ui/UiDraggable.vue";
import UiScrollable from "@/ui/UiScrollable.vue";
import { shift } from "@floating-ui/core";

const ctx = useSettingsMenu();
const settings = useSettings();
const actor = useActor();
const updater = useUpdater();

// The useDraggable needs an element to use middleware
const root = document.getElementById("root") ?? undefined;
const dragHandle = ref<HTMLDivElement | undefined>();

const filter = ref("");
const platform = inject(SITE_CURRENT_PLATFORM, "UNKNOWN");

const breakpoints = useBreakpoints({
	compact: 960,
	expanded: 1120,
});
const isExpanded = breakpoints.greater("expanded");

const categoryOrder = {
	General: 0,
	Chat: 1,
	Channel: 2,
	Highlights: 3,
	Appearance: 4,
	Compatibility: 5,
};

function navigateToCategory(name: string, scrollpoint?: string) {
	switch (name) {
		case "Compatibility":
			return ctx.switchView("compat");
	}

	ctx.switchView("config");
	ctx.scrollpoint = "";
	ctx.category = name;

	if (scrollpoint) nextTick(() => (ctx.scrollpoint = scrollpoint));
}

function sortNodes(filter?: string) {
	const nodes = settings.nodes;

	ctx.mappedNodes = {};

	const sorted = Object.values(nodes)
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

	const a = sorted.filter((node) => {
		if (!node.path) return false;
		if (!node.label) return false;
		if (filter && !node.label.toLowerCase().includes(filter.toLowerCase())) return false;
		return true;
	});

	for (const node of a) {
		if (!node.path?.length) continue;
		const cat = node.path[0];
		const subCat = node.path[1];

		if (!ctx.mappedNodes[cat]) ctx.mappedNodes[cat] = {};
		if (!ctx.mappedNodes[cat][subCat]) ctx.mappedNodes[cat][subCat] = [];

		ctx.mappedNodes[cat][subCat].push(node);
	}
}

function getOrder(c: string | undefined) {
	return c && isOrdered(c) ? categoryOrder[c] : -1;
}

function isOrdered(c: string): c is keyof typeof categoryOrder {
	return c in categoryOrder;
}

function openAuthWindow(): void {
	actor.openAuthorizeWindow(platform);
}

const keys = useMagicKeys();
const paintToolShortcut = keys["Alt+Shift+P"];

watch(paintToolShortcut, (press) => {
	if (!press) return;

	ctx.switchView("paint");
});

watch(
	[settings.nodes, filter],
	() => {
		sortNodes(filter.value);

		if (ctx.seen.length === 0) {
			ctx.markSettingAsSeen(...Object.keys(settings.nodes));
		}
	},
	{ immediate: true },
);
</script>

<style scoped lang="scss">
@media (width <= 1120px) {
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

@media (width <= 960px) {
	:deep(.seventv-settings-compact) {
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
	background: var(--seventv-background-shade-1);
	border-radius: 0.25rem;
	outline: 0.1rem solid var(--seventv-border-transparent-1);
}

.seventv-settings-header {
	display: flex;
	width: 100%;
	align-items: center;
	justify-content: center;
	background: var(--seventv-background-transparent-3);
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
		color: currentcolor;

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
	background: var(--seventv-background-transparent-2);

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
			border: none;
			padding-left: 3rem;
			color: currentcolor;
			outline: none;
			transition: outline 140ms;

			&:focus {
				outline: 1px solid var(--seventv-primary);
			}
		}
	}

	.seventv-settings-sidebar-profile {
		display: flex;
		height: 5rem;
		flex-shrink: 0;
		margin-top: auto;
		align-items: center;
		float: bottom;
		padding: 1rem;

		&:hover {
			cursor: pointer;
			background: var(--seventv-highlight-neutral-1);
		}

		.seventv-settings-sidebar-profile-left {
			cursor: pointer;
			display: flex;
			align-items: center;

			.seventv-settings-sidebar-profile-picture {
				height: 3rem;
				width: 3rem;
				background-color: var(--seventv-background-shade-1);
				clip-path: circle(50% at 50% 50%);
				overflow: clip;
				border-radius: 50%;
			}

			.seventv-settings-sidebar-profile-text {
				margin-left: 1rem;
				font-size: 1.5rem;
				font-weight: 700;
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
