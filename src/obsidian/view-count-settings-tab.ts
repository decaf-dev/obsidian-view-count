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


		const storageTypeDesc = new DocumentFragment();
		storageTypeDesc.createDiv({
			text: "If property is selected, each note will have their view count stored in a property in their frontmatter. If file is selected, the view count for all notes will be stored in a file in the Obsidian config directory.",
		});
		storageTypeDesc.createEl("br");
		storageTypeDesc.createDiv({
			text: "Please restart Obsidian after changing this setting.",
			cls: "view-count-text--emphasize",
		});
		new Setting(containerEl)
			.setName('Storage type')
			.setDesc(storageTypeDesc)
			.addDropdown(component => component
				.addOptions({
					'property': 'Property',
					'file': 'File',
				})
				.setValue(this.plugin.settings.storageType)
				.onChange(async (value) => {
					this.plugin.settings.storageType = value as unknown as "property" | "file";
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Increment once a day')
			.setDesc('If enabled a file view count will only be incremented once a day. Otherwise, the file view count will be incremented every time it is opened.')
			.addToggle(component => component
				.setValue(this.plugin.settings.incrementOnceADay)
				.onChange(async (value) => {
					this.plugin.settings.incrementOnceADay = value;
					await this.plugin.saveSettings();
				}));


		const viewCountDesc = new DocumentFragment();
		viewCountDesc.createDiv({
			text: "The name of the property that the view count will be stored in. This is only used if the storage type is set to property.",
		});
		viewCountDesc.createEl("br");
		viewCountDesc.createDiv({
			text: "Please rename the existing property before updating this setting. You can use the rename option in the All Properties view in the sidebar to do this.",
			cls: "view-count-text--emphasize",
		});

		new Setting(containerEl)
			.setName('View count property name')
			.setDesc(viewCountDesc)
			.setDisabled(this.plugin.settings.storageType !== "property")
			.addText(text => text
				.setValue(this.plugin.settings.viewCountPropertyName)
				.onChange(async (value) => {
					this.plugin.settings.viewCountPropertyName = value;
					await this.plugin.saveSettings();
				}));

		const viewDateDesc = new DocumentFragment();
		viewDateDesc.createDiv({
			text: "The name of the property that the last view date will be stored in. This is only used if increment once a day is enabled.",
		});
		viewDateDesc.createEl("br");
		viewDateDesc.createDiv({
			text: "Please rename the existing property before updating this setting. You can use the rename option in the All Properties view in the sidebar to do this.",
			cls: "view-count-text--emphasize",
		});

		new Setting(containerEl)
			.setName('View date property name')
			.setDesc(viewDateDesc)
			.setDisabled(this.plugin.settings.storageType !== "property" || !this.plugin.settings.incrementOnceADay)
			.addText(text => text
				.setValue(this.plugin.settings.lastViewDatePropertyName)
				.onChange(async (value) => {
					this.plugin.settings.lastViewDatePropertyName = value;
					await this.plugin.saveSettings();
				}));


		new Setting(containerEl)
			.setName("Excluded paths")
			.setDesc("The paths that should be excluded from view count. This setting only works for property storage. Please separate paths by commas. e.g. folder1,folder2/inner")
			.addText(component => component.setValue(this.plugin.settings.excludedPaths.join(",")).onChange(async (value) => {
				this.plugin.settings.excludedPaths = value.split(",");
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl).setName("Plugin compatibility").setHeading();
		new Setting(containerEl)
			.setName("Templater delay")
			.setDesc(
				"The delay in milliseconds before inserting view count frontmatter. Increase this value if you're using the Templater plugin and your template is being overwritten"
			)
			.addText((component) =>
				component.setValue(this.plugin.settings.templaterDelay.toString()).onChange(
					async (value) => {
						this.plugin.settings.templaterDelay = parseInt(value);
						await this.plugin.saveSettings();
					}
				)
			);

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
