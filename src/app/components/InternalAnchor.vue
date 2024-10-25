<template>
	<a :href="'?seventv=' + param" onclick="return false" @click="onClick">
		<slot />
	</a>
</template>
<script setup lang="ts">
import { useNavigator } from "@/composable/useNavigator";

const props = defineProps<{
	param: string;
}>();

const params = useNavigator();
const onClick = () => {
	params.seventv = props.param;
	return false;
};
</script>
