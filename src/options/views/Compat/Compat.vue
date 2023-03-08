<template>
	<!-- Compat takes a look at the user's extensions for compatibility issues -->
	<main class="seventv-compat">
		<div class="seventv-compat-heading">
			<template v-if="hasManagementPermission">
				<div class="seventv-compat-list">
					<div
						v-for="[ext, compat] of compatList"
						:key="ext.id"
						class="seventv-compat-extension-item"
						:has-issues="!!compat.issues.length"
						:is-disabled="!ext.enabled"
						:style="{
							filter: getColorBorder(compat),
						}"
					>
						<div class="ext-heading">
							<img :src="ext.icons?.at(-1)?.url ?? ''" />
							<h3>
								{{ ext.name }}
								<span v-if="ext.shortName && ext.name !== ext.shortName">({{ ext.shortName }})</span>
								<span>{{ ext.versionName ?? ext.version }}</span>
							</h3>
						</div>

						<UiScrollable>
							<div v-if="compat.issues.length" class="ext-compat-concern-list">
								<div v-for="(iss, i) of compat.issues" :key="i" class="ext-compat-concern">
									<h4 :style="{ color: severityMap[iss.severity] }">
										{{ iss.severity.replace("_", " ") }}
									</h4>
									<p>{{ iss.message }}</p>
								</div>
							</div>
						</UiScrollable>

						<div v-if="compat.issues.length && ext.enabled" class="ext-compat-interact">
							<button @click="disableExtension(ext)">DISABLE</button>
						</div>
					</div>
				</div>
			</template>

			<!-- Ask for Permission -->
			<template v-else>
				<div class="seventv-compat-permission-request">
					<UiButton class="ui-button-important" @click="requestManagement">
						<span>Check Compatibility</span>
					</UiButton>
					<UiButton v-if="internal" class="ui-button-hollow" @click="emit('skip')"> No thanks </UiButton>
				</div>
			</template>
		</div>
	</main>
</template>

<script setup lang="ts">
import { inject, reactive, ref, watch } from "vue";
import { OPTIONS_CONTEXT_KEY } from "@/options/keys";
import UiButton from "@/ui/UiButton.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const emit = defineEmits<{
	(e: "skip"): void;
}>();

defineProps<{
	internal: boolean;
}>();

const config = ref<SevenTV.Config | null>(null);
const extensions = ref<ExtensionInfo[]>([]);
const compatList = reactive(new Map<ExtensionInfo, SevenTV.ConfigCompat>());

const hasManagementPermission = ref(false);
const isExtensionContext = inject(OPTIONS_CONTEXT_KEY, false);
const severityMap: Record<SevenTV.ConfigCompatIssueSeverity, string> = {
	WARNING: "#ff5722",
	CLASHING: "#f44336",
	DUPLICATE_FUNCTIONALITY: "#ffc107",
	NOTE: "#2196f3",
	BAD_PERFORMANCE: "#c9427b",
};

const configName =
	"extension" + (import.meta.env.VITE_APP_VERSION_BRANCH ? `-${import.meta.env.VITE_APP_VERSION_BRANCH}` : "");
fetch(`${import.meta.env.VITE_APP_API}/config/${configName}`)
	.then((r) => r.json() as Promise<SevenTV.Config>)
	.then((r) => (config.value = r));

function requestManagement(): void {
	chrome.permissions.request(
		{
			permissions: ["management"],
		},
		(granted) => {
			hasManagementPermission.value = granted;
		},
	);
}

function checkExtensions(): void {
	chrome.management.getAll((result) => {
		extensions.value.length = 0;
		compatList.clear();

		extensions.value = result.filter((e) => e.type === "extension");

		for (const ext of extensions.value) {
			const compat = config.value?.compatibility?.find((c) => c.id.includes(ext.id));

			compatList.set(
				ext,
				compat ?? {
					id: [],
					issues: [],
				},
			);
		}
	});
}

function disableExtension(ext: ExtensionInfo): void {
	chrome.management.setEnabled(ext.id, false, () => {
		ext.enabled = false;
	});
}

function getColorBorder(compat: SevenTV.ConfigCompat): string {
	return compat.issues.map((i) => `drop-shadow(0 0 0.1rem ${severityMap[i.severity]})`).join(" ");
}

// check current status of management permission
if (isExtensionContext && chrome && chrome.permissions) {
	chrome.permissions.contains(
		{
			permissions: ["management"],
		},
		(v) => (hasManagementPermission.value = v),
	);
}

watch(
	[hasManagementPermission, config],
	([v]) => {
		if (!v) return;

		checkExtensions();
	},
	{
		immediate: true,
	},
);

type ExtensionInfo = chrome.management.ExtensionInfo & { versionName?: string };
</script>

<style scoped lang="scss">
main.seventv-compat {
	width: 100%;
	padding: 0.25rem;

	h2 {
		font-size: 1.5rem;
	}

	.seventv-compat-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
		gap: 0.5rem;
	}

	.seventv-compat-extension-item {
		display: grid;
		grid-template-rows: auto 60% 15%;
		row-gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 0.25rem;
		background: var(--seventv-background-shade-3);
		opacity: 0.5;
		height: 16rem;

		&[has-issues="true"] {
			opacity: 1;
		}

		&[is-disabled="true"] {
			opacity: 0.25;

			h3,
			span {
				text-decoration: line-through;
			}

			.ext-heading::after {
				content: " (Disabled)";
				margin-left: 0.5rem;
				text-decoration: none !important;
				color: var(--seventv-warning);
			}
		}

		.ext-compat-concern-list {
			display: grid;
			row-gap: 0.25rem;
			height: 10rem;
			margin: 0 0.5rem;
		}

		.ext-compat-interact {
			display: flex;
			align-items: flex-end;
		}
		.ext-compat-interact > button {
			all: unset;
			padding: 0.25rem 0.5rem;
			border-radius: 0.25rem;
			font-size: 0.75rem;
			transition: all 0.2s ease-in-out;
			background: var(--seventv-background-shade-2);
			font-weight: 600;

			&:hover {
				cursor: pointer;
				background: var(--seventv-highlight-neutral-1);
			}
		}

		.ext-heading {
			display: flex;
			overflow: clip;

			img {
				width: 2rem;
				height: 2rem;
				margin-right: 1rem;
			}

			h3 {
				font-size: 1rem;
				font-weight: 500;
				margin: 0;
				text-overflow: ellipsis;

				span {
					color: var(--seventv-muted);
					font-size: 0.75rem;
					font-weight: 400;
					margin-left: 0.5rem;
				}
			}
		}
	}

	.seventv-compat-permission-request {
		display: flex;
		justify-content: center;
		column-gap: 1rem;
		padding: 1rem;
		text-align: center;

		button {
			margin: 1rem 0;
			padding: 0 3rem;
			font-size: 2rem;
			text-align: center;
			height: 4rem;
		}

		p {
			font-size: 1.25rem;
			text-align: center;
		}
	}
}
</style>
