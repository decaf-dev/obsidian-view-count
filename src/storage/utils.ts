import { App } from "obsidian";
import { normalize } from "path";
import { ViewCountEntry } from "./types";

export const stringifyEntries = (entries: ViewCountEntry[]) => {
	return JSON.stringify({
		items: entries
	}, null, 2);
}

export const parseEntries = (fileData: string) => {
	const json = JSON.parse(fileData);

	if (!json.items)
		return [];

	return json.items
}


export const getFilePath = (app: App) => {
	const VIEW_COUNT_FILE = 'view-count.json';
	return normalize(app.vault.configDir + "/" + VIEW_COUNT_FILE);
}
