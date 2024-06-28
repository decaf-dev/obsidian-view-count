import { DurationFilter, ListSize } from "./storage/types";
import { TView } from "./svelte/types";


export interface ViewCountPluginSettings {
	viewCountType: TViewCount;
	saveViewCountToFrontmatter: boolean;
	viewCountPropertyName: string;
	pluginVersion: string;
	logLevel: string,
	excludedPaths: string[];
	templaterDelay: number;
	currentView: TView;
	durationFilter: DurationFilter;
	listSize: ListSize;
}

export interface ViewCountPluginSettings_2_3_1 {
	viewCountType: TViewCount;
	saveViewCountToFrontmatter: boolean;
	viewCountPropertyName: string;
	pluginVersion: string;
	logLevel: string,
	excludedPaths: string[];
	templaterDelay: number;
}

export type TViewCount = "unique-days-opened" | "total-times-opened";

export interface ViewCountPluginSettings_1_2_2 {
	incrementOnceADay: boolean;
	storageType: "property" | "file";
	viewCountPropertyName: string;
	lastViewDatePropertyName: string;
	pluginVersion: string;
	logLevel: string,
	excludedPaths: string[];
	templaterDelay: number;
}

export interface ViewCountPluginSettings_1_2_1 {
	incrementOnceADay: boolean;
	storageType: "property" | "file";
	viewCountPropertyName: string;
	lastViewDatePropertyName: string;
	pluginVersion: string;
	logLevel: string,
	excludedPaths: string[];
	enableTemplaterDelay: boolean;
}
