/**
 * Formats a date with relative contextual countdown indicators.
 * @param {string} isoString - The ISO string of the target game time.
 * @param {Date} currentTime - A reactive or current Date instance.
 * @returns {string} - "Today (in 4h)", "Sun 7/12", etc.
 */
export function dynamicDateCountdown(isoString, currentTime) {
	if (!isoString) return '';
	const gameDate = new Date(isoString);

	const isToday = gameDate.toDateString() === currentTime.toDateString();
	const baseDateStr = isToday
		? 'Today'
		: gameDate.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });

	const msDiff = gameDate.getTime() - currentTime.getTime();
	const hoursRemaining = Math.floor(msDiff / (1000 * 60 * 60));
	const minsRemaining = Math.floor((msDiff % (1000 * 60 * 60)) / (1000 * 60));

	if (hoursRemaining > 0 && hoursRemaining <= 24) {
		return `${baseDateStr} (${hoursRemaining} hours)`;
	} else if (hoursRemaining === 0 && minsRemaining > 0) {
		return `${baseDateStr} (${minsRemaining} minutes)`;
	}

	return baseDateStr;
}
