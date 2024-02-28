export const compareVersions = (version1: string, version2: string) => {
	const v1 = version1.split('.');
	const v2 = version2.split('.');

	for (let i = 0; i < v1.length; i++) {
		const v1Num = parseInt(v1[i]);
		const v2Num = parseInt(v2[i]);

		if (v1Num < v2Num) {
			return -1; // version1 is less than version2
		} else if (v1Num > v2Num) {
			return 1; // version1 is greater than version2
		}
	}

	return 0; // versions are equal
}
