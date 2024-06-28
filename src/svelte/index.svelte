<script lang="ts">
	import { Menu, TFile } from "obsidian";
	import { onMount } from "svelte";
	import store from "./store";
	import EventManager from "src/event/event-manager";
	import { ViewCountEntry } from "src/storage/types";
	import ViewsView from "./components/views-view.svelte";
	import TrendsView from "./components/trends-view.svelte";
	import { MostViewedRenderItem, TrendingRenderItem } from "./types";
	import IconButton from "./components/icon-button.svelte";
	import ViewCountPlugin from "src/main";
	import "./styles.css";
	import { TimePeriod, ItemCount, TView } from "src/types";

	let currentView: TView = TView.VIEWS;
	let viewRenderItems: MostViewedRenderItem[] = [];
	let trendRenderItems: TrendingRenderItem[] = [];

	let timePeriod: TimePeriod;
	let itemCount: ItemCount;
	let plugin: ViewCountPlugin;

	store.plugin.subscribe((p) => {
		plugin = p;

		itemCount = plugin.settings.itemCount;
		timePeriod = plugin.settings.timePeriod;
		currentView = plugin.settings.currentView;

		updateViewItems();
		updateTrendItems();
	});

	onMount(() => {
		//TODO optimize event. Don't update all items?
		function handleRefresh() {
			updateViewItems();
			updateTrendItems();
		}

		EventManager.getInstance().on("refresh-item-view", handleRefresh);
		return () => {
			EventManager.getInstance().off("refresh-item-view", handleRefresh);
		};
	});

	function updateViewItems() {
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
		items = items.slice(0, itemCount);
		viewRenderItems = items;
	}

	function updateTrendItems() {
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
						timePeriod!,
					);
				return { file, timesOpened: timesOpened };
			},
		);
		items.sort((a, b) => b.timesOpened - a.timesOpened);
		items = items.filter((item) => item.timesOpened > 0);
		items = items.slice(0, itemCount);
		trendRenderItems = items;
	}

	function handleViewsClick() {
		currentView = TView.VIEWS;
	}

	function handleTrendsClick() {
		currentView = TView.TRENDS;
	}

	async function saveSettings() {
		plugin.settings.itemCount = itemCount;
		plugin.settings.timePeriod = timePeriod;
		plugin.settings.currentView = currentView;
		await plugin.saveSettings();
	}

	function handleItemCountClick(e: CustomEvent) {
		const { nativeEvent } = e.detail;

		const menu = new Menu();
		menu.setUseNativeMenu(true);

		menu.addItem((item) => {
			item.setTitle("10");
			item.setChecked(itemCount === 10);
			item.onClick(() => (itemCount = 10));
		});
		menu.addItem((item) => {
			item.setTitle("15");
			item.setChecked(itemCount === 15);
			item.onClick(() => (itemCount = 15));
		});
		menu.addItem((item) => {
			item.setTitle("20");
			item.setChecked(itemCount === 20);
			item.onClick(() => (itemCount = 20));
		});
		menu.addItem((item) => {
			item.setTitle("25");
			item.setChecked(itemCount === 25);
			item.onClick(() => (itemCount = 25));
		});
		menu.addItem((item) => {
			item.setTitle("50");
			item.setChecked(itemCount === 50);
			item.onClick(() => (itemCount = 50));
		});
		menu.addItem((item) => {
			item.setTitle("100");
			item.setChecked(itemCount === 100);
			item.onClick(() => (itemCount = 100));
		});
		menu.showAtMouseEvent(nativeEvent);
	}

	function handleTimePeriodClick(e: CustomEvent) {
		const { nativeEvent } = e.detail;

		const menu = new Menu();
		menu.setUseNativeMenu(true);
		menu.addItem((item) => {
			item.setTitle("3 days");
			item.setChecked(timePeriod === TimePeriod.DAYS_3);
			item.onClick(() => (timePeriod = TimePeriod.DAYS_3));
		});
		menu.addItem((item) => {
			item.setTitle("7 days");
			item.setChecked(timePeriod === TimePeriod.DAYS_7);
			item.onClick(() => (timePeriod = TimePeriod.DAYS_7));
		});
		menu.addItem((item) => {
			item.setTitle("14 days");
			item.setChecked(timePeriod === TimePeriod.DAYS_14);
			item.onClick(() => (timePeriod = TimePeriod.DAYS_14));
		});
		menu.addItem((item) => {
			item.setTitle("30 days");
			item.setChecked(timePeriod === TimePeriod.DAYS_30);
			item.onClick(() => (timePeriod = TimePeriod.DAYS_30));
		});
		menu.addSeparator();
		menu.addItem((item) => {
			item.setTitle("Today");
			item.setChecked(timePeriod === TimePeriod.TODAY);
			item.onClick(() => (timePeriod = TimePeriod.TODAY));
		});
		menu.addItem((item) => {
			item.setTitle("This week");
			item.setChecked(timePeriod === TimePeriod.WEEK);
			item.onClick(() => (timePeriod = TimePeriod.WEEK));
		});
		menu.addItem((item) => {
			item.setTitle("This week iso");
			item.setChecked(timePeriod === TimePeriod.WEEK_ISO);
			item.onClick(() => (timePeriod = TimePeriod.WEEK_ISO));
		});
		menu.addItem((item) => {
			item.setTitle("This month");
			item.setChecked(timePeriod === TimePeriod.MONTH);
			item.onClick(() => (timePeriod = TimePeriod.MONTH));
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

	$: if (timePeriod || itemCount) {
		updateTrendItems();
	}

	$: if (itemCount) {
		updateViewItems();
	}

	$: timePeriod, itemCount, currentView, saveSettings();
</script>

<div class="nav-header">
	<div class="nav-buttons-container">
		<IconButton
			ariaLabel="Views"
			iconId="eye"
			isActive={currentView == TView.VIEWS}
			on:click={handleViewsClick}
		/>
		<IconButton
			ariaLabel="Trends"
			iconId="trending-up"
			isActive={currentView == TView.TRENDS}
			on:click={handleTrendsClick}
		/>
		<IconButton
			ariaLabel="Item count"
			iconId="hash"
			on:click={handleItemCountClick}
		/>
		<IconButton
			ariaLabel="Time period"
			iconId="history"
			disabled={currentView !== TView.TRENDS}
			on:click={handleTimePeriodClick}
		/>
	</div>
</div>
<div class="view-content view-count-view">
	{#if currentView === TView.VIEWS}
		<ViewsView
			renderItems={viewRenderItems}
			on:itemClick={handleItemClick}
		/>
	{/if}
	{#if currentView === TView.TRENDS}
		<TrendsView
			renderItems={trendRenderItems}
			on:itemClick={handleItemClick}
		/>
	{/if}
</div>
