import { App, PluginSettingTab, Setting } from "obsidian";
import ViewCountPlugin from "src/main";

class ViewCountSettingsTab extends PluginSettingTab {
	plugin: ViewCountPlugin;

	constructor(app: App, plugin: ViewCountPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();


		new Setting(containerEl)
			.setName('Property name')
			.setDesc('The name of the property that the view count will be stored in')
			.addText(text => text
				.setValue(this.plugin.settings.propertyName)
				.onChange(async (value) => {
					this.plugin.settings.propertyName = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Increment once a day')
			.setDesc('If enabled, the view count will only increment once a day otherwise it will increment every time the note is opened')
			.addToggle(component => component
				.setValue(this.plugin.settings.incrementOnceADay)
				.onChange(async (value) => {
					this.plugin.settings.incrementOnceADay = value;
					await this.plugin.saveSettings();
				}));
	}
}

export default ViewCountSettingsTab;
