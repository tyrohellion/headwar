#!/usr/bin/env bash
# Computes season-progress-scaled qualification thresholds. Used both for
# statcast run value percentiles (build_savant_json.sh) and for the B-Ref
# OPS+/ERA+ MLB rankings (build_bref_index.sh).
# Source this file, then call: compute_thresholds YEAR
# Sets BAT_THRESHOLD, PITCH_THRESHOLD, ERA_IP_THRESHOLD, FIELD_THRESHOLD env vars.
#
# Thresholds are based on Baseball Savant's methodology but adjusted:
#   - Batting:     2.0 PA per team game  (Savant uses 2.1)
#   - Pitching:   ~200 batters_faced over a 162-game season (Savant uses ~1.25 BF/game)
#   - ERA+/OPS+ (bref_index): the same batting (PA) and pitching qualifiers,
#                 but pitching is expressed in innings because
#                 war_daily_pitch.txt has no batters-faced column
#                 (~200 BF / ~3.3 BF per inning ≈ 60 IP over a full season)
#   - Fielding:   2.4 outs per team game, so ~390 outs (~130 IP) over a
#                 162-game season, up from Savant's ~100 IP (300 outs).
#                 NOTE: this barely moves the percentiles (measured 2025:
#                 530 -> 507 qualified, every percentile shifts <= 2 points).
#                 A percentile is an order statistic, so trimming players from
#                 the middle of the pool cannot change anyone's rank much, and
#                 the best/worst players stay pinned at 100/0. Do not expect
#                 this threshold to reconcile our percentiles with Savant's.
#   - Baserunning: NO client-side threshold. Savant's endpoint already refuses to
#                 publish players below its own floor (30 extra bases moved, so
#                 ~1,200 players a season are absent from the CSV entirely), and
#                 adding our own qualifier on top only removed real baserunners:
#                 batting PA correlates just 0.51 with bases moved and excluded
#                 low-PA specialists such as Esteury Ruiz (255 PA). We rank
#                 everyone Savant gives us with a non-null run value.
#
# For current season: uses season progress to estimate games played.
# For historical seasons: uses 162 (60 for 2020).
# If thresholds are not provided to build_savant_json.sh, percentiles are
# computed over all players (no qualification).

compute_thresholds() {
  local YEAR="${1:-}"
  local CURRENT_YEAR=$(date +%Y)

  # Default: no qualification (empty — caller should handle this)
  BAT_THRESHOLD=""
  PITCH_THRESHOLD=""
  ERA_IP_THRESHOLD=""
  FIELD_THRESHOLD=""

  if [ -z "$YEAR" ] || [ "$YEAR" -gt "$CURRENT_YEAR" ]; then
    echo "No qualification thresholds (year not provided or future year)"
    return
  fi

  # Statcast run values did not exist before 2015, so no qualification applies.
  if [ "$YEAR" -lt 2015 ]; then
    echo "No qualification thresholds (statcast run values unavailable before 2015)"
    return
  fi

  local GAMES=162

  if [ "$YEAR" -eq 2020 ]; then
    GAMES=60
  elif [ "$YEAR" -eq "$CURRENT_YEAR" ]; then
    # Opening Day: last Thursday on/before March 31
    local opening_day
    opening_day=$(date -d "${YEAR}-03-31" +%s)
    local dow
    dow=$(date -d "@${opening_day}" +%u)
    if [ "$dow" -ge 4 ]; then
      opening_day=$((opening_day - (dow - 4) * 86400))
    else
      opening_day=$((opening_day - (dow + 3) * 86400))
    fi

    # End of Season: last Sunday on/before September 30
    local end_of_season
    end_of_season=$(date -d "${YEAR}-09-30" +%s)
    dow=$(date -d "@${end_of_season}" +%u)
    end_of_season=$((end_of_season - (7 - dow) * 86400))

    local now
    now=$(date +%s)

    if [ "$now" -le "$opening_day" ]; then
      GAMES=0
    elif [ "$now" -ge "$end_of_season" ]; then
      GAMES=162
    else
      local total=$((end_of_season - opening_day))
      local elapsed=$((now - opening_day))
      GAMES=$((elapsed * 162 / total))
    fi
  fi

  # Batting: 2.0 PA per team game
  BAT_THRESHOLD=$((GAMES * 2))
  # Pitching: ~200 batters faced over a full season (200/162 ≈ 1.234 per game)
  PITCH_THRESHOLD=$((GAMES * 100 / 81))
  # ERA+ (bref_index): same ~200-BF pitching qualifier in innings
  # (~60 IP over a full season; 60/162 ≈ 0.370 per game)
  ERA_IP_THRESHOLD=$((GAMES * 10 / 27))
  # Fielding: 2.4 outs per game (~390 outs / ~130 IP over a full season,
  # up from Savant's ~100 IP) — trims part-time players from the percentiles
  FIELD_THRESHOLD=$((GAMES * 12 / 5))


  export BAT_THRESHOLD PITCH_THRESHOLD ERA_IP_THRESHOLD FIELD_THRESHOLD
  echo "Year: $YEAR, Est Games: $GAMES, BAT: $BAT_THRESHOLD, PITCH: $PITCH_THRESHOLD, ERA_IP: $ERA_IP_THRESHOLD, FIELD: $FIELD_THRESHOLD"
}
