import { Plugin, TFile, moment } from 'obsidian';
import ViewCountSettingsTab from './obsidian/view-count-settings-tab';

interface ViewCountPluginSettings {
	incrementOnceADay: boolean;
	lastViewed: {
		path: string,
		viewTime: number
	}[];
}

const DEFAULT_SETTINGS: ViewCountPluginSettings = {
	incrementOnceADay: true,
	lastViewed: []
}

export default class ViewCountPlugin extends Plugin {
	settings: ViewCountPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerEvent(this.app.workspace.on("file-open", async (file) => {
			if (file === null) return;
			if (file.extension !== "md") return;

			const incrementOnceADay = this.settings.incrementOnceADay;
			if (incrementOnceADay) {
				const lastViewedMillis = this.getLastViewed(file);
				const startTodayMillis = moment().startOf('day').valueOf();
				if (lastViewedMillis >= startTodayMillis) {
					return;
				}
			}
			await this.updateLastViewed(file);
			await this.incrementViewCount(file);
		}));

		this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
			if (file instanceof TFile) {
				await this.renameLastViewed(file.path, oldPath);
			}
		}));

		this.registerEvent(this.app.vault.on("delete", async (file) => {
			if (file instanceof TFile) {
				this.deleteLastViewed(file);
			}
		}));

		this.addSettingTab(new ViewCountSettingsTab(this.app, this));
	}

	private async incrementViewCount(file: TFile) {
		// const propertyName = this.settings.propertyName;

		// await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
		// 	if (!frontmatter[propertyName]) {
		// 		frontmatter[propertyName] = 1;
		// 	} else {
		// 		frontmatter[propertyName]++;
		// 	}
		// });
	}

	private getLastViewed(file: TFile) {
		const lastViewed = this.settings.lastViewed;
		const entry = lastViewed.find((entry) => entry.path === file.path);
		return entry ? entry.viewTime : 0;
	}

	private async deleteLastViewed(file: TFile) {
		const lastViewed = this.settings.lastViewed;
		const index = lastViewed.findIndex((entry) => entry.path === file.path);
		if (index !== -1) {
			lastViewed.splice(index, 1);
			await this.saveSettings();
		}
	}

	private async updateLastViewed(file: TFile) {
		const lastViewed = this.settings.lastViewed;
		const index = lastViewed.findIndex((entry) => entry.path === file.path);
		if (index === -1) {
			lastViewed.push({ path: file.path, viewTime: Date.now() });
		} else {
			lastViewed[index].viewTime = Date.now();
		}
		await this.saveSettings();
	}

	private async renameLastViewed(newPath: string, oldPath: string) {
		const lastViewed = this.settings.lastViewed;
		this.settings.lastViewed = lastViewed.map((entry) => {
			const { path } = entry;
			if (path === oldPath) {
				return {
					...entry,
					path: newPath
				}
			}
			return entry;
		});
		await this.saveSettings();
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
