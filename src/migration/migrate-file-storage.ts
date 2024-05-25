import { App } from "obsidian";
import { ViewCountEntry, ViewCountEntry_1_2_2 } from "src/storage/types";
import { getFilePath, parseEntries, stringifyEntries } from "src/storage/utils";
import { ViewCountPluginSettings_1_2_2 } from "src/types";

export const migrateFileStorage = async (app: App, settings: ViewCountPluginSettings_1_2_2) => {
	console.log("Migrating file storage");

	const path = getFilePath(app);
	const exists = await app.vault.adapter.exists(path);
	if (exists) {
		const fileData = await app.vault.adapter.read(path);
		const oldEntries = parseEntries<ViewCountEntry_1_2_2>(fileData);
		console.log("Old entries", oldEntries);

		const { incrementOnceADay } = settings;
		const newEntries: ViewCountEntry[] = oldEntries.map(entry => {
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
		console.log("New entries", newEntries);

		const data = stringifyEntries(newEntries);
		await app.vault.adapter.write(path, data);
	}
	console.log("Migration complete");
}