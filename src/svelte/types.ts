import { TFile } from "obsidian";

export interface MostViewedRenderItem {
	file: TFile;
	viewCount: number;
}

export interface TrendingRenderItem {
	file: TFile;
	timesOpened: number;
}