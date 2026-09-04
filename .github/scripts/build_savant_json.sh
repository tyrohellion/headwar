#!/usr/bin/env bash
set -euo pipefail

# Builds static/data/savant_<year>.json from the statcast leaderboard CSVs in
# tmp/ (fetched by the workflow). Exits non-zero if the result is invalid.

YEAR="$1"

duckdb -c "
CREATE TABLE savant_bat_pct AS SELECT CAST(player_id AS VARCHAR) AS mlb_id, CAST(exit_velocity AS INTEGER) AS pct_exit_velocity, CAST(hard_hit_percent AS INTEGER) AS pct_hard_hit, CAST(COALESCE(TRY_CAST(brl_percent AS INTEGER), TRY_CAST(brl AS INTEGER)) AS INTEGER) AS pct_barrel, CAST(xwoba AS INTEGER) AS pct_xwoba, CAST(xba AS INTEGER) AS pct_xba, CAST(xslg AS INTEGER) AS pct_xslg, CAST(whiff_percent AS INTEGER) AS pct_whiff, CAST(k_percent AS INTEGER) AS pct_k_rate, CAST(bb_percent AS INTEGER) AS pct_bb_rate, CAST(chase_percent AS INTEGER) AS pct_chase, CAST(sprint_speed AS INTEGER) AS pct_sprint_speed FROM read_csv('tmp/bat_pct.csv', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True) WHERE player_id IS NOT NULL AND CAST(player_id AS VARCHAR) != '';

CREATE TABLE savant_bat_xstats AS SELECT CAST(player_id AS VARCHAR) AS mlb_id, CAST(ba AS DOUBLE) AS ba, CAST(est_ba AS DOUBLE) AS xba, CAST(slg AS DOUBLE) AS slg, CAST(est_slg AS DOUBLE) AS xslg, CAST(woba AS DOUBLE) AS woba, CAST(est_woba AS DOUBLE) AS xwoba FROM read_csv('tmp/bat_xstats.csv', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True) WHERE player_id IS NOT NULL AND CAST(player_id AS VARCHAR) != '';

CREATE TABLE savant_bat_ev AS SELECT CAST(player_id AS VARCHAR) AS mlb_id, CAST(avg_hit_speed AS DOUBLE) AS avg_exit_velocity, CAST(max_hit_speed AS DOUBLE) AS max_exit_velocity, CAST(ev50 AS DOUBLE) AS ev50, CAST(brl_percent AS DOUBLE) AS barrel_rate, CAST(ev95percent AS DOUBLE) AS hard_hit_rate FROM read_csv('tmp/bat_ev.csv', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True) WHERE player_id IS NOT NULL AND CAST(player_id AS VARCHAR) != '';

CREATE TABLE savant_bat_custom AS SELECT CAST(player_id AS VARCHAR) AS mlb_id, CAST(whiff_percent AS DOUBLE) AS whiff_rate, CAST(chase_percent AS DOUBLE) AS chase_rate, CAST(swing_percent AS DOUBLE) AS swing_rate, CAST(sweet_spot_percent AS DOUBLE) AS sweet_spot_rate FROM read_csv('tmp/bat_custom.csv', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True) WHERE player_id IS NOT NULL AND CAST(player_id AS VARCHAR) != '';

CREATE TABLE savant_bat_rv AS SELECT CAST(player_id AS VARCHAR) AS mlb_id, CAST(runs_all AS DOUBLE) AS savant_bat_run_val FROM read_csv('tmp/bat_rv.csv', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True) WHERE player_id IS NOT NULL AND CAST(player_id AS VARCHAR) != '';
ALTER TABLE savant_bat_rv ADD COLUMN pct_bat_run_val INTEGER;
UPDATE savant_bat_rv SET pct_bat_run_val = ROUND(PERCENT_RANK() OVER (ORDER BY savant_bat_run_val) * 100);

