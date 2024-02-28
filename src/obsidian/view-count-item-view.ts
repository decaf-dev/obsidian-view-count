import { App, ItemView, MarkdownView, TFile, WorkspaceLeaf } from "obsidian";
import { VIEW_COUNT_ITEM_VIEW } from "src/constants";
import EventManager from "src/event/event-manager";
import ViewCountStorage from "src/storage/view-count-storage";

export default class ViewCountItemView extends ItemView {
	app: App;
	storage: ViewCountStorage;

	constructor(leaf: WorkspaceLeaf, app: App, storage: ViewCountStorage) {
		super(leaf);
		this.app = app;
		this.storage = storage;
	}

	getViewType() {
		return VIEW_COUNT_ITEM_VIEW;
	}

	getDisplayText() {
		return "Most viewed";
	}

	getIcon() {
		return "eye";
	}

	async onOpen() {
		const { contentEl } = this;

		//Calculate top 20 most viewed notes
		let sortedEntries = [...this.storage.getEntries()];
		sortedEntries.sort((a, b) => b.viewCount - a.viewCount);
		sortedEntries = sortedEntries.slice(0, 20);

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
			flairOuterDiv.createDiv({ cls: "tree-item-flair", text: entry.viewCount.toString() });

			itemDiv.addEventListener("click", () => {

				this.app.workspace.getLeaf(false)?.setViewState({
					type: file.extension == "canvas" ? "canvas" : "markdown",
					active: true,
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
		// console.log("Refreshing view count item view");
		this.onClose();
		this.onOpen();
	}
}
