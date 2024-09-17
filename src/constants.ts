import { LOG_LEVEL_OFF } from "./logger/constants";
import { TimePeriod, TView, ViewCountPluginSettings } from "./types";

export const VIEW_COUNT_ITEM_VIEW = "view-count";

export const DEFAULT_SETTINGS: ViewCountPluginSettings = {
	countMethod: "unique-days-opened",
	skipNewNotes: false,
	syncToFrontmatter: false,
	propertyName: "view-count",
	pluginVersion: "",
	logLevel: LOG_LEVEL_OFF,
	excludedPaths: [],
	templaterDelay: 0,
	currentView: TView.VIEWS,
	timePeriod: TimePeriod.DAYS_3,
	itemCount: 20,
};
