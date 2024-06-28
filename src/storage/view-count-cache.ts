import { App, Notice, TFile } from "obsidian";
import { getFilePath, parseEntries, shouldTrackFile, stringifyEntries } from "./utils";
import Logger from "js-logger";
import _ from "lodash";
import { ViewCountEntry } from "./types";
import EventManager from "src/event/event-manager";
import { getStartOf14DaysAgoMillis, getStartOf30DaysAgoMillis, getStartOf31DaysAgoMillis, getStartOf3DaysAgoMillis, getStartOf7DaysAgoMillis, getStartOfMonthMillis, getStartOfTodayMillis, getStartOfWeekMillis } from "src/utils/time-utils";
import { TimePeriod, ViewCountPluginSettings } from "src/types";

export default class ViewCountCache {
	private app: App;
	private entries: ViewCountEntry[] = [];
	private settings: ViewCountPluginSettings;

	private debounceSave = _.debounce(() => this.save(), 200);
	debounceRefresh = _.debounce(() => this.refresh(), 200);

	constructor(app: App, settings: ViewCountPluginSettings) {
		this.app = app;
		this.settings = settings;
	}

	async load() {
		Logger.trace({ fileName: "view-count-cache.ts", functionName: "load", message: "called" });
		const path = getFilePath(this.app);
		const exists = await this.app.vault.adapter.exists(path);

		if (!exists) {
			const data = stringifyEntries([]);
			try {
				Logger.debug({ fileName: "view-count-cache.ts", functionName: "load", message: "creating new cache..." });
				await this.app.vault.create(path, data);
			} catch (err) {
				const error = err as Error;
				Logger.error({ fileName: "view-count-cache.ts", functionName: "load", message: "error creating cache" }, { error: error.message });
				new Notice("View Count: error creating cache");
			}
			return;
		}

		try {
			const result = await this.app.vault.adapter.read(path);
			this.entries = parseEntries(result);
			Logger.debug({ fileName: "view-count-cache.ts", functionName: "load", message: "loaded view count entries" }, { entries: this.entries });
			this.refresh();
		} catch (err) {
			const error = err as Error;
			Logger.error({ fileName: "view-count-cache.ts", functionName: "load", message: "error loading cache" }, { error: error.message });
			new Notice("View Count: error loading cache");
		}
	}

	async save() {
		Logger.trace({ fileName: "view-count-cache.ts", functionName: "save", message: "called" });
		try {
			const path = getFilePath(this.app);
			const data = stringifyEntries(this.entries);
			await this.app.vault.adapter.write(path, data);
		} catch (err) {
			const error = err as Error;
			Logger.error({ fileName: "view-count-cache.ts", functionName: "save", message: "error saving file cache" }, { error: error.message });
			new Notice("View Count: error saving file cache");
		}
	}

	async handleFileOpen(file: TFile) {
		Logger.trace({ fileName: "view-count-cache.ts", functionName: "handleFileOpen", message: "called" });
		const { excludedPaths, templaterDelay, saveViewCountToFrontmatter } = this.settings;
		if (!shouldTrackFile(file, excludedPaths)) {
			Logger.debug({ fileName: "view-count-cache.ts", functionName: "handeFileOpen", message: `file "${file.path}" is set to be excluded. returning...` });
			return;
		}

		const entry = this.entries.find((entry) => entry.path === file.path);
		if (!entry) {
			await this.createEntry(file);
		}

		await this.incrementViewCount(file.path);

		if (saveViewCountToFrontmatter) {
			//If we're creating a new file and the templater delay is greater than 0, wait before updating the view count property in frontmatter
			//This is to prevent the view count from overwriting the templater output
			if (!entry && templaterDelay > 0) {
				Logger.debug({ fileName: "view-count-cache.ts", functionName: "handleFileOpen", message: `templater delay is greater than 0. Waiting ${templaterDelay}ms before incrementing the view count.` });
				await new Promise(resolve => setTimeout(resolve, templaterDelay));
			}
			await this.updateViewCountProperty(file);
		}


		await this.addOpenLogEntry(file.path);

		this.debounceSave();
		this.debounceRefresh();
	}

