

export interface ViewCountPluginSettings {
	viewCountType: ViewCountType;
	saveViewCountToFrontmatter: boolean;
	viewCountPropertyName: string;
	pluginVersion: string;
	logLevel: string,
	excludedPaths: string[];
	templaterDelay: number;
}

export type ViewCountType = "unique-days-opened" | "total-times-opened";

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
