// src/lib/warStore.svelte.js
import { untrack } from 'svelte';

// Keep track of our loaded datasets independently in memory
let globalActiveVault = null;
let globalArchiveVault = null;

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

function extractMetricsFromRecord(playerRecord, id, year) {
	if (!playerRecord) {
		console.warn(`[warStore] No player record found in vaults for ID: ${id}`);
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

	const seasonStats = seasonsMap[String(year)];
	if (seasonStats) {
		state.currentSeasonWar =
			seasonStats.war != null ? parseFloat(seasonStats.war).toFixed(1) : '0.0';
		state.currentSeasonOpsPlus = seasonStats.ops ?? 'N/A';
		state.currentSeasonEraPlus = seasonStats.era ?? 'N/A';
	} else {
		state.currentSeasonWar = '0.0';
		state.currentSeasonOpsPlus = 'N/A';
		state.currentSeasonEraPlus = 'N/A';
	}
}

export async function loadAdvancedMetrics(playerMlbId, selectedYear) {
	if (!playerMlbId) return;

	const stringId = String(playerMlbId);

	// 1. If we already found them in a previously loaded vault, extract metrics directly
	if (globalActiveVault && globalActiveVault[stringId]) {
		extractMetricsFromRecord(globalActiveVault[stringId], playerMlbId, selectedYear);
		return;
	}
	if (globalArchiveVault && globalArchiveVault[stringId]) {
		extractMetricsFromRecord(globalArchiveVault[stringId], playerMlbId, selectedYear);
		return;
	}

	state.loading = true;

	try {
		// 2. Load the active vault if it hasn't been fetched yet
		if (!globalActiveVault) {
			const activeUrl = `${window.location.origin}/data/war_active.json`;
			const res = await fetch(activeUrl);
			if (!res.ok) throw new Error(`Active database HTTP error ${res.status}`);
			globalActiveVault = await res.json();
		}

		// 3. If player exists in the active vault, use it
		if (globalActiveVault[stringId]) {
			extractMetricsFromRecord(globalActiveVault[stringId], playerMlbId, selectedYear);
			return;
		}

		// 4. Otherwise, fetch the historical archive pool fallback
		if (!globalArchiveVault) {
			console.log(
				`[warStore] Player ${stringId} not found in active vault. Checking archive file...`
			);
			const archiveUrl = `${window.location.origin}/data/war_archive.json`;
			const res = await fetch(archiveUrl);
			if (!res.ok) throw new Error(`Archive database HTTP error ${res.status}`);
			globalArchiveVault = await res.json();
		}

		// 5. Extract metrics from archive (or cleanly handle missing records)
		extractMetricsFromRecord(globalArchiveVault[stringId], playerMlbId, selectedYear);
	} catch (err) {
		console.error('[warStore] CRITICAL: Failed fetching or parsing data storage assets:', err);
	} finally {
		state.loading = false;
	}
}
