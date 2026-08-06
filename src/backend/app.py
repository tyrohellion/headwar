from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import lru_cache
import pybaseball
import pandas as pd
import numpy as np
import io
import requests
import time

pybaseball.cache.enable()

app = Flask(__name__)
CORS(app)

SCRAPING_FUNCTIONS = {
    'batting_stats_bref',
    'pitching_stats_bref',
}

LEAGUE_LEADERBOARD_FUNCTIONS = {
    'statcast_batter_percentile_ranks',
    'statcast_batter_run_value',
    'statcast_pitcher_run_value',
    'statcast_fielding_run_value',
    'statcast_baserunning_run_value',
    'statcast_batter_expected_stats',
    'statcast_batter_exitvelo_barrels',
    'statcast_batter_pitch_arsenal',
    'statcast_batter_custom',
}

def fetch_savant_csv(url: str, label: str) -> pd.DataFrame:
    """Helper to fetch and clean Baseball Savant CSV endpoints."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    response = requests.get(url, headers=headers, timeout=10)
    if response.status_code != 200:
        raise ConnectionError(f"Baseball Savant [{label}] returned status code {response.status_code}")
        
    df = pd.read_csv(io.StringIO(response.content.decode('utf-8')))
    df.columns = df.columns.str.strip()
    return df


def fetch_direct_batting_run_values(year: int) -> pd.DataFrame:
    """Swing-Take Batting Run Values (Total + Heart, Shadow, Chase, Waste)."""
    url = f"https://baseballsavant.mlb.com/leaderboard/swing-take?year={year}&team=&leverage=Neutral&group=Batter&type=All&sub_type=null&min=1&csv=True"
    return fetch_savant_csv(url, "Batting Run Value")


def fetch_direct_pitching_run_values(year: int) -> pd.DataFrame:
    """Swing-Take Pitching Run Values (Total + Heart, Shadow, Chase, Waste)."""
    url = f"https://baseballsavant.mlb.com/leaderboard/swing-take?year={year}&team=&leverage=Neutral&group=Pitcher&type=All&sub_type=null&min=1&csv=True"
    return fetch_savant_csv(url, "Pitching Run Value")


def fetch_direct_fielding_run_values(year: int) -> pd.DataFrame:
    """Statcast Fielding Run Values (Range/OAA, Arm, Catching, DP)."""
    url = f"https://baseballsavant.mlb.com/leaderboard/fielding-run-value?gameType=Regular&seasonStart={year}&seasonEnd={year}&type=fielder&position=&minInnings=1&csv=true"
    return fetch_savant_csv(url, "Fielding Run Value")


def fetch_direct_baserunning_run_values(year: int) -> pd.DataFrame:
    """Statcast Baserunning Run Values (Stolen Base Runs + Extra Bases Taken Runs)."""
    url = f"https://baseballsavant.mlb.com/leaderboard/baserunning-run-value?gameType=Regular&seasonStart={year}&seasonEnd={year}&type=Runners&minOpportunities=1&csv=true"
    return fetch_savant_csv(url, "Baserunning Run Value")


def fetch_direct_statcast_custom(year: int) -> pd.DataFrame:
    """Fetches raw Statcast metrics (Whiff%, Chase%, Swing%, EV, xStats) from Savant custom leaderboard CSV."""
    selections = "pa,k_percent,bb_percent,woba,xwoba,sweet_spot_percent,barrel_batted_rate,hard_hit_percent,ev50,whiff_percent,swing_percent,chase_percent,exit_velocity"
    url = f"https://baseballsavant.mlb.com/leaderboard/custom?year={year}&type=batter&filter=&min=1&selections={selections}&chart=false&csv=true"
    return fetch_savant_csv(url, "Statcast Custom Leaderboard")

@lru_cache(maxsize=32)
def get_cached_leaderboard(function_name: str, year: int):
    """
    In-memory cache for season-level Statcast leaderboards.
    Prevents re-parsing CSVs for every player lookup in the same season.
    """
    try:
        if function_name == 'statcast_batter_run_value':
            return fetch_direct_batting_run_values(year)
        elif function_name == 'statcast_pitcher_run_value':
            return fetch_direct_pitching_run_values(year)
        elif function_name == 'statcast_fielding_run_value':
            return fetch_direct_fielding_run_values(year)
        elif function_name == 'statcast_baserunning_run_value':
            return fetch_direct_baserunning_run_values(year)
        elif function_name == 'statcast_batter_custom':
            return fetch_direct_statcast_custom(year)
    except Exception as err:
        print(f"[Flask Error] Direct CSV fetch failed for {function_name} ({year}): {err}")
        return None

    func = getattr(pybaseball, function_name, None)
    if func and callable(func):
        return func(year)
    return None


def serialize_data(data):
    """Helper function to cleanly format Pandas DataFrames to dictionaries."""
    if isinstance(data, pd.DataFrame):
        cleaned_df = data.replace({np.nan: None, np.inf: None, -np.inf: None})
        return cleaned_df.to_dict(orient='records')
    return data

@app.route('/api/<function_name>', methods=['POST'])
def dynamic_api(function_name):
    CUSTOM_SAVANT_ROUTES = {
        'statcast_batter_run_value',
        'statcast_pitcher_run_value',
        'statcast_fielding_run_value',
        'statcast_baserunning_run_value',
        'statcast_batter_custom'
    }

    is_valid_pybaseball = hasattr(pybaseball, function_name) and callable(getattr(pybaseball, function_name))
    is_custom_route = function_name in CUSTOM_SAVANT_ROUTES

    if not (is_valid_pybaseball or is_custom_route):
        return jsonify({"error": f"Function '{function_name}' not found."}), 404

    try:
        kwargs = request.json or {}
        player_id = kwargs.pop('player_id', None)  # Intercept player_id if provided

        if function_name == 'playerid_reverse_lookup' and 'player_ids' in kwargs:
            raw_ids = kwargs['player_ids']
            if isinstance(raw_ids, list):
                kwargs['player_ids'] = [int(x) for x in raw_ids if str(x).isdigit()]

        if function_name in LEAGUE_LEADERBOARD_FUNCTIONS and 'year' in kwargs:
            year = int(kwargs['year'])
            data = get_cached_leaderboard(function_name, year)
        
        elif function_name in SCRAPING_FUNCTIONS:
            func = getattr(pybaseball, function_name)
            max_retries = 3
            backoff_delay = 1.5
            time.sleep(0.3)

            for attempt in range(max_retries):
                try:
                    data = func(**kwargs)
                    break
                except Exception as exc:
                    exc_str = str(exc).lower()
                    if "connection" in exc_str or "reset" in exc_str or attempt == max_retries - 1:
                        if attempt < max_retries - 1:
                            print(f"[Flask Proxy] Retrying {function_name}... ({attempt+1}/{max_retries})")
                            time.sleep(backoff_delay)
                            backoff_delay *= 2
                            continue
                    raise exc
        else:
            func = getattr(pybaseball, function_name)
            data = func(**kwargs)

        if player_id and isinstance(data, pd.DataFrame):
            id_col = None
            id_candidates = [
                'player_id', 'key_mlbam', 'mlbam_id', 
                'pos_player_id', 'id', 'fielding_id', 
                'fielder_id', 'runner_id'
            ]
            
            for candidate in id_candidates:
                if candidate in data.columns:
                    id_col = candidate
                    break

            if id_col:
                filtered_df = data[data[id_col].astype(str).str.strip() == str(player_id).strip()]
                
                if function_name == 'statcast_batter_pitch_arsenal':
                    return jsonify(serialize_data(filtered_df))
                
                if not filtered_df.empty:
                    return jsonify(serialize_data(filtered_df)[0])

                return jsonify(None)

        if isinstance(data, (tuple, list)):
            return jsonify([serialize_data(item) for item in data])
        elif isinstance(data, pd.DataFrame):
            return jsonify(serialize_data(data))
        elif data is None:
            return jsonify([])
        else:
            return jsonify(data)

    except Exception as e:
        print(f"[Flask Error] Critical failure executing {function_name}: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)