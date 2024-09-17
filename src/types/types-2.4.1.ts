export interface ViewCountPluginSettings_2_4_1 {
	viewCountType: TViewCount;
	saveViewCountToFrontmatter: boolean;
	viewCountPropertyName: string;
	pluginVersion: string;
	logLevel: string;
	excludedPaths: string[];
	templaterDelay: number;
	currentView: TView;
	timePeriod: TimePeriod;
	itemCount: ItemCount;
}

enum TView {
	VIEWS = "views",
	TRENDS = "trends",
}

type TViewCount = "unique-days-opened" | "total-times-opened";

type ItemCount = 10 | 15 | 20 | 25 | 50 | 100;

enum TimePeriod {
	MONTH = "month",
	WEEK_ISO = "week-iso",
	WEEK = "week",
	TODAY = "today",
	DAYS_30 = "30-days",
	DAYS_14 = "14-days",
	DAYS_7 = "7-days",
	DAYS_3 = "3-days",
}
