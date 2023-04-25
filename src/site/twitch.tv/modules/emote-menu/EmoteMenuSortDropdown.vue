<template>
    <div ref="sortByRef">
        <UiFloating v-if="showSortMenu" :anchor="sortByRef" placement="left-start"
            :middleware="[shift({ mainAxis: true, crossAxis: true })]" :emit-clickout="true"
            @clickout="showSortMenu = false">
            <FormDropdown :node="emoteMenuSortProperties" :on-change="toggleShowSortBy" />
            <FormDropdown :node="emoteMenuSortOrderProperties" :on-change="toggleShowSortBy" />
        </UiFloating>
        <BarsSortIcon @click="toggleShowSortBy()" />
    </div>
</template>

<script setup lang="ts">
import { emoteMenuSortOrderProperties, emoteMenuSortProperties } from "./EmoteMenuContext";
import FormDropdown from "@/site/global/settings/control/FormDropdown.vue";
import BarsSortIcon from "@/assets/svg/icons/BarsSortIcon.vue";
import UiFloating from "@/ui/UiFloating.vue";
import { ref } from "vue";
import { shift } from "@floating-ui/dom";

const sortByRef = ref<HTMLButtonElement | undefined>();
const showSortMenu = ref(false);

function toggleShowSortBy() {
    showSortMenu.value = !showSortMenu.value;
}
</script>
