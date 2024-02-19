import { App, Notice, TFile } from "obsidian";
import { ViewCountEntries } from "./types";
import { getFilePath, parseEntires, stringifyEntires } from "./utils";

class ViewCountCache {
	private app: App;
	private entries: ViewCountEntries;

	constructor(app: App) {
		this.app = app;
		this.entries = [];
	}

	async load() {
		const path = getFilePath(this.app);
		const exists = await this.app.vault.adapter.exists(path);

		if (!exists) {
			const data = stringifyEntires([]);
			try {
				console.log("Creating cache");
				await this.app.vault.create(path, data);
			} catch (err) {
				console.error("Error creating cache: ", (err as Error).message);
				new Notice("View Count: error loading view count");
			}
			return;
		}

		try {
			const result = await this.app.vault.adapter.read(path);
			this.entries = parseEntires(result);
			console.log("Loaded cache: ", this.entries);
		} catch (err) {
			console.error("Error loading cache: ", (err as Error).message);
			new Notice("View Count: error loading cache");
		}
	}

	async save(app: App) {
		try {
			const path = getFilePath(app);
			const data = stringifyEntires(this.entries);
			await app.vault.adapter.write(path, data);
		} catch (err) {
			console.error("Error saving cache: ", (err as Error).message);
			new Notice("View Count: error saving cache");
		}
	}

	async incrementViewCount(file: TFile) {
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
	}

	getViewTime(file: TFile) {
		return this.entries.find((entry) => entry.path === file.path)?.lastViewMillis ?? 0;
	}

	getViewCount(file: TFile) {
		return this.entries.find((entry) => entry.path === file.path)?.viewCount ?? 0;
	}

	async renameLastViewed(newPath: string, oldPath: string) {
		this.entries = this.entries.map((entry) => {
			if (entry.path === oldPath) {
				entry.path = newPath;
			}
			return entry;
		});
		await this.save(this.app);
	}

	async deleteLastViewed(file: TFile) {
		this.entries = this.entries.filter((entry) => entry.path !== file.path);
		await this.save(this.app);
	}
}

export default ViewCountCache;
