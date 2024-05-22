
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
