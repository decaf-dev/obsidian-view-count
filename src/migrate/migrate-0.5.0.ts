import Logger from "js-logger";
import { App } from "obsidian";
import ViewCountPlugin from "src/main";
import { getPropertyType, setPropertyType } from "src/storage/utils";
import { ViewCountPluginSettings } from "src/types";
import { unixTimeMillisToDate } from "src/utils/time-utils";

export default class Migrate_050 {
	private plugin: ViewCountPlugin;
	private app: App;
	private settings: ViewCountPluginSettings;

	constructor(plugin: ViewCountPlugin, app: App, settings: ViewCountPluginSettings) {
		this.plugin = plugin;
		this.app = app;
		this.settings = settings;
	}

	async migrate() {
		await this.migrateViewTimeName();
		await this.migrateViewTimeFromNumberToDate();
	}

	/**
	 * This will update the property name to "view-date" if it's not already
	 */
	private async migrateViewTimeName() {
		Logger.trace("Migrate_050 migrateViewTimeName");
		const { lastViewTimePropertyName, lastViewDatePropertyName } = this.settings;

		//If the user had a custom property name, save the name
		if (lastViewTimePropertyName !== "last-view-time") {
			Logger.debug("Updating lastViewDatePropertyName to lastViewTimePropertyName value", { lastViewTimePropertyName });
			this.settings.lastViewDatePropertyName = lastViewTimePropertyName;
			await this.plugin.saveSettings();
		} else {
			//Otherwise update the old default with the new default
			const markdownFiles = this.app.vault.getMarkdownFiles();
			for (const file of markdownFiles) {
				await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
					if (!frontmatter[lastViewTimePropertyName]) return;
					Logger.debug("Renaming last-view-time property name to view-date", { path: file.path });

					frontmatter[lastViewDatePropertyName] = frontmatter[lastViewTimePropertyName];
					delete frontmatter[lastViewTimePropertyName];
				});
			}
		}
	}

	/**
	 * This will update the property type to date if it's not already
	 */
	private async migrateViewTimeFromNumberToDate() {
		Logger.trace("Migrate_050 migrateViewTimeFromNumberToDate");
		const { lastViewDatePropertyName } = this.settings;
		const type = await getPropertyType(this.app, lastViewDatePropertyName);
		Logger.debug("lastViewDatePropertyName type", { type });

		if (type != "date") {
			Logger.debug("Property type is not date");
			const markdownFiles = this.app.vault.getMarkdownFiles();

			for (const file of markdownFiles) {
				await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
					if (!frontmatter[lastViewDatePropertyName]) return;

					if (typeof frontmatter[lastViewDatePropertyName] === "number") {
						Logger.debug("Converting lastViewDatePropertyName value to date", { path: file.path });
						const date = unixTimeMillisToDate(frontmatter[lastViewDatePropertyName]);
						frontmatter[lastViewDatePropertyName] = date;
					}
				});
			}

			Logger.debug("Setting lastViewDatePropertyName type to date");
			await setPropertyType(this.app, lastViewDatePropertyName, "date");
		}
	}
}