CREATE TABLE savant_pitch_rv AS SELECT CAST(player_id AS VARCHAR) AS mlb_id, CAST(runs_all AS DOUBLE) AS savant_pitch_run_val FROM read_csv('tmp/pitch_rv.csv', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True) WHERE player_id IS NOT NULL AND CAST(player_id AS VARCHAR) != '';
ALTER TABLE savant_pitch_rv ADD COLUMN pct_pitch_run_val INTEGER;
UPDATE savant_pitch_rv SET pct_pitch_run_val = ROUND(PERCENT_RANK() OVER (ORDER BY savant_pitch_run_val) * 100);

CREATE TABLE savant_field_rv AS SELECT CAST(id AS VARCHAR) AS mlb_id, CAST(total_runs AS DOUBLE) AS savant_field_run_val, CAST(total_runs AS DOUBLE) AS f_total_runs, CAST(inf_of_runs AS DOUBLE) AS f_inf_of_runs, CAST(range_runs AS DOUBLE) AS f_range_runs, CAST(arm_runs AS DOUBLE) AS f_arm_runs, CAST(dp_runs AS DOUBLE) AS f_dp_runs, CAST(catching_runs AS DOUBLE) AS f_catching_runs, CAST(framing_runs AS DOUBLE) AS f_framing_runs, CAST(throwing_runs AS DOUBLE) AS f_throwing_runs, CAST(blocking_runs AS DOUBLE) AS f_blocking_runs FROM read_csv('tmp/field_rv.csv', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True) WHERE id IS NOT NULL AND CAST(id AS VARCHAR) != '';
ALTER TABLE savant_field_rv ADD COLUMN pct_f_total_runs INTEGER;
ALTER TABLE savant_field_rv ADD COLUMN pct_f_inf_of_runs INTEGER;
ALTER TABLE savant_field_rv ADD COLUMN pct_f_range_runs INTEGER;
ALTER TABLE savant_field_rv ADD COLUMN pct_f_arm_runs INTEGER;
ALTER TABLE savant_field_rv ADD COLUMN pct_f_dp_runs INTEGER;
ALTER TABLE savant_field_rv ADD COLUMN pct_f_catching_runs INTEGER;
ALTER TABLE savant_field_rv ADD COLUMN pct_f_framing_runs INTEGER;
ALTER TABLE savant_field_rv ADD COLUMN pct_f_throwing_runs INTEGER;
ALTER TABLE savant_field_rv ADD COLUMN pct_f_blocking_runs INTEGER;
UPDATE savant_field_rv SET pct_f_total_runs = ROUND(PERCENT_RANK() OVER (ORDER BY f_total_runs) * 100);
UPDATE savant_field_rv SET pct_f_inf_of_runs = ROUND(PERCENT_RANK() OVER (ORDER BY f_inf_of_runs) * 100);
UPDATE savant_field_rv SET pct_f_range_runs = ROUND(PERCENT_RANK() OVER (ORDER BY f_range_runs) * 100);
UPDATE savant_field_rv SET pct_f_arm_runs = ROUND(PERCENT_RANK() OVER (ORDER BY f_arm_runs) * 100);
UPDATE savant_field_rv SET pct_f_dp_runs = ROUND(PERCENT_RANK() OVER (ORDER BY f_dp_runs) * 100);
UPDATE savant_field_rv SET pct_f_catching_runs = ROUND(PERCENT_RANK() OVER (ORDER BY f_catching_runs) * 100);
UPDATE savant_field_rv SET pct_f_framing_runs = ROUND(PERCENT_RANK() OVER (ORDER BY f_framing_runs) * 100);
UPDATE savant_field_rv SET pct_f_throwing_runs = ROUND(PERCENT_RANK() OVER (ORDER BY f_throwing_runs) * 100);
UPDATE savant_field_rv SET pct_f_blocking_runs = ROUND(PERCENT_RANK() OVER (ORDER BY f_blocking_runs) * 100);

CREATE TABLE savant_base_rv AS SELECT CAST(player_id AS VARCHAR) AS mlb_id, CAST(runner_runs_tot AS DOUBLE) AS savant_base_run_val FROM read_csv('tmp/base_rv.csv', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True) WHERE player_id IS NOT NULL AND CAST(player_id AS VARCHAR) != '';
ALTER TABLE savant_base_rv ADD COLUMN pct_base_run_val INTEGER;
UPDATE savant_base_rv SET pct_base_run_val = ROUND(PERCENT_RANK() OVER (ORDER BY savant_base_run_val) * 100);

