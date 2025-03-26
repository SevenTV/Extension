<template>
	<UiDraggable
		:handle="dragHandle"
		:initial-anchor="root"
		:initial-middleware="[shift({ crossAxis: true, mainAxis: true, padding: { top: 50 } })]"
		:initial-placement="'top'"
	>
		<div v-if="ctx.open" class="seventv-settings-menu-container">
			<div class="seventv-settings-menu">
				<div ref="dragHandle" class="seventv-settings-header">
					<div>
						<div class="seventv-settings-header-icon">
							<Logo7TV />
						</div>
					</div>
					<div />
					<button
						class="seventv-settings-header-icon seventv-header-button"
						@click.prevent="ctx.open = false"
					>
						<TwClose />
					</button>
				</div>
				<div class="seventv-settings-content">
					<!-- Sidebar -->
					<div class="seventv-settings-sidebar">
						<div class="seventv-settings-sidebar-search">
							<input
								v-model="filter"
								placeholder="Search..."
								type="text"
								name="search"
								autocomplete="off"
								class="seventv-settings-search-input"
							/>
						</div>

						<UiScrollable
							ref="sidebarScroller"
							class="seventv-settings-sidebar-categories-scroll"
							@container-scroll="updateSidebarExpansionIndicator"
						>
							<div class="seventv-settings-sidebar-categories">
								<SettingsUpdateButton v-if="!updater.isUpToDate" />
								<CategoryDropdown
									v-if="'home changelog version'.includes(filter.toLowerCase())"
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
									v-if="
										actor.user &&
										actor.user.style?.paint_id &&
										'paint tool subscriber color'.includes(filter.toLowerCase())
									"
									:style="{ color: 'var(--seventv-subscriber-color)' }"
									category="Paint Tool"
									:sub-categories="[]"
									@open-category="() => ctx.switchView('paint')"
								/>
								<CategoryDropdown
									v-if="'compatibility error fix check'.includes(filter.toLowerCase())"
									category="Compatibility"
									:sub-categories="[]"
									@open-category="() => ctx.switchView('compat')"
								/>
								<CategoryDropdown
									v-if="'backup restore config export import'.includes(filter.toLowerCase())"
									category="Backup"
									:sub-categories="[]"
									@open-category="() => ctx.switchView('backup')"
								/>
								<div class="seventv-settings-expansion-indicator" :hidden="!shouldShowSidebarExpansion">
									<div class="color-overlay">
										<div class="shade-1"></div>
										<div class="transparent-2"></div>
									</div>
									<button class="expansion-button" @click="scrollSidebarToNextPage()">
										<DropdownIcon class="expansion-icon" />
									</button>
								</div>
							</div>
						</UiScrollable>

						<div class="seventv-settings-sidebar-actor" @click="openProfile">
							<div class="seventv-settings-sidebar-profile-left">
								<div class="seventv-settings-sidebar-profile-picture">
									<template v-if="actor.user?.avatar_url">
										<img :src="actor.user!.avatar_url" />
									</template>
								</div>
								<span class="seventv-settings-sidebar-profile-text seventv-settings-expanded">
									{{ actor.token && actor.user ? actor.user.display_name : "SIGN IN" }}
								</span>
							</div>
							<div
								v-if="actor.token"
								class="seventv-settings-sidebar-profile-logout seventv-settings-expanded"
								@click.stop="actor.logout"
							>
								<LogoutIcon />
							</div>
						</div>
					</div>

					<div class="seventv-settings-view">
						<component :is="ctx.view" />
					</div>
				</div>
			</div>
		</div>
	</UiDraggable>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch, watchEffect } from "vue";
import { useBreakpoints, useEventListener, useKeyModifier } from "@vueuse/core";
import { useActor } from "@/composable/useActor";
import { useSettings } from "@/composable/useSettings";
import useUpdater from "@/composable/useUpdater";
import DropdownIcon from "@/assets/svg/icons/DropdownIcon.vue";
import LogoutIcon from "@/assets/svg/icons/LogoutIcon.vue";
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
	Backup: 6,
};

