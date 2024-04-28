import { Plugin, TFile, normalizePath } from 'obsidian';
import ViewCountSettingsTab from './obsidian/view-count-settings-tab';
import FileStorage from './storage/file-storage';
import PropertyStorage from './storage/property-storage';
import { ViewCountPluginSettings } from './types';
import ViewCountItemView from './obsidian/view-count-item-view';
import { VIEW_COUNT_ITEM_VIEW } from './constants';
import Logger from 'js-logger';
import { LOG_LEVEL_OFF } from './logger/constants';
import { formatMessageForLogger, stringToLogLevel } from './logger';
import { startTodayMillis } from './utils/time-utils';
import _ from 'lodash';

const DEFAULT_SETTINGS: ViewCountPluginSettings = {
	incrementOnceADay: true,
	storageType: "property",
	viewCountPropertyName: "view-count",
	lastViewDatePropertyName: "view-date",
	pluginVersion: "",
	logLevel: LOG_LEVEL_OFF,
	excludedPaths: [],
	enableTemplaterDelay: false,
}

export default class ViewCountPlugin extends Plugin {
	settings: ViewCountPluginSettings;
	storage: FileStorage | PropertyStorage;
	viewCountStatusBarItem: HTMLElement | null = null;

	debounceHandleFileStorageOpen = _.debounce(this.handleFileStorageFileOpen, 100);
	debounceHandlePropertyStorageOpen = _.debounce(this.handlePropertyStorageFileOpen, 100);

	async onload() {
		await this.loadSettings();

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

		if (this.settings.storageType === "file") {
			this.storage = new FileStorage(this.app);
		} else if (this.settings.storageType === "property") {
			this.storage = new PropertyStorage(this.app, this.settings);
		}

		this.registerView(
			VIEW_COUNT_ITEM_VIEW,
			(leaf) => new ViewCountItemView(leaf, this.app, this.storage),
		);

		this.addSettingTab(new ViewCountSettingsTab(this.app, this));

		this.app.workspace.onLayoutReady(async () => {
			//This needs to be before the migration
			if (this.settings.pluginVersion !== this.manifest.version) {
				this.settings.pluginVersion = this.manifest.version;
				await this.saveSettings();
			}

			//This needs to run before events are setup
			await this.storage.load();

			if (this.settings.storageType === "file") {
				await this.registerFileStorageEvents();
			} else if (this.settings.storageType === "property") {
				await this.registerPropertyStorageEvents();
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

	async registerPropertyStorageEvents() {
		this.registerEvent(this.app.workspace.on("active-leaf-change", async (leaf) => {
			if (leaf === null) return;
			const viewType = leaf.view.getViewType();
			Logger.debug("Active leaf changed", { viewType });

			if (viewType !== "markdown") {
				Logger.debug("View count not supported for view type", { viewType });
				return;
			}

			const file = this.app.workspace.getActiveFile();
			if (file === null) return;

			await this.debounceHandlePropertyStorageOpen(file);
		}));

		this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
			if (file instanceof TFile) {
				await this.storage.renameEntry(file.path, oldPath);
			}
		}));

		this.registerEvent(this.app.vault.on("delete", async (file) => {
			if (file instanceof TFile) {
				this.storage.deleteEntry(file);
			}
		}));
	}

	async registerFileStorageEvents() {
		this.registerEvent(this.app.workspace.on("active-leaf-change", async (leaf) => {
			if (leaf === null) return;
			const viewType = leaf.view.getViewType();
			Logger.debug("Active leaf changed", { viewType });
			if (viewType === "file-explorer") return;

			if (viewType === "vault-explorer") {
				Logger.debug("View count not supported for view type", { viewType });
				this.viewCountStatusBarItem?.setText("");
				return;
			}

			const file = this.app.workspace.getActiveFile();
			if (file === null) return;

			await this.debounceHandleFileStorageOpen(file);
		}));

		this.registerEvent(this.app.vault.on("rename", async (file, oldPath) => {
			if (file instanceof TFile) {
				await this.storage.renameEntry(file.path, oldPath);
			}
		}));

		this.registerEvent(this.app.vault.on("delete", async (file) => {
			if (file instanceof TFile) {
				await this.storage.deleteEntry(file);
			}
		}));
	}

	private async handlePropertyStorageFileOpen(file: TFile) {
		const { incrementOnceADay, excludedPaths, enableTemplaterDelay } = this.settings;
		if (excludedPaths.find(path => {
			//Normalize the path so that it will match the file path
			//This function will remove a forward slash
			const normalized = normalizePath(path);
			return file.path.startsWith(normalized)
		})) {
			Logger.debug(`File path ${file.path} is included in the excludedPaths array`);
			return false;
		}
		if (incrementOnceADay) {
			Logger.debug("Increment once a day is enabled. Checking if view count should be incremented.");
			const lastViewMillis = await this.storage.getLastViewTime(file);
			const todayMillis = startTodayMillis();
			if (lastViewMillis >= todayMillis) {
				Logger.debug("View count already incremented today", { path: file.path, lastViewMillis, todayMillis });
				return;
			}
		}
		if (enableTemplaterDelay) {
			//If the file is a new file, it will not be in the storage
			const entry = this.storage.getEntries().find((entry) => entry.path === file.path);
			if (!entry) {
				Logger.debug("Templater delay is enabled. Waiting 1000ms before incrementing view count.");
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		}
		await this.storage.incrementViewCount(file);
	}

	private async handleFileStorageFileOpen(file: TFile) {
		const incrementOnceADay = this.settings.incrementOnceADay;
		if (incrementOnceADay) {
			Logger.debug("Increment once a day is enabled. Checking if view count should be incremented.");
			const lastViewMillis = await this.storage.getLastViewTime(file);
			const todayMillis = startTodayMillis();
			if (lastViewMillis < todayMillis) {
				Logger.debug("View count not incremented today. Incrementing view count.", { path: file.path, lastViewMillis, todayMillis });
				await this.storage.incrementViewCount(file);
			} else {
				Logger.debug("View count already incremented today", { path: file.path, lastViewMillis, todayMillis });
			}
		} else {
			await this.storage.incrementViewCount(file);
		}

		if (!this.viewCountStatusBarItem) {
			this.viewCountStatusBarItem = this.addStatusBarItem();
		}
		const viewCount = await this.storage.getViewCount(file);
		const viewName = viewCount === 1 ? "view" : "views";
		this.viewCountStatusBarItem.setText(`${viewCount} ${viewName}`);
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