CREATE TABLE savant_arm_str AS SELECT CAST(player_id AS VARCHAR) AS mlb_id, CAST(arm_overall AS DOUBLE) AS f_arm_overall, CAST(max_arm_strength AS DOUBLE) AS f_max_arm_strength FROM read_csv('tmp/arm_str.csv', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True) WHERE player_id IS NOT NULL AND CAST(player_id AS VARCHAR) != '';

CREATE TABLE savant_pitch_pct AS SELECT CAST(player_id AS VARCHAR) AS mlb_id, CAST(xwoba AS INTEGER) AS p_pct_xwoba, CAST(xba AS INTEGER) AS p_pct_xba, CAST(xslg AS INTEGER) AS p_pct_xslg, CAST(brl_percent AS INTEGER) AS p_pct_brl_percent, CAST(exit_velocity AS INTEGER) AS p_pct_exit_velocity, CAST(hard_hit_percent AS INTEGER) AS p_pct_hard_hit, CAST(k_percent AS INTEGER) AS p_pct_k_rate, CAST(bb_percent AS INTEGER) AS p_pct_bb_rate, CAST(whiff_percent AS INTEGER) AS p_pct_whiff, CAST(chase_percent AS INTEGER) AS p_pct_chase, CAST(arm_strength AS INTEGER) AS p_pct_arm_strength, CAST(xera AS INTEGER) AS p_pct_xera, CAST(fb_velocity AS INTEGER) AS p_pct_fb_velocity, CAST(fb_spin AS INTEGER) AS p_pct_fb_spin, CAST(curve_spin AS INTEGER) AS p_pct_curve_spin FROM read_csv('tmp/pitch_pct.csv', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True) WHERE player_id IS NOT NULL AND CAST(player_id AS VARCHAR) != '';

CREATE TABLE savant_pitch_xstats AS SELECT CAST(player_id AS VARCHAR) AS mlb_id, CAST(est_ba AS DOUBLE) AS p_est_ba, CAST(est_slg AS DOUBLE) AS p_est_slg, CAST(est_woba AS DOUBLE) AS p_est_woba, CAST(woba AS DOUBLE) AS p_woba, CAST(xera AS DOUBLE) AS p_xera FROM read_csv('tmp/pitch_xstats.csv', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True) WHERE player_id IS NOT NULL AND CAST(player_id AS VARCHAR) != '';

CREATE TABLE savant_pitch_ev AS SELECT CAST(player_id AS VARCHAR) AS mlb_id, CAST(avg_hit_speed AS DOUBLE) AS p_avg_exit_velocity, CAST(max_hit_speed AS DOUBLE) AS p_max_exit_velocity, CAST(ev50 AS DOUBLE) AS p_ev50, CAST(brl_percent AS DOUBLE) AS p_barrel_rate, CAST(ev95percent AS DOUBLE) AS p_hard_hit_rate, CAST(avg_hit_angle AS DOUBLE) AS p_avg_hit_angle, CAST(anglesweetspotpercent AS DOUBLE) AS p_angle_sweet_spot, CAST(avg_distance AS DOUBLE) AS p_avg_distance FROM read_csv('tmp/pitch_ev.csv', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True) WHERE player_id IS NOT NULL AND CAST(player_id AS VARCHAR) != '';

CREATE TABLE savant_keys AS
SELECT DISTINCT mlb_id FROM (
  SELECT mlb_id FROM savant_bat_pct UNION
  SELECT mlb_id FROM savant_bat_xstats UNION
  SELECT mlb_id FROM savant_bat_ev UNION
  SELECT mlb_id FROM savant_bat_custom UNION
  SELECT mlb_id FROM savant_bat_rv UNION
  SELECT mlb_id FROM savant_pitch_rv UNION
  SELECT mlb_id FROM savant_field_rv UNION
  SELECT mlb_id FROM savant_arm_str UNION
  SELECT mlb_id FROM savant_base_rv UNION
  SELECT mlb_id FROM savant_pitch_pct UNION
  SELECT mlb_id FROM savant_pitch_xstats UNION
  SELECT mlb_id FROM savant_pitch_ev
);

