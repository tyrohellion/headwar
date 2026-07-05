export function getSeasonProgressPercentage() {
	const now = new Date();
	const currentYear = now.getFullYear();

	const openingDay = new Date(currentYear, 2, 31);
	while (openingDay.getDay() !== 4) {
		openingDay.setDate(openingDay.getDate() - 1);
	}
	openingDay.setHours(0, 0, 0, 0);

	const endOfSeason = new Date(currentYear, 8, 30);
	while (endOfSeason.getDay() !== 0) {
		endOfSeason.setDate(endOfSeason.getDate() - 1);
	}
	endOfSeason.setHours(23, 59, 59, 999);

	if (now < openingDay) return '0%';
	if (now > endOfSeason) return '100%';

	const totalDuration = endOfSeason - openingDay;
	const currentElapsed = now - openingDay;

	return Math.round((currentElapsed / totalDuration) * 100) + '%';
}
