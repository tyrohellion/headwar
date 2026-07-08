import { untrack } from 'svelte';

let globalActiveVault = null;
let globalArchiveVault = null;
let globalLeaderboard = null;

let state = $state({
	careerWar: 'N/A',
	careerWarRank: 'N/A',
	currentSeasonWar: 'N/A',
	currentSeasonWarRank: 'N/A',
	currentSeasonOpsPlus: 'N/A',
	currentSeasonOpsPlusRank: 'N/A',
	currentSeasonEraPlus: 'N/A',
	currentSeasonEraPlusRank: 'N/A',
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
	get careerWarRank() {
		return state.careerWarRank;
	},
	get currentSeasonWar() {
		return state.currentSeasonWar;
	},
	get currentSeasonWarRank() {
		return state.currentSeasonWarRank;
	},
	get currentSeasonOpsPlus() {
		return state.currentSeasonOpsPlus;
	},
	get currentSeasonOpsPlusRank() {
		return state.currentSeasonOpsPlusRank;
	},
	get currentSeasonEraPlus() {
		return state.currentSeasonEraPlus;
	},
	get currentSeasonEraPlusRank() {
		return state.currentSeasonEraPlusRank;
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
	const stringId = String(id);
	console.log(`[warStore DEBUG] Found record for ID: ${id}`, playerRecord);

	if (!playerRecord) {
		console.warn(`[warStore] No player record found in vaults for ID: ${id}`);
		state.careerWar = '0.0';
		state.careerWarRank = 'N/A';
		state.currentSeasonWar = '0.0';
		state.currentSeasonWarRank = 'N/A';
		state.currentSeasonOpsPlus = 'N/A';
		state.currentSeasonOpsPlusRank = 'N/A';
		state.currentSeasonEraPlus = 'N/A';
		state.currentSeasonEraPlusRank = 'N/A';
		state.careerOpsPlus = 'N/A';
		state.careerEraPlus = 'N/A';
		state.seasons = {};
		state.isRetired = false;
		return;
	}

	if (globalLeaderboard && globalLeaderboard[stringId]) {
		state.careerWar = parseFloat(globalLeaderboard[stringId].value).toFixed(1);
		state.careerWarRank = globalLeaderboard[stringId].rank ?? 'N/A';
	} else {
		state.careerWar = '0.0';
		state.careerWarRank = 'N/A';
	}

	const seasonsMap = playerRecord.seasons || {};
	state.seasons = seasonsMap;

	const seasonKeys = Object.keys(seasonsMap).map(Number);
	const maxSeason = seasonKeys.length ? Math.max(...seasonKeys) : 2026;
	state.isRetired = maxSeason < 2026;

	let totalOpsWarWeight = 0;
	let totalOpsWeight = 0;
	let totalEraWarWeight = 0;
	let totalEraWeight = 0;

	for (const sYear in seasonsMap) {
		const data = seasonsMap[sYear];

		const warVal = data.war && typeof data.war === 'object' ? (data.war.value ?? 0) : 0;
		const weight = Math.max(Math.abs(warVal), 0.1);

		if (data.ops && typeof data.ops === 'object' && data.ops.value != null) {
			totalOpsWeight += data.ops.value * weight;
			totalOpsWarWeight += weight;
		}

		if (data.era && typeof data.era === 'object' && data.era.value != null) {
			totalEraWeight += data.era.value * weight;
			totalEraWarWeight += weight;
		}
	}

	state.careerOpsPlus =
		totalOpsWarWeight > 0 ? Math.round(totalOpsWeight / totalOpsWarWeight) : 'N/A';
	state.careerEraPlus =
		totalEraWarWeight > 0 ? Math.round(totalEraWeight / totalEraWarWeight) : 'N/A';

	const seasonStats = seasonsMap[String(year)];
	if (seasonStats) {
		if (seasonStats.war && typeof seasonStats.war === 'object') {
			state.currentSeasonWar = parseFloat(seasonStats.war.value ?? 0).toFixed(1);
			state.currentSeasonWarRank = seasonStats.war.rank ?? 'N/A';
		} else {
			state.currentSeasonWar = '0.0';
			state.currentSeasonWarRank = 'N/A';
		}

		if (seasonStats.ops && typeof seasonStats.ops === 'object') {
			state.currentSeasonOpsPlus = seasonStats.ops.value ?? 'N/A';
			state.currentSeasonOpsPlusRank = seasonStats.ops.rank ?? 'N/A'; // Handily handles 'null' for unqualified players
		} else {
			state.currentSeasonOpsPlus = 'N/A';
			state.currentSeasonOpsPlusRank = 'N/A';
		}

		if (seasonStats.era && typeof seasonStats.era === 'object') {
			state.currentSeasonEraPlus = seasonStats.era.value ?? 'N/A';
			state.currentSeasonEraPlusRank = seasonStats.era.rank ?? 'N/A';
		} else {
			state.currentSeasonEraPlus = 'N/A';
			state.currentSeasonEraPlusRank = 'N/A';
		}
	} else {
		state.currentSeasonWar = '0.0';
		state.currentSeasonWarRank = 'N/A';
		state.currentSeasonOpsPlus = 'N/A';
		state.currentSeasonOpsPlusRank = 'N/A';
		state.currentSeasonEraPlus = 'N/A';
		state.currentSeasonEraPlusRank = 'N/A';
	}
}

export async function loadAdvancedMetrics(playerMlbId, selectedYear) {
	if (!playerMlbId) return;

	const stringId = String(playerMlbId);
	state.loading = true;

	try {
		if (!globalLeaderboard) {
			const leaderboardUrl = `${window.location.origin}/data/career_leaderboard.json`;
			const res = await fetch(leaderboardUrl);
			if (!res.ok) throw new Error(`Leaderboard database HTTP error ${res.status}`);
			globalLeaderboard = await res.json();
		}

		const playerMeta = globalLeaderboard[stringId];
		if (!playerMeta) {
			extractMetricsFromRecord(null, playerMlbId, selectedYear);
			return;
		}

		if (playerMeta.status === 'archive') {
			if (!globalArchiveVault) {
				const archiveUrl = `${window.location.origin}/data/war_archive.json`;
				const res = await fetch(archiveUrl);
				if (!res.ok) throw new Error(`Archive database HTTP error ${res.status}`);
				globalArchiveVault = await res.json();
			}
			extractMetricsFromRecord(globalArchiveVault[stringId], playerMlbId, selectedYear);
		} else {
			if (!globalActiveVault) {
				const activeUrl = `${window.location.origin}/data/war_active.json`;
				const res = await fetch(activeUrl);
				if (!res.ok) throw new Error(`Active database HTTP error ${res.status}`);
				globalActiveVault = await res.json();
			}
			extractMetricsFromRecord(globalActiveVault[stringId], playerMlbId, selectedYear);
		}
	} catch (err) {
		console.error('[warStore] CRITICAL: Failed fetching or parsing data storage assets:', err);
	} finally {
		state.loading = false;
	}
}
