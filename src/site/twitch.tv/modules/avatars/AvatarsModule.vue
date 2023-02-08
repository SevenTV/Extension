<template />

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { watchDebounced } from "@vueuse/core";
import { ObserverPromise } from "@/common/Async";
import { getVNodeFromDOM } from "@/common/ReactHooks";
import { defineFunctionHook, unsetPropertyHook } from "@/common/Reflection";
import { db } from "@/db/idb";
import { declareModule } from "@/composable/useModule";
import { useConfig } from "@/composable/useSettings";
import { useWorker } from "@/composable/useWorker";

const { markAsReady } = declareModule("avatars", {
	name: "Animated Avatars",
	depends_on: [],
	config: [
		{
			key: "avatars.animation",
			path: ["Appearance", "Interface"],
			label: "Animated Avatars",
			hint: "Whether or not to allow user avatars to be animated",
			type: "TOGGLE",
			defaultValue: true,
		},
	],
});

const { sendMessage, target: workerTarget } = useWorker();

// const avatarMap = new Map<string, string>();
const avatarClass = ref<
	ReactExtended.ReactVNode & {
		render: ReactExtended.AnyReactComponent["render"];
		children: ReactExtended.ReactRuntimeElement[];
	}
>();

const data = reactive({
	seen: new Set<string>(),
	pending: new Set<string>(),
});

const shouldRenderAvatars = useConfig<boolean>("avatars.animation");
const avatars = reactive<Record<string, SevenTV.Cosmetic<"AVATAR">>>({});

let fetchTimeout: number | undefined;

// Lookup a user for their avatar
//
// This batches lookups into one request until the buffer is filled or after some time
function lookupUser(username: string): void {
	if (data.seen.has(username)) return;

	data.seen.add(username);
	data.pending.add(username);

	if (!fetchTimeout) {
		fetchTimeout = window.setTimeout(() => {
			fetchTimeout = undefined;

			const usernames = Array.from(data.pending);
			data.pending.clear();

			sendMessage("REQUEST_USER_COSMETICS", {
				identifiers: usernames.map((v) => ["username", v]),
				kinds: ["AVATAR"],
			});
		}, 500);
	}
}

async function awaitAvatarElement(): Promise<HTMLElement> {
	const n = document.querySelector<HTMLElement>(".tw-avatar");
	if (n) {
		return Promise.resolve(n);
	}

	return new ObserverPromise<HTMLElement>(
		(entries, emit) => {
			for (const entry of entries) {
				if (!entry.addedNodes.length) continue;

				for (let i = 0; i < entry.addedNodes.length; i++) {
					const node = entry.addedNodes[i];
					if (!(node instanceof HTMLElement)) continue;

					const n = node.querySelector<HTMLElement>(".tw-avatar");
					if (!n) continue;

					emit(n);
					return;
				}
			}
		},
		document.getElementById("root")!,
		{
			childList: true,
			subtree: true,
		},
	);
}

/* Capture the render class */
async function findAvatarClass() {
	const ael = await awaitAvatarElement();
	if (!ael) return;

	const com = getVNodeFromDOM(ael);
	if (!com || !com.return) return;
	if ((com.return.type as { displayName?: string }).displayName !== "ScAvatar") return;

	avatarClass.value = com.return.type as unknown as typeof avatarClass.value;
}

function doRerender() {
	const elements = document.querySelectorAll(".tw-avatar");

	const componentsToForceUpdate = new Set<ReactExtended.WritableComponent>();
	const oldKeys = new Map();

	for (let i = 0; i < elements.length; i++) {
		const el = elements.item(i);

		const com = getVNodeFromDOM(el);
		if (!com) continue;

		let returnCom: ReactExtended.ReactVNode | null = com;
		while (returnCom) {
			if (!oldKeys.has(returnCom)) {
				oldKeys.set(returnCom, returnCom.key);
				returnCom.key = "seventv-rerender";
			}

			if (returnCom.stateNode) {
				if ("forceUpdate" in returnCom.stateNode) {
					componentsToForceUpdate.add(returnCom.stateNode);
					break;
				}
			}

			returnCom = returnCom.return;
		}
	}

	for (const com of componentsToForceUpdate) {
		for (let i = 0; i < 2; i++) com.forceUpdate();
	}

	for (const [com, key] of oldKeys) {
		com.key = key;
	}
}

/* Patch a given avatar with a new url according to the avatarMap */
function patchImageAvatar(component: Twitch.UserAvatar) {
	const props = component.props;
	if (!props || !props.userLogin) return;

	// Schedule a request for the user's avatar
	lookupUser(props.userLogin);

	const avatar = avatars[props.userLogin];
	if (!avatar || !avatar.data || !avatar.data.host?.files?.length) return;

	const fi = avatar.data.host.files.find((f) => f.width && f.width > 64);
	if (!fi) return;

	props.src = `${avatar.data.host.url}/${fi.name}`;
}

// Patch the render function of the avatar class
watch(avatarClass, (ac, oldAc) => {
	if (!ac) return;

	if (oldAc) unsetPropertyHook(oldAc, "render");

	defineFunctionHook(ac, "render", function (old, ...args) {
		if (shouldRenderAvatars.value) {
			const { children } = args[0] ?? {};

			if (Array.isArray(children)) {
				for (const child of children) {
					if (!child || !child.type || child.type.displayName != "ImageAvatar") continue;

					patchImageAvatar(child);
				}
			}
		}

		return old?.apply(old, args);
	});

	doRerender();
});

function assignAvatar(av: SevenTV.Cosmetic<"AVATAR">) {
	if (!av.data || !av.data.user || !av.data.user.connections?.length) return;

	const con = av.data.user.connections.find((con) => con.platform === "TWITCH");
	if (!con) return; // couldn't find twitch username

	avatars[con.username] = av;
}

// Initiate rerender after avatar changes
watchDebounced(
	avatars,
	() => {
		doRerender();
	},
	{
		debounce: 350,
	},
);

watch(shouldRenderAvatars, doRerender);

workerTarget.addEventListener("cosmetic_created", (ev) => {
	if (ev.detail.kind !== "AVATAR") return;

	assignAvatar(ev.detail as SevenTV.Cosmetic<"AVATAR">);
});

// Pre-load stored avatars
onMounted(() => {
	findAvatarClass();

	db.cosmetics
		.where("kind")
		.equals("AVATAR")
		.each((v) => {
			assignAvatar(v as SevenTV.Cosmetic<"AVATAR">);
		});
});

onUnmounted(() => {
	if (avatarClass.value) {
		unsetPropertyHook(avatarClass.value, "render");
		doRerender();
	}

	if (fetchTimeout) {
		window.clearTimeout(fetchTimeout);
		fetchTimeout = undefined;
	}
});

markAsReady();
</script>
