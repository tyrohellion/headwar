#!/usr/bin/env python3
"""Build static/data/savant_careers.json: career Statcast averages for modern players.

Every player who debuted in the Statcast era (2015 or newer) gets one row that
summarises their whole career instead of a single season, so career mode has
something to show.

Aggregation is games-weighted, which is the whole point: the 60-game 2020 season
must not count as much as a 150-game season. Each metric carries its own
denominator, and a season is only counted once that metric actually qualified
there, so a metric missing in 2019 never drags on 2020's game total.

Three aggregation classes:

  count      season totals, projected to a 162-game season
             sum(value) / sum(games) * 162
  rate       per-game rates, averaged by games
             sum(value * games) / sum(games)
  percentile mean of the seasons where the percentile exists
             sum(value) / count(value)

Rates are games-weighted but NOT scaled to 162 games, because a rate does not
grow with playing time: projecting exit velocity to a full season would report
a healthy 88.7 mph batter as a 95 mph one.

Usage: build_savant_careers.py [OUTS_PER_SEASON]
  OUTS_PER_SEASON - games the projection normalises to (default 162)

Requires static/data/savant_<year>.json for every year present, plus
tmp/war_daily_bat.txt and tmp/war_daily_pitch.txt for authoritative games
played (baseball-reference G, not the MLB API's gamesPlayed, which undercounts
the split 2020 season and games without a plate appearance).
"""

import json
import os
import re
import subprocess
import sys
from collections import defaultdict

OUT_PATH = "static/data/savant_careers.json"
STATCAST_ERA_START = 2015
MIN_PLAYERS = 500

# Only the per-season files. A bare savant_*.json glob would also match this
# script's own output, which has no year in its name.
SEASON_FILE = re.compile(r"^savant_(\d{4})\.json$")

# Games basis per metric group: a position player's season length, or a
# pitcher's. Stated explicitly so an unexpected column fails loudly instead of
# being silently mis-weighted. savant_pitch_run_val lacks the p_ prefix but is a
# pitching total, so it must be listed rather than inferred.
PITCH_METRICS = {"savant_pitch_run_val"}
PITCH_PREFIXES = ("p_",)

# Pitching counts project to a full rotation season rather than 162 games:
# B-Ref's pitching G is games pitched, roughly 21 per season for a starter, so
# scaling to 162 inflates pitching run value about 8x while deflating batting.
PITCH_GAMES_PER_SEASON = 30

# Per-season totals -> projected to a full season.
COUNT_METRICS = {
    "savant_bat_run_val": 2,
    "savant_pitch_run_val": 2,
    "savant_base_run_val": 2,
    "f_total_runs": 2,
    "f_arm_runs": 2,
    "f_catching_runs": 2,
    "f_framing_runs": 2,
    "f_throwing_runs": 2,
    "f_blocking_runs": 2,
    "f_five_star_catches": 1,
}

# Per-game rates -> games-weighted average, never scaled to 162 games.
RATE_METRICS = {
    "xba": 3,
    "xslg": 3,
    "xwoba": 3,
    "avg_exit_velocity": 1,
    "ev50": 1,
    "barrel_rate": 1,
    "hard_hit_rate": 1,
    "whiff_rate": 1,
    "chase_rate": 1,
    "sweet_spot_rate": 1,
    "p_est_ba": 3,
    "p_est_slg": 3,
    "p_est_woba": 3,
    "p_xera": 2,
    "p_avg_exit_velocity": 1,
    "p_ev50": 1,
    "p_barrel_rate": 1,
    "p_hard_hit_rate": 1,
    "p_avg_hit_angle": 1,
    "p_angle_sweet_spot": 1,
    "p_avg_distance": 1,
}

# Deliberately not carried into career averages. Arm strength is a percentile-only
# stat on the site (fieldingStatcastConfig reads percentiles.arm_strength), so these
# raw mph figures are never displayed, and a games-weighted average of them would be
# a meaningless number rather than a career rate.
EXCLUDED_METRICS = {"f_arm_overall", "f_max_arm_strength"}


