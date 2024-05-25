import { App, Notice, TFile } from "obsidian";
import { getFilePath, parseEntries, stringifyEntries } from "./utils";
import Logger from "js-logger";
import _ from "lodash";
import { ViewCountEntry } from "./types";
import EventManager from "src/event/event-manager";
import { getStartOf31DaysAgoMillis, getStartOfTodayMillis } from "src/utils/time-utils";
import { ViewCountPluginSettings } from "src/types";

export default class ViewCountCache {
	private app: App;
	private entries: ViewCountEntry[] = [];
	private settings: ViewCountPluginSettings;

	constructor(app: App, settings: ViewCountPluginSettings) {
		this.app = app;
		this.settings = settings;
	}


	debounceSave = _.debounce(() => this.save(), 200);
	debounceRefresh = _.debounce(() => this.refresh(), 200);

	async load() {
		Logger.trace("ViewCountCache load");
		const path = getFilePath(this.app);
		const exists = await this.app.vault.adapter.exists(path);

		if (!exists) {
			const data = stringifyEntries([]);
			try {
				Logger.debug("Creating new cache...");
				await this.app.vault.create(path, data);
			} catch (err) {
				Logger.error("Error creating cache: ", (err as Error).message);
				new Notice("View Count: error creating cache");
			}
			return;
		}

		try {
			const result = await this.app.vault.adapter.read(path);
			this.entries = parseEntries(result);
			Logger.debug("Loaded view count entries", { entries: this.entries });
			this.refresh();
		} catch (err) {
			Logger.error("Error loading cache: ", (err as Error).message);
			new Notice("View Count: error loading cache");
		}
	}

	async save() {
		Logger.trace("ViewCountCache save");
		try {
			Logger.debug("Saving view count entries", { entries: this.entries });
			const path = getFilePath(this.app);
			const data = stringifyEntries(this.entries);
			await this.app.vault.adapter.write(path, data);
		} catch (err) {
			Logger.error("Error saving file cache: ", (err as Error).message);
			new Notice("View Count: error saving file cache");
		}
	}

	incrementViewCount(file: TFile) {
		Logger.trace("ViewCountCache incrementViewCount");
		Logger.debug("Increment view count for file:", { path: file.path });

		const entry = this.entries.find((entry) => entry.path === file.path);
		if (entry) {
			this.entries = this.entries.map((entry) => {
				if (entry.path === file.path) {
					const lastOpen = entry.openLogs.last();

					let shouldIncrementDaysOpened = false;
					const startTodayMillis = getStartOfTodayMillis();
					const lastOpenMillis = lastOpen?.timestampMillis ?? 0;
					if (lastOpenMillis < startTodayMillis) {
						shouldIncrementDaysOpened = true;
					}

					//Keep 31 days of logs
					const start31DaysAgoMillis = getStartOf31DaysAgoMillis();
					const filteredLogs = entry.openLogs.filter((log) => log.timestampMillis >= start31DaysAgoMillis);

					return {
						...entry,
						totalTimesOpened: entry.totalTimesOpened + 1,
						uniqueDaysOpened: shouldIncrementDaysOpened ? entry.uniqueDaysOpened + 1 : entry.uniqueDaysOpened,
						openLogs: [...filteredLogs, { timestampMillis: Date.now() }],
					}
				}
				return entry;
			});
		} else {
			Logger.debug("Adding new entry");
			this.entries = [...this.entries, {
				path: file.path,
				uniqueDaysOpened: 1,
				totalTimesOpened: 1,
				openLogs: [{ timestampMillis: Date.now() }],
			}];
		}

		this.debounceSave();
		this.debounceRefresh();
	}

	async syncViewCountToFrontmatter(file: TFile) {
		const { viewCountPropertyName, saveViewCountToFrontmatter, templaterDelay, viewCountType } = this.settings;
		if (!saveViewCountToFrontmatter) {
			return;
		}

		const entry = this.entries.find((entry) => entry.path === file.path);
		if (!entry) {
			throw new Error("Entry not found");
		}

		if (!entry && templaterDelay > 0) {
			Logger.debug(`Templater delay is greater than 0. Waiting ${templaterDelay}ms before incrementing the view count.`);
			await new Promise(resolve => setTimeout(resolve, templaterDelay));
		}

		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (viewCountType === "unique-days-opened") {
				Logger.debug("Updating view count property in frontmatter", { path: file.path, viewCountPropertyName, viewCount: entry.uniqueDaysOpened, type: "unique-days-opened" });
				frontmatter[viewCountPropertyName] = entry.uniqueDaysOpened;
			} else {
				Logger.debug("Updating view count property in frontmatter", { path: file.path, viewCountPropertyName, viewCount: entry.totalTimesOpened, type: "total-times-opened" });
				frontmatter[viewCountPropertyName] = entry.totalTimesOpened;
			}
		});
	}

	getViewCount(file: TFile) {
		const { viewCountType } = this.settings;
		if (viewCountType === "unique-days-opened") {
			return this.entries.find((entry) => entry.path === file.path)?.uniqueDaysOpened ?? 0;
		} else {
			return this.entries.find((entry) => entry.path === file.path)?.totalTimesOpened ?? 0;
		}
	}

	getViewCountForEntry = (entry: ViewCountEntry) => {
		const { viewCountType } = this.settings;
		if (viewCountType === "unique-days-opened") {
			return entry.uniqueDaysOpened;
		} else {
			return entry.totalTimesOpened;
		}
	}

	getLastOpenTime(file: TFile) {
		const entry = this.entries.find((entry) => entry.path === file.path);
		if (!entry) {
			return 0;
		}

		const lastOpen = entry.openLogs.last();
		return lastOpen?.timestampMillis ?? 0;
	}

	async renameEntry(newPath: string, oldPath: string) {
		Logger.trace("ViewCountCache renameEntry");
		Logger.debug("Renaming entry", { oldPath, newPath });
		this.entries = this.entries.map((entry) => {
			if (entry.path === oldPath) {
				entry.path = newPath;
			}
			return entry;
		});

		this.debounceSave();
		this.debounceRefresh();
	}

	async deleteEntry(file: TFile) {
		Logger.trace("ViewCountCache deleteEntry");
		Logger.debug("Deleting entry", { path: file.path });
		this.entries = this.entries.filter((entry) => entry.path !== file.path);

		this.debounceSave();
		this.debounceRefresh();
	}

	getEntries() {
		return this.entries;
	}

	private refresh() {
		EventManager.getInstance().emit("refresh-item-view");
	}
}
