<script lang="ts">
	import { Menu, TFile } from "obsidian";
	import { onMount } from "svelte";
	import store, { ViewCountPluginStore } from "./store";
	import EventManager from "src/event/event-manager";
	import {
		DurationFilter,
		RenderSize,
		ViewCountEntry,
	} from "src/storage/types";
	import MostViewedView from "./components/most-viewed-view.svelte";
	import TrendingView from "./components/trending-view.svelte";
	import { MostViewedRenderItem, TrendingRenderItem, TView } from "./types";
	import IconButton from "./components/icon-button.svelte";
	import "./styles.css";

	let currentView: TView = TView.MOST_VIEWED;
	let mostViewedRenderItems: MostViewedRenderItem[] = [];
	let trendingRenderItems: TrendingRenderItem[] = [];
	let duration: DurationFilter = DurationFilter.WEEK_ISO;
	let renderSize: RenderSize = 20;

	let pluginStore: ViewCountPluginStore;

	store.pluginStore.subscribe((store) => {
		pluginStore = store;
		updateMostViewedItems();
		updateTrendingItems();
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
		const sortedEntries =
			pluginStore.cache.getEntriesSortedByViewCount("desc");

		const entryFiles: Map<ViewCountEntry, TFile> = new Map();
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
		items = items.slice(0, renderSize);
		return items;
	}

	function updateTrendingItems() {
		const sortedEntries =
			pluginStore.cache.getEntriesSortedByViewCount("desc");

		const entryFiles: Map<ViewCountEntry, TFile> = new Map();
		sortedEntries.forEach((entry) => {
			const file = pluginStore.app.vault.getFileByPath(entry.path);
			if (file !== null) {
				entryFiles.set(entry, file);
			}
		});

		let items: TrendingRenderItem[] = Array.from(entryFiles.entries()).map(
			([entry, file]) => {
				const timesOpened = pluginStore.cache.getNumTimesOpenedForEntry(
					entry,
					duration,
				);
				return { file, timesOpened: timesOpened };
			},
		);
		items.sort((a, b) => b.timesOpened - a.timesOpened);
		items = items.filter((item) => item.timesOpened > 0);
		items = items.slice(0, renderSize);
		return items;
	}

	function handleMostViewedClick() {
		currentView = TView.MOST_VIEWED;
	}

	function handleTrendingClick() {
		currentView = TView.TRENDING;
	}

	function handleItemsToShowClick(e: CustomEvent) {
		const { nativeEvent } = e.detail;

		const menu = new Menu();
		menu.setUseNativeMenu(true);

		menu.addItem((item) => {
			item.setTitle("10");
			item.setChecked(renderSize === 10);
			item.onClick(() => (renderSize = 10));
		});
		menu.addItem((item) => {
			item.setTitle("15");
			item.setChecked(renderSize === 15);
			item.onClick(() => (renderSize = 15));
		});
		menu.addItem((item) => {
			item.setTitle("20");
			item.setChecked(renderSize === 20);
			item.onClick(() => (renderSize = 20));
		});
		menu.addItem((item) => {
			item.setTitle("25");
			item.setChecked(renderSize === 25);
			item.onClick(() => (renderSize = 25));
		});
		menu.addItem((item) => {
			item.setTitle("50");
			item.setChecked(renderSize === 50);
			item.onClick(() => (renderSize = 50));
		});
		menu.addItem((item) => {
			item.setTitle("100");
			item.setChecked(renderSize === 100);
			item.onClick(() => (renderSize = 100));
		});
		menu.showAtMouseEvent(nativeEvent);
	}

	function handleDurationClick(e: CustomEvent) {
		const { nativeEvent } = e.detail;

		const menu = new Menu();
		menu.setUseNativeMenu(true);
		menu.addItem((item) => {
			item.setTitle("7 days");
			item.setChecked(duration === DurationFilter.DAYS_7);
			item.onClick(() => (duration = DurationFilter.DAYS_7));
		});
		menu.addItem((item) => {
			item.setTitle("14 days");
			item.setChecked(duration === DurationFilter.DAYS_14);
			item.onClick(() => (duration = DurationFilter.DAYS_14));
		});
		menu.addItem((item) => {
			item.setTitle("30 days");
			item.setChecked(duration === DurationFilter.DAYS_30);
			item.onClick(() => (duration = DurationFilter.DAYS_30));
		});
		menu.addSeparator();
		menu.addItem((item) => {
			item.setTitle("Week");
			item.setChecked(duration === DurationFilter.WEEK);
			item.onClick(() => (duration = DurationFilter.WEEK));
		});
		menu.addItem((item) => {
			item.setTitle("Week Iso");
			item.setChecked(duration === DurationFilter.WEEK_ISO);
			item.onClick(() => (duration = DurationFilter.WEEK_ISO));
		});
		menu.addItem((item) => {
			item.setTitle("Month");
			item.setChecked(duration === DurationFilter.MONTH);
			item.onClick(() => (duration = DurationFilter.MONTH));
		});
		menu.showAtMouseEvent(nativeEvent);
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

	$: if (duration || renderSize) {
		trendingRenderItems = updateTrendingItems();
	}

	$: if (renderSize) {
		mostViewedRenderItems = updateMostViewedItems();
	}
</script>

<div class="nav-header">
	<div class="nav-buttons-container">
		<IconButton
			ariaLabel="Most viewed"
			iconId="eye"
			isActive={currentView == TView.MOST_VIEWED}
			on:click={handleMostViewedClick}
		/>
		<IconButton
			ariaLabel="Trending"
			iconId="trending-up"
			isActive={currentView == TView.TRENDING}
			on:click={handleTrendingClick}
		/>
		<IconButton
			ariaLabel="Items to show"
			iconId="sigma"
			on:click={handleItemsToShowClick}
		/>
		<IconButton
			ariaLabel="Duration filter"
			iconId="history"
			disabled={currentView !== TView.TRENDING}
			on:click={handleDurationClick}
		/>
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
