import * as duckdb from '@duckdb/duckdb-wasm';
import mvp_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?worker';
import eh_wasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?worker';
import coi_wasm from '@duckdb/duckdb-wasm/dist/duckdb-coi.wasm?url';
import coi_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-coi.worker.js?worker';
import coi_pthread_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-coi.pthread.worker.js?worker';

export const CURRENT_SEASON = new Date().getFullYear();
export const SAVANT_MIN_YEAR = 2015;

const BREF_FILE = 'bref_daily.parquet';
const OPS_QUALIFIED_PA = 200;
const ERA_QUALIFIED_IP = 50;

let connectionPromise = null;
let registeredFiles = new Set();
let brefCareerCache = null;
let brefSeasonCache = null;

export function savantFileName(year) {
	const y = Number(year);
	if (!Number.isFinite(y) || y < SAVANT_MIN_YEAR || y > CURRENT_SEASON) return null;
	return `savant_${y}.parquet`;
}

export function isCurrentSeason(year) {
	return Number(year) === CURRENT_SEASON;
}

function normalizeValue(value) {
	return typeof value === 'bigint' ? Number(value) : value;
}

function rowsToObjects(table) {
	if (!table) return [];
	return table.toArray().map((row) => {
		const raw = row.toJSON();
		const obj = {};
		for (const key of Object.keys(raw)) obj[key] = normalizeValue(raw[key]);
		return obj;
	});
}

async function getConnection() {
	if (typeof window === 'undefined') {
		throw new Error('Parquet data is only available in the browser');
	}
	if (!connectionPromise) connectionPromise = initDb();
	return connectionPromise;
}

async function initDb() {
	const bundles = {
		mvp: { mainModule: mvp_wasm, mainWorker: new mvp_worker() },
		eh: { mainModule: eh_wasm, mainWorker: new eh_worker() },
		coi: {
			mainModule: coi_wasm,
			mainWorker: new coi_worker(),
			pthreadWorker: new coi_pthread_worker()
		}
	};

	const bundle = await duckdb.selectBundle(bundles);
	const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.ERROR);
	const db = new duckdb.AsyncDuckDB(logger, bundle.mainWorker);
	await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

	const baseUrl = `${window.location.origin}/data/`;
	const files = [BREF_FILE];
	for (let year = SAVANT_MIN_YEAR; year <= CURRENT_SEASON; year++) {
		files.push(savantFileName(year));
	}

	for (const file of files) {
		if (registeredFiles.has(file)) continue;
		await db.registerFileURL(file, baseUrl + file, duckdb.DuckDBDataProtocol.HTTP, true);
		registeredFiles.add(file);
	}

	const conn = await db.connect();
	return conn;
}

async function runQuery(sql) {
	const conn = await getConnection();
	const table = await conn.query(sql);
	return rowsToObjects(table);
}

// ---------------------------------------------------------------
// B-Ref metrics (bref_daily.parquet, single file for all seasons)
// ---------------------------------------------------------------

async function getBrefCareerMap() {
	if (brefCareerCache) return brefCareerCache;

	const rows = await runQuery(
		`SELECT mlb_id, ROUND(SUM(WAR_total), 1) AS career_war
		 FROM read_parquet('${BREF_FILE}')
		 WHERE mlb_id IS NOT NULL
		 GROUP BY mlb_id`
	);

	rows.sort((a, b) => b.career_war - a.career_war);

	const map = new Map();
	rows.forEach((row, index) => {
		map.set(row.mlb_id, { value: row.career_war, rank: index + 1 });
	});

	brefCareerCache = map;
	return map;
}

