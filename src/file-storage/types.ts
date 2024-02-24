export interface ViewCountEntry {
	path: string;
	viewCount: number;
	lastViewMillis: number;
}

export type ViewCountEntries = ViewCountEntry[];
