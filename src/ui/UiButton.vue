<template>
	<button>
		<slot />

		<span class="ui-button-icon">
			<slot name="icon" />
		</span>
	</button>
</template>

<script setup lang="ts">
void 0;
</script>

<style scoped lang="scss">
button {
	all: unset;
	height: 100%;
	border-radius: 0.25rem;
	background: var(--seventv-input-background);
	outline: 0.01em solid var(--seventv-input-border);
	padding: 0 0.5em;

	white-space: nowrap;

	text-align: center;
	font-weight: 600;
	font-size: 1.25em;

	&:hover {
		cursor: pointer;
	}

	transition: opacity 170ms ease-in-out;
	&:focus-within {
		opacity: 0.65;
	}

	&.ui-button-important {
		background: var(--seventv-text-color-normal);
		color: var(--seventv-background-shade-1);
		box-shadow: 0.15rem 0.15rem 0.1rem var(--seventv-text-color-normal);

		&:hover {
			filter: brightness(1.5);
		}
	}

	&.ui-button-hollow {
		background: unset;
		outline-width: 0.15em;

		&:hover {
			background: var(--seventv-input-background);
		}
	}

	.ui-button-icon {
		display: inline-grid;
		> :only-child {
			margin-left: 0.5rem;
		}
	}

	* {
		display: inline-block;
		vertical-align: middle;
	}

	&[disabled] {
		cursor: not-allowed;
		opacity: 0.25 !important;

		&:hover {
			filter: unset;
		}
	}
}
</style>
