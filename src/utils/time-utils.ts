import { moment } from "obsidian";

export const unixTimeMillisToDate = (unixTimeMillis: number) => {
	const unixTimeSeconds = unixTimeMillis / 1000;
	const normalTimestamp = moment.unix(unixTimeSeconds);
	const formattedTimestamp = normalTimestamp.format('YYYY-MM-DD');
	return formattedTimestamp
}

export const dateToUnixTimeMillis = (date: string) => {
	const normalTimestamp = moment(date);
	const unixTimeMillis = normalTimestamp.valueOf();
	return unixTimeMillis;
}


export const getStartOfMonthMillis = () => {
	return moment().startOf('month').valueOf();
}

/**
 * Gets the start of the week in milliseconds
 * isoWeek: boolean - If true, the week starts on Monday. If false, the week starts on Sunday
 */
export const getStartOfWeekMillis = (isoWeek: boolean) => {
	if (isoWeek) {
		return moment().startOf('isoWeek').valueOf();
	}
	return moment().startOf('week').valueOf();
}

export const getStartOfTodayMillis = () => {
	return moment().startOf('day').valueOf();
}

export const getStartOf31DaysAgoMillis = () => {
	return getStartOfDaysMillis(31);
}


export const getStartOf30DaysAgoMillis = () => {
	return getStartOfDaysMillis(30);
}

export const getStartOf14DaysAgoMillis = () => {
	return getStartOfDaysMillis(14);
}

export const getStartOf7DaysAgoMillis = () => {
	return getStartOfDaysMillis(7);
}

export const getStartOf3DaysAgoMillis = () => {
	return getStartOfDaysMillis(3);
}

const getStartOfDaysMillis = (daysAgo: number) => {
	return moment().subtract(daysAgo, 'days').startOf('day').valueOf();
}