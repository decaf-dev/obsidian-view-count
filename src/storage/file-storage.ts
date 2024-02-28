import { App, Notice, TFile } from "obsidian";
import { getFilePath, parseEntries, stringifyEntries } from "./utils";
import ViewCountStorage from "./view-count-storage";

export default class FileStorage extends ViewCountStorage {
	private app: App;

	constructor(app: App) {
		super();
		this.app = app;
	}

	async load() {
		const path = getFilePath(this.app);
		const exists = await this.app.vault.adapter.exists(path);

		if (!exists) {
			const data = stringifyEntries([]);
			try {
				//console.log("Creating file cache");
				await this.app.vault.create(path, data);
			} catch (err) {
				console.error("Error creating file cache: ", (err as Error).message);
				new Notice("View Count: error loading view count");
			}
			return;
		}

		try {
			const result = await this.app.vault.adapter.read(path);
			this.entries = parseEntries(result);
			//console.log("Loaded file cache: ", this.entries);
			this.refresh();
		} catch (err) {
			console.error("Error loading file cache: ", (err as Error).message);
			new Notice("View Count: error loading cache");
		}
	}

	async save(app: App) {
		try {
			const path = getFilePath(app);
			const data = stringifyEntries(this.entries);
			await app.vault.adapter.write(path, data);
		} catch (err) {
			console.error("Error saving file cache: ", (err as Error).message);
			new Notice("View Count: error saving file cache");
		}
	}

	async incrementViewCount(file: TFile) {
		//console.log("Incrementing view count for file: ", file.path);
		const entry = this.entries.find((entry) => entry.path === file.path);

		if (entry) {
			this.entries = this.entries.map((entry) => {
				if (entry.path === file.path) {
					return {
						...entry,
						viewCount: entry.viewCount + 1,
						lastViewMillis: Date.now()
					};
				}
				return entry;
			});
		} else {
			this.entries = [...this.entries, {
				path: file.path,
				viewCount: 1,
				lastViewMillis: Date.now()
			}];
		}

		await this.save(this.app);
		this.refresh();
	}

	async getLastViewTime(file: TFile) {
		return this.entries.find((entry) => entry.path === file.path)?.lastViewMillis ?? 0;
	}

	async getViewCount(file: TFile) {
		return this.entries.find((entry) => entry.path === file.path)?.viewCount ?? 0;
	}

	async renameEntry(newPath: string, oldPath: string) {
		//console.log("Renaming file: ", oldPath, newPath);
		this.entries = this.entries.map((entry) => {
			if (entry.path === oldPath) {
				entry.path = newPath;
			}
			return entry;
		});
		await this.save(this.app);
		this.refresh();
	}

	async deleteEntry(file: TFile) {
		//console.log("Deleting file: ", file.path);
		this.entries = this.entries.filter((entry) => entry.path !== file.path);
		await this.save(this.app);
		this.refresh();
	}
}
