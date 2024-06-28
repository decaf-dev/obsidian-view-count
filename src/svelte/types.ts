import { TFile } from "obsidian";

export interface MostViewedRenderItem {
	file: TFile;
	viewCount: number;
}

export interface TrendingRenderItem {
	file: TFile;
	timesOpened: number;
}

export enum TView {
	MOST_VIEWED = "most-viewed",
	TRENDING = "trending"
}