def fail(message):
    print(f"ERROR: {message}")
    sys.exit(1)


def run_duckdb(sql):
    result = subprocess.run(
        ["duckdb", "-csv", "-c", sql],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        fail(f"duckdb failed:\n{result.stderr.strip()}")
    return result.stdout


def is_pitch_metric(metric):
    return metric in PITCH_METRICS or metric.startswith(PITCH_PREFIXES)


def classify(metric):
    """Return (kind, decimals) for a savant column, or None if not a metric."""
    if metric in EXCLUDED_METRICS:
        return "skip", 0
    if metric in COUNT_METRICS:
        return "count", COUNT_METRICS[metric]
    if metric in RATE_METRICS:
        return "rate", RATE_METRICS[metric]
    if metric.startswith(("pct_", "p_pct_", "b_pct_")):
        return "percentile", 0
    return None


def load_metric_columns():
    """Metric column names come from the generated savant files themselves, so a
    new metric added upstream cannot be silently dropped from career averages.
    Keyed across every year, because an older file may predate a metric."""
    metrics = set()
    for name in os.listdir("static/data"):
        if not SEASON_FILE.match(name):
            continue
        with open(os.path.join("static/data", name)) as handle:
            rows = json.load(handle)
        if rows:
            metrics.update(k for k in rows[0] if k != "mlb_id")
    return sorted(metrics)


def main():
    games_per_season = int(sys.argv[1]) if len(sys.argv) > 1 else 162

    for required in ("tmp/war_daily_bat.txt", "tmp/war_daily_pitch.txt"):
        if not os.path.exists(required):
            fail(f"{required} is missing; run the fetch step first")

    savant_files = sorted(
        name for name in os.listdir("static/data") if SEASON_FILE.match(name)
    )
    if not savant_files:
        fail("no static/data/savant_<year>.json files found")

    metrics = load_metric_columns()
    unknown = [m for m in metrics if classify(m) is None]
    if unknown:
        fail(f"unclassified savant metrics (add them to the script): {unknown}")

    metric_cols = ", ".join(f'"{m}"' for m in metrics)
    file_list = ", ".join(f"'static/data/{name}'" for name in savant_files)

    # One wide CSV: every player-season of Statcast joined to that season's games.
    sql = f"""
CREATE TABLE bref_games AS
SELECT mlb_id, year, SUM(g_bat) AS g_bat, SUM(g_pitch) AS g_pitch
FROM (
  SELECT CAST(mlb_ID AS VARCHAR) AS mlb_id, CAST(year_ID AS INTEGER) AS year,
         CAST(G AS INTEGER) AS g_bat, CAST(NULL AS INTEGER) AS g_pitch
  FROM read_csv('tmp/war_daily_bat.txt', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True)
  UNION ALL
  SELECT CAST(mlb_ID AS VARCHAR) AS mlb_id, CAST(year_ID AS INTEGER) AS year,
         CAST(NULL AS INTEGER) AS g_bat, CAST(G AS INTEGER) AS g_pitch
  FROM read_csv('tmp/war_daily_pitch.txt', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True)
) WHERE mlb_id IS NOT NULL
GROUP BY mlb_id, year;

CREATE TABLE savant_wide AS
SELECT
  CAST(regexp_extract(filename, 'savant_([0-9]{{4}})\\.json', 1) AS INTEGER) AS year,
  *
FROM read_json_auto([{file_list}], filename=true);

COPY (
  SELECT s.mlb_id, s.year, g.g_bat, g.g_pitch, {metric_cols}
  FROM savant_wide s
  JOIN bref_games g
    ON g.mlb_id = CAST(s.mlb_id AS VARCHAR) AND g.year = s.year
  WHERE s.year >= {STATCAST_ERA_START}
) TO STDOUT (FORMAT CSV, HEADER true);
"""

    raw = run_duckdb(sql).splitlines()
    if len(raw) < 2:
        fail("joined savant + games query returned no rows")

    # True debut, from B-Ref's full history rather than the savant years: a
    # 2012 debutee also has savant rows from 2015, and would otherwise look like
    # a Statcast-era rookie.
    debut_raw = run_duckdb(
        f"""
CREATE TABLE bref_games AS
SELECT mlb_id, year FROM (
  SELECT CAST(mlb_ID AS VARCHAR) AS mlb_id, CAST(year_ID AS INTEGER) AS year
  FROM read_csv('tmp/war_daily_bat.txt', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True)
  UNION
  SELECT CAST(mlb_ID AS VARCHAR), CAST(year_ID AS INTEGER)
  FROM read_csv('tmp/war_daily_pitch.txt', header=True, ignore_errors=True, nullstr=['NULL', ''], union_by_name=True)
) WHERE mlb_id IS NOT NULL;
COPY (SELECT mlb_id, MIN(year) AS debut FROM bref_games GROUP BY mlb_id)
TO STDOUT (FORMAT CSV, HEADER true);
"""
    ).splitlines()

    debut = {}
    for line in debut_raw[1:]:
        player, year = line.split(",")
        debut[player] = int(year)

    header = raw[0].split(",")
    idx = {name: i for i, name in enumerate(header)}

    # player -> metric -> [weighted sum, games, plain sum, count]
    acc = defaultdict(lambda: defaultdict(lambda: [0.0, 0.0, 0.0, 0]))
    seasons = defaultdict(set)
    total_games = defaultdict(float)

    for line in raw[1:]:
        parts = line.split(",")
        if len(parts) != len(header):
            continue
        player = parts[idx["mlb_id"]]
        year = int(parts[idx["year"]])
        g_bat = float(parts[idx["g_bat"]] or 0)
        g_pitch = float(parts[idx["g_pitch"]] or 0)
        # A pitcher with no batting row still needs a games denominator for
        # fielding and baserunning metrics.
        position_games = g_bat or g_pitch

        seasons[player].add(year)
        total_games[player] += max(g_bat, g_pitch)

        for metric in metrics:
            cell = parts[idx[metric]]
            if not cell:
                continue
            try:
                value = float(cell)
            except ValueError:
                continue
            games = g_pitch if is_pitch_metric(metric) else position_games
            slot = acc[player][metric]
            slot[0] += value * games
            slot[1] += games
            slot[2] += value
            slot[3] += 1

    out = []
    for player, metric_map in acc.items():
        first_year = debut.get(player)
        if first_year is None or first_year < STATCAST_ERA_START:
            continue
        row = {
            "mlb_id": player,
            "seasons": len(seasons[player]),
            "games": int(total_games[player]),
        }
        for metric, (weighted, games, plain, count) in metric_map.items():
            kind, decimals = classify(metric)
            if kind == "skip":
                continue
            if kind == "count":
                if games <= 0:
                    continue
                basis = PITCH_GAMES_PER_SEASON if is_pitch_metric(metric) else games_per_season
                value = plain / games * basis
            elif kind == "rate":
                if games <= 0:
                    continue
                value = weighted / games
            else:
                if count == 0:
                    continue
                value = plain / count
            row[metric] = round(value, decimals)
        if len(row) > 3:
            out.append(row)

    out.sort(key=lambda r: r["mlb_id"])

    if len(out) < MIN_PLAYERS:
        fail(f"only {len(out)} modern players produced career averages")

    with open(OUT_PATH + ".tmp", "w") as handle:
        json.dump(out, handle, separators=(",", ":"))
    os.replace(OUT_PATH + ".tmp", OUT_PATH)
    size_mb = os.path.getsize(OUT_PATH) / 1e6
    print(
        f"savant_careers.json players: {len(out)} "
        f"(debut >= {STATCAST_ERA_START}), {size_mb:.1f} MB"
    )


if __name__ == "__main__":
    main()