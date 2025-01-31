import { tryOnUnmounted } from "@vueuse/core";

const soundMap = new Map<string, HTMLAudioElement>();

/**
 * Play a sound using XHR
 *
 * @param path the path to the sound file, prepended by the assets URL set by the loader
 * @param reuse whether to reuse the audio element for the same path
 */
export function useSound(path: string, reuse = true) {
	const existingAudio = soundMap.get(path);
	const audio = reuse && existingAudio ? existingAudio : new Audio();

	const play = (volume: number = 1) => {
		if (existingAudio) {
			existingAudio.volume = volume;
			existingAudio.play();
			return;
		}

		fetchAudio(path).then((blobUrl) => {
			audio.src = blobUrl;
			audio.volume = volume;
			audio.play();

			if (reuse) soundMap.set(path, audio);
		});
	};

	const stop = () => audio.pause();

	tryOnUnmounted(() => {
		audio.remove();
	});

	return { play, stop, audio };
}

function fetchAudio(path: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("GET", path, true);
		xhr.responseType = "blob";

		xhr.onload = () => {
			if (xhr.status === 200) {
				const contentType = xhr.getResponseHeader("Content-Type") || "audio/mpeg";
				const blob = new Blob([xhr.response], { type: contentType });
				resolve(URL.createObjectURL(blob));
			} else {
				reject(new Error(`HTTP error: ${xhr.status} - ${xhr.statusText}`));
			}
		};

		xhr.onerror = () => reject(new Error("Network error while fetching audio"));
		xhr.send();
	});
}

export interface Sound {
	play: (volume?: number) => void;
	stop: () => void;
	audio: HTMLAudioElement;
}
