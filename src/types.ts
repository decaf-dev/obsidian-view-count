
export interface ViewCountPluginSettings {
	incrementOnceADay: boolean;
	storageType: "property" | "file";
	viewCountPropertyName: string;
	lastViewDatePropertyName: string;
	lastViewTimePropertyName: string;
	pluginVersion: string;
}
