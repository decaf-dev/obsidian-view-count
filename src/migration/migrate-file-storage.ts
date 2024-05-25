import Logger from "js-logger";
import { App } from "obsidian";
import { ViewCountEntry, ViewCountEntry_1_2_2 } from "src/storage/types";
import { getFilePath, parseEntries, stringifyEntries } from "src/storage/utils";
import { ViewCountPluginSettings_1_2_2 } from "src/types";

export const migrateFileStorage = async (app: App, settings: ViewCountPluginSettings_1_2_2) => {
	const path = getFilePath(app);
	const exists = await app.vault.adapter.exists(path);
	if (exists) {
		Logger.info("Migrating file storage from 1.2.2 to 2.0.0");
		const fileData = await app.vault.adapter.read(path);
		const entries = parseEntries<ViewCountEntry_1_2_2>(fileData);

		const { incrementOnceADay } = settings;
		const newEntries: ViewCountEntry[] = entries.map(entry => {
			return {
				path: entry.path,
				uniqueDaysOpened: incrementOnceADay ? entry.viewCount : 0,
				totalTimesOpened: entry.viewCount,
				openLogs: [
					{
						timestampMillis: entry.lastViewMillis
					}
				]
			}
		});
		const data = stringifyEntries(newEntries);
		await app.vault.adapter.write(path, data);
		Logger.info("Migration complete");
	}
}