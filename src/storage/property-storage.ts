import { App, TFile } from "obsidian";
import { ViewCountPluginSettings } from "src/types";
import ViewCountStorage from "./view-count-storage";
import { dateToUnixTimeMillis, unixTimeMillisToDate } from "src/utils/time-utils";
import Logger from "js-logger";

export default class PropertyStorage extends ViewCountStorage {
	private app: App;
	private settings: ViewCountPluginSettings;

	constructor(app: App, settings: ViewCountPluginSettings) {
		super();
		this.app = app;
		this.settings = settings;
	}

	async load() {
		Logger.trace("PropertyStorage load");
		const { viewCountPropertyName, lastViewDatePropertyName } = this.settings;

		const markdownFiles = this.app.vault.getMarkdownFiles();
		for (const file of markdownFiles) {
			const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;

			const date = frontmatter?.[lastViewDatePropertyName] ?? "";
			const timeMillis = dateToUnixTimeMillis(date);

			if (frontmatter?.[viewCountPropertyName] !== undefined) {
				this.entries.push({
					viewCount: frontmatter?.[viewCountPropertyName],
					lastViewMillis: timeMillis,
					path: file.path
				})
			}
		}
		Logger.debug("Loaded entries", { entries: this.entries });
		this.refresh();

	}

	async incrementViewCount(file: TFile) {
		Logger.trace("PropertyStorage incrementViewCount");
		Logger.debug("Incrementing view count for file", { path: file.path });
		const { viewCountPropertyName, incrementOnceADay, lastViewDatePropertyName } = this.settings;
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
				Logger.debug("Updating view date");
				const date = unixTimeMillisToDate(Date.now());
				frontmatter[lastViewDatePropertyName] = date;
			}

			if (!frontmatter[viewCountPropertyName]) {
				Logger.debug("Setting view count to 1");
				frontmatter[viewCountPropertyName] = 1;
			} else {
				Logger.debug("Incrementing view count");
				frontmatter[viewCountPropertyName]++;
			}
		});
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
		const { lastViewDatePropertyName } = this.settings;

		let lastViewDate = "";
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			lastViewDate = frontmatter[lastViewDatePropertyName] ?? "";
		});
		const timeMillis = dateToUnixTimeMillis(lastViewDate);
		return timeMillis;
	}

	async renameEntry(newPath: string, oldPath: string) {
		Logger.trace("PropertyStorage renameEntry");
		Logger.debug("Renaming entry", { oldPath, newPath });
		this.entries = this.entries.map((entry) => {
			if (entry.path === oldPath) {
				entry.path = newPath;
			}
			return entry;
		});
		this.refresh();
	}

	async deleteEntry(file: TFile) {
		Logger.trace("PropertyStorage deleteEntry");
		Logger.debug("Deleting entry", { path: file.path });
		this.entries = this.entries.filter((entry) => entry.path !== file.path);
		this.refresh();
	}
}
