<script lang="ts">
	import { Menu, TFile } from "obsidian";
	import { onMount } from "svelte";
	import store from "./store";
	import EventManager from "src/event/event-manager";
	import {
		DurationFilter,
		ListSize,
		ViewCountEntry,
	} from "src/storage/types";
	import MostViewedView from "./components/most-viewed-view.svelte";
	import TrendingView from "./components/trending-view.svelte";
	import { MostViewedRenderItem, TrendingRenderItem, TView } from "./types";
	import IconButton from "./components/icon-button.svelte";
	import ViewCountPlugin from "src/main";
	import "./styles.css";

	let currentView: TView = TView.MOST_VIEWED;
	let mostViewedRenderItems: MostViewedRenderItem[] = [];
	let trendingRenderItems: TrendingRenderItem[] = [];

	let duration: DurationFilter;
	let listSize: ListSize;
	let plugin: ViewCountPlugin;

	store.plugin.subscribe((p) => {
		plugin = p;

		listSize = plugin.settings.listSize;
		duration = plugin.settings.durationFilter;
		currentView = plugin.settings.currentView;

		updateMostViewedItems();
		updateTrendingItems();
	});

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
			plugin.viewCountCache!.getEntriesSortedByViewCount("desc");

		const entryFiles: Map<ViewCountEntry, TFile> = new Map();
		sortedEntries.forEach((entry) => {
			const file = plugin.app.vault.getFileByPath(entry.path);
			if (file !== null) {
				entryFiles.set(entry, file);
			}
		});

		let items: MostViewedRenderItem[] = Array.from(
			entryFiles.entries(),
		).map(([entry, file]) => {
			const viewCount =
				plugin.viewCountCache!.getViewCountForEntry(entry);
			return { file, viewCount };
		});
		items = items.slice(0, listSize);
		mostViewedRenderItems = items;
	}

	function updateTrendingItems() {
		const sortedEntries =
			plugin.viewCountCache!.getEntriesSortedByViewCount("desc");

		const entryFiles: Map<ViewCountEntry, TFile> = new Map();
		sortedEntries.forEach((entry) => {
			const file = plugin.app.vault.getFileByPath(entry.path);
			if (file !== null) {
				entryFiles.set(entry, file);
			}
		});

		let items: TrendingRenderItem[] = Array.from(entryFiles.entries()).map(
			([entry, file]) => {
				const timesOpened =
					plugin.viewCountCache!.getNumTimesOpenedForEntry(
						entry,
						duration!,
					);
				return { file, timesOpened: timesOpened };
			},
		);
		items.sort((a, b) => b.timesOpened - a.timesOpened);
		items = items.filter((item) => item.timesOpened > 0);
		items = items.slice(0, listSize);
		trendingRenderItems = items;
	}

	function handleMostViewedClick() {
		currentView = TView.MOST_VIEWED;
	}

	function handleTrendingClick() {
		currentView = TView.TRENDING;
	}

	async function saveSettings() {
		plugin.settings.listSize = listSize;
		plugin.settings.durationFilter = duration;
		plugin.settings.currentView = currentView;
		await plugin.saveSettings();
	}

	function handleListSizeClick(e: CustomEvent) {
		const { nativeEvent } = e.detail;

		const menu = new Menu();
		menu.setUseNativeMenu(true);

		menu.addItem((item) => {
			item.setTitle("10");
			item.setChecked(listSize === 10);
			item.onClick(() => (listSize = 10));
		});
		menu.addItem((item) => {
			item.setTitle("15");
			item.setChecked(listSize === 15);
			item.onClick(() => (listSize = 15));
		});
		menu.addItem((item) => {
			item.setTitle("20");
			item.setChecked(listSize === 20);
			item.onClick(() => (listSize = 20));
		});
		menu.addItem((item) => {
			item.setTitle("25");
			item.setChecked(listSize === 25);
			item.onClick(() => (listSize = 25));
		});
		menu.addItem((item) => {
			item.setTitle("50");
			item.setChecked(listSize === 50);
			item.onClick(() => (listSize = 50));
		});
		menu.addItem((item) => {
			item.setTitle("100");
			item.setChecked(listSize === 100);
			item.onClick(() => (listSize = 100));
		});
		menu.showAtMouseEvent(nativeEvent);
	}

	function handleDurationClick(e: CustomEvent) {
		const { nativeEvent } = e.detail;

		const menu = new Menu();
		menu.setUseNativeMenu(true);
		menu.addItem((item) => {
			item.setTitle("3 days");
			item.setChecked(duration === DurationFilter.DAYS_3);
			item.onClick(() => (duration = DurationFilter.DAYS_3));
		});
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
			item.setTitle("Today");
			item.setChecked(duration === DurationFilter.TODAY);
			item.onClick(() => (duration = DurationFilter.TODAY));
		});
		menu.addItem((item) => {
			item.setTitle("This week");
			item.setChecked(duration === DurationFilter.WEEK);
			item.onClick(() => (duration = DurationFilter.WEEK));
		});
		menu.addItem((item) => {
			item.setTitle("This week iso");
			item.setChecked(duration === DurationFilter.WEEK_ISO);
			item.onClick(() => (duration = DurationFilter.WEEK_ISO));
		});
		menu.addItem((item) => {
			item.setTitle("This month");
			item.setChecked(duration === DurationFilter.MONTH);
			item.onClick(() => (duration = DurationFilter.MONTH));
		});
		menu.showAtMouseEvent(nativeEvent);
	}

	function handleItemClick(e: CustomEvent) {
		const { file } = e.detail;
		const viewType = (plugin.app as any).viewRegistry.getTypeByExtension(
			file.extension,
		);
		plugin.app.workspace.getLeaf(false)?.setViewState({
			type: viewType,
			active: true,
			state: {
				file: file.path,
			},
		});
	}

	$: if (duration || listSize) {
		updateTrendingItems();
	}

	$: if (listSize) {
		updateMostViewedItems();
	}

	$: duration, listSize, currentView, saveSettings();
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
			ariaLabel="List size"
			iconId="sigma"
			on:click={handleListSizeClick}
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
