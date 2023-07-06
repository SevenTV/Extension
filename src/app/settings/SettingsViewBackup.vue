<template>
	<main class="seventv-settings-backup">
		<h3>Backup</h3>
		<p>Export your current settings or import from a settings file</p>

		<div class="seventv-settings-backup-buttons">
			<UiButton class="seventv-settings-backup-button" @click="exportSettings">Export</UiButton>
			<UiButton class="seventv-settings-backup-button" @click="importSettings">Import</UiButton>
		</div>
		<div v-if="error">
			<p class="seventv-settings-backup-error">There was an error exporting/importing your settings!</p>
		</div>

		<div v-if="unserializableSettings.length > 0" class="seventv-settings-backup-warning-container">
			<h5 class="seventv-settings-backup-warning">
				Settings unable to export/import:
			</h5>
			<p v-for="label of unserializableSettings" :key="label" class="seventv-settings-backup-info">{{ label }}</p>
		</div>
	</main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useStore } from "@/store/main";
import { log } from "@/common/Logger";
import {
	SerializedSettings,
	deserializeSettings,
	exportSettings as e,
	getUnserializableSettings,
	importSettings as i,
} from "@/composable/useSettings";
import UiButton from "@/ui/UiButton.vue";

const { platform } = useStore();

const error = ref<boolean>(false);
const unserializableSettings = getUnserializableSettings()
	.map((s) => s.label)
	.filter((s) => s !== "");

async function exportSettings() {
	error.value = false;

	e(platform).catch((err) => {
		error.value = true;
		log.error("failed to export settings", err);
	});
}

async function importSettings() {
	error.value = false;

	const fileList = await open();
	if (!fileList) return;

	const raw = await read(fileList[0]);

	let serialized: SerializedSettings;
	try {
		serialized = JSON.parse(raw);
	} catch (err) {
		log.error("failed to parse settings file", (err as Error).message);
		error.value = true;
		return;
	}

	let deserializedSettings: SevenTV.Setting<SevenTV.SettingType>[] = [];
	try {
		deserializedSettings = deserializeSettings(serialized);
	} catch (err) {
		log.error("failed to deserialize settings file", (err as Error).message);
		error.value = true;
		return;
	}

	log.debugWithObjects(["<Settings>", "Deserialized settings file"], [deserializedSettings]);
	try {
		await i(deserializedSettings);
		log.info("<Settings>", "Loaded settings from file");
	} catch (err) {
		log.error("failed to save settings from file", (err as Error).message);
		error.value = true;
	}
}

async function open(): Promise<FileList | null> {
	return new Promise((res) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "application/json";

		input.onchange = () => res(input.files);
		input.oncancel = () => res(null);

		input.click();
	});
}

async function read(file: Blob): Promise<string> {
	return new Promise((res, rej) => {
		const fileReader = new FileReader();
		fileReader.readAsText(file, "utf-8");
		fileReader.onload = () => {
			res(fileReader.result as string);
		};
		fileReader.onerror = (err) => rej(err);
	});
}
</script>

<style scoped lang="scss">
main.seventv-settings-backup {
	display: flex;
	flex-direction: column;
	align-items: center;

	.seventv-settings-backup-error {
		color: rgb(196, 43, 43);
	}

	.seventv-settings-backup-warning {
		color: rgb(192, 192, 64);
	}

	.seventv-settings-backup-info {
		color: rgb(190, 190, 190);
	}

	.seventv-settings-backup-buttons {
		margin-top: 20px;

		.seventv-settings-backup-button {
			margin-left: 10px;
			margin-right: 10px;
			padding: 3px 20px;
		}
	}

	.seventv-settings-backup-warning-container {
		border: rgb(192, 192, 64) solid 1px;
		border-radius: 3px;
		padding: 10px;
		margin-top: 20px;
	}
}
</style>
