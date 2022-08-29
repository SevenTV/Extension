<template>
	<div id="app">
		<h1>SEVENTV</h1>
	</div>
	<p>this is a vue app inside of twitch.tv</p>

	<Teleport to=".tw-title">
		<TpTest />
	</Teleport>
</template>

<script setup lang="ts">
import TpTest from "./TpTest.vue";
</script>
