import os
import json
import pandas as pd
from pybaseball import bwar_bat, bwar_pitch

CURRENT_YEAR = 2026
YEAR_THRESHOLD = CURRENT_YEAR - 8  # 2018

def generate_compressed_war_vault():
    os.makedirs('static/data', exist_ok=True)
    archive_path = 'static/data/war_archive.json'
    active_path = 'static/data/war_active.json'

    # Load existing archive if it exists to preserve historical data
    if os.path.exists(archive_path):
        print("Loading historical archive data...")
        with open(archive_path, 'r') as f:
            war_archive = json.load(f)
    else:
        print("No historical archive found. Creating from scratch...")
        war_archive = {}

    print("Downloading massive Baseball-Reference source archives...")
    try:
        # Pulling with return_all=True to safely ensure we get advanced adjustment columns
        batters = bwar_bat(return_all=True)
        pitchers = bwar_pitch(return_all=True)
    except Exception as e:
        print(f"Error executing pybaseball network request: {e}")
        return

    # Clean missing variables & structural types
    for df in [batters, pitchers]:
        df['mlb_ID'] = df['mlb_ID'].fillna(0).astype(int)
        df['year_ID'] = df['year_ID'].astype(int)
        df['WAR'] = pd.to_numeric(df['WAR'], errors='coerce').fillna(0.0)

    # Filter down to entries linked with a legitimate MLB tracking ID
    batters = batters[batters['mlb_ID'] > 0]
    pitchers = pitchers[pitchers['mlb_ID'] > 0]

    # Pre-calculate the last active year for every player in the dataset to sort them cleanly
    print("Analyzing player activity time horizons...")
    max_year_bat = batters.groupby('mlb_ID')['year_ID'].max()
    max_year_pitch = pitchers.groupby('mlb_ID')['year_ID'].max()
    last_active_map = pd.concat([max_year_bat, max_year_pitch]).groupby(level=0).max().to_dict()

    # Active data pipeline map
    war_active = {}

    # 1. COMPILE BATTER DATA (WAR & OPS+)
    print("Processing historical batter metrics...")
    for _, row in batters.iterrows():
        mlb_id = str(row['mlb_ID'])
        year = str(row['year_ID'])
        war = float(row['WAR'])
        
        # Pull raw performance indices
        ops_plus = row.get('OPS_plus') or row.get('ops_plus')
        ops_val = int(ops_plus) if pd.notna(ops_plus) else None
        
        # Route to the correct target vault based on their absolute final career year
        last_year_played = last_active_map.get(int(mlb_id), 0)
        target_vault = war_archive if last_year_played < YEAR_THRESHOLD else war_active
        
        if mlb_id not in target_vault:
            target_vault[mlb_id] = {"career_total": 0.0, "seasons": {}}
            
        if year not in target_vault[mlb_id]["seasons"]:
            target_vault[mlb_id]["seasons"][year] = {"war": 0.0}
            
        target_vault[mlb_id]["seasons"][year]["war"] += war
        if ops_val is not None:
            target_vault[mlb_id]["seasons"][year]["ops"] = ops_val

    # 2. COMPILE PITCHER DATA (WAR & ERA+)
    print("Processing historical pitcher metrics...")
    for _, row in pitchers.iterrows():
        mlb_id = str(row['mlb_ID'])
        year = str(row['year_ID'])
        war = float(row['WAR'])
        
        era_plus = row.get('ERA_plus') or row.get('era_plus')
        era_val = int(era_plus) if pd.notna(era_plus) else None
        
        # Route to the correct target vault based on their absolute final career year
        last_year_played = last_active_map.get(int(mlb_id), 0)
        target_vault = war_archive if last_year_played < YEAR_THRESHOLD else war_active
        
        if mlb_id not in target_vault:
            target_vault[mlb_id] = {"career_total": 0.0, "seasons": {}}
            
        if year not in target_vault[mlb_id]["seasons"]:
            target_vault[mlb_id]["seasons"][year] = {"war": 0.0}
            
        target_vault[mlb_id]["seasons"][year]["war"] += war
        if era_val is not None:
            target_vault[mlb_id]["seasons"][year]["era"] = era_val

    # 3. NORMALIZE CAREER TOTALS & PRECISION ACROSS BOTH VAULTS
    print("Formatting structural outputs and calculating career aggregates...")
    for vault in [war_active, war_archive]:
        for mlb_id in list(vault.keys()):
            v = vault[mlb_id]
            
            # Calculate full macro-career aggregate across all collected seasons
            career_calc = sum(season_data["war"] for season_data in v["seasons"].values())
            v["career_total"] = round(career_calc, 1)
            
            # Round seasonal outputs cleanly to single decimals
            for year in v["seasons"]:
                v["seasons"][year]["war"] = round(v["seasons"][year]["war"], 1)

    # 4. SAVE COMPRESSED ASSETS
    print("Saving compressed storage assets...")
    with open(active_path, 'w') as f:
        json.dump(war_active, f, separators=(',', ':'))
        
    with open(archive_path, 'w') as f:
        json.dump(war_archive, f, separators=(',', ':'))
        
    print(f"Successfully sync'd! Active Players: {len(war_active)} | Archived Players: {len(war_archive)}")

if __name__ == "__main__":
    generate_compressed_war_vault()