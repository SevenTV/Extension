import { inject, onUnmounted } from "vue";
import { SITE_ASSETS_URL } from "@/common/Constant";

const soundMap = new Map<string, HTMLAudioElement>();

/**
 * Play a sound
 *
 * @param path the path to the sound file, prepended by the assets url set by the loader
 * @param reuse whether to reuse the audio element for the same path
 */
export function useSound(path: string, reuse = true): Sound {
	const assets = inject(SITE_ASSETS_URL, "");
	const audio = reuse
		? soundMap.get(path) || soundMap.set(path, new Audio(assets + path)).get(path)!
		: new Audio(assets + path);

	const play = () => audio.play();
	const stop = () => audio.pause();

	onUnmounted(() => {
		audio.remove();
	});

	return { play, stop, audio };
}

export interface Sound {
	play: () => void;
	stop: () => void;
	audio: HTMLAudioElement;
}
