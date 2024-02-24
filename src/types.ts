
export interface ViewCountPluginSettings {
	incrementOnceADay: boolean;
	storageType: "property" | "file";
	viewCountPropertyName: string;
	lastViewTimePropertyName: string;

}