function navigateToCategory(name: string, scrollpoint?: string) {
	switch (name) {
		case "Compatibility":
			return ctx.switchView("compat");
		case "Backup":
			return ctx.switchView("backup");
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
			return node.type != "NONE" && node.path && node.path.length > 1;
		})
		.sort((a, b) => {
			if (!a.path) return -1;
			if (!b.path) return 1;

			const oa = getOrder(a.path[0]);
			const ob = getOrder(b.path[0]);
			if (oa !== ob) return oa - ob;

			const soa = a.path[1];
			const sob = b.path[1];

			if (soa != sob) return soa.localeCompare(sob);

			const pa = Number(a.path.at(2) ?? 0);
			const pb = Number(b.path.at(2) ?? 0);

			return pa - pb;
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

const sidebarScroller = ref<InstanceType<typeof UiScrollable>>();
const shouldShowSidebarExpansion = ref(true);

function updateSidebarExpansionIndicator() {
	const container = sidebarScroller.value?.container;
	if (!container) return;

	shouldShowSidebarExpansion.value = container.scrollTop < 3 && container.scrollHeight > container.clientHeight;
}

onMounted(() => updateSidebarExpansionIndicator());

function scrollSidebarToNextPage() {
	const container = sidebarScroller.value?.container;
	if (!container) return;

	const current = container.scrollTop;
	const visible = container.clientHeight;
	const height = container.scrollHeight;
	const bottomExtreme = visible - height;

	container.scrollTop = Math.max(0, Math.max(bottomExtreme, current + visible));
}

const openProfile = () => {
	ctx.view = null;
	nextTick(() => ctx.switchView("profile"));
};

const isAlt = useKeyModifier("Alt");
const isShift = useKeyModifier("Shift");
const isMeta = useKeyModifier("Meta");
const isCtrl = useKeyModifier("Control");

const keys = ref({
	p: false,
	s: false,
});

useEventListener(window, "keydown", updateKeys, { capture: true });
useEventListener(window, "keyup", updateKeys, { capture: true });

function updateKeys(e: KeyboardEvent) {
	const isPressed = e.type === "keydown";
	if (e.key.toUpperCase() === "S") {
		keys.value.s = isPressed;
	} else if (e.key.toUpperCase() === "P") {
		keys.value.p = isPressed;
	}
}

watchEffect(() => {
	if (isAlt.value && isShift.value && !(isMeta.value || isCtrl.value)) {
		if (keys.value.p && !keys.value.s) {
			ctx.switchView("paint");
		} else if (keys.value.s && !keys.value.p) {
			ctx.switchView("store");
		}
	}
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
// grid.layoutit.com?id=AZllBEL

@media (width <= 1120px) {
	// Large Screen
	:deep(.seventv-settings-expanded) {
		display: none !important;
	}
}

@media (width <= 960px) {
	// Small Screen
	:deep(.seventv-settings-compact) {
		display: none !important;
	}

	.seventv-settings-content {
		grid-template-columns: 4em 1fr !important;
		width: 75vw !important;
	}

	.seventv-settings-sidebar {
		grid-template-rows: 1fr auto !important;
	}

	.seventv-settings-sidebar-search {
		display: none !important;
	}
}

.seventv-settings-menu {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 4em 1.75fr;
	grid-template-areas:
		"header"
		"content";
	pointer-events: all;
	background: var(--seventv-background-shade-1);
	border-radius: 0.25rem;
	border: 0.1rem solid var(--seventv-border-transparent-1);
}

.seventv-settings-header {
	display: grid;
	grid-template-columns: 3.5em 1fr 3.5em;
	grid-template-rows: 1fr;
	place-items: center;
	cursor: move;
	padding: 0 0.5em;
	border-bottom: 0.1rem solid var(--seventv-border-transparent-1);

	.seventv-settings-header-icon {
		display: grid;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;

		> svg {
			font-size: 3rem;
		}
	}

	.seventv-header-button {
		cursor: pointer;
		color: currentcolor;

		&:hover {
			background: hsla(0deg, 0%, 30%, 32%);
		}
	}
}

.seventv-settings-view {
	grid-area: view;
}

.seventv-settings-sidebar {
	grid-area: sidebar;
	display: grid;
	grid-template-rows: 4em 1fr 4em;
	grid-template-areas:
		"search"
		"categories"
		"actor";
	background: var(--seventv-background-transparent-2);
	border-right: 0.1rem solid var(--seventv-border-transparent-1);

	.seventv-settings-sidebar-search {
		grid-area: search;
		padding: 0.5em;
		transition: width 0.2s ease;

		.seventv-settings-search-input {
			background-color: var(--seventv-background-shade-1);
			border-radius: 0.25em;
			height: 4rem;
			width: 100%;
			border: none;
			padding-left: 1rem;
			color: currentcolor;
			outline: none;
			transition: outline 140ms;

			&:focus {
				outline: 1px solid var(--seventv-primary);
			}
		}
	}

	.seventv-settings-sidebar-categories-scroll {
		border-top: 1px solid var(--seventv-border-transparent-1);
		border-bottom: 1px solid var(--seventv-border-transparent-1);
	}

	.seventv-settings-sidebar-actor {
		grid-area: actor;
		grid-template-columns: 0.6fr 1.8fr auto;
		grid-template-rows: 1fr;
		grid-template-areas: ". . .";
		display: grid;
		margin-top: auto;
		align-items: center;
		padding: 1rem;
		height: 100%;

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
				margin-left: 1em;
				font-size: 1em;
				font-weight: 700;

				// ellipsis overflow
				max-width: 8em;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}

		.seventv-settings-sidebar-profile-logout {
			padding: 0.5em 0;
			display: flex;
			margin-left: auto;
			cursor: pointer;

			> svg {
				height: 1.5em;
				width: 100%;
			}
		}
	}
}

.seventv-settings-content {
	grid-area: content;
	display: grid;
	grid-template-columns: 16em 1fr;
	grid-template-rows: 1fr;
	grid-template-areas: "sidebar view";
	width: 50vw;
	overflow-y: clip;

	.seventv-settings-sidebar,
	.seventv-settings-view {
		height: calc(60vh);
	}
}

.seventv-settings-expansion-indicator {
	display: flex;
	align-items: center;
	justify-content: center;
	position: absolute;
	bottom: 0;
	width: 100%;
	padding: 1rem;
	pointer-events: none;
	opacity: 1;
	transition: opacity linear 200ms;

	.color-overlay {
		position: absolute;
		width: 100%;
		height: 100%;
		mask-image: linear-gradient(to top, rgba(0, 0, 0, 100%), rgba(0, 0, 0, 0%));
		/* stylelint-disable-next-line property-no-vendor-prefix */
		-webkit-mask-image: linear-gradient(to top, rgba(0, 0, 0, 100%), rgba(0, 0, 0, 0%));

		> * {
			position: absolute;
			width: 100%;
			height: 100%;
		}

		.shade-1 {
			background: var(--seventv-background-shade-1);
		}

		.transparent-2 {
			background: var(--seventv-background-transparent-2);
		}
	}

	.expansion-button {
		outline: none;
		display: block;
		border-radius: 0.4rem;
		background: transparent;
		pointer-events: auto;
		margin-top: 3rem;
		padding: 0.6rem;

		&:hover {
			background: var(--seventv-highlight-neutral-1);
		}
	}

	&[hidden] {
		opacity: 0;

		.expansion-button {
			pointer-events: none;
		}
	}

	.expansion-icon {
		font-size: 1.75rem;
		transform: rotate(180deg);
	}
}
</style>
