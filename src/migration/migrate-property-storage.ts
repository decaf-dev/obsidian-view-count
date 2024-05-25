import Logger from "js-logger";
import { App } from "obsidian";
import { ViewCountEntry } from "src/storage/types";
import { getFilePath, stringifyEntries } from "src/storage/utils";
import { ViewCountPluginSettings_1_2_2 } from "src/types";

export const migratePropertyStorage = async (app: App, settings: ViewCountPluginSettings_1_2_2) => {

	Logger.info("Migrating property storage from 1.2.2 to 2.0.0");
	const { viewCountPropertyName, lastViewDatePropertyName, incrementOnceADay } = settings;

	const files = app.vault.getMarkdownFiles();
	const newEntries: ViewCountEntry[] = files.map(file => {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		const viewCount = frontmatter?.[viewCountPropertyName] ?? 0;
		const lastViewMillis = frontmatter?.[lastViewDatePropertyName] ?? 0;
		return {
			path: file.path,
			uniqueDaysOpened: incrementOnceADay ? viewCount : 0,
			totalTimesOpened: viewCount,
			openLogs: [
				{
					timestampMillis: lastViewMillis
				}
			]
		}
	});
	Logger.debug("New entries", newEntries);

	const path = getFilePath(app);

	const data = stringifyEntries(newEntries);
	await app.vault.adapter.write(path, data);
	Logger.info("Migration complete");
}