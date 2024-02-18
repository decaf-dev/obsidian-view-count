export interface ViewCountEntry {
	filePath: string;
	viewCount: number;
	lastViewMillis: number;
}

export type ViewCountEntries = ViewCountEntry[];
