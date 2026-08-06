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

async function fetchBatterStatcastEndpoint(functionName, mlbId, year, extraParams = {}) {
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
	return fetchBatterStatcastEndpoint('statcast_batter_run_value', mlbId, year);
}

export function getPitcherRunValues(mlbId, year = 2026) {
	return fetchBatterStatcastEndpoint('statcast_pitcher_run_value', mlbId, year);
}

export function getFieldingRunValues(mlbId, year = 2026) {
	return fetchBatterStatcastEndpoint('statcast_fielding_run_value', mlbId, year);
}

export function getBaserunningRunValues(mlbId, year = 2026) {
	return fetchBatterStatcastEndpoint('statcast_baserunning_run_value', mlbId, year);
}

export function getBatterPercentileRanks(mlbId, year = 2026) {
	return fetchBatterStatcastEndpoint('statcast_batter_percentile_ranks', mlbId, year);
}

export function getBatterExpectedStats(mlbId, year = 2026, minPA = 1) {
	return fetchBatterStatcastEndpoint('statcast_batter_expected_stats', mlbId, year, { minPA });
}

export function getBatterExitVeloBarrels(mlbId, year = 2026, minBBE = 1) {
	return fetchBatterStatcastEndpoint('statcast_batter_exitvelo_barrels', mlbId, year, { minBBE });
}

export function getBatterPitchArsenal(mlbId, year = 2026, minPA = 1) {
	return fetchBatterStatcastEndpoint('statcast_batter_pitch_arsenal', mlbId, year, { minPA });
}

export async function getCompleteBatterStatcastProfile(mlbId, year = 2026) {
	if (!mlbId) return null;

	console.time(`[Statcast Profile Fetch Time] MLB ID: ${mlbId}`);

	const [
		runValuesRes,
		pitcherRunValuesRes,
		fieldingRunValuesRes,
		baserunningRunValuesRes,
		percentilesRes,
		expectedStatsRes,
		exitVeloRes,
		pitchArsenalRes
	] = await Promise.allSettled([
		getBatterRunValues(mlbId, year),
		getPitcherRunValues(mlbId, year),
		getFieldingRunValues(mlbId, year),
		getBaserunningRunValues(mlbId, year),
		getBatterPercentileRanks(mlbId, year),
		getBatterExpectedStats(mlbId, year),
		getBatterExitVeloBarrels(mlbId, year),
		getBatterPitchArsenal(mlbId, year)
	]);

	const profile = {
		mlbId,
		year,
		runValues: runValuesRes.status === 'fulfilled' ? runValuesRes.value : null,
		pitcherRunValues: pitcherRunValuesRes.status === 'fulfilled' ? pitcherRunValuesRes.value : null,
		fieldingRunValues:
			fieldingRunValuesRes.status === 'fulfilled' ? fieldingRunValuesRes.value : null,
		baserunningRunValues:
			baserunningRunValuesRes.status === 'fulfilled' ? baserunningRunValuesRes.value : null,
		percentiles: percentilesRes.status === 'fulfilled' ? percentilesRes.value : null,
		expectedStats: expectedStatsRes.status === 'fulfilled' ? expectedStatsRes.value : null,
		exitVeloBarrels: exitVeloRes.status === 'fulfilled' ? exitVeloRes.value : null,
		pitchArsenal: pitchArsenalRes.status === 'fulfilled' ? pitchArsenalRes.value : []
	};

	console.timeEnd(`[Statcast Profile Fetch Time] MLB ID: ${mlbId}`);
	console.log('Final Aggregated Object:', profile);

	return profile;
}
