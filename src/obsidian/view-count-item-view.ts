import { App, ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_COUNT_ITEM_VIEW } from "src/constants";
import ViewCountCache from "src/storage/view-count-cache";
import ItemViewApp from "src/svelte/index.svelte";
import store from "src/svelte/store";

export default class ViewCountItemView extends ItemView {
	app: App;
	cache: ViewCountCache;
	component: ItemViewApp | null;

	constructor(leaf: WorkspaceLeaf, app: App, cache: ViewCountCache) {
		super(leaf);
		this.app = app;
		this.cache = cache;
	}

	getViewType() {
		return VIEW_COUNT_ITEM_VIEW;
	}

	getDisplayText() {
		return "View count";
	}

	getIcon() {
		return "eye";
	}


	async onOpen() {
		const { containerEl } = this;
		containerEl.empty();


		store.pluginStore.set({
			app: this.app,
			cache: this.cache,
		});

		this.component = new ItemViewApp({
			target: containerEl,
		});
	}

	async onClose() {
		const { contentEl } = this;
		this.component?.$destroy();
		contentEl.empty();
	}
}
