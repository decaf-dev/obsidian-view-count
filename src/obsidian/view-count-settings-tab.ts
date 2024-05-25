import { App, PluginSettingTab, Setting } from "obsidian";
import ViewCountPlugin from "src/main";

import { LOG_LEVEL_DEBUG, LOG_LEVEL_ERROR, LOG_LEVEL_INFO, LOG_LEVEL_OFF, LOG_LEVEL_TRACE, LOG_LEVEL_WARN } from "../logger/constants";
import "./styles.css";
import Logger from "js-logger";
import { stringToLogLevel } from "src/logger";

class ViewCountSettingsTab extends PluginSettingTab {
	plugin: ViewCountPlugin;

	constructor(app: App, plugin: ViewCountPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		const viewCountTypeDesc = new DocumentFragment();
		viewCountTypeDesc.createDiv({
			text: "View count can be defined two ways: the total number of times the file has been opened or the number of unique days the file has been opened.",
		});
		viewCountTypeDesc.createEl("br");
		viewCountTypeDesc.createDiv({
			text: "Warning: if you change this setting and you have 'Save view to frontmatter' enabled, the view count property in all relevant notes will be updated.",
			cls: "view-count-text--warning",
		});

		new Setting(containerEl)
			.setName('View count type')
			.setDesc(viewCountTypeDesc)
			.addDropdown(component => component
				.addOption("unique-days-opened", "Unique days opened")
				.addOption("total-times-opened", "Total times opened")
				.setValue(this.plugin.settings.viewCountType)
				.onChange(async (value) => {
					this.plugin.settings.viewCountType = value as "unique-days-opened" | "total-times-opened";
					await this.plugin.saveSettings();
				}));


		new Setting(containerEl)
			.setName("Excluded paths")
			.setDesc("The folder paths that should be excluded from view count tracking. Please separate individual paths by commas. e.g. folder1,folder2/inner")
			.addText(component => component.setValue(this.plugin.settings.excludedPaths.join(",")).onChange(async (value) => {
				this.plugin.settings.excludedPaths = value.split(",");
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl).setName("Frontmatter").setHeading();

		const storageTypeDesc = new DocumentFragment();
		storageTypeDesc.createDiv({
			text: "Save the view count to a frontmatter property in each note. This is useful if you want to query for the view count using the DataView plugin.",
		});
		storageTypeDesc.createEl("br");
		storageTypeDesc.createDiv({
			text: "Warning: once you enable this setting, the view count property in all relevant notes will be updated.",
			cls: "view-count-text--warning",
		});

		new Setting(containerEl)
			.setName('Save view count to frontmatter')
			.setDesc(storageTypeDesc)
			.addToggle(component => component
				.setValue(this.plugin.settings.saveViewCountToFrontmatter)
				.onChange(async (value) => {
					this.plugin.settings.saveViewCountToFrontmatter = value;
					await this.plugin.saveSettings();
				}));

		const viewCountDesc = new DocumentFragment();
		viewCountDesc.createDiv({
			text: "The name of the property that the view count will be stored in.",
		});
		viewCountDesc.createEl("br");
		viewCountDesc.createDiv({
			text: "Notice: Please rename the existing property before updating this setting. You can use the rename option in the 'All Properties' view in the sidebar to do this.",
			cls: "view-count-text--emphasize",
		});


		new Setting(containerEl)
			.setName('View count property name')
			.setDesc(viewCountDesc)
			.addText(text => text
				.setValue(this.plugin.settings.viewCountPropertyName)
				.onChange(async (value) => {
					this.plugin.settings.viewCountPropertyName = value;
					await this.plugin.saveSettings();
				}));


		new Setting(containerEl).setName("Plugin compatibility").setHeading();
		new Setting(containerEl)
			.setName("Templater delay")
			.setDesc(
				"The delay in milliseconds before inserting view count frontmatter. Increase this value if you're using the Templater plugin and your template is being overwritten"
			)
			.addDropdown((cb) => {
				cb.addOptions({
					"0": "0",
					"1000": "1000",
					"2000": "2000",
					"3000": "3000",
					"4000": "4000",
					"5000": "5000"
				})
				cb.setValue(this.plugin.settings.templaterDelay.toString()).onChange(
					async (value) => {
						this.plugin.settings.templaterDelay = parseInt(value);
						await this.plugin.saveSettings();
					}
				)
			});


		new Setting(containerEl).setName("Debugging").setHeading();
		new Setting(containerEl)
			.setName("Log level")
			.setDesc(
				"Sets the log level. Please use trace to see all log messages."
			)
			.addDropdown((cb) => {
				cb.addOptions({
					[LOG_LEVEL_OFF]: "Off",
					[LOG_LEVEL_ERROR]: "Error",
					[LOG_LEVEL_WARN]: "Warn",
					[LOG_LEVEL_INFO]: "Info",
					[LOG_LEVEL_DEBUG]: "Debug",
					[LOG_LEVEL_TRACE]: "Trace"
				})
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
