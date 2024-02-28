import { TFile } from "obsidian";
import { ViewCountEntry } from "./types";
import EventManager from "src/event/event-manager";

export default abstract class ViewCountStorage {
	protected entries: ViewCountEntry[];

	constructor() {
		this.entries = [];
	}

	abstract load(): Promise<void>;
	abstract incrementViewCount(file: TFile): Promise<void>;
	abstract getViewCount(file: TFile): Promise<number>;
	abstract getLastViewTime(file: TFile): Promise<number>;
	abstract renameEntry(oldPath: string, newPath: string): Promise<void>;
	abstract deleteEntry(file: TFile): Promise<void>;

	public getEntries() {
		return this.entries;
	}

	protected refresh() {
		EventManager.getInstance().emit("refresh-item-view");
	}
}
