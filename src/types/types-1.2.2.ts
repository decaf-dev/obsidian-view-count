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