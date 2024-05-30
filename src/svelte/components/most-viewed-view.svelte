<script lang="ts">
	import { TFile } from "obsidian";
	import { RenderItem } from "../types";
	import { createEventDispatcher } from "svelte";

	export let renderItems: RenderItem[];
	const dispatch = createEventDispatcher();

	function handleItemClick(file: TFile) {
		dispatch("itemClick", { file });
	}
</script>

{#if renderItems.length == 0}
	<div class="pane-empty">No notes with view count found.</div>
{:else}
	{#each renderItems as { file, viewCount }}
		<div class="tree-item">
			<div
				role="button"
				tabindex="0"
				class="tree-item-self is-clickable"
				on:click={() => handleItemClick(file)}
				on:keydown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						handleItemClick(file);
					}
				}}
			>
				<div class="tree-item-inner">
					<div class="tree-item-inner-text">
						{file.extension == "md" ? file.basename : file.name}
					</div>
				</div>
				<div class="tree-item-flair-outer">
					<div class="tree-item-flair">
						{viewCount}
					</div>
				</div>
			</div>
		</div>
	{/each}
{/if}
