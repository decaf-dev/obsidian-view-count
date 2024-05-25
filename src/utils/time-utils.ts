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

export const getStartOfTodayMillis = () => {
	return moment().startOf('day').valueOf();
}

export const getStartOf31DaysAgoMillis = () => {
	return moment().subtract(31, 'days').startOf('day').valueOf();
}