CREATE TABLE savant_${YEAR} AS
SELECT
  ${YEAR} AS year_ID,
  k.mlb_id,
  bp.pct_exit_velocity, bp.pct_hard_hit, bp.pct_barrel, bp.pct_xwoba, bp.pct_xba, bp.pct_xslg, bp.pct_whiff, bp.pct_k_rate, bp.pct_bb_rate, bp.pct_chase, bp.pct_sprint_speed,
  bx.xba, bx.xslg, bx.woba, bx.xwoba,
  bev.avg_exit_velocity, bev.max_exit_velocity, bev.ev50, bev.barrel_rate, bev.hard_hit_rate,
  bc.whiff_rate, bc.chase_rate, bc.swing_rate, bc.sweet_spot_rate,
  sb.savant_bat_run_val, sb.pct_bat_run_val,
  sp.savant_pitch_run_val, sp.pct_pitch_run_val,
  sf.savant_field_run_val, sf.f_total_runs, sf.f_inf_of_runs, sf.f_range_runs, sf.f_arm_runs, sf.f_dp_runs, sf.f_catching_runs, sf.f_framing_runs, sf.f_throwing_runs, sf.f_blocking_runs,
  sf.pct_f_total_runs, sf.pct_f_inf_of_runs, sf.pct_f_range_runs, sf.pct_f_arm_runs, sf.pct_f_dp_runs, sf.pct_f_catching_runs, sf.pct_f_framing_runs, sf.pct_f_throwing_runs, sf.pct_f_blocking_runs,
  as_.f_arm_overall, as_.f_max_arm_strength,
  sr.savant_base_run_val, sr.pct_base_run_val,
  pp.p_pct_xwoba, pp.p_pct_xba, pp.p_pct_xslg, pp.p_pct_brl_percent, pp.p_pct_exit_velocity, pp.p_pct_hard_hit, pp.p_pct_k_rate, pp.p_pct_bb_rate, pp.p_pct_whiff, pp.p_pct_chase, pp.p_pct_arm_strength, pp.p_pct_xera, pp.p_pct_fb_velocity, pp.p_pct_fb_spin, pp.p_pct_curve_spin,
  px.p_est_ba, px.p_est_slg, px.p_est_woba, px.p_woba, px.p_xera,
  pe.p_avg_exit_velocity, pe.p_max_exit_velocity, pe.p_ev50, pe.p_barrel_rate, pe.p_hard_hit_rate, pe.p_avg_hit_angle, pe.p_angle_sweet_spot, pe.p_avg_distance
FROM savant_keys k
LEFT JOIN savant_bat_pct bp USING (mlb_id)
LEFT JOIN savant_bat_xstats bx USING (mlb_id)
LEFT JOIN savant_bat_ev bev USING (mlb_id)
LEFT JOIN savant_bat_custom bc USING (mlb_id)
LEFT JOIN savant_bat_rv sb USING (mlb_id)
LEFT JOIN savant_pitch_rv sp USING (mlb_id)
LEFT JOIN savant_field_rv sf USING (mlb_id)
LEFT JOIN savant_arm_str as_ USING (mlb_id)
LEFT JOIN savant_base_rv sr USING (mlb_id)
LEFT JOIN savant_pitch_pct pp USING (mlb_id)
LEFT JOIN savant_pitch_xstats px USING (mlb_id)
LEFT JOIN savant_pitch_ev pe USING (mlb_id);

COPY (SELECT * FROM savant_${YEAR}) TO 'static/data/savant_${YEAR}.json' (FORMAT JSON, ARRAY true);
"

python3 - <<EOF
import json, sys

with open('static/data/savant_${YEAR}.json') as f:
    rows = json.load(f)
if len(rows) < 100:
    print("ERROR: savant_${YEAR}.json has too few rows:", len(rows))
    sys.exit(1)
print(f"savant_${YEAR}.json rows: {len(rows)}")
EOF
