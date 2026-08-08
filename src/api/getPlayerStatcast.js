const API_BASE_URL = 'http://localhost:5000/api';

export async function fetchPybaseball(functionName, payload = {}) {
	const startTime = performance.now();
	const endpointUrl = `${API_BASE_URL}/${functionName}`;

	try {
		const response = await fetch(endpointUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		const duration = (performance.now() - startTime).toFixed(2);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				`[Flask HTTP Error] ${functionName} (${response.status}) in ${duration}ms:`,
				errorText
			);
			return null;
		}

		const data = await response.json();
		return data;
	} catch (err) {
		const duration = (performance.now() - startTime).toFixed(2);
		console.error(`[Network Error] ${functionName} after ${duration}ms:`, err);
		return null;
	}
}

async function fetchStatcastEndpoint(functionName, mlbId, year, extraParams = {}) {
	if (!mlbId) return null;
	try {
		const result = await fetchPybaseball(functionName, {
			year: Number(year),
			player_id: String(mlbId),
			...extraParams
		});

		console.groupCollapsed(`[Statcast API Log] ${functionName}`);
		console.log(`MLB ID: ${mlbId} | Season: ${year}`);
		if (result) {
			console.log('Raw Payload:', result);
			if (Array.isArray(result)) {
				console.log(`Array Length: ${result.length}`);
				console.table(result);
			} else if (typeof result === 'object') {
				console.log('Keys:', Object.keys(result));
				console.table(result);
			}
		} else {
			console.warn(`No record found for player ${mlbId} in ${year}`);
		}
		console.groupEnd();

		return result;
	} catch (err) {
		console.error(`[Statcast API Error] ${functionName}:`, err);
		return null;
	}
}

export function getBatterRunValues(mlbId, year = 2026) {
	return fetchStatcastEndpoint('statcast_batter_run_value', mlbId, year);
}

export function getBatterPercentileRanks(mlbId, year = 2026) {
	return fetchStatcastEndpoint('statcast_batter_percentile_ranks', mlbId, year);
}

export function getBatterExpectedStats(mlbId, year = 2026, minPA = 1) {
	return fetchStatcastEndpoint('statcast_batter_expected_stats', mlbId, year, { minPA });
}

export function getBatterExitVeloBarrels(mlbId, year = 2026, minBBE = 1) {
	return fetchStatcastEndpoint('statcast_batter_exitvelo_barrels', mlbId, year, { minBBE });
}

// export function getBatterPitchArsenal(mlbId, year = 2026, minPA = 1) {
// 	return fetchStatcastEndpoint('statcast_batter_pitch_arsenal', mlbId, year, { minPA });
// }

export function getPitcherRunValues(mlbId, year = 2026) {
	return fetchStatcastEndpoint('statcast_pitcher_run_value', mlbId, year);
}

export function getPitcherPercentileRanks(mlbId, year = 2026) {
	return fetchStatcastEndpoint('statcast_pitcher_percentile_ranks', mlbId, year);
}

export function getPitcherExpectedStats(mlbId, year = 2026, minPA = 1) {
	return fetchStatcastEndpoint('statcast_pitcher_expected_stats', mlbId, year, { minPA });
}

export function getPitcherExitVeloBarrels(mlbId, year = 2026, minBBE = 1) {
	return fetchStatcastEndpoint('statcast_pitcher_exitvelo_barrels', mlbId, year, { minBBE });
}

// export function getPitcherPitchArsenal(mlbId, year = 2026, minP = 1) {
// 	return fetchStatcastEndpoint('statcast_pitcher_pitch_arsenal', mlbId, year, { minP });
// }

export function getFieldingRunValues(mlbId, year = 2026) {
	return fetchStatcastEndpoint('statcast_fielding_run_value', mlbId, year);
}

export function getBaserunningRunValues(mlbId, year = 2026) {
	return fetchStatcastEndpoint('statcast_baserunning_run_value', mlbId, year);
}

export async function getCompletePlayerStatcastProfile(mlbId, year = 2026) {
	if (!mlbId) return null;

	console.time(`[Statcast Profile Fetch Time] MLB ID: ${mlbId}`);

	const [
		batterRunValues,
		batterPercentiles,
		batterExpectedStats,
		batterExitVelo,
		// batterPitchArsenal,
		fieldingRunValues,
		baserunningRunValues,
		pitcherRunValues,
		pitcherPercentiles,
		pitcherExpectedStats,
		pitcherExitVelo
		// pitcherPitchArsenal
	] = await Promise.allSettled([
		getBatterRunValues(mlbId, year),
		getBatterPercentileRanks(mlbId, year),
		getBatterExpectedStats(mlbId, year),
		getBatterExitVeloBarrels(mlbId, year),
		// getBatterPitchArsenal(mlbId, year),
		getFieldingRunValues(mlbId, year),
		getBaserunningRunValues(mlbId, year),
		getPitcherRunValues(mlbId, year),
		getPitcherPercentileRanks(mlbId, year),
		getPitcherExpectedStats(mlbId, year),
		getPitcherExitVeloBarrels(mlbId, year)
		// getPitcherPitchArsenal(mlbId, year)
	]);

	const getValue = (res) => (res.status === 'fulfilled' ? res.value : null);

	const profile = {
		mlbId: String(mlbId),
		year: String(year),
		runValues: getValue(batterRunValues),
		percentiles: getValue(batterPercentiles),
		expectedStats: getValue(batterExpectedStats),
		exitVeloBarrels: getValue(batterExitVelo),
		// pitchArsenal: getValue(batterPitchArsenal) || [],
		fieldingRunValues: getValue(fieldingRunValues),
		baserunningRunValues: getValue(baserunningRunValues),
		pitcherRunValues: getValue(pitcherRunValues),
		pitcherPercentiles: getValue(pitcherPercentiles),
		pitcherExpectedStats: getValue(pitcherExpectedStats),
		pitcherExitVeloBarrels: getValue(pitcherExitVelo)
		// pitcherPitchArsenal: getValue(pitcherPitchArsenal) || []
	};

	console.timeEnd(`[Statcast Profile Fetch Time] MLB ID: ${mlbId}`);
	console.log('Final Aggregated Statcast Profile:', profile);
	return profile;
}

export const getCompleteBatterStatcastProfile = (mlbId, year = 2026) =>
	getCompletePlayerStatcastProfile(mlbId, year);
