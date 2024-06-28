<script lang="ts">
	import { setIcon } from "obsidian";
	import { createEventDispatcher, onMount } from "svelte";

	export let iconId: string;
	export let isActive: boolean = false;
	export let ariaLabel: string = "";
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher();
	let ref: HTMLElement;

	onMount(() => {
		setIcon(ref, iconId);
	});

	function handleClick(event: Event) {
		if (disabled) return;
		dispatch("click", { nativeEvent: event });
	}

	$: className =
		"clickable-icon nav-action-button " +
		(isActive == true ? " is-active" : "");
</script>

<div
	class={className}
	tabindex="0"
	aria-disabled={disabled}
	role="button"
	aria-label={ariaLabel}
	bind:this={ref}
	on:click={handleClick}
	on:keydown={(e) => {
		if (e.key === "Enter" || e.key === " ") {
			handleClick(e);
		}
	}}
></div>
