<template>
	<select>
		<option disabled value="">Select one</option>
		<!-- It's fine to use index as key because the order of the options won't change -->
		<option v-for="(s, i) in options" :key="i" :value="s">{{ s }}</option>
	</select>
</template>

<script setup lang="ts">
defineProps<{
	options: string[];
}>();
</script>
