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
			.setName('Increment once a day')
			.setDesc('If enabled a file view count will only be incremented once a day. Otherwise, the file view count will be incremented every time it is opened.')
			.addToggle(component => component
				.setValue(this.plugin.settings.incrementOnceADay)
				.onChange(async (value) => {
					this.plugin.settings.incrementOnceADay = value;
					await this.plugin.saveSettings();
				}));
	}
}

export default ViewCountSettingsTab;
