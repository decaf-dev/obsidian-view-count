import { App, PluginSettingTab, Setting } from "obsidian";
import ViewCountPlugin from "src/main";

import {
	LOG_LEVEL_DEBUG,
	LOG_LEVEL_ERROR,
	LOG_LEVEL_INFO,
	LOG_LEVEL_OFF,
	LOG_LEVEL_TRACE,
	LOG_LEVEL_WARN,
} from "../logger/constants";
import Logger from "js-logger";
import { stringToLogLevel } from "src/logger";

class ViewCountSettingsTab extends PluginSettingTab {
	plugin: ViewCountPlugin;

	constructor(app: App, plugin: ViewCountPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const viewCountCache = this.plugin.viewCountCache;
		if (viewCountCache === null) {
			throw new Error("View count cache is null");
		}

		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setName("General").setHeading();

		new Setting(containerEl)
			.setName("Count method")
			.setDesc("Method used to calculate view counts.")
			.addDropdown((component) =>
				component
					.addOption("unique-days-opened", "Unique days opened")
					.addOption("total-times-opened", "Total times opened")
					.setValue(this.plugin.settings.viewCountType)
					.onChange(async (value) => {
						this.plugin.settings.viewCountType = value as
							| "unique-days-opened"
							| "total-times-opened";
						await this.plugin.saveSettings();

						if (this.plugin.settings.saveViewCountToFrontmatter) {
							await viewCountCache.syncViewCountToFrontmatter();
						}
						await viewCountCache.debounceRefresh();
					})
			);

		new Setting(containerEl)
			.setName("Excluded paths")
			.setDesc(
				"Folder paths to exclude from view count tracking. Please separate individual paths by commas. e.g. folder1,folder2"
			)
			.addText((component) =>
				component
					.setValue(this.plugin.settings.excludedPaths.join(","))
					.onChange(async (value) => {
						this.plugin.settings.excludedPaths = value.split(",");
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl).setName("Frontmatter").setHeading();

		new Setting(containerEl)
			.setName("Sync view count")
			.setDesc(
				"View count is automatically saved to a JSON file. Enabling sync will add and continuously update a frontmatter property in markdown notes to reflect the view count stored in the JSON file."
			)
			.addToggle((component) =>
				component
					.setValue(this.plugin.settings.saveViewCountToFrontmatter)
					.onChange(async (value) => {
						this.plugin.settings.saveViewCountToFrontmatter = value;

						await this.plugin.saveSettings();
						await viewCountCache.syncViewCountToFrontmatter();
					})
			);

		const viewCountDesc = new DocumentFragment();
		viewCountDesc.createDiv({
			text: "Property name to store the view count in.",
		});
		viewCountDesc.createEl("br");
		viewCountDesc.createDiv({
			text: "Please rename the existing property in all your notes before changing this setting. You can use the rename option from the 'All Properties' view in the sidebar.",
			cls: "view-count-text--emphasize",
		});

		new Setting(containerEl)
			.setName("Property name")
			.setDesc(viewCountDesc)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.viewCountPropertyName)
					.onChange(async (value) => {
						this.plugin.settings.viewCountPropertyName = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl).setName("Plugin compatibility").setHeading();
		new Setting(containerEl)
			.setName("Templater delay")
			.setDesc(
				"Time to wait before adding a view count property to a new markdown note. Increase this value if you're using the Templater plugin and your template is being overwritten."
			)
			.addDropdown((cb) => {
				cb.addOptions({
					"0": "0",
					"1000": "1000",
					"2000": "2000",
					"3000": "3000",
					"4000": "4000",
					"5000": "5000",
				});
				cb.setValue(
					this.plugin.settings.templaterDelay.toString()
				).onChange(async (value) => {
					this.plugin.settings.templaterDelay = parseInt(value);
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl).setName("Debugging").setHeading();
		new Setting(containerEl)
			.setName("Log level")
			.setDesc(
				"Set the log level. Please use trace to see all log messages."
			)
			.addDropdown((cb) => {
				cb.addOptions({
					[LOG_LEVEL_OFF]: "Off",
					[LOG_LEVEL_ERROR]: "Error",
					[LOG_LEVEL_WARN]: "Warn",
					[LOG_LEVEL_INFO]: "Info",
					[LOG_LEVEL_DEBUG]: "Debug",
					[LOG_LEVEL_TRACE]: "Trace",
				});
				cb.setValue(this.plugin.settings.logLevel).onChange(
					async (value) => {
						this.plugin.settings.logLevel = value;
						await this.plugin.saveSettings();
						Logger.setLevel(stringToLogLevel(value));
					}
				);
			});
	}
}

export default ViewCountSettingsTab;
