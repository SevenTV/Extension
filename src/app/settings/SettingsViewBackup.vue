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
import { exportSettings as e } from "@/composable/useSettings";
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

	let parsed: any = {};
	try {
		parsed = JSON.parse(raw);
	} catch (err) {
		console.error(err);
		error.value = true;
		return;
	}
	console.log(parsed);

	if (!(parsed.settings instanceof Array)) {
		error.value = true;
		return;
	}

	const deserializedSettings: SevenTV.Setting<SevenTV.SettingType>[] = [];

	for (const { key, type, constructorName, value, timestamp } of parsed.settings) {
		if (key == undefined || type == undefined || value == undefined || timestamp == undefined)
			throw new Error("invalid settings file: missing keys");
		console.log(constructorName);

		if (typeof value !== type) throw new Error("invalid settings file: incorrect value for type");

		if (type !== "object") {
			deserializedSettings.push({
				key,
				type,
				value,
			});
		} else {
			if (!constructorName) throw new Error("invalid settings file: missing constructorName for object type");
			let deserializedValue: any;

			switch (constructorName) {
				case "Map": {
					deserializedValue = new Map(value);
					break;
				}
				case "Set": {
					deserializedValue = new Set(value);
					break;
				}
				default:
					throw new Error("invalid settings file: cannot deserialize constructor type");
			}

			deserializedSettings.push({
				key,
				type,
				value: deserializedValue,
			});
		}
	}
	console.log(deserializedSettings);
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
