// src/lib/warStore.svelte.js

// Shared cache reference stays alive in memory across page navigations
let globalWarVault = null;

// The shared reactive state object that components can read from
export const advancedStats = $state({
	careerWar: 'N/A',
	currentSeasonWar: 'N/A',
	currentSeasonOpsPlus: 'N/A',
	currentSeasonEraPlus: 'N/A',
	loading: false
});

/**
 * Extracts and sets the metrics reactively from a local vault object
 */
function extractMetrics(id, year) {
	const playerRecord = globalWarVault[String(id)];

	if (!playerRecord) {
		advancedStats.careerWar = '0.0';
		advancedStats.currentSeasonWar = '0.0';
		advancedStats.currentSeasonOpsPlus = 'N/A';
		advancedStats.currentSeasonEraPlus = 'N/A';
		return;
	}

	// Assign directly to our exported reactive state object
	advancedStats.careerWar =
		playerRecord.career_total != null ? Number(playerRecord.career_total).toFixed(1) : '0.0';

	const seasonStats = playerRecord.seasons[String(year)];
	if (seasonStats) {
		advancedStats.currentSeasonWar =
			seasonStats.war != null ? Number(seasonStats.war).toFixed(1) : '0.0';
		advancedStats.currentSeasonOpsPlus = seasonStats.ops ?? 'N/A';
		advancedStats.currentSeasonEraPlus = seasonStats.era ?? 'N/A';
	} else {
		advancedStats.currentSeasonWar = '0.0';
		advancedStats.currentSeasonOpsPlus = 'N/A';
		advancedStats.currentSeasonEraPlus = 'N/A';
	}
}

/**
 * Main public function called by your components to update the stats
 */
export function loadAdvancedMetrics(playerMlbId, selectedYear) {
	if (!playerMlbId) return;

	// Scenario A: Vault is already cached in memory, read from it instantly!
	if (globalWarVault) {
		extractMetrics(playerMlbId, selectedYear);
		return;
	}

	// Scenario B: First time loading, fetch the tiny 2.4MB static JSON asset
	advancedStats.loading = true;
	fetch('/data/war_vault.json')
		.then((res) => res.json())
		.then((vault) => {
			globalWarVault = vault;
			extractMetrics(playerMlbId, selectedYear);
		})
		.catch((err) => {
			console.error('Failed parsing static metrics database:', err);
		})
		.finally(() => {
			advancedStats.loading = false;
		});
}
