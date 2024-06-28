import { ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_COUNT_ITEM_VIEW } from "src/constants";
import ViewCountPlugin from "src/main";
import ItemViewApp from "src/svelte/index.svelte";
import store from "src/svelte/store";

export default class ViewCountItemView extends ItemView {
	plugin: ViewCountPlugin;
	component: ItemViewApp | null;

	constructor(leaf: WorkspaceLeaf, plugin: ViewCountPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.component = null;
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

		store.plugin.set(this.plugin);

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
