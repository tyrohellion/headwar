export const CURRENT_SEASON = new Date().getFullYear();
export const SAVANT_MIN_YEAR = 2015;
export const BREF_MIN_YEAR = 1871;

const DATA_PATH = '/data/';

let brefIndexPromise = null;
const savantCache = new Map();

function fetchJson(fileName) {
	return fetch(`${DATA_PATH}${fileName}`).then((res) => {
		if (!res.ok) throw new Error(`Failed to load ${fileName}: ${res.status}`);
		return res.json();
	});
}

export function savantFileName(year) {
	const y = Number(year);
	if (!Number.isFinite(y) || y < SAVANT_MIN_YEAR || y > CURRENT_SEASON) return null;
	return `savant_${y}.json`;
}

export function isCurrentSeason(year) {
	return Number(year) === CURRENT_SEASON;
}

// ---------------------------------------------------------------
// B-Ref metrics (bref_index.json, one row per player)
// Each row: { id, cw, cwr, co, ce, seasons }
//   cw  = career WAR
//   cwr = career WAR rank
//   co  = career OPS+ (WAR-weighted)
//   ce  = career ERA+ (WAR-weighted)
//   seasons = [year, war, warRank, ops, opsRank, era, eraRank]
// ---------------------------------------------------------------

function getBrefIndex() {
	if (!brefIndexPromise) {
		brefIndexPromise = fetchJson('bref_index.json').then((players) => {
			const map = new Map();
			for (const player of players) map.set(String(player.id), player);
			return map;
		});
	}
	return brefIndexPromise;
}

export async function getPlayerBrefMetrics(mlbId, selectedYear = CURRENT_SEASON) {
	const stringId = String(mlbId);
	const index = await getBrefIndex();
	const player = index.get(stringId);

	if (!player) {
		return {
			careerWar: 0,
			careerWarRank: 'N/A',
			careerOpsPlus: 'N/A',
			careerEraPlus: 'N/A',
			currentSeasonWar: 0,
			currentSeasonWarRank: 'N/A',
			currentSeasonOpsPlus: 'N/A',
			currentSeasonOpsPlusRank: 'N/A',
			currentSeasonEraPlus: 'N/A',
			currentSeasonEraPlusRank: 'N/A',
			seasons: {},
			maxSeason: CURRENT_SEASON,
			isRetired: false
		};
	}

	const seasons = {};
	for (const [year, war, warRank, ops, opsRank, era, eraRank] of player.seasons) {
		const yearKey = String(year);
		seasons[yearKey] = {
			war: { value: war ?? 0, rank: warRank ?? 'N/A' },
			...(ops != null ? { ops: { value: ops, rank: opsRank ?? 'N/A' } } : {}),
			...(era != null ? { era: { value: era, rank: eraRank ?? 'N/A' } } : {})
		};
	}

	const years = Object.keys(seasons)
		.map(Number)
		.sort((a, b) => b - a);
	const maxSeason = years.length ? years[0] : CURRENT_SEASON;
	const current = seasons[String(selectedYear)];

	return {
		careerWar: player.cw ?? 0,
		careerWarRank: player.cwr ?? 'N/A',
		careerOpsPlus: player.co ?? 'N/A',
		careerEraPlus: player.ce ?? 'N/A',
		currentSeasonWar: current?.war?.value ?? 0,
		currentSeasonWarRank: current?.war?.rank ?? 'N/A',
		currentSeasonOpsPlus: current?.ops?.value ?? 'N/A',
		currentSeasonOpsPlusRank: current?.ops?.rank ?? 'N/A',
		currentSeasonEraPlus: current?.era?.value ?? 'N/A',
		currentSeasonEraPlusRank: current?.era?.rank ?? 'N/A',
		seasons,
		maxSeason,
		isRetired: maxSeason < CURRENT_SEASON
	};
}

// ---------------------------------------------------------------
// Statcast profile (savant_<year>.json, current + historical)
// ---------------------------------------------------------------

function num(value) {
	return value == null ? null : Number(value);
}

