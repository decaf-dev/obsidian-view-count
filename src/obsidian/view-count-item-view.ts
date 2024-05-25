import { App, ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_COUNT_ITEM_VIEW } from "src/constants";
import EventManager from "src/event/event-manager";
import ViewCountCache from "src/storage/view-count-cache";

export default class ViewCountItemView extends ItemView {
	app: App;
	cache: ViewCountCache;

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
		const { contentEl } = this;
		contentEl.addClass("view-count-view");

		//Calculate top 50 most viewed notes
		let sortedEntries = [...this.cache.getEntries()];
		sortedEntries.sort((a, b) => this.cache.getViewCountForEntry(b) - this.cache.getViewCountForEntry(a));
		sortedEntries = sortedEntries.slice(0, 50);

		EventManager.getInstance().on("refresh-item-view", this.handleRefreshEvent);

		if (sortedEntries.length === 0) {
			contentEl.createDiv({ cls: "pane-empty", text: "No notes with view count found." });
			return;
		}

		for (const entry of sortedEntries) {
			const file = this.app.vault.getFileByPath(entry.path);
			if (!file) {
				continue;
			}

			const containerEl = contentEl.createDiv({ cls: "tree-item" });
			const itemDiv = containerEl.createDiv({ cls: "tree-item-self is-clickable" });
			const innerDiv = itemDiv.createDiv({ cls: "tree-item-inner" });

			const displayName = file.extension == "md" ? file.basename : file.name;
			innerDiv.createDiv({ cls: "tree-item-inner-text", text: displayName });

			const flairOuterDiv = itemDiv.createDiv({ cls: "tree-item-flair-outer" });
			flairOuterDiv.createDiv({ cls: "tree-item-flair", text: this.cache.getViewCountForEntry(entry).toString() });

			itemDiv.addEventListener("click", () => {
				const type = (this.app as any).viewRegistry.getTypeByExtension(file.extension);
				this.app.workspace.getLeaf(false)?.setViewState({
					type,
					active: false,
					state: {
						file: entry.path,
					},
				});
			});
		}
	}

	async onClose() {
		const { contentEl } = this;
		contentEl.empty();

		EventManager.getInstance().off("refresh-item-view", this.handleRefreshEvent);
	}

	private handleRefreshEvent = () => {
		this.onClose();
		this.onOpen();
	}
}
