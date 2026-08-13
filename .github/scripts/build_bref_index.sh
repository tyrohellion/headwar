#!/usr/bin/env bash
set -euo pipefail

# Builds static/data/bref_index.json from tmp/war_daily_bat.txt and
# tmp/war_daily_pitch.txt (both must be present). Those two files contain every
# season (1871-present), so the full browser-facing index is rebuilt from
# scratch on every run. Exits non-zero if the result is invalid.

duckdb -c "
CREATE TABLE raw_bat AS
SELECT
  CAST(mlb_ID AS VARCHAR) AS mlb_id,
  CAST(player_ID AS VARCHAR) AS player_ID,
  CAST(name_common AS VARCHAR) AS name_common,
  CAST(year_ID AS INTEGER) AS year_ID,
  CAST(team_ID AS VARCHAR) AS team_ID,
  CAST(stint_ID AS INTEGER) AS stint_ID,
  CAST(lg_ID AS VARCHAR) AS lg_ID,
  CAST(age AS INTEGER) AS age,
  CAST(PA AS INTEGER) AS PA,
  CAST(G AS INTEGER) AS G_bat,
  CAST(OPS_plus AS DOUBLE) AS ops_plus,
  CAST(WAR AS DOUBLE) AS WAR_bat,
  CAST(runs_bat AS DOUBLE) AS runs_bat,
  CAST(runs_br AS DOUBLE) AS runs_br,
  CAST(runs_defense AS DOUBLE) AS runs_defense
FROM read_csv('tmp/war_daily_bat.txt', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True);

CREATE TABLE raw_pitch AS
SELECT
  CAST(mlb_ID AS VARCHAR) AS mlb_id,
  CAST(player_ID AS VARCHAR) AS player_ID,
  CAST(name_common AS VARCHAR) AS name_common,
  CAST(year_ID AS INTEGER) AS year_ID,
  CAST(team_ID AS VARCHAR) AS team_ID,
  CAST(stint_ID AS INTEGER) AS stint_ID,
  CAST(lg_ID AS VARCHAR) AS lg_ID,
  CAST(age AS INTEGER) AS age,
  CAST(G AS INTEGER) AS G_pitch,
  CAST(GS AS INTEGER) AS GS,
  CAST(IPouts AS DOUBLE) AS IPouts,
  CAST(WAR AS DOUBLE) AS WAR_pitch,
  CAST(era_plus AS DOUBLE) AS era_plus
FROM read_csv('tmp/war_daily_pitch.txt', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True);

CREATE TABLE bref_combined AS
SELECT
  COALESCE(b.mlb_id, p.mlb_id) AS mlb_id,
  COALESCE(b.player_ID, p.player_ID) AS player_ID,
  COALESCE(b.name_common, p.name_common) AS name_common,
  COALESCE(b.year_ID, p.year_ID) AS year_ID,
  COALESCE(b.team_ID, p.team_ID) AS team_ID,
  COALESCE(b.stint_ID, p.stint_ID) AS stint_ID,
  COALESCE(b.lg_ID, p.lg_ID) AS lg_ID,
  COALESCE(b.age, p.age) AS age,
  ROUND(COALESCE(b.WAR_bat, 0) + COALESCE(p.WAR_pitch, 0), 2) AS WAR_total,
  COALESCE(b.WAR_bat, 0) AS WAR_bat,
  COALESCE(p.WAR_pitch, 0) AS WAR_pitch,
  b.PA,
  b.G_bat,
  b.ops_plus,
  b.runs_bat,
  b.runs_br,
  b.runs_defense,
  p.G_pitch,
  p.GS,
  ROUND(COALESCE(p.IPouts, 0) / 3.0, 1) AS IP,
  p.era_plus
FROM raw_bat b
FULL OUTER JOIN raw_pitch p
  ON b.player_ID = p.player_ID
 AND b.year_ID = p.year_ID
 AND b.stint_ID = p.stint_ID
 AND COALESCE(b.team_ID, '') = COALESCE(p.team_ID, '');

