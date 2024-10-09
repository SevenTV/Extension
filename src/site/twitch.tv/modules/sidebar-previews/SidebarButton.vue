<template>
	<Teleport :to="el">
		<Transition>
			<div v-if="hovering && expanded && timeoutDuration > 0">
				<div class="outer">
					<div class="inner"></div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { HookedInstance } from "@/common/ReactHooks";
import { useConfig } from "@/composable/useSettings";

const props = defineProps<{
	inst: HookedInstance<Twitch.SideBarToggleComponent>;
	expanded: boolean;
	hovering: boolean;
}>();

const el = ref(props.inst.domNodes["root"]);

const timeoutDuration = useConfig<number>("ui.sidebar_hover_expand_timeout");

function set(v: boolean) {
	el.value.firstElementChild?.setAttribute("style", v ? "display: none !important" : "");
}

const transition = computed(() => `width ${timeoutDuration.value / 1000}s linear`);

onMounted(() => set(true));
onUnmounted(() => set(false));
</script>
<style lang="scss">
.outer {
	position: absolute;
	top: 0;
	right: 0;
	width: 100%;
	height: 0.5rem;
	background: hsla(0, 0%, 100%, 0.2);

	.inner {
		left: 0;
		position: absolute;

		width: 100%;
		height: 100%;
		background: currentColor;
	}
}

.v-leave-active {
	transition: v-bind(transition);
	.inner {
		transition: v-bind(transition);
	}
}

.v-leave-to .inner {
	width: 0;
}
</style>
