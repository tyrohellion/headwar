import { getPlayerBrefMetrics } from './parquetData.js';

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

function formatWar(value) {
	return typeof value === 'number' ? value.toFixed(1) : '0.0';
}

function resetToEmpty() {
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
}

export async function loadAdvancedMetrics(playerMlbId, selectedYear) {
	if (!playerMlbId) return;

	state.loading = true;

	try {
		const metrics = await getPlayerBrefMetrics(playerMlbId, selectedYear);

		state.careerWar = formatWar(metrics.careerWar);
		state.careerWarRank = metrics.careerWarRank;
		state.currentSeasonWar = formatWar(metrics.currentSeasonWar);
		state.currentSeasonWarRank = metrics.currentSeasonWarRank;
		state.currentSeasonOpsPlus = metrics.currentSeasonOpsPlus;
		state.currentSeasonOpsPlusRank = metrics.currentSeasonOpsPlusRank;
		state.currentSeasonEraPlus = metrics.currentSeasonEraPlus;
		state.currentSeasonEraPlusRank = metrics.currentSeasonEraPlusRank;
		state.careerOpsPlus = metrics.careerOpsPlus;
		state.careerEraPlus = metrics.careerEraPlus;
		state.seasons = metrics.seasons;
		state.isRetired = metrics.isRetired;
	} catch (err) {
		console.error('[warStore] Failed to load B-Ref metrics from parquet:', err);
		resetToEmpty();
	} finally {
		state.loading = false;
	}
}
