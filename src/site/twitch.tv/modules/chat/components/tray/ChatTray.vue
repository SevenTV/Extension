<template>
	<template v-for="({ parent, component, props }, i) of trayElements" :key="i">
		<Teleport v-if="parent.current" :to="parent.current">
			<Component :is="component" v-bind="props" />
		</Teleport>
	</template>
</template>
<script setup lang="ts">
import { trayElements } from "./ChatTray";
</script>
