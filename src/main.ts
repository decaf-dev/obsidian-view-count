import { Plugin, TFile, moment } from 'obsidian';
import ViewCountSettingsTab from './obsidian/view-count-settings-tab';
import FileCache from './file-storage';
import FileStorage from './file-storage';
import PropertyStorage from './property-storage';
import { ViewCountPluginSettings } from './types';

const DEFAULT_SETTINGS: ViewCountPluginSettings = {
	incrementOnceADay: true,
	storageType: "property",
	viewCountPropertyName: "view-count",
	lastViewTimePropertyName: "last-view-time"
}

export default class ViewCountPlugin extends Plugin {
	settings: ViewCountPluginSettings;
	fileStorage: FileStorage;
	propertyStorage: PropertyStorage;
	viewCountStatusBarItem?: HTMLElement;

	async onload() {
		await this.loadSettings();

		if (this.settings.storageType === "property") {
			this.propertyStorage = new PropertyStorage(this.app, this.settings);
			await this.registerPropertyStorageEvents();
		} else {
			this.fileStorage = new FileCache(this.app);
			await this.fileStorage.load();
			await this.registerFileStorageEvents();
		}

		this.addSettingTab(new ViewCountSettingsTab(this.app, this));
	}

	async registerPropertyStorageEvents() {
		this.registerEvent(this.app.workspace.on("file-open", async (file) => {
			if (file === null) return;
			if (file.extension !== "md") return;

			const incrementOnceADay = this.settings.incrementOnceADay;
			if (incrementOnceADay) {
				const lastViewedMillis = await this.propertyStorage.getLastViewTime(file);
				const startTodayMillis = moment().startOf('day').valueOf();
				if (lastViewedMillis >= startTodayMillis) {
					return;
				}
			}
			await this.propertyStorage.incrementViewCount(file);
		}));
	}

	async registerFileStorageEvents() {
		this.registerEvent(this.app.workspace.on("file-open", async (file) => {
			if (file === null) return;

			const incrementOnceADay = this.settings.incrementOnceADay;
			if (incrementOnceADay) {
				const lastViewedMillis = this.fileStorage.getViewTime(file);
				const startTodayMillis = moment().startOf('day').valueOf();
				if (lastViewedMillis < startTodayMillis) {
					await this.fileStorage.incrementViewCount(file);
				}
			} else {
				await this.fileStorage.incrementViewCount(file);
			}

			if (!this.viewCountStatusBarItem) {
				this.viewCountStatusBarItem = this.addStatusBarItem();
			}
			const viewCount = this.fileStorage.getViewCount(file);
			const viewName = viewCount === 1 ? "view" : "views";
			this.viewCountStatusBarItem.setText(`${viewCount} ${viewName}`);
		}));

		this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
			if (file instanceof TFile) {
				await this.fileStorage.renameLastViewed(file.path, oldPath);
			}
		}));

		this.registerEvent(this.app.vault.on("delete", async (file) => {
			if (file instanceof TFile) {
				this.fileStorage.deleteLastViewed(file);
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
