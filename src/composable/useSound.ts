import { tryOnUnmounted } from "@vueuse/core";

const soundMap = new Map<string, HTMLAudioElement>();

/**
 * Play a sound
 *
 * @param path the path to the sound file, prepended by the assets URL set by the loader
 * @param reuse whether to reuse the audio element for the same path
 */
export function useSound(path: string, reuse = true) {
	const existingAudioElement = soundMap.get(path);
	const audio = reuse && existingAudioElement ? existingAudioElement : new Audio();

	const play = (volume: number = 1) => {
		if (reuse && existingAudioElement) {
			existingAudioElement.volume = volume;
			existingAudioElement.play();
			return;
		}

		fetchAudio(path).then((blobUrl) => {
			audio.src = blobUrl;
			audio.volume = volume;
			audio.play();
			soundMap.set(path, audio);
		});
	};

	const stop = () => audio.pause();

	tryOnUnmounted(() => {
		audio.remove();
	});

	return { play, stop, audio };
}

async function fetchAudio(path: string): Promise<string> {
	const response = await fetch(path);
	if (!response.ok) {
		throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
	}
	return URL.createObjectURL(await response.blob());
}

export interface Sound {
	play: (volume?: number) => void;
	stop: () => void;
	audio: HTMLAudioElement;
}
