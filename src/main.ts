import { Plugin, } from 'obsidian';
import ViewCountSettingsTab from './obsidian/ViewCountSettingsTab';

interface ViewCountPluginSettings {
	incrementOnceADay: boolean;
	propertyName: string;
}

const DEFAULT_SETTINGS: ViewCountPluginSettings = {
	incrementOnceADay: true,
	propertyName: "view-count",
}

export default class ViewCountPlugin extends Plugin {
	settings: ViewCountPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new ViewCountSettingsTab(this.app, this));

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
