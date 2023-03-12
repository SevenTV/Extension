import { tryOnUnmounted } from "@vueuse/core";

const soundMap = new Map<string, HTMLAudioElement>();

/**
 * Play a sound
 *
 * @param path the path to the sound file, prepended by the assets url set by the loader
 * @param reuse whether to reuse the audio element for the same path
 */
export function useSound(path: string, reuse = true): Sound {
	const audio = reuse ? soundMap.get(path) || soundMap.set(path, new Audio(path)).get(path)! : new Audio(path);

	const play = (volume = 1) => {
		audio.volume = volume;
		audio.play();
	};
	const stop = () => audio.pause();

	tryOnUnmounted(() => {
		audio.remove();
	});

	return { play, stop, audio };
}

export interface Sound {
	play: (volume?: number) => void;
	stop: () => void;
	audio: HTMLAudioElement;
}
