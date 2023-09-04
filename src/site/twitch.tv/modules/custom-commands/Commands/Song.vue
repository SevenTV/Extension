<template />
<script setup lang="ts">
import { onUnmounted } from "vue";
import { declareConfig, useConfig, useSettings } from "@/composable/useSettings";

const props = defineProps<{
	add: (c: Twitch.ChatCommand) => void;
	remove: (c: Twitch.ChatCommand) => void;
}>();

const oauth = useConfig<string>("commands.song.oauth");
const settings = useSettings();

async function doRequest(blobs: Blob[]): Promise<ApiResponse> {
	const blob = new Blob(blobs, { type: blobs[0].type });
	const file = new File([blob], "test.webm");

	const fd = new FormData();

	fd.append("api_token", oauth.value);
	fd.append("file", file);
	fd.append("return", "apple_music,spotify");

	const res = await fetch(URL, {
		method: "POST",
		body: fd,
	});

	const json = (await res.json()) as ApiResponse;
	return json;
}

async function startRecording() {
	const videoElement = document.querySelector(".video-player__container video") as HTMLCanvasElement;
	const stream = videoElement.captureStream();
	const mediaRecorder = new MediaRecorder(stream);
	const blobs = new Array<Blob>();

	mediaRecorder.ondataavailable = function (e) {
		blobs.push(e.data);
	};

	if (!stream.active)
		return {
			notice: "Stream not playing",
			error: "invalid_parameters",
		};

	mediaRecorder.start(1000);

	await new Promise((resolve) => setTimeout(resolve, 5000));
	mediaRecorder.stop();

	if (blobs.length < 1) {
		return {
			notice: "Audio recording error",
			error: "invalid_parameters",
		};
	}

	const res = await doRequest(blobs);

	if (res.status == "error")
		return {
			notice: res.error!.error_message,
			error: res.error?.error_code == 900 ? "unauthorized" : "invalid_parameters",
		};

	if (res.result)
		return {
			notice: `Song is:  ${res.result.artist} - ${res.result.title}`,
		};
	return {
		notice: "Could not recognize song",
	};
}

const handler: Twitch.ChatCommand.Handler = () => {
	if (navigator.mediaDevices) {
		return {
			deferred: startRecording(),
		};
	}
};

const command: Twitch.ChatCommand = {
	name: "song",
	description: "Try to recognize the song",
	helpText:
		"The extension will try to get the song using a music recognition api. It does this by listening to the stream for a few seconds and then sending that off to AudD. ",
	permissionLevel: 0,
	handler: handler,
	group: "7TV",
};

const URL = "https://api.audd.io/";

interface ApiResponse {
	status: "success" | "error";
	result?: {
		artist: string;
		title: string;
		album: string;
		release_date: string;
		label: string;
		timecode: string;
		song_link: string;
	};
	error?: {
		error_code: number;
		error_message: string;
	};
}

settings.register([
	declareConfig("commands.song.oauth", "INPUT", {
		path: ["Chat", "Commands"],
		label: "AudD api key",
		hint: "Input an AudD api key to use the /song command",
		defaultValue: "",
		options: {
			placeholder: "Key",
			type: "password",
		},
		predicate(v) {
			return v.length == 32 || v == "";
		},
		effect(v) {
			if (v) props.add(command);
			else props.remove(command);
		},
	}),
]);

onUnmounted(() => props.remove(command));
</script>
