import { onUnmounted, ref } from "vue";
import { MaybeRef, until } from "@vueuse/core";
import { log } from "@/common/Logger";
import { v4 as uuidv4 } from "uuid";

/**
 * Request permission(s) for the extension based on user gesture
 *
 * @param target the element, which on click will request the permission
 * @param origins the origins to request permission for
 * @param permissions the non-host permissions to request
 */
export function useExtensionPermission(
	target: MaybeRef<HTMLElement | null>,
	origins?: string[],
	permissions?: string[],
) {
	if (!origins) origins = [];
	if (!permissions) permissions = [];

	const id = uuidv4();
	const granted = ref(false);

	// send a message to the content script once the element is found
	function onElementFound(el: HTMLElement) {
		el.setAttribute("data-seventv-permission-selector", id);

		const selector = `[data-seventv-permission-selector="${id}"]`;

		log.debug(
			"<Extension>",
			"Created permission grant request button",
			`id=${id}`,
			`origins=${origins}`,
			`permissions=${permissions}`,
		);

		window.postMessage({
			type: "seventv-create-permission-listener",
			data: {
				selector: selector,
				id,
				origins,
				permissions,
			},
		});
	}

	// wait for the element to be available
	until(target)
		.toBeTruthy()
		.then((el) => onElementFound(el));

	// Listen for permission grant
	const onGrant = (ev: MessageEvent) => {
		switch (ev.data.type) {
			case "seventv-permission-granted": {
				const { id: grantID } = ev.data.data as { id: string };
				if (grantID !== id) return;

				granted.value = true;
				log.info("<Extension>", "Permission request granted", `id=${id}`);

				break;
			}
		}
	};
	window.addEventListener("message", onGrant);

	onUnmounted(() => {
		window.removeEventListener("message", onGrant);
	});

	return { granted };
}