	/**
	 * Gets the view count for a file.
	 * This may be the total times opened or the unique days opened depending on the settings.
	 * Note: This is a public method for usage with DataviewJS
	 * @param file 
	 * @returns 
	 */
	getViewCount = (file: TFile) => {
		const entry = this.entries.find((entry) => entry.path === file.path);
		if (!entry) {
			return 0;
		}
		return this.getViewCountForEntry(entry);
	}

	getViewCountForEntry(entry: ViewCountEntry) {
		const { viewCountType } = this.settings;
		if (viewCountType === "unique-days-opened") {
			return entry.uniqueDaysOpened;
		} else {
			return entry.totalTimesOpened;
		}
	}


	/**
	 * Gets the trending weight (the score) for a file.
	 * Note: This is a public method for usage with DataviewJS
	 * @param file - The file to get the weight for
	 * @param timePeriod - The time period used to calculate the weight
	 */
	getTrendingWeight(file: TFile, timePeriod: TimePeriod) {
		const entry = this.entries.find((entry) => entry.path === file.path);
		if (!entry) {
			return 0;
		}
		return this.getNumTimesOpenedForEntry(entry, timePeriod);
	}

	getNumTimesOpenedForEntry(entry: ViewCountEntry, timePeriod: TimePeriod) {
		const { openLogs } = entry;

		let timeMillis = 0;

		switch (timePeriod) {
			case TimePeriod.MONTH:
				timeMillis = getStartOfMonthMillis();
				break;
			case TimePeriod.WEEK:
				timeMillis = getStartOfWeekMillis(false);
				break;
			case TimePeriod.WEEK_ISO:
				timeMillis = getStartOfWeekMillis(true);
				break;
			case TimePeriod.TODAY:
				timeMillis = getStartOfTodayMillis();
				break;
			case TimePeriod.DAYS_30:
				timeMillis = getStartOf30DaysAgoMillis();
				break;
			case TimePeriod.DAYS_14:
				timeMillis = getStartOf14DaysAgoMillis();
				break;
			case TimePeriod.DAYS_7:
				timeMillis = getStartOf7DaysAgoMillis();
				break;
			case TimePeriod.DAYS_3:
				timeMillis = getStartOf3DaysAgoMillis();
				break;
			default:
				throw new Error(`TimePeriod ${timePeriod} is not supported`);
		}

		return openLogs.filter((log) => log.timestampMillis >= timeMillis).length;
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
		Logger.trace({ fileName: "view-count-cache.ts", functionName: "renameEntry", message: "called" });
		Logger.debug({ fileName: "view-count-cache.ts", functionName: "renameEntry", message: "called" }, { oldPath, newPath });

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
		Logger.trace({ fileName: "view-count-cache.ts", functionName: "deleteEntry", message: "called" });
		Logger.debug({ fileName: "view-count-cache.ts", functionName: "deleteEntry", message: "deleting entry" }, { path: file.path });
		this.entries = this.entries.filter((entry) => entry.path !== file.path);

		this.debounceSave();
		this.debounceRefresh();
	}

	getEntries() {
		return this.entries;
	}

	getEntriesSortedByViewCount(sortDir: "asc" | "desc") {
		let entriesCopy = [...this.entries];
		entriesCopy.sort(
			(a, b) => {
				if (sortDir === "asc") {
					return this.getViewCountForEntry(a) - this.getViewCountForEntry(b);
				} else {
					return this.getViewCountForEntry(b) - this.getViewCountForEntry(a);
				}
			}
		);
		return entriesCopy;
	}

	async syncViewCountToFrontmatter() {
		Logger.trace({ fileName: "view-count-cache.ts", functionName: "syncViewCountToFrontmatter", message: "called" });

		const { saveViewCountToFrontmatter } = this.settings;
		for (const entry of this.entries) {
			const file = this.app.vault.getFileByPath(entry.path);
			if (!file) continue;

			if (saveViewCountToFrontmatter) {
				await this.updateViewCountProperty(file);
			} else {
				await this.deleteViewCountProperty(file);

			}
		}
	}

