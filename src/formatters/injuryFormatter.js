// Counts a player's distinct injured-list stints in a season from the MLB
// Stats API transactions feed (https://statsapi.mlb.com/api/v1/transactions).
//
// Transactions describe roster moves in free text, e.g.:
//   "Los Angeles Angels placed CF Mike Trout on the 10-day injured list. Left knee meniscus tear."
//   "Los Angeles Angels placed CF Mike Trout on the 10-day disabled list. Right wrist inflammation."
//   "Los Angeles Angels transferred CF Mike Trout from the 10-day injured list to the 60-day injured list."
//   "Los Angeles Angels activated CF Mike Trout from the 10-day injured list."
//
// A single injury can produce multiple placements (a 10-day stint upgraded to
// 60-day, or the same move re-announced), all sharing the same reason text. So
// we count each distinct reason once per season rather than each placement.
//
// Days on the injured list come from pairing each injury's earliest placement
// to the first subsequent activation. Activations that are All-Star Game or
// offseason roster bookkeeping (e.g. "Los Angeles Angels activated ... from the
// 10-day injured list" in November, or "American League All-Stars activated ...")
// are treated as the closing event of an ongoing stint rather than a return to
// play mid-season.

function isInjuredListPlacement(description = '') {
	const lower = description.toLowerCase();
	return (
		lower.includes('placed') &&
		(lower.includes('injured list') || lower.includes('disabled list'))
	);
}

function isInjuredListActivation(description = '') {
	const lower = description.toLowerCase();
	if (/all[- ]stars?/.test(lower)) return false;
	return (
		(lower.includes('activated') || lower.includes('reinstated')) &&
		(lower.includes('injured list') || lower.includes('disabled list'))
	);
}

function daysBetween(laterDate, earlierDate) {
	if (!laterDate || !earlierDate) return 0;
	const later = new Date(`${laterDate}T00:00:00`);
	const earlier = new Date(`${earlierDate}T00:00:00`);
	if (Number.isNaN(later.getTime()) || Number.isNaN(earlier.getTime())) {
		return 0;
	}
	return Math.max(0, Math.round((later - earlier) / 86_400_000));
}

function extractReason(description = '') {
	// Grab everything after the first ". " that follows the list type so any
	// "retroactive to <date>" preamble is dropped. Falls back to the full
	// description if the API did not append a reason.
	const match = description.match(/(?:injured|disabled)\s+list[\s\S]*?\.\s+(.+)$/i);
	return (match ? match[1].trim() : description.trim()) || 'Injured list';
}

function normalizeReason(reason) {
	return reason
		.replace(/\s+/g, ' ')
		.replace(/\.+$/g, '')
		.trim()
		.toLowerCase();
}

/**
 * Summarizes a player's injuries for one season.
 * @param {Array} transactions - Raw `transactions` array from the MLB Stats API.
 * @param {number|string} season - Season year, e.g. 2023 or '2023'.
 * @returns {{ count: number, days: number, injuries: { date: string, reason: string, days: number, ongoing: boolean }[] }}
 */
export function summarizeSeasonInjuries(transactions = [], season) {
	const seasonPrefix = `${season}-`;

	const byReason = new Map();
	const activations = [];

	for (const t of transactions) {
		const effective = t?.effectiveDate || t?.date || '';
		if (!String(effective).startsWith(seasonPrefix)) continue;

		if (isInjuredListPlacement(t.description)) {
			const rawReason = extractReason(t.description);
			const key = normalizeReason(rawReason);
			const date = effective.slice(0, 10);
			const existing = byReason.get(key);

			if (!existing || (date && date < existing.date)) {
				byReason.set(key, {
					date,
					reason:
						rawReason.replace(/\.+$/g, '').trim() || 'Injured list'
				});
			}
		} else if (isInjuredListActivation(t.description)) {
			activations.push(effective.slice(0, 10));
		}
	}

	// Pair each injury's earliest placement with the next unused activation. An
	// activation is consumed once, so duplicate re-announced placements of the
	// same stint (which share a reason) never "close" another stint's clock. A
	// stint with no closing activation in the window is still ongoing.
	const entries = [...byReason.values()].sort((a, b) =>
		a.date.localeCompare(b.date)
	);
	const pool = [...new Set(activations)].sort();

	for (const entry of entries) {
		const index = pool.findIndex((date) => date >= entry.date);
		if (index !== -1) {
			const [end] = pool.splice(index, 1);
			entry.days = daysBetween(end, entry.date);
			entry.ongoing = false;
		} else {
			entry.days = 0;
			entry.ongoing = true;
		}
	}

	const injuries = entries
		.map((entry) => ({ ...entry }))
		.sort((a, b) => a.date.localeCompare(b.date));
	const days = injuries.reduce((sum, entry) => sum + (entry.days || 0), 0);

	return { count: injuries.length, days, injuries };
}