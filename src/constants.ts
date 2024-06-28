import { LOG_LEVEL_OFF } from "./logger/constants";
import { ViewCountPluginSettings } from "./types";

export const VIEW_COUNT_ITEM_VIEW = "view-count";

export const DEFAULT_SETTINGS: ViewCountPluginSettings = {
	viewCountType: "unique-days-opened",
	saveViewCountToFrontmatter: false,
	viewCountPropertyName: "view-count",
	pluginVersion: "",
	logLevel: LOG_LEVEL_OFF,
	excludedPaths: [],
	templaterDelay: 0,
}
