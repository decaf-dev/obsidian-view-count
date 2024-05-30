<script lang="ts">
	import { TFile, setIcon } from "obsidian";
	import { onMount } from "svelte";
	import store, { ViewCountPluginStore } from "./store";
	import EventManager from "src/event/event-manager";
	import { ViewCountEntry } from "src/storage/types";
	import MostViewedView from "./components/most-viewed-view.svelte";
	import TrendingView from "./components/trending-view.svelte";
	import { MostViewedRenderItem, TrendingRenderItem } from "./types";

	import "./styles.css";

	type ViewType = "most-viewed" | "trending";

	let trendingIconRef: HTMLElement | null = null;
	let mostViewedIconRef: HTMLElement | null = null;
	let currentView: ViewType = "most-viewed";
	let mostViewedRenderItems: MostViewedRenderItem[] = [];
	let trendingRenderItems: TrendingRenderItem[] = [];

	let pluginStore: ViewCountPluginStore;

	store.pluginStore.subscribe((store) => {
		pluginStore = store;
		updateMostViewedItems();
		updateTrendingItems();
	});

	onMount(() => {
		if (trendingIconRef) {
			setIcon(trendingIconRef, "trending-up");
		}

		if (mostViewedIconRef) {
			setIcon(mostViewedIconRef, "eye");
		}
	});

	//TODO add a timer to update trending items?

	onMount(() => {
		//TODO optimize event. Don't update all items?
		function handleRefreshEvent() {
			updateMostViewedItems();
			updateTrendingItems();
		}

		EventManager.getInstance().on("refresh-item-view", handleRefreshEvent);
		return () => {
			EventManager.getInstance().off(
				"refresh-item-view",
				handleRefreshEvent,
			);
		};
	});

	function updateMostViewedItems() {
		let sortedEntries =
			pluginStore.cache.getEntriesSortedByViewCount("desc");

		let entryFiles: Map<ViewCountEntry, TFile> = new Map();
		sortedEntries.forEach((entry) => {
			const file = pluginStore.app.vault.getFileByPath(entry.path);
			if (file !== null) {
				entryFiles.set(entry, file);
			}
		});

		let items: MostViewedRenderItem[] = Array.from(
			entryFiles.entries(),
		).map(([entry, file]) => {
			const viewCount = pluginStore.cache.getViewCountForEntry(entry);
			return { file, viewCount };
		});

		items = items.slice(0, 50);
		mostViewedRenderItems = items;
	}

	function updateTrendingItems() {
		let sortedEntries =
			pluginStore.cache.getEntriesSortedByViewCount("desc");

		let entryFiles: Map<ViewCountEntry, TFile> = new Map();
		sortedEntries.forEach((entry) => {
			const file = pluginStore.app.vault.getFileByPath(entry.path);
			if (file !== null) {
				entryFiles.set(entry, file);
			}
		});

		//TODO add selection of time period
		let items: TrendingRenderItem[] = Array.from(entryFiles.entries()).map(
			([entry, file]) => {
				const timesOpened = pluginStore.cache.getNumTimesOpenedForEntry(
					entry,
					"7-days",
				);
				return { file, timesOpened: timesOpened };
			},
		);
		items.sort((a, b) => b.timesOpened - a.timesOpened);
		items = items.filter((item) => item.timesOpened > 0);

		items = items.slice(0, 50);
		trendingRenderItems = items;
	}

	function handleMostViewedClick() {
		currentView = "most-viewed";
	}

	function handleTrendingClick() {
		currentView = "trending";
	}

	function getNavActionButtonClass(currentView: ViewType, view: ViewType) {
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
			class={mostViewedClassName}
			tabindex="0"
			role="button"
			aria-label="Most Viewed"
			bind:this={mostViewedIconRef}
			on:click={handleMostViewedClick}
			on:keydown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					handleMostViewedClick();
				}
			}}
		></div>
		<div
			class={trendingClassName}
			tabindex="0"
			role="button"
			aria-label="Trending"
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
		<MostViewedView
			renderItems={mostViewedRenderItems}
			on:itemClick={handleItemClick}
		/>
	{/if}
	{#if currentView === "trending"}
		<TrendingView
			renderItems={trendingRenderItems}
			on:itemClick={handleItemClick}
		/>
	{/if}
</div>