	private async updateViewCountProperty(file: TFile) {
		Logger.trace({ fileName: "view-count-cache.ts", functionName: "updateViewCountProperty", message: "called" });
		const { viewCountPropertyName, viewCountType } = this.settings;

		const entry = this.entries.find((entry) => entry.path === file.path);
		if (!entry) {
			throw new Error("Entry not found for file");
		}

		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (viewCountType === "unique-days-opened") {
				Logger.debug({ fileName: "view-count-cache.ts", functionName: "updateViewCountProperty", message: "ipdating view count property in frontmatter" }, { path: file.path, viewCountPropertyName, viewCount: entry.uniqueDaysOpened, type: "unique-days-opened" });
				frontmatter[viewCountPropertyName] = entry.uniqueDaysOpened;
			} else {
				Logger.debug({ fileName: "view-count-cache.ts", functionName: "updateViewCountProperty", message: "ipdating view count property in frontmatter" }, { path: file.path, viewCountPropertyName, viewCount: entry.totalTimesOpened, type: "total-times-opened" });
				frontmatter[viewCountPropertyName] = entry.totalTimesOpened;
			}
		});
	}

	private async deleteViewCountProperty(file: TFile) {
		Logger.trace({ fileName: "view-count-cache.ts", functionName: "deleteViewCountProperty", message: "called" });
		const { viewCountPropertyName } = this.settings;

		Logger.debug({ fileName: "view-count-cache.ts", functionName: "deleteViewCountProperty", message: "deleting view count property in frontmatter" }, { path: file.path, viewCountPropertyName });
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			frontmatter[viewCountPropertyName] = undefined;
		});
	}

	private async createEntry(file: TFile) {
		Logger.trace({ fileName: "view-count-cache.ts", functionName: "createEntry", message: "called" });
		Logger.debug({ fileName: "view-count-cache.ts", functionName: "createEntry", message: "creating new entry" }, { path: file.path });

		const updatedEntries = [...this.entries, {
			path: file.path,
			uniqueDaysOpened: 0,
			totalTimesOpened: 0,
			openLogs: [],
		}];
		this.entries = updatedEntries;
	}

	private async addOpenLogEntry(targetPath: string) {
		Logger.trace({ fileName: "view-count-cache.ts", functionName: "addOpenLogEntry", message: "called" });
		Logger.trace({ fileName: "view-count-cache.ts", functionName: "addOpenLogEntry", message: "adding to open log" }, { targetPath });

		const updatedEntries = this.entries.map((entry) => {
			if (entry.path === targetPath) {
				//Keep 31 days of logs.
				//This will support both 30-days and month time periods
				const start31DaysAgoMillis = getStartOf31DaysAgoMillis();
				const filteredLogs = entry.openLogs.filter((log) => log.timestampMillis >= start31DaysAgoMillis);

				const updatedLogs = [...filteredLogs, { timestampMillis: Date.now() }];

				return {
					...entry,
					openLogs: updatedLogs
				}
			}
			return entry;
		});
		this.entries = updatedEntries;
	}

	private async incrementViewCount(targetPath: string) {
		Logger.trace({ fileName: "view-count-cache.ts", functionName: "incrementViewCount", message: "called" });
		Logger.debug({ fileName: "view-count-cache.ts", functionName: "incrementViewCount", message: "incrementing view count" }, { targetPath });

		const updatedEntries = this.entries.map((entry) => {
			if (entry.path === targetPath) {
				const lastOpenEntry = entry.openLogs.last();

				const startTodayMillis = getStartOfTodayMillis();
				const lastOpenMillis = lastOpenEntry?.timestampMillis ?? 0;

				let incrementDays = false;
				if (lastOpenMillis < startTodayMillis) {
					incrementDays = true;
				}

				return {
					...entry,
					totalTimesOpened: entry.totalTimesOpened + 1,
					uniqueDaysOpened: incrementDays ? entry.uniqueDaysOpened + 1 : entry.uniqueDaysOpened,
				}
			}
			return entry;
		});
		this.entries = updatedEntries;
	}


	private refresh() {
		Logger.trace({ fileName: "view-count-cache.ts", functionName: "refresh", message: "called" });
		EventManager.getInstance().emit("refresh-item-view");
	}
}
