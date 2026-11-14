// MLB's lightweight team objects (embedded in people/stats payloads) only carry
// the full name ("Atlanta Braves"). The nickname ("Braves") lives on the full
// team resource, so resolve the id -> nickname map once per season and cache it
// for the session.
const nicknameMaps = new Map();

export async function getTeamNicknameMap(year = new Date().getFullYear()) {
	if (!nicknameMaps.has(year)) {
		nicknameMaps.set(
			year,
			(async () => {
				try {
					const res = await fetch(
						`https://statsapi.mlb.com/api/v1/teams?sportId=1&season=${year}`
					);
					if (!res.ok) return new Map();
					const data = await res.json();
					return new Map(
						(data.teams || []).map((team) => [
							team.id,
							team.teamName || team.clubName || team.name || ''
						])
					);
				} catch (err) {
					console.error('Failed to load MLB team nicknames:', err);
					return new Map();
				}
			})()
		);
	}
	return nicknameMaps.get(year);
}