function buildStatcastProfile(row, year) {
	const pct = (v) => (v == null ? null : Number(v));
	const num = (v) => (v == null ? null : Number(v));

	const batRunVal = num(row.savant_bat_run_val);
	const pitchRunVal = num(row.savant_pitch_run_val);
	const fieldRunVal = num(row.f_total_runs ?? row.savant_field_run_val);
	const baseRunVal = num(row.savant_base_run_val);

	return {
		mlbId: row.mlb_id,
		year: String(year),
		runValues: batRunVal != null ? { runs_all: batRunVal } : undefined,
		pitcherRunValues: pitchRunVal != null ? { runs_all: pitchRunVal } : undefined,
		fieldingRunValues:
			fieldRunVal != null
				? {
						total_runs: fieldRunVal,
						inf_of_runs: num(row.f_inf_of_runs),
						range_runs: num(row.f_range_runs),
						arm_runs: num(row.f_arm_runs),
						dp_runs: num(row.f_dp_runs),
						catching_runs: num(row.f_catching_runs),
						framing_runs: num(row.f_framing_runs),
						throwing_runs: num(row.f_throwing_runs),
						blocking_runs: num(row.f_blocking_runs)
					}
				: undefined,
		baserunningRunValues: baseRunVal != null ? { runner_runs_tot: baseRunVal } : undefined,
		armStrength: {
			overall: num(row.f_arm_overall),
			max: num(row.f_max_arm_strength)
		},
		percentiles: {
			exit_velocity: pct(row.pct_exit_velocity),
			hard_hit_percent: pct(row.pct_hard_hit),
			brl_percent: pct(row.pct_barrel),
			xwoba: pct(row.pct_xwoba),
			xba: pct(row.pct_xba),
			xslg: pct(row.pct_xslg),
			whiff_percent: pct(row.pct_whiff),
			k_percent: pct(row.pct_k_rate),
			bb_percent: pct(row.pct_bb_rate),
			chase_percent: pct(row.pct_chase),
			sprint_speed: pct(row.pct_sprint_speed),
			sprint_speed_val: pct(row.pct_sprint_speed),
			arm_strength: pct(row.p_pct_arm_strength)
		},
		expectedStats: {
			est_ba: num(row.xba),
			est_slg: num(row.xslg),
			est_woba: num(row.xwoba),
			woba: num(row.woba)
		},
		exitVeloBarrels: {
			avg_hit_speed: num(row.avg_exit_velocity),
			max_hit_speed: num(row.max_exit_velocity),
			ev95percent: num(row.hard_hit_rate),
			brl_percent: num(row.barrel_rate),
			ev50: num(row.ev50)
		},
		custom: {
			whiff_percent: num(row.whiff_rate),
			chase_percent: num(row.chase_rate),
			swing_percent: num(row.swing_rate),
			sweet_spot_percent: num(row.sweet_spot_rate)
		},
		pitcherPercentiles: {
			exit_velocity: pct(row.p_pct_exit_velocity),
			hard_hit_percent: pct(row.p_pct_hard_hit),
			brl_percent: pct(row.p_pct_brl_percent),
			xwoba: pct(row.p_pct_xwoba),
			xba: pct(row.p_pct_xba),
			xslg: pct(row.p_pct_xslg),
			whiff_percent: pct(row.p_pct_whiff),
			k_percent: pct(row.p_pct_k_rate),
			bb_percent: pct(row.p_pct_bb_rate),
			chase_percent: pct(row.p_pct_chase),
			xera: pct(row.p_pct_xera),
			fb_velocity: pct(row.p_pct_fb_velocity),
			fb_spin: pct(row.p_pct_fb_spin),
			fb_spin_val: pct(row.p_pct_fb_spin),
			curve_spin: pct(row.p_pct_curve_spin),
			curve_spin_val: pct(row.p_pct_curve_spin)
		},
		pitcherExpectedStats: {
			xera: num(row.p_xera),
			est_woba: num(row.p_est_woba),
			est_ba: num(row.p_est_ba),
			est_slg: num(row.p_est_slg)
		},
		pitcherExitVeloBarrels: {
			avg_hit_speed: num(row.p_avg_exit_velocity),
			max_hit_speed: num(row.p_max_exit_velocity),
			ev95percent: num(row.p_hard_hit_rate),
			brl_percent: num(row.p_barrel_rate),
			ev50: num(row.p_ev50),
			avg_hit_angle: num(row.p_avg_hit_angle),
			anglesweetspotpercent: num(row.p_angle_sweet_spot),
			avg_distance: num(row.p_avg_distance)
		}
	};
}

function getSavantRows(fileName) {
	if (!savantCache.has(fileName)) {
		savantCache.set(
			fileName,
			fetchJson(fileName).catch((err) => {
				savantCache.delete(fileName);
				throw err;
			})
		);
	}
	return savantCache.get(fileName);
}

export async function getPlayerStatcastProfile(mlbId, year = CURRENT_SEASON) {
	const fileName = savantFileName(year);
	if (!fileName) return null;

	try {
		const rows = await getSavantRows(fileName);
		const row = rows.find((r) => String(r.mlb_id) === String(mlbId));
		if (!row) return null;
		return buildStatcastProfile(row, year);
	} catch (err) {
		return null;
	}
}
