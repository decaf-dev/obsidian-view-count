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

export type ListSize = 10 | 15 | 20 | 25 | 50 | 100;

export enum DurationFilter {
	MONTH = "month",
	WEEK_ISO = "week-iso",
	WEEK = "week",
	DAYS_30 = "30-days",
	DAYS_14 = "14-days",
	DAYS_7 = "7-days"
}