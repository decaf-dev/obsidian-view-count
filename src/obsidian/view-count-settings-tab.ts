import { App, PluginSettingTab, Setting } from "obsidian";
import ViewCountPlugin from "src/main";

import "./styles.css";

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

		new Setting(containerEl)
			.setName('View count property name')
			.setDesc('The name of the property that the view count will be stored in. This is only used if the storage type is set to property.')
			.setDisabled(this.plugin.settings.storageType !== "property")
			.addText(text => text
				.setValue(this.plugin.settings.viewCountPropertyName)
				.onChange(async (value) => {
					this.plugin.settings.viewCountPropertyName = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Last view date property name')
			.setDesc('The name of the property that the last view date will be stored in. This is only used if increment once a day is enabled.')
			.setDisabled(this.plugin.settings.storageType !== "property" || !this.plugin.settings.incrementOnceADay)
			.addText(text => text
				.setValue(this.plugin.settings.lastViewDatePropertyName)
				.onChange(async (value) => {
					this.plugin.settings.lastViewDatePropertyName = value;
					await this.plugin.saveSettings();
				}));
	}
}

export default ViewCountSettingsTab;
