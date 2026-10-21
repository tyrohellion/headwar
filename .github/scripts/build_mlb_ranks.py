#!/usr/bin/env python3
"""Build static/data/mlb_ranks.json: league ranks for the standard stats.

The MLB stats API exposes a leaderboard per stat group: for a season, every
player who qualified for that board, with their full stat line and the rank
for whichever stat the board happens to be sorted by.

That rank is the only one the API hands back. Asking it for a rank per stat
would mean one request per stat, so instead each board is pulled once and
every stat is ranked locally from the same numbers - which is what the API
would have returned anyway.

Only qualified players appear on a board, so the output only holds players
who qualified. Everyone else has no league position to show.

Usage: build_mlb_ranks.py [FIRST_SEASON] [SPLIT_SEASON] [LAST_SEASON]
  FIRST_SEASON - oldest season to cover (default 1900)
  SPLIT_SEASON  - seasons from here up go in the main file, older ones in the
                  archive (default 2000)
  LAST_SEASON   - last season to cover (default the current year)

Two files are written:

  static/data/mlb_ranks.json         recent seasons, loaded with the page
  static/data/mlb_ranks_archive.json older seasons, loaded on demand

The split keeps the file a player page pulls in small: the archive only
downloads when someone picks a season older than the split.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

OUT_PATH = "static/data/mlb_ranks.json"
ARCHIVE_PATH = "static/data/mlb_ranks_archive.json"
CAREER_PATH = "static/data/mlb_ranks_career.json"
API = "https://statsapi.mlb.com/api/v1/stats"
FIRST_SEASON = 1900
SPLIT_SEASON = 2000
REQUEST_DELAY = 0.2
RETRIES = 3
TIMEOUT = 45

# board -> (namespace it feeds, [(site stat key, API stat key), ...])
#
# Fielding is deliberately left out: the defensive boards rank every player who
# qualified, which says very little about any one of them.

BOARDS = {
    "hitting": (
        "hitting",
        [
            ("avg", "avg"),
            ("obp", "obp"),
            ("slg", "slg"),
            ("ops", "ops"),
            ("homeRuns", "homeRuns"),
            ("rbi", "rbi"),
            ("gamesPlayed", "gamesPlayed"),
            ("plateAppearances", "plateAppearances"),
            ("atBats", "atBats"),
            ("runs", "runs"),
            ("hits", "hits"),
            ("doubles", "doubles"),
            ("triples", "triples"),
            ("baseOnBalls", "baseOnBalls"),
            ("strikeOuts", "strikeOuts"),
            ("stolenBases", "stolenBases"),
            ("caughtStealing", "caughtStealing"),
            ("intentionalWalks", "intentionalWalks"),
            ("hitByPitch", "hitByPitch"),
            ("sacFlies", "sacFlies"),
            ("sacBunts", "sacBunts"),
        ],
    ),
    "pitching": (
        "pitching",
        [
            ("era", "era"),
            ("whip", "whip"),
            ("ops", "ops"),
            ("obp", "obp"),
            ("strikeoutsPer9Inn", "strikeoutsPer9Inn"),
            ("walksPer9Inn", "walksPer9Inn"),
            ("inningsPitched", "inningsPitched"),
            ("gamesStarted", "gamesStarted"),
            ("gamesPlayed", "gamesPlayed"),
            ("saves", "saves"),
            ("strikeOuts", "strikeOuts"),
            ("battersFaced", "battersFaced"),
            ("hits", "hits"),
            ("earnedRuns", "earnedRuns"),
            ("baseOnBalls", "baseOnBalls"),
            ("wins", "wins"),
            ("losses", "losses"),
        ],
    ),
}

# Stats where a lower number is the better one. Everything else ranks high to
# low. These are per namespace: strikeouts are a good thing for a pitcher and
# a bad one for a batter, and a catcher's stolen bases allowed are a negative.
LOWER_IS_BETTER = {
    "hitting": {"strikeOuts"},
    "pitching": {
        "era",
        "whip",
        "ops",
        "obp",
        "hits",
        "earnedRuns",
        "baseOnBalls",
        "losses",
        "walksPer9Inn",
    },
}


def fail(message):
    print(f"ERROR: {message}")
    sys.exit(1)


def fetch_json(url):
    last = None
    for attempt in range(RETRIES):
        try:
            request = urllib.request.Request(
                url, headers={"User-Agent": "headwar-data-pipeline/1.0"}
            )
            with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
                return json.load(response)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as err:
            last = err
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed to fetch {url}: {last}")


def to_number(value):
    """The API returns rates as strings like '.316' and counts as numbers."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if text.startswith("."):
        text = "0" + text
    try:
        return float(text)
    except ValueError:
        return None


def board_url(board, season):
    if season == "career":
        return f"{API}?stats=career&group={board}&limit=1000"
    return (
        f"{API}?stats=season&group={board}&season={season}"
        f"&gameType=R&limit=1000"
    )


