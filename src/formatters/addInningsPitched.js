/**
 * Safely sums an array of innings pitched (IP) strings or numbers
 * using standard baseball math (3 outs = 1 full inning).
 *
 * @param {Array<string|number>} ipArray - Array of IP values (e.g., ['36.1', 34.1, '10.0'])
 * @returns {string} The formatted total IP (e.g., "70.2")
 */
export function sumInningsPitched(ipArray) {
	if (!Array.isArray(ipArray) || ipArray.length === 0) return '0.0';

	const totalOuts = ipArray.reduce((acc, ip) => {
		if (ip === null || ip === undefined) return acc;

		const str = String(ip).trim();
		if (!str || str === '0') return acc;

		const [fullInnings, outs] = str.split('.').map(Number);

		const safeInnings = isNaN(fullInnings) ? 0 : fullInnings;
		const safeOuts = isNaN(outs) ? 0 : outs;

		return acc + safeInnings * 3 + safeOuts;
	}, 0);

	const finalInnings = Math.floor(totalOuts / 3);
	const finalOuts = totalOuts % 3;

	return `${finalInnings}.${finalOuts}`;
}
