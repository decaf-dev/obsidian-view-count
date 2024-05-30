<script lang="ts">
	import { TFile, setIcon } from "obsidian";
	import { onMount } from "svelte";
	import "./styles.css";
	import store, { ViewCountPluginStore } from "./store";
	import EventManager from "src/event/event-manager";
	import { ViewCountEntry } from "src/storage/types";
	import { RenderItem } from "./types";
	import MostViewedView from "./components/most-viewed-view.svelte";

	let trendingIconRef: HTMLElement | null = null;
	let mostViewedIconRef: HTMLElement | null = null;
	let currentView: "most-viewed" | "trending" = "most-viewed";
	let renderItems: RenderItem[] = [];

	let pluginStore: ViewCountPluginStore;

	store.pluginStore.subscribe((store) => {
		pluginStore = store;
		updateRenderItems();
	});

	onMount(() => {
		if (trendingIconRef) {
			setIcon(trendingIconRef, "trending-up");
		}

		if (mostViewedIconRef) {
			setIcon(mostViewedIconRef, "eye");
		}
	});

	onMount(() => {
		function handleRefreshEvent() {
			//TODO optimize
			//don't update all items
			updateRenderItems();
		}

		EventManager.getInstance().on("refresh-item-view", handleRefreshEvent);
		return () => {
			EventManager.getInstance().off(
				"refresh-item-view",
				handleRefreshEvent,
			);
		};
	});

	function updateRenderItems() {
		let sortedEntries = pluginStore.cache.getSortedEntries("desc");

		let entryFiles: Map<ViewCountEntry, TFile> = new Map();
		sortedEntries.forEach((entry) => {
			const file = this.app.vault.getFileByPath(entry.path);
			if (file !== null) {
				entryFiles.set(entry, file);
			}
		});
		let items: RenderItem[] = Array.from(entryFiles.entries()).map(
			([entry, file]) => {
				const viewCount = pluginStore.cache.getViewCountForEntry(entry);
				return { file, viewCount };
			},
		);
		items = items.slice(0, 50);
		renderItems = items;
	}

	function handleMostViewedClick() {
		currentView = "most-viewed";
	}

	function handleTrendingClick() {
		currentView = "trending";
	}

	function getNavActionButtonClass(
		currentView: "most-viewed" | "trending",
		view: "most-viewed" | "trending",
	) {
		let className = "clickable-icon nav-action-button";
		if (currentView === view) {
			return `${className} is-active`;
		}
		return className;
	}

	function handleItemClick(e: CustomEvent) {
		const { file } = e.detail;
		const viewType = (
			pluginStore.app as any
		).viewRegistry.getTypeByExtension(file.extension);
		pluginStore.app.workspace.getLeaf(false)?.setViewState({
			type: viewType,
			active: true,
			state: {
				file: file.path,
			},
		});
	}

	$: mostViewedClassName = getNavActionButtonClass(
		currentView,
		"most-viewed",
	);
	$: trendingClassName = getNavActionButtonClass(currentView, "trending");
</script>

<div class="nav-header">
	<div class="nav-buttons-container">
		<div
			tabindex="0"
			role="button"
			aria-label="Most Viewed"
			class={mostViewedClassName}
			bind:this={mostViewedIconRef}
			on:click={handleMostViewedClick}
			on:keydown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					handleMostViewedClick();
				}
			}}
		></div>
		<div
			tabindex="0"
			role="button"
			aria-label="Trending"
			class={trendingClassName}
			bind:this={trendingIconRef}
			on:click={handleTrendingClick}
			on:keydown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					handleTrendingClick();
				}
			}}
		></div>
	</div>
</div>
<div class="view-content view-count-view">
	{#if currentView === "most-viewed"}
		<MostViewedView {renderItems} on:itemClick={handleItemClick} />
	{/if}
	{#if currentView === "trending"}
		<p>Trending notes</p>
	{/if}
</div>
