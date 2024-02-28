import { App, TFile } from "obsidian";
import { ViewCountPluginSettings } from "src/types";

export default class PropertyStorage {

	private app: App;
	private settings: ViewCountPluginSettings;

	constructor(app: App, settings: ViewCountPluginSettings) {
		this.app = app;
		this.settings = settings;
	}

	async incrementViewCount(file: TFile) {
		const { viewCountPropertyName, incrementOnceADay, lastViewTimePropertyName } = this.settings;
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (incrementOnceADay) {
				frontmatter[lastViewTimePropertyName] = Date.now();
			}

			if (!frontmatter[viewCountPropertyName]) {
				frontmatter[viewCountPropertyName] = 1;
			} else {
				frontmatter[viewCountPropertyName]++;
			}
		});
	}

	async getViewCount(file: TFile) {
		const { viewCountPropertyName } = this.settings;

		let viewCount = 0;
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			viewCount = frontmatter[viewCountPropertyName] ?? 0;
		});
		return viewCount;
	}

	async getLastViewTime(file: TFile) {
		const { lastViewTimePropertyName } = this.settings;

		let lastViewTime = 0;
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			lastViewTime = frontmatter[lastViewTimePropertyName] ?? 0;
		});
		return lastViewTime;
	}
}