-- Career totals + ranks (all players)
CREATE TABLE bref_career AS
SELECT mlb_id, ROUND(SUM(WAR_total), 1) AS career_war
FROM bref_combined
WHERE mlb_id IS NOT NULL
GROUP BY mlb_id;

CREATE TABLE bref_career_ranked AS
SELECT mlb_id, career_war,
       ROW_NUMBER() OVER (ORDER BY career_war DESC) AS career_war_rank
FROM bref_career;

-- Per-season totals + ranks
CREATE TABLE bref_season_agg AS
SELECT year_ID, mlb_id,
       ROUND(SUM(WAR_total), 1) AS war,
       SUM(PA) AS pa,
       ROUND(SUM(IP), 1) AS ip,
       ROUND(arg_max(ops_plus, PA)) AS ops,
       ROUND(arg_max(era_plus, IP)) AS era
FROM bref_combined
WHERE mlb_id IS NOT NULL
GROUP BY year_ID, mlb_id;

CREATE TABLE bref_season AS
SELECT a.*,
       ROW_NUMBER() OVER (PARTITION BY year_ID ORDER BY war DESC) AS war_rank,
       o.ops_rank,
       e.era_rank
FROM bref_season_agg a
LEFT JOIN (
  SELECT year_ID, mlb_id,
         ROW_NUMBER() OVER (PARTITION BY year_ID ORDER BY ops DESC) AS ops_rank
  FROM bref_season_agg
  WHERE ops IS NOT NULL AND pa >= 200
) o USING (year_ID, mlb_id)
LEFT JOIN (
  SELECT year_ID, mlb_id,
         ROW_NUMBER() OVER (PARTITION BY year_ID ORDER BY era DESC) AS era_rank
  FROM bref_season_agg
  WHERE era IS NOT NULL AND ip >= 50
) e USING (year_ID, mlb_id);

-- Career OPS+/ERA+ (WAR-weighted averages over qualified seasons)
CREATE TABLE bref_career_plus AS
SELECT mlb_id,
  ROUND(SUM(CASE WHEN ops IS NOT NULL THEN ops * GREATEST(ABS(war), 0.1) END) /
        SUM(CASE WHEN ops IS NOT NULL THEN GREATEST(ABS(war), 0.1) END)) AS career_ops_plus,
  ROUND(SUM(CASE WHEN era IS NOT NULL THEN era * GREATEST(ABS(war), 0.1) END) /
        SUM(CASE WHEN era IS NOT NULL THEN GREATEST(ABS(war), 0.1) END)) AS career_era_plus
FROM bref_season_agg
GROUP BY mlb_id;

-- Nested per-player season arrays:
-- [year, war, war_rank, ops, ops_rank, era, era_rank]
CREATE TABLE bref_player_seasons AS
SELECT mlb_id,
  to_json(list(json_array(year_ID, war, war_rank, ops, ops_rank, era, era_rank) ORDER BY year_ID)) AS seasons
FROM bref_season
GROUP BY mlb_id;

-- Export the full browser-facing index (JSON array of player objects)
COPY (
  SELECT c.mlb_id AS id,
         c.career_war AS cw,
         c.career_war_rank AS cwr,
         p.career_ops_plus AS co,
         p.career_era_plus AS ce,
         s.seasons
  FROM bref_career_ranked c
  LEFT JOIN bref_career_plus p USING (mlb_id)
  LEFT JOIN bref_player_seasons s USING (mlb_id)
  ORDER BY c.career_war_rank
) TO 'static/data/bref_index.json' (FORMAT JSON, ARRAY true);
"

python3 - <<'EOF'
import json, sys

with open('static/data/bref_index.json') as f:
    players = json.load(f)
if len(players) < 10000:
    print("ERROR: bref_index.json has too few players:", len(players))
    sys.exit(1)
years = {s[0] for p in players for s in p['seasons']}
print(f"bref_index.json players: {len(players)}, seasons covering {min(years)}-{max(years)}")
EOF
