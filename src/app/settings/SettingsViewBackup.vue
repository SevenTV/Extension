<template>
	<main class="seventv-settings-backup">
		<h3>
			Backup
			<p>Export your current settings or import from a settings file</p>
		</h3>

		<div v-if="error">
			<p class="export-error">There was an error exporting/importing your settings!</p>
		</div>
		<UiButton @click="exportSettings">Export</UiButton>
		<UiButton @click="importSettings">Import</UiButton>
	</main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useStore } from "@/store/main";
import { SerializedSettings, deserializeSettings, exportSettings as e } from "@/composable/useSettings";
import UiButton from "@/ui/UiButton.vue";

const { platform } = useStore();

const error = ref<boolean>(false);

async function exportSettings() {
	error.value = false;

	e(platform).catch((err) => {
		error.value = true;
		console.error(err);
	});
}

async function importSettings() {
	error.value = false;

	const fileList = await open();
	if (!fileList) return;

	console.log(fileList);
	const raw = await read(fileList[0]);

	let serialized: SerializedSettings;
	try {
		serialized = JSON.parse(raw);
	} catch (err) {
		console.error(err);
		error.value = true;
		return;
	}
	console.log(serialized);

	let deserializedSettings: SevenTV.Setting<SevenTV.SettingType>[] = [];
	try {
		deserializedSettings = deserializeSettings(serialized);
	} catch (err) {
		console.error(err);
		error.value = true;
		return;
	}

	console.log(deserializedSettings);
	// TODO: overwrite settings store
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
	.export-error {
		color: rgb(196, 43, 43);
	}
}
</style>
