import { Plugin, TFile } from 'obsidian';
import ViewCountSettingsTab from './obsidian/view-count-settings-tab';
import { TView, TimePeriod, ViewCountPluginSettings } from './types';
import ViewCountItemView from './obsidian/view-count-item-view';
import { DEFAULT_SETTINGS, VIEW_COUNT_ITEM_VIEW } from './constants';
import Logger from 'js-logger';
import { formatMessageForLogger, stringToLogLevel } from './logger';
import _ from 'lodash';
import { isVersionLessThan } from './utils';
import ViewCountCache from './storage/view-count-cache';
import { migrateFileStorage } from './migration/migrate-file-storage';
import { migratePropertyStorage } from './migration/migrate-property-storage';
import { ViewCountPluginSettings_1_2_2 } from './types/types-1.2.2';
import { ViewCountPluginSettings_1_2_1 } from './types/types-1.2.1';
import { ViewCountPluginSettings_2_3_1 } from './types/types-2.3.1';
import { DurationFilter_2_4_0, TView_2_4_0, ViewCountPluginSettings_2_4_0 } from './types/types-2.4.0';

export default class ViewCountPlugin extends Plugin {
	settings: ViewCountPluginSettings = DEFAULT_SETTINGS;
	viewCountCache: ViewCountCache | null = null;
	settings_1_2_2: ViewCountPluginSettings_1_2_2 | null = null;
	viewCountStatusBarItem: HTMLElement | null = null;

	debounceHandleFileOpen = _.debounce(this.handleFileOpen, 100);

	async onload() {
		await this.loadSettings();
		this.setupLogger();

		const viewCountCache = new ViewCountCache(this.app, this.settings);
		this.viewCountCache = viewCountCache;

		this.registerView(
			VIEW_COUNT_ITEM_VIEW,
			(leaf) => new ViewCountItemView(leaf, this),
		);

		this.addSettingTab(new ViewCountSettingsTab(this.app, this));

		if (this.settings_1_2_2?.storageType != "property") {
			await this.viewCountCache.load();
		}

		this.registerEvents();

		this.addCommand({
			id: "open-view-count",
			name: "Open view count view",
			callback: () => {
				this.openViewCountView(true);
			}
		});

		this.app.workspace.onLayoutReady(async () => {
			if (this.settings_1_2_2?.storageType == "property") {
				await migratePropertyStorage(this.app, this.settings_1_2_2);
				await viewCountCache.load();
			}
			this.openViewCountView(false);
		});
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

					const newData: ViewCountPluginSettings_2_3_1 = {
						...typedData,
						saveViewCountToFrontmatter: typedData.storageType === "property" ? true : false,
						viewCountType: typedData.incrementOnceADay ? "unique-days-opened" : "total-times-opened",
					}
					data = newData as unknown as Record<string, unknown>;

					this.settings_1_2_2 = structuredClone(typedData);
					await migrateFileStorage(this.app, typedData);
				}

				if (isVersionLessThan(settingsVersion, "2.4.0")) {
					console.log("Migrating settings from 2.3.1 to 2.4.0");
					const typedData = (data as unknown) as ViewCountPluginSettings_2_3_1;
					const newData: ViewCountPluginSettings_2_4_0 = {
						...typedData,
						durationFilter: DurationFilter_2_4_0.DAYS_3,
						currentView: TView_2_4_0.MOST_VIEWED,
						listSize: 20
					}
					data = newData as unknown as Record<string, unknown>;
				}

				if (isVersionLessThan(settingsVersion, "2.4.1")) {
					console.log("Migrating settings from 2.4.0 to 2.4.1");
					const typedData = (data as unknown) as ViewCountPluginSettings_2_4_0;
					const newData: ViewCountPluginSettings = {
						...typedData,
						timePeriod: TimePeriod.DAYS_3,
						currentView: TView.VIEWS,
						itemCount: 20
					}
					data = newData as unknown as Record<string, unknown>;
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

	private registerEvents() {
		const cache = this.viewCountCache;
		if (cache === null) {
			throw new Error("View count cache is null");
		}

		this.registerEvent(this.app.workspace.on("file-open", async (file) => {
			if (file === null) return;
			await this.debounceHandleFileOpen(file);
		}));

		this.registerEvent(this.app.workspace.on("active-leaf-change", async (leaf) => {
			if (leaf === null) return;
			const viewType = leaf.view.getViewType();

			if (viewType !== "markdown" && viewType !== "image" && viewType !== "pdf" && viewType != "dataloom" && viewType != "audio" && viewType != "video") {
				Logger.debug({ fileName: "main.ts", functionName: "active-leaf-change", message: "view count not supported for view type" }, { viewType });
				this.viewCountStatusBarItem?.setText("");
				return;
			} else {
				const file = (leaf.view as any).file as TFile | null;
				if (file != null) {
					await this.debounceHandleFileOpen(file);
				}
			}
		}));

		this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
			if (file instanceof TFile) {
				await cache.renameEntry(file.path, oldPath);
			}
		}));

		this.registerEvent(this.app.vault.on("delete", async (file) => {
			if (file instanceof TFile) {
				await cache.deleteEntry(file);
			}
		}));
	}

	private openViewCountView(active: boolean) {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_COUNT_ITEM_VIEW);
		if (leaves.length === 0) {
			this.app.workspace.getRightLeaf(false)?.setViewState({
				type: VIEW_COUNT_ITEM_VIEW,
				active,
			});
		}
	}


	private async handleFileOpen(file: TFile) {
		Logger.trace({ fileName: "main.ts", functionName: "handleFileOpen", message: "called" });
		if (this.viewCountCache === null) {
			throw new Error("View count cache is null");
		}

		await this.viewCountCache.handleFileOpen(file);

		if (!this.viewCountStatusBarItem) {
			this.viewCountStatusBarItem = this.addStatusBarItem();
		}

		//Update the view count in the status bar
		const viewCount = this.viewCountCache.getViewCount(file);
		const viewName = viewCount === 1 ? "view" : "views";
		this.viewCountStatusBarItem.setText(`${viewCount} ${viewName}`);
	}

	private setupLogger() {
		Logger.useDefaults();
		Logger.setHandler(function (messages, context) {
			const { message, data } = formatMessageForLogger(...messages);
			if (context.level === Logger.WARN) {
				console.warn(message);
				if (data) {
					console.warn(data);
				}
			} else if (context.level === Logger.ERROR) {
				console.error(message);
				if (data) {
					console.error(data);
				}
			} else {
				console.log(message);
				if (data) {
					console.log(data);
				}
			}
		});

		const logLevel = stringToLogLevel(this.settings.logLevel);
		Logger.setLevel(logLevel);
	}
}
