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

export type TimesOpenedDuration = "month" | "week-iso" | "week" | "30-days" | "14-days" | "7-days";