def rank_board(splits, stat_pairs, lower_is_better):
    """Return {playerId: {site key: rank}} for one board.

    Ties share a rank the way MLB's own leaderboards do: 1, 2, 2, 4.
    """
    if not splits:
        return {}

    available = splits[0].get("stat", {})
    pairs = [(site, api) for site, api in stat_pairs if api in available]
    if not pairs:
        return {}

    # Collect the values for each stat once.
    columns = {site: [] for site, _ in pairs}
    for split in splits:
        player_id = (split.get("player") or {}).get("id")
        if player_id is None:
            continue
        for site, api in pairs:
            value = to_number(split["stat"].get(api))
            if value is not None:
                columns[site].append((value, player_id))

    ranks = {}
    for site, rows in columns.items():
        if not rows:
            continue
        ascending = site in lower_is_better
        rows.sort(key=lambda row: (row[0], row[1]), reverse=not ascending)

        previous_value = None
        previous_rank = 0
        for position, (value, player_id) in enumerate(rows, start=1):
            if previous_value is not None and value == previous_value:
                rank = previous_rank
            else:
                rank = position
                previous_rank = rank
                previous_value = value
            ranks.setdefault(player_id, {})[site] = rank

    return ranks


def main():
    first_season = int(sys.argv[1]) if len(sys.argv) > 1 else FIRST_SEASON
    split_season = int(sys.argv[2]) if len(sys.argv) > 2 else SPLIT_SEASON
    last_season = int(sys.argv[3]) if len(sys.argv) > 3 else int(
        time.localtime().tm_year
    )

    # player id -> namespace -> season -> {stat key: rank}
    players = {}
    career_players = {}
    failures = 0
    requests = 0

    # The stat order each namespace is written in. The browser reads this list
    # out of the file, so the ranks can be stored positionally: repeating the
    # stat names in every row is what makes a JSON file this size.
    keys = {}
    career_keys = {}

    seasons = [str(year) for year in range(first_season, last_season + 1)]

    def collect(target, target_keys, season):
        """Fetch every board for one season and merge the ranks in."""
        nonlocal failures, requests

        for board, (namespace, stat_pairs) in BOARDS.items():
            try:
                data = fetch_json(board_url(board, season))
            except RuntimeError as err:
                print(f"  WARNING: {err}")
                failures += 1
                continue

            requests += 1
            time.sleep(REQUEST_DELAY)

            splits = (data.get("stats") or [{}])[0].get("splits") or []
            if not splits:
                continue

            available = splits[0].get("stat", {})
            pairs = [(site, api) for site, api in stat_pairs if api in available]
            if not pairs:
                continue

            namespace_keys = target_keys.setdefault(namespace, [])
            for site, _ in pairs:
                if site not in namespace_keys:
                    namespace_keys.append(site)

            ranks = rank_board(splits, pairs, LOWER_IS_BETTER[namespace])
            for player_id, stat_ranks in ranks.items():
                entry = (
                    target.setdefault(str(player_id), {})
                    .setdefault(namespace, {})
                    .setdefault(season, {})
                )
                entry.update(stat_ranks)

    for season in seasons:
        collect(players, keys, season)
        print(f"  {season}: {len(players)} players so far")

    # The all-time board, for career mode. The API only carries a subset of the
    # stats on the career board, so a stat it does not track has no rank.
    collect(career_players, career_keys, "career")
    print(f"  career: {len(career_players)} players")

    if not players:
        fail("no leaderboard data was retrieved")

    # A single hiccup should not stop the build, but a rate limit or an outage
    # would leave the file quietly half empty, so that does fail the job.
    if failures > max(4, requests * 0.2):
        fail(f"{failures} of {requests} leaderboard requests failed")

    def write(path, source, source_keys, wanted):
        """Write the ranks for the given seasons to a file."""
        if not wanted:
            return 0
        out = {"keys": source_keys, "players": {}}
        for player_id, namespaces in source.items():
            row = {}
            for namespace, season_map in namespaces.items():
                packed = {}
                for season, stat_ranks in season_map.items():
                    if season not in wanted:
                        continue
                    order = source_keys[namespace]
                    packed[season] = [stat_ranks.get(key, 0) for key in order]
                if packed:
                    row[namespace] = packed
            if row:
                out["players"][player_id] = row

        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path + ".tmp", "w") as handle:
            json.dump(out, handle, separators=(",", ":"))
        os.replace(path + ".tmp", path)
        return len(out["players"])

    recent = {s for s in seasons if int(s) >= split_season}
    archive = {s for s in seasons if int(s) < split_season}

    recent_players = write(OUT_PATH, players, keys, recent)
    archive_players = write(ARCHIVE_PATH, players, keys, archive)
    career_players_written = write(CAREER_PATH, career_players, career_keys, {"career"})

    recent_mb = os.path.getsize(OUT_PATH) / 1e6
    archive_mb = os.path.getsize(ARCHIVE_PATH) / 1e6 if archive_players else 0
    career_mb = os.path.getsize(CAREER_PATH) / 1e6 if career_players_written else 0
    print(
        f"mlb_ranks.json: {recent_players} players, {len(recent)} seasons "
        f"({split_season}+), {recent_mb:.2f} MB"
    )
    if archive_players:
        print(
            f"mlb_ranks_archive.json: {archive_players} players, "
            f"{len(archive)} seasons (before {split_season}), {archive_mb:.2f} MB"
        )
    if career_players_written:
        print(
            f"mlb_ranks_career.json: {career_players_written} players, "
            f"all time, {career_mb:.2f} MB"
        )
    print(
        f"{requests} requests, {failures} failures, "
        f"{len(players)} players total"
    )


if __name__ == "__main__":
    main()
