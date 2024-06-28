export interface ViewCountPluginSettings_2_3_1 {
	viewCountType: TViewCount;
	saveViewCountToFrontmatter: boolean;
	viewCountPropertyName: string;
	pluginVersion: string;
	logLevel: string,
	excludedPaths: string[];
	templaterDelay: number;
}

type TViewCount = "unique-days-opened" | "total-times-opened";