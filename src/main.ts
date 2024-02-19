import { Plugin, TFile, moment } from 'obsidian';
import ViewCountSettingsTab from './obsidian/view-count-settings-tab';
import ViewCountCache from './count/view-count-cache';

interface ViewCountPluginSettings {
	incrementOnceADay: boolean;
}

const DEFAULT_SETTINGS: ViewCountPluginSettings = {
	incrementOnceADay: true,
}

export default class ViewCountPlugin extends Plugin {
	settings: ViewCountPluginSettings;
	viewCountCache: ViewCountCache;
	viewCountStatusBarItem?: HTMLElement;

	async onload() {
		this.viewCountCache = new ViewCountCache(this.app);
		await this.loadSettings();

		await this.viewCountCache.load();

		this.registerEvent(this.app.workspace.on("file-open", async (file) => {
			if (file === null) return;

			const incrementOnceADay = this.settings.incrementOnceADay;
			if (incrementOnceADay) {
				const lastViewedMillis = this.viewCountCache.getViewTime(file);
				const startTodayMillis = moment().startOf('day').valueOf();
				if (lastViewedMillis >= startTodayMillis) {
					return;
				}
			}
			await this.viewCountCache.incrementViewCount(file);

			if (!this.viewCountStatusBarItem) {
				this.viewCountStatusBarItem = this.addStatusBarItem();
			}
			const viewCount = this.viewCountCache.getViewCount(file);
			const viewName = viewCount === 1 ? "view" : "views";
			this.viewCountStatusBarItem.setText(`${viewCount} ${viewName}`);
		}));

		this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
			if (file instanceof TFile) {
				await this.viewCountCache.renameLastViewed(file.path, oldPath);
			}
		}));

		this.registerEvent(this.app.vault.on("delete", async (file) => {
			if (file instanceof TFile) {
				this.viewCountCache.deleteLastViewed(file);
			}
		}));

		this.addSettingTab(new ViewCountSettingsTab(this.app, this));
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
