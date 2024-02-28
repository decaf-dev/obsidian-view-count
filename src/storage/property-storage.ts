import { App, TFile } from "obsidian";
import { ViewCountPluginSettings } from "src/types";
import ViewCountStorage from "./view-count-storage";
import { dateTimeToUnixTimeMillis, getPropertyType, setPropertyType, unixTimeMillisToDateTime } from "./utils";

export default class PropertyStorage extends ViewCountStorage {
	private app: App;
	private settings: ViewCountPluginSettings;

	constructor(app: App, settings: ViewCountPluginSettings) {
		super();
		this.app = app;
		this.settings = settings;
	}

	async load() {
		const { viewCountPropertyName, lastViewTimePropertyName } = this.settings;

		const markdownFiles = this.app.vault.getMarkdownFiles();
		for (const file of markdownFiles) {
			const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;

			const dateTime = frontmatter?.[lastViewTimePropertyName] ?? "";
			const timeMillis = dateTimeToUnixTimeMillis(dateTime);
			this.entries.push({
				viewCount: frontmatter?.[viewCountPropertyName] ?? 0,
				lastViewMillis: timeMillis,
				path: file.path
			})
		}
		this.refresh();

	}

	async incrementViewCount(file: TFile) {
		const { viewCountPropertyName, incrementOnceADay, lastViewTimePropertyName } = this.settings;
		const entry = this.entries.find((entry) => entry.path === file.path);

		if (entry) {
			this.entries = this.entries.map((entry) => {
				if (entry.path === file.path) {
					return {
						...entry,
						viewCount: entry.viewCount + 1,
						lastViewMillis: Date.now()
					};
				}
				return entry;
			});
		} else {
			this.entries = [...this.entries, {
				path: file.path,
				viewCount: 1,
				lastViewMillis: Date.now()
			}];
		}

		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (incrementOnceADay) {
				const dateTime = unixTimeMillisToDateTime(Date.now());
				frontmatter[lastViewTimePropertyName] = dateTime;
			}

			if (!frontmatter[viewCountPropertyName]) {
				frontmatter[viewCountPropertyName] = 1;
			} else {
				frontmatter[viewCountPropertyName]++;
			}
		});
		//console.log("Incremented view count for file: ", file.path);
		this.refresh();
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

		let lastViewTime = "";
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			lastViewTime = frontmatter[lastViewTimePropertyName] ?? "";
		});
		const timeMillis = dateTimeToUnixTimeMillis(lastViewTime);
		return timeMillis;
	}

	async renameEntry(newPath: string, oldPath: string) {
		//console.log("Renaming file: ", oldPath, newPath);
		this.entries = this.entries.map((entry) => {
			if (entry.path === oldPath) {
				entry.path = newPath;
			}
			return entry;
		});
		this.refresh();
	}

	async deleteEntry(file: TFile) {
		//console.log("Deleting file: ", file.path);
		this.entries = this.entries.filter((entry) => entry.path !== file.path);
		this.refresh();
	}
}
