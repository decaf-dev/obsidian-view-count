
export interface ViewCountPluginSettings {
	incrementOnceADay: boolean;
	storageType: "property" | "file";
	viewCountPropertyName: string;
	lastViewDatePropertyName: string;
	pluginVersion: string;
	logLevel: string,
}