async function getBrefSeasonCache() {
	if (brefSeasonCache) return brefSeasonCache;

	const rows = await runQuery(
		`SELECT year_ID, mlb_id,
		        ROUND(SUM(WAR_total), 1) AS war,
		        SUM(PA) AS pa,
		        ROUND(SUM(IP), 1) AS ip,
		        ROUND(arg_max(ops_plus, PA)) AS ops,
		        ROUND(arg_max(era_plus, IP)) AS era
		 FROM read_parquet('${BREF_FILE}')
		 WHERE mlb_id IS NOT NULL
		 GROUP BY year_ID, mlb_id`
	);

	const byYear = new Map();
	for (const row of rows) {
		const yearKey = String(row.year_ID);
		if (!byYear.has(yearKey)) byYear.set(yearKey, new Map());
		byYear.get(yearKey).set(row.mlb_id, row);
	}

	for (const playerMap of byYear.values()) {
		const players = Array.from(playerMap.values());

		const warSorted = [...players].sort((a, b) => b.war - a.war);
		warSorted.forEach((p, i) => (p.warRank = i + 1));

		const opsQualified = players
			.filter((p) => p.ops != null && p.pa != null && p.pa >= OPS_QUALIFIED_PA)
			.sort((a, b) => b.ops - a.ops);
		opsQualified.forEach((p, i) => (p.opsRank = i + 1));

		const eraQualified = players
			.filter((p) => p.era != null && p.ip != null && p.ip >= ERA_QUALIFIED_IP)
			.sort((a, b) => b.era - a.era);
		eraQualified.forEach((p, i) => (p.eraRank = i + 1));
	}

	brefSeasonCache = byYear;
	return byYear;
}

export async function getPlayerBrefMetrics(mlbId, selectedYear = CURRENT_SEASON) {
	const stringId = String(mlbId);
	const [careerMap, seasonCache] = await Promise.all([getBrefCareerMap(), getBrefSeasonCache()]);

	const careerEntry = careerMap.get(stringId);
	const careerWar = careerEntry ? careerEntry.value : 0;
	const careerWarRank = careerEntry ? careerEntry.rank : 'N/A';

	const playerSeasons = [];
	for (const [yearKey, playerMap] of seasonCache) {
		const row = playerMap.get(stringId);
		if (row) playerSeasons.push({ yearKey, row });
	}
	playerSeasons.sort((a, b) => Number(b.yearKey) - Number(a.yearKey));

	const seasons = {};
	for (const { yearKey, row } of playerSeasons) {
		seasons[yearKey] = {
			war: { value: row.war ?? 0, rank: row.warRank ?? 'N/A' },
			...(row.ops != null ? { ops: { value: row.ops, rank: row.opsRank ?? 'N/A' } } : {}),
			...(row.era != null ? { era: { value: row.era, rank: row.eraRank ?? 'N/A' } } : {})
		};
	}

	let totalOpsWeight = 0;
	let totalOpsWarWeight = 0;
	let totalEraWeight = 0;
	let totalEraWarWeight = 0;

	for (const yearKey of Object.keys(seasons)) {
		const data = seasons[yearKey];
		const warVal = typeof data.war?.value === 'number' ? data.war.value : 0;
		const weight = Math.max(Math.abs(warVal), 0.1);

		if (data.ops?.value != null) {
			totalOpsWeight += data.ops.value * weight;
			totalOpsWarWeight += weight;
		}
		if (data.era?.value != null) {
			totalEraWeight += data.era.value * weight;
			totalEraWarWeight += weight;
		}
	}

	const careerOpsPlus =
		totalOpsWarWeight > 0 ? Math.round(totalOpsWeight / totalOpsWarWeight) : 'N/A';
	const careerEraPlus =
		totalEraWarWeight > 0 ? Math.round(totalEraWeight / totalEraWarWeight) : 'N/A';

	const current = seasons[String(selectedYear)];
	const maxSeason = playerSeasons.length ? Number(playerSeasons[0].yearKey) : CURRENT_SEASON;

	return {
		careerWar,
		careerWarRank,
		careerOpsPlus,
		careerEraPlus,
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
// Statcast profile (savant_<year>.parquet, current + historical)
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

export async function getPlayerStatcastProfile(mlbId, year = CURRENT_SEASON) {
	const file = savantFileName(year);
	if (!file) return null;

	const rows = await runQuery(
		`SELECT * FROM read_parquet('${file}') WHERE mlb_id = '${String(mlbId)}' LIMIT 1`
	);
	const row = rows[0];
	if (!row) return null;

	return buildStatcastProfile(row, year);
}
