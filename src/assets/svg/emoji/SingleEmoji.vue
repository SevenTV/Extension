<template>
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
		<use :xlink:href="'#' + id" />
	</svg>
</template>

<script setup lang="ts">
defineProps<{
	id: string;
}>();
</script>
