import { Plugin, TFile, normalizePath } from 'obsidian';
import ViewCountSettingsTab from './obsidian/view-count-settings-tab';
import { ViewCountPluginSettings, ViewCountPluginSettings_1_2_1, ViewCountPluginSettings_1_2_2 } from './types';
import ViewCountItemView from './obsidian/view-count-item-view';
import { VIEW_COUNT_ITEM_VIEW } from './constants';
import Logger from 'js-logger';
import { LOG_LEVEL_OFF } from './logger/constants';
import { formatMessageForLogger, stringToLogLevel } from './logger';
import _ from 'lodash';
import { isVersionLessThan } from './utils';
import ViewCountCache from './storage/view-count-cache';
import { getStartOfTodayMillis } from './utils/time-utils';
import { migrateFileStorage } from './migration/migrate-file-storage';
import { migratePropertyStorage } from './migration/migrate-property-storage';

const DEFAULT_SETTINGS: ViewCountPluginSettings = {
	viewCountType: "unique-days-opened",
	saveViewCountToFrontmatter: false,
	viewCountPropertyName: "view-count",
	pluginVersion: "",
	logLevel: LOG_LEVEL_OFF,
	excludedPaths: [],
	templaterDelay: 0,
}

export default class ViewCountPlugin extends Plugin {
	settings: ViewCountPluginSettings;
	viewCountStatusBarItem: HTMLElement | null = null;
	viewCountCache: ViewCountCache;
	settings_1_2_2: ViewCountPluginSettings_1_2_2 | null = null;

	debounceFileOpen = _.debounce(this.handleFileOpen, 100);

	async onload() {
		await this.loadSettings();

		//Setup logger
		Logger.useDefaults();
		Logger.setHandler(function (messages) {
			const { message, data } = formatMessageForLogger(...messages);
			console.log(message);
			if (data) {
				console.log(data);
			}
		});

		const logLevel = stringToLogLevel(this.settings.logLevel);
		Logger.setLevel(logLevel);

		this.viewCountCache = new ViewCountCache(this.app, this.settings);

		this.registerView(
			VIEW_COUNT_ITEM_VIEW,
			(leaf) => new ViewCountItemView(leaf, this.app, this.viewCountCache),
		);

		this.addSettingTab(new ViewCountSettingsTab(this.app, this));

		if (this.settings_1_2_2?.storageType != "property") {
			await this.viewCountCache.load();
		}

		this.registerEvents();

		this.app.workspace.onLayoutReady(async () => {
			if (this.settings_1_2_2?.storageType == "property") {
				await migratePropertyStorage(this.app, this.settings_1_2_2);
				await this.viewCountCache.load();
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

	registerEvents() {
		this.registerEvent(this.app.workspace.on("active-leaf-change", async (leaf) => {
			if (leaf === null) return;
			const viewType = leaf.view.getViewType();
			Logger.debug("Active leaf changed", { viewType });

			if (viewType !== "markdown" && viewType !== "image" && viewType !== "pdf" && viewType != "dataloom" && viewType != "audio" && viewType != "video") {
				Logger.debug("View count not supported for view type", { viewType });
				this.viewCountStatusBarItem?.setText("");
				return;
			}

			const file = this.app.workspace.getActiveFile();
			if (file === null) return;

			await this.debounceFileOpen(file);
		}));

		this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
			if (file instanceof TFile) {
				await this.viewCountCache.renameEntry(file.path, oldPath);
			}
		}));

		this.registerEvent(this.app.vault.on("delete", async (file) => {
			if (file instanceof TFile) {
				await this.viewCountCache.deleteEntry(file);
			}
		}));
	}

	private async handleFileOpen(file: TFile) {
		Logger.trace("handleFileOpen");
		const { excludedPaths, viewCountType } = this.settings;
		if (excludedPaths.find(path => {
			//Normalize the path so that it will match the file path
			//This function will remove a forward slash
			const normalized = normalizePath(path);
			return file.path.startsWith(normalized)
		})) {
			Logger.debug(`File path ${file.path} is included in the excludedPaths array`);
			return false;
		}

		if (viewCountType == "unique-days-opened") {
			Logger.debug("View count type set to 'unique-days-opened'. Checking if view count should be incremented.");
			const lastOpenMillis = this.viewCountCache.getLastOpenTime(file);
			const startTodayMillis = getStartOfTodayMillis();
			if (lastOpenMillis < startTodayMillis) {
				Logger.debug("View count has not been incremented today. Incrementing view count.");
				this.viewCountCache.incrementViewCount(file);
			} else {
				Logger.debug("View count was already incremented today. Returning...");
			}
		} else {
			this.viewCountCache.incrementViewCount(file);
		}

		if (!this.viewCountStatusBarItem) {
			this.viewCountStatusBarItem = this.addStatusBarItem();
		}

		//Update the view count in the status bar
		const viewCount = this.viewCountCache.getViewCount(file);
		const viewName = viewCount === 1 ? "view" : "views";
		this.viewCountStatusBarItem.setText(`${viewCount} ${viewName}`);
	}


	onunload() {
		this.viewCountStatusBarItem?.remove();
	}

	async loadSettings() {
		let data: Record<string, unknown> | null = await this.loadData();

		//Null if the settings are empty
		if (data !== null) {
			const settingsVersion = (data["pluginVersion"] as string) ?? null;
			if (settingsVersion !== null) {
				if (isVersionLessThan(settingsVersion, "1.2.2")) {
					console.log("Migrating settings from 1.2.1 to 1.2.2");
					const typedData = (data as unknown) as ViewCountPluginSettings_1_2_1;
					const newData: ViewCountPluginSettings_1_2_2 = {
						...typedData,
						templaterDelay: 0
					}
					data = newData as unknown as Record<string, unknown>;
				}
				if (isVersionLessThan(settingsVersion, "2.0.0")) {
					console.log("Migrating settings from 1.2.2 to 2.0.0");
					const typedData = (data as unknown) as ViewCountPluginSettings_1_2_2;

					const newData: ViewCountPluginSettings = {
						...typedData,
						saveViewCountToFrontmatter: typedData.storageType === "property" ? true : false,
						viewCountType: typedData.incrementOnceADay ? "unique-days-opened" : "total-times-opened",
					}
					data = newData as unknown as Record<string, unknown>;

					this.settings_1_2_2 = structuredClone(typedData);
					await migrateFileStorage(this.app, typedData);
				}
			}
		}

		//Apply default settings. This will make it so we don't need to do migrations for just adding new settings
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		//Update the plugin version to the current version
		this.settings.pluginVersion = this.manifest.version;
		await this.saveSettings();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
