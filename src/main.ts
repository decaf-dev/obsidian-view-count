import { Plugin, TFile, moment } from 'obsidian';
import ViewCountSettingsTab from './obsidian/view-count-settings-tab';
import FileStorage from './storage/file-storage';
import PropertyStorage from './storage/property-storage';
import { ViewCountPluginSettings } from './types';
import ViewCountItemView from './obsidian/view-count-item-view';
import { VIEW_COUNT_ITEM_VIEW } from './constants';

const DEFAULT_SETTINGS: ViewCountPluginSettings = {
	incrementOnceADay: true,
	storageType: "property",
	viewCountPropertyName: "view-count",
	lastViewTimePropertyName: "last-view-time"
}

export default class ViewCountPlugin extends Plugin {
	settings: ViewCountPluginSettings;
	storage: FileStorage | PropertyStorage;
	viewCountStatusBarItem?: HTMLElement;

	async onload() {
		await this.loadSettings();

		if (this.settings.storageType === "file") {
			this.storage = new FileStorage(this.app);
		} else if (this.settings.storageType === "property") {
			this.storage = new PropertyStorage(this.app, this.settings);
		}

		this.registerView(
			VIEW_COUNT_ITEM_VIEW,
			(leaf) => new ViewCountItemView(leaf, this.app, this.storage),
		);

		this.addSettingTab(new ViewCountSettingsTab(this.app, this));

		this.app.workspace.onLayoutReady(async () => {
			await this.storage.load();

			if (this.settings.storageType === "file") {
				await this.registerFileStorageEvents();
			} else if (this.settings.storageType === "property") {
				await this.registerPropertyStorageEvents();
			}

			const leaves = this.app.workspace.getLeavesOfType(VIEW_COUNT_ITEM_VIEW);
			if (leaves.length === 0) {
				this.app.workspace.getRightLeaf(false)?.setViewState({
					type: VIEW_COUNT_ITEM_VIEW,
					active: false,
				});
			}
		});
	}

	async registerPropertyStorageEvents() {
		this.registerEvent(this.app.workspace.on("file-open", async (file) => {
			if (file === null) return;
			if (file.extension !== "md") return;

			const incrementOnceADay = this.settings.incrementOnceADay;
			if (incrementOnceADay) {
				const lastViewedMillis = await this.storage.getLastViewTime(file);
				const startTodayMillis = moment().startOf('day').valueOf();
				if (lastViewedMillis >= startTodayMillis) {
					return;
				}
			}
			await this.storage.incrementViewCount(file);
		}));

		this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
			if (file instanceof TFile) {
				await this.storage.renameEntry(file.path, oldPath);
			}
		}));

		this.registerEvent(this.app.vault.on("delete", async (file) => {
			if (file instanceof TFile) {
				this.storage.deleteEntry(file);
			}
		}));
	}

	async registerFileStorageEvents() {
		this.registerEvent(this.app.workspace.on("file-open", async (file) => {
			if (file === null) return;

			const incrementOnceADay = this.settings.incrementOnceADay;
			if (incrementOnceADay) {
				const lastViewedMillis = await this.storage.getLastViewTime(file);
				const startTodayMillis = moment().startOf('day').valueOf();
				if (lastViewedMillis < startTodayMillis) {
					await this.storage.incrementViewCount(file);
				}
			} else {
				await this.storage.incrementViewCount(file);
			}

			if (!this.viewCountStatusBarItem) {
				this.viewCountStatusBarItem = this.addStatusBarItem();
			}
			const viewCount = await this.storage.getViewCount(file);
			const viewName = viewCount === 1 ? "view" : "views";
			this.viewCountStatusBarItem.setText(`${viewCount} ${viewName}`);
		}));

		this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
			if (file instanceof TFile) {
				await this.storage.renameEntry(file.path, oldPath);
			}
		}));

		this.registerEvent(this.app.vault.on("delete", async (file) => {
			if (file instanceof TFile) {
				this.storage.deleteEntry(file);
			}
		}));
	}

	onunload() {
		this.viewCountStatusBarItem?.remove();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
