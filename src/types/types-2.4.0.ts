export interface ViewCountPluginSettings_2_4_0 {
	viewCountType: TViewCount;
	saveViewCountToFrontmatter: boolean;
	viewCountPropertyName: string;
	pluginVersion: string;
	logLevel: string,
	excludedPaths: string[];
	templaterDelay: number;
	currentView: TView;
	durationFilter: DurationFilter;
	listSize: ListSize;
}

export { TView as TView_2_4_0 };
export { DurationFilter as DurationFilter_2_4_0 }

enum TView {
	MOST_VIEWED = "most-viewed",
	TRENDING = "trending"
}

type TViewCount = "unique-days-opened" | "total-times-opened";

type ListSize = 10 | 15 | 20 | 25 | 50 | 100;

enum DurationFilter {
	MONTH = "month",
	WEEK_ISO = "week-iso",
	WEEK = "week",
	TODAY = "today",
	DAYS_30 = "30-days",
	DAYS_14 = "14-days",
	DAYS_7 = "7-days",
	DAYS_3 = "3-days"
}