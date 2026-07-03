// src/lib/warStore.svelte.js
import { untrack } from 'svelte';

let globalWarVault = null;

// EXPANDED: Added career stats, seasons raw map, and retired flag directly to state
let state = $state({
	careerWar: 'N/A',
	currentSeasonWar: 'N/A',
	currentSeasonOpsPlus: 'N/A',
	currentSeasonEraPlus: 'N/A',
	careerOpsPlus: 'N/A',
	careerEraPlus: 'N/A',
	seasons: {},
	isRetired: false,
	loading: false
});

export const advancedStats = {
	get careerWar() {
		return state.careerWar;
	},
	get currentSeasonWar() {
		return state.currentSeasonWar;
	},
	get currentSeasonOpsPlus() {
		return state.currentSeasonOpsPlus;
	},
	get currentSeasonEraPlus() {
		return state.currentSeasonEraPlus;
	},
	get careerOpsPlus() {
		return state.careerOpsPlus;
	},
	get careerEraPlus() {
		return state.careerEraPlus;
	},
	get seasons() {
		return state.seasons;
	},
	get isRetired() {
		return state.isRetired;
	},
	get loading() {
		return state.loading;
	}
};

function extractMetrics(id, year) {
	console.log(
		`[warStore] Extracting metrics for Player ID: ${id} (${typeof id}), Year: ${year} (${typeof year})`
	);

	if (!globalWarVault) {
		console.error('[warStore] extractMetrics called but globalWarVault is null!');
		return;
	}

	const playerRecord = globalWarVault[String(id)];
	console.log(`[warStore] Found player record for ID ${id}:`, playerRecord);

	if (!playerRecord) {
		console.warn(`[warStore] No player record found in vault for ID: ${id}`);
		state.careerWar = '0.0';
		state.currentSeasonWar = '0.0';
		state.currentSeasonOpsPlus = 'N/A';
		state.currentSeasonEraPlus = 'N/A';
		state.careerOpsPlus = 'N/A';
		state.careerEraPlus = 'N/A';
		state.seasons = {};
		state.isRetired = false;
		return;
	}

	// Assign base historical career WAR
	state.careerWar =
		playerRecord.career_total != null ? parseFloat(playerRecord.career_total).toFixed(1) : '0.0';
	console.log(`[warStore] Assigned careerWar: ${state.careerWar}`);

	// Expose raw seasons object so UI dropdown can map keys
	const seasonsMap = playerRecord.seasons || {};
	state.seasons = seasonsMap;

	// Detect retirement status by looking at maximum recorded season against current year 2026
	const seasonKeys = Object.keys(seasonsMap).map(Number);
	const maxSeason = seasonKeys.length ? Math.max(...seasonKeys) : 2026;
	state.isRetired = maxSeason < 2026;

	// --- CALCULATE CAREER METRICS ---
	let totalOpsWarWeight = 0;
	let totalOpsWeight = 0;
	let totalEraWarWeight = 0;
	let totalEraWeight = 0;

	for (const sYear in seasonsMap) {
		const data = seasonsMap[sYear];
		// Use absolute WAR value with a minimum floor to properly distribute weight contributions
		const weight = Math.max(Math.abs(data.war || 0), 0.1);

		if (data.ops != null && !isNaN(data.ops)) {
			totalOpsWeight += data.ops * weight;
			totalOpsWarWeight += weight;
		}
		if (data.era != null && !isNaN(data.era)) {
			totalEraWeight += data.era * weight;
			totalEraWarWeight += weight;
		}
	}

	state.careerOpsPlus =
		totalOpsWarWeight > 0 ? Math.round(totalOpsWeight / totalOpsWarWeight) : 'N/A';
	state.careerEraPlus =
		totalEraWarWeight > 0 ? Math.round(totalEraWeight / totalEraWarWeight) : 'N/A';
	// ---------------------------------

	console.log('[warStore] Available seasons keys in data:', seasonKeys);

	const seasonStats = seasonsMap[String(year)];
	console.log(`[warStore] Found season stats for year ${year}:`, seasonStats);

	if (seasonStats) {
		state.currentSeasonWar =
			seasonStats.war != null ? parseFloat(seasonStats.war).toFixed(1) : '0.0';
		state.currentSeasonOpsPlus = seasonStats.ops ?? 'N/A';
		state.currentSeasonEraPlus = seasonStats.era ?? 'N/A';
	} else {
		console.warn(`[warStore] Year ${year} not found inside seasons object for player ${id}`);
		state.currentSeasonWar = '0.0';
		state.currentSeasonOpsPlus = 'N/A';
		state.currentSeasonEraPlus = 'N/A';
	}

	console.log('[warStore] Current UI State updated to:', {
		careerWar: state.careerWar,
		currentSeasonWar: state.currentSeasonWar,
		currentSeasonOpsPlus: state.currentSeasonOpsPlus,
		currentSeasonEraPlus: state.currentSeasonEraPlus,
		careerOpsPlus: state.careerOpsPlus,
		careerEraPlus: state.careerEraPlus,
		isRetired: state.isRetired
	});
}

export function loadAdvancedMetrics(playerMlbId, selectedYear) {
	console.log(
		`[warStore] loadAdvancedMetrics triggered with ID: ${playerMlbId}, Year: ${selectedYear}`
	);
	if (!playerMlbId) {
		console.warn('[warStore] loadAdvancedMetrics blocked because playerMlbId is falsey.');
		return;
	}

	if (globalWarVault) {
		console.log('[warStore] Vault already cached. Proceeding to extract metrics.');
		extractMetrics(playerMlbId, selectedYear);
		return;
	}

	state.loading = true;
	const targetUrl = `${window.location.origin}/data/war_vault.json`;
	console.log(`[warStore] Vault not in memory. Fetching static asset from: ${targetUrl}`);

	fetch(targetUrl)
		.then((res) => {
			console.log(`[warStore] Fetch response status: ${res.status} ${res.statusText}`);
			if (!res.ok) throw new Error(`HTTP network error ${res.status}`);
			return res.json();
		})
		.then((vault) => {
			globalWarVault = vault;
			const keysCount = Object.keys(vault).length;
			console.log(
				`[warStore] Vault successfully loaded and parsed! Total unique player profiles: ${keysCount}`
			);
			console.log(
				'[warStore] First 5 sample profile keys in vault:',
				Object.keys(vault).slice(0, 5)
			);

			extractMetrics(playerMlbId, selectedYear);
		})
		.catch((err) => {
			console.error('[warStore] CRITICAL: Failed fetching or parsing static database:', err);
		})
		.finally(() => {
			state.loading = false;
		});
}
