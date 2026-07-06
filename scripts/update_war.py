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
    leaderboard_path = 'static/data/career_leaderboard.json'

    # ALWAYS start both vaults completely fresh to prevent historical 
    # data from compounding and duplicating on subsequent script runs.
    war_archive = {}
    war_active = {}
    career_leaderboard = {}

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
            target_vault[mlb_id] = {"seasons": {}}
            
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
            target_vault[mlb_id] = {"seasons": {}}
            
        if year not in target_vault[mlb_id]["seasons"]:
            target_vault[mlb_id]["seasons"][year] = {"war": 0.0}
            
        target_vault[mlb_id]["seasons"][year]["war"] += war
        if era_val is not None:
            target_vault[mlb_id]["seasons"][year]["era"] = era_val

    # 3. NORMALIZE CAREER TOTALS & PRECISION ACROSS BOTH VAULTS
    print("Formatting structural outputs and calculating career aggregates...")
    global_career_data = []

    for vault_name, vault in [("active", war_active), ("archive", war_archive)]:
        for mlb_id in list(vault.keys()):
            v = vault[mlb_id]
            
            # Calculate full macro-career aggregate across all collected seasons
            career_calc = sum(season_data["war"] for season_data in v["seasons"].values())
            career_total = round(career_calc, 1)
            
            # Append to our global pool for the 3rd file
            global_career_data.append({
                "mlb_id": mlb_id,
                "career_total": career_total,
                "status": vault_name
            })
            
            # Round seasonal outputs cleanly to single decimals
            for year in v["seasons"]:
                v["seasons"][year]["war"] = round(v["seasons"][year]["war"], 1)

# 4. CALCULATE LEADERBOARD RANKINGS
    print("Calculating leaderboard rankings...")
    
    # --- A. Build the 3rd File: Global Career Leaderboard ---
    # Sort the entire global pool from highest to lowest career WAR
    global_career_data.sort(key=lambda x: x["career_total"], reverse=True)
    
    career_leaderboard = {}
    for index, item in enumerate(global_career_data):
        career_leaderboard[item["mlb_id"]] = {
            "value": item["career_total"],
            "rank": index + 1,
            "status": item["status"]
        }

    # --- B. Seasonal Stat Rankings (Pooled Globally across BOTH files, Grouped by Year) ---
    # We initialize these OUTSIDE the vault loops to combine all historical data together
    yearly_war = {}
    yearly_ops = {}
    yearly_era = {}

    # Gather data from BOTH vaults into a single global pool per year
    for vault_name, vault in [("active", war_active), ("archive", war_archive)]:
        for mlb_id, p_data in vault.items():
            for year, s_data in p_data["seasons"].items():
                yearly_war.setdefault(year, []).append((mlb_id, s_data["war"], vault_name))
                if "ops" in s_data:
                    yearly_ops.setdefault(year, []).append((mlb_id, s_data["ops"], vault_name))
                if "era" in s_data:
                    yearly_era.setdefault(year, []).append((mlb_id, s_data["era"], vault_name))

    # Rank and assign Seasonal WAR globally
    for year, players in yearly_war.items():
        players.sort(key=lambda x: x[1], reverse=True)
        for index, (mlb_id, val, vault_name) in enumerate(players):
            target_vault = war_active if vault_name == "active" else war_archive
            target_vault[mlb_id]["seasons"][year]["war"] = {"value": val, "rank": index + 1}

    # Rank and assign Seasonal OPS+ globally
    for year, players in yearly_ops.items():
        players.sort(key=lambda x: x[1], reverse=True)
        for index, (mlb_id, val, vault_name) in enumerate(players):
            target_vault = war_active if vault_name == "active" else war_archive
            target_vault[mlb_id]["seasons"][year]["ops"] = {"value": val, "rank": index + 1}

    # Rank and assign Seasonal ERA+ globally
    for year, players in yearly_era.items():
        players.sort(key=lambda x: x[1], reverse=True)
        for index, (mlb_id, val, vault_name) in enumerate(players):
            target_vault = war_active if vault_name == "active" else war_archive
            target_vault[mlb_id]["seasons"][year]["era"] = {"value": val, "rank": index + 1}

    # 5. SAVE COMPRESSED ASSETS
    print("Saving compressed storage assets...")
    
    with open(active_path, 'w') as f:
        json.dump(war_active, f, separators=(',', ':'))
        
    with open(archive_path, 'w') as f:
        json.dump(war_archive, f, separators=(',', ':'))
        
    with open(leaderboard_path, 'w') as f:
        json.dump(career_leaderboard, f, separators=(',', ':'))
        
    print(f"Successfully sync'd! Active: {len(war_active)} | Archived: {len(war_archive)} | Leaderboard Entries: {len(career_leaderboard)}")

if __name__ == "__main__":
    generate_compressed_war_vault()