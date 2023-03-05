<template>
	<svg id="Badge" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="1em">
		<defs v-if="bgGradient && Array.isArray(bgGradient.stops) && bgGradient.stops.length">
			<linearGradient :id="`BadgeGradient1-${instID}`" :gradientTransform="'rotate(' + bgGradient.angle + ')'">
				<stop
					v-for="(stop, index) in bgGradient.stops"
					:key="index"
					:offset="(stop.offset * 100).toString(10) + '%'"
					:stop-color="stop.color"
				/>
			</linearGradient>
		</defs>
		<defs v-if="borderGradient && Array.isArray(borderGradient.stops) && borderGradient.stops.length">
			<linearGradient
				:id="`BadgeGradient2-${instID}`"
				:gradientTransform="'rotate(' + borderGradient.angle + ')'"
			>
				<stop
					v-for="(stop, index) in borderGradient.stops"
					:key="index"
					:offset="(stop.offset * 100).toString(10) + '%'"
					:stop-color="stop.color"
					:stop-opacity="stop.opacity ?? 1"
				/>
			</linearGradient>
		</defs>
		<defs v-if="logoGradient && Array.isArray(logoGradient.stops) && logoGradient.stops.length">
			<linearGradient
				:id="`BadgeGradient3-${instID}`"
				x1="0%"
				y1="0%"
				x2="100%"
				y2="100%"
				:gradientTransform="'rotate(' + logoGradient.angle + ')'"
				gradientUnits="userSpaceOnUse"
			>
				<stop
					v-for="(stop, index) in logoGradient.stops"
					:key="index"
					:offset="(stop.offset * 100).toString(10) + '%'"
					:stop-color="stop.color"
				/>
			</linearGradient>
		</defs>

		<g v-if="!background?.component" id="Background">
			<rect v-if="bgGradient" :fill="`url(#BadgeGradient1-${instID})`" width="300" height="300" rx="33.22" />
			<rect v-else :fill="bg.color" width="300" height="300" rx="33.22" />
		</g>
		<component :is="markRaw(background.component)" v-else />

		<g id="Border">
			<path
				:fill="borderGradient ? `url(#BadgeGradient2-${instID})` : border.color"
				d="M266.78,17A16.24,16.24,0,0,1,283,33.22V266.78A16.24,16.24,0,0,1,266.78,283H33.22A16.24,16.24,0,0,1,17,266.78V33.22A16.24,16.24,0,0,1,33.22,17H266.78m0-17H33.22A33.22,33.22,0,0,0,0,33.22V266.78A33.22,33.22,0,0,0,33.22,300H266.78A33.22,33.22,0,0,0,300,266.78V33.22A33.22,33.22,0,0,0,266.78,0Z"
			/>
		</g>

		<path
			v-if="logoGradient"
			:fill="logoGradient ? `url(#BadgeGradient3-${instID})` : undefined"
			d="M211.19,113.56l10.36-18L227.14,86,216.78,68v-.41H161.45l10.36,18,10.36,18,5.81,10h23.21M97,234.58l10.36-18,10.36-18,10.36-18,10.37-18,10.36-18,10.36-18,7.67-13.26-10.37-18-10.36-18L140.31,68H52.85L42.49,86,36.9,95.32l10.36,18v.41h66.32l-10.37,18-10.36,18-10.36,18-10.36,18-10.36,18-7.26,12.85,10.36,18V235H97m86.62-.42h31.71l10.36-18,10.37-18,10.36-18,10.36-18L264,150l-10.36-18v-.41H221.76l-10.37,18-10.36,18-1.45,2.69-10.36-18-10.36-18-1.45-2.69-10.37,18-10.36,18-5.8,9.94,10.36,18,10.36,18,10.37,18,1.65,2.9M266.78,17A16.24,16.24,0,0,1,283,33.22V266.78A16.24,16.24,0,0,1,266.78,283H33.22A16.24,16.24,0,0,1,17,266.78V33.22A16.24,16.24,0,0,1,33.22,17H266.78m0-17H33.22A33.22,33.22,0,0,0,0,33.22V266.78A33.22,33.22,0,0,0,33.22,300H266.78A33.22,33.22,0,0,0,300,266.78V33.22A33.22,33.22,0,0,0,266.78,0Z"
		/>
		<g v-else id="Logo">
			<path
				:fill="logo.color"
				d="M211.19,113.56l10.36-18L227.14,86,216.78,68v-.41H161.45l10.36,18,10.36,18,5.81,10h23.21"
			/>
			<path
				:fill="logo.color"
				d="M97,234.58l10.36-18,10.36-18,10.36-18,10.37-18,10.36-18,10.36-18,7.67-13.26-10.37-18-10.36-18-5.8-9.32H52.85l-10.36,18L36.9,95.32l10.36,18v.41h66.32l-10.37,18-10.36,18-10.36,18-10.36,18-10.36,18-7.26,12.85,10.36,18v.42H97"
			/>
			<path
				:fill="logo.color"
				d="M183.62,234.58h31.71l10.36-18,10.37-18,10.36-18,10.36-18L264,150l-10.36-18v-.41H221.76l-10.37,18-10.36,18-1.45,2.69-10.36-18-10.36-18-1.45-2.69-10.37,18-10.36,18-5.8,9.94,10.36,18,10.36,18,10.37,18,1.65,2.9"
			/>
		</g>
	</svg>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import { markRaw } from "vue";

const instID = Math.random().toString(36).substring(7);

const props = defineProps<{
	logo: {
		color: string;
		gradient?: GradientDef;
	};
	border?: {
		color?: string;
		gradient?: GradientDef;
	};
	background?: {
		color?: string;
		component?: Component;
		gradient?: GradientDef;
	};
}>();

const bg = props.background ?? {};
const border = props.border ?? { color: "transparent" };
const logo = props.logo ?? { color: "#ffffff" };

const bgGradient = bg.gradient;
const borderGradient = border.gradient;
const logoGradient = logo.gradient;

interface GradientDef {
	angle: number;
	stops: {
		offset: number;
		color: string;
		opacity?: number;
	}[];
}
</script>
