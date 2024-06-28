import { App, Notice, TFile } from "obsidian";
import { getFilePath, parseEntries, shouldTrackFile, stringifyEntries } from "./utils";
import Logger from "js-logger";
import _ from "lodash";
import { DurationFilter, ViewCountEntry } from "./types";
import EventManager from "src/event/event-manager";
import { getStartOf14DaysAgoMillis, getStartOf30DaysAgoMillis, getStartOf31DaysAgoMillis, getStartOf7DaysAgoMillis, getStartOfMonthMillis, getStartOfTodayMillis, getStartOfWeekMillis } from "src/utils/time-utils";
import { ViewCountPluginSettings } from "src/types";

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
			const path = getFilePath(this.app);
			const data = stringifyEntries(this.entries);
			await this.app.vault.adapter.write(path, data);
		} catch (err) {
			Logger.error("Error saving file cache: ", (err as Error).message);
			new Notice("View Count: error saving file cache");
		}
	}

	async handleFileOpen(file: TFile) {
		Logger.trace("ViewCountCache handleFileOpen");
		const { excludedPaths, templaterDelay, saveViewCountToFrontmatter } = this.settings;
		if (!shouldTrackFile(file, excludedPaths)) {
			Logger.debug(`File ${file.path} is set to be excluded. Returning.`);
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
				Logger.debug(`Templater delay is greater than 0. Waiting ${templaterDelay}ms before incrementing the view count.`);
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
	 * @param duration - The duration used to calculate the weight
	 */
	getTrendingWeight(file: TFile, duration: DurationFilter) {
		const entry = this.entries.find((entry) => entry.path === file.path);
		if (!entry) {
			return 0;
		}
		return this.getNumTimesOpenedForEntry(entry, duration);
	}

	getNumTimesOpenedForEntry(entry: ViewCountEntry, duration: DurationFilter) {
		const { openLogs } = entry;

		let timeMillis = 0;

		switch (duration) {
			case "month":
				timeMillis = getStartOfMonthMillis();
				break;
			case "week":
				timeMillis = getStartOfWeekMillis(false);
				break;
			case "week-iso":
				timeMillis = getStartOfWeekMillis(true);
				break;
			case "30-days":
				timeMillis = getStartOf30DaysAgoMillis();
				break;
			case "14-days":
				timeMillis = getStartOf14DaysAgoMillis();
				break;
			case "7-days":
				timeMillis = getStartOf7DaysAgoMillis();
				break;
			default:
				throw new Error(`DurationFilter ${duration} is not supported`);
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
		Logger.trace("ViewCountCache syncViewCountToFrontmatter");

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
		Logger.trace("ViewCountCache updateViewCountPropertyInFrontmatter");
		const { viewCountPropertyName, viewCountType } = this.settings;

		const entry = this.entries.find((entry) => entry.path === file.path);
		if (!entry) {
			throw new Error("Entry not found for file");
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

	private async deleteViewCountProperty(file: TFile) {
		Logger.trace("ViewCountCache deleteViewCountPropertyInFrontmatter");
		const { viewCountPropertyName } = this.settings;

		Logger.debug("Deleting view count property in frontmatter", { path: file.path, viewCountPropertyName });
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			frontmatter[viewCountPropertyName] = undefined;
		});
	}

	private async createEntry(file: TFile) {
		Logger.trace("ViewCountCache createEntry");
		Logger.debug("Creating new entry", { path: file.path });

		const updatedEntries = [...this.entries, {
			path: file.path,
			uniqueDaysOpened: 0,
			totalTimesOpened: 0,
			openLogs: [],
		}];
		this.entries = updatedEntries;
	}

	private async addOpenLogEntry(targetPath: string) {
		Logger.trace("ViewCountCache addOpenLogEntry");
		Logger.debug("Adding to open log", { path: targetPath });

		const updatedEntries = this.entries.map((entry) => {
			if (entry.path === targetPath) {
				//Keep 31 days of logs. This will support both 30-days and month durations
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
		Logger.trace("ViewCountCache incrementViewCount");
		Logger.debug("Incrementing view count", { path: targetPath });

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
		EventManager.getInstance().emit("refresh-item-view");
	}
}
