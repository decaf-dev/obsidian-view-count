export interface ViewCountEntry {
	path: string;
	uniqueDaysOpened: number;
	totalTimesOpened: number;
	openLogs: OpenLogEntry[];
}

export interface OpenLogEntry {
	timestampMillis: number;
}

export interface ViewCountEntry_1_2_2 {
	path: string;
	viewCount: number;
	lastViewMillis: number;
}