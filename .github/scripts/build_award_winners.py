#!/usr/bin/env python3
"""Build src/lib/data/awardWinners.json for the home hero buttons.

The hero used to fetch four MVP/Cy Young recipient endpoints on every page
load. This script runs in the daily data workflow instead, so the browser only
imports a tiny static array.

It keeps the two most recent complete AL/NL MVP seasons and the most recent
complete AL/NL Cy Young season. A season is only accepted when all of its
awards have published recipients; otherwise it falls back to older seasons.
"""

import json
import os
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

OUT_PATH = "src/lib/data/awardWinners.json"
AWARDS_URL = "https://statsapi.mlb.com/api/v1/awards"

MVP_AWARDS = ("ALMVP", "NLMVP")
CY_AWARDS = ("ALCY", "NLCY")
AWARD_LABELS = {
    "ALMVP": "AL MVP",
    "NLMVP": "NL MVP",
    "ALCY": "AL Cy Young",
    "NLCY": "NL Cy Young",
}

RETRIES = 3
TIMEOUT = 30


def fetch_json(url):
    for attempt in range(RETRIES):
        try:
            with urllib.request.urlopen(url, timeout=TIMEOUT) as response:
                return json.load(response)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
            if attempt == RETRIES - 1:
                raise
            print(f"::warning::Award request failed ({exc}); retrying {attempt + 1}/{RETRIES}")
            time.sleep(0.5 * (attempt + 1))


def fetch_winner(award_id, season):
    url = f"{AWARDS_URL}/{award_id}/recipients?season={season}"
    try:
        data = fetch_json(url)
    except Exception as exc:
        print(f"::warning::Skipping {award_id} {season}: {exc}")
        return None

    for award in data.get("awards", []):
        player = award.get("player") or {}
        if award.get("id") == award_id and player.get("id") and player.get("nameFirstLast"):
            player_id = player["id"]
            return {
                "id": player_id,
                "name": player["nameFirstLast"],
                "href": f"/players/{player_id}",
                "awardId": award_id,
                "awardLabel": AWARD_LABELS[award_id],
                "season": int(award.get("season") or season),
            }

    return None


def collect_season_winners(award_ids, seasons):
    by_season = {}
    for season in seasons:
        winners = [fetch_winner(award_id, season) for award_id in award_ids]
        if all(winners):
            by_season[season] = winners
    return by_season


def main():
    year = datetime.now(timezone.utc).year
    seasons = [year, year - 1, year - 2]

    mvp_by_season = collect_season_winners(MVP_AWARDS, seasons)
    cy_by_season = collect_season_winners(CY_AWARDS, seasons)

    mvp_seasons = sorted(mvp_by_season, reverse=True)[:2]
    cy_season = next(iter(sorted(cy_by_season, reverse=True)), None)

    winners = [
        winner
        for season in mvp_seasons
        for winner in mvp_by_season[season]
    ]
    if cy_season is not None:
        winners.extend(cy_by_season[cy_season])

    seen = set()
    winners = [winner for winner in winners if not (winner["id"] in seen or seen.add(winner["id"]))]

    if not winners and not os.path.exists(OUT_PATH):
        raise SystemExit("No award recipients were available and no existing award file was found")
    if not winners:
        print("::warning::No award recipients were available; keeping the existing award file")
        return

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as output:
        json.dump(winners, output, indent=2)
        output.write("\n")

    print(f"Wrote {len(winners)} award winners to {OUT_PATH}")


if __name__ == "__main__":
    main()
