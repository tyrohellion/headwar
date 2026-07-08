import os
import json
import pandas as pd
from pybaseball import bwar_bat, bwar_pitch

CURRENT_YEAR = 2026
YEAR_THRESHOLD = CURRENT_YEAR - 8

MIN_SEASONAL_PA = 200
MIN_SEASONAL_IPOUTS = 150

def generate_compressed_war_vault():
    os.makedirs('static/data', exist_ok=True)
    archive_path = 'static/data/war_archive.json'
    active_path = 'static/data/war_active.json'
    leaderboard_path = 'static/data/career_leaderboard.json'

    war_archive = {}
    war_active = {}
    career_leaderboard = {}

    print("Downloading massive Baseball-Reference source archives...")
    try:
        batters = bwar_bat(return_all=True)
        pitchers = bwar_pitch(return_all=True)
    except Exception as e:
        print(f"Error executing pybaseball network request: {e}")
        return

    for df in [batters, pitchers]:
        df['mlb_ID'] = df['mlb_ID'].fillna(0).astype(int)
        df['year_ID'] = df['year_ID'].astype(int)
        df['WAR'] = pd.to_numeric(df['WAR'], errors='coerce').fillna(0.0)

    batters = batters[batters['mlb_ID'] > 0]
    pitchers = pitchers[pitchers['mlb_ID'] > 0]

    print("Analyzing player activity time horizons...")
    max_year_bat = batters.groupby('mlb_ID')['year_ID'].max()
    max_year_pitch = pitchers.groupby('mlb_ID')['year_ID'].max()
    last_active_map = pd.concat([max_year_bat, max_year_pitch]).groupby(level=0).max().to_dict()

    print("Processing historical batter metrics...")
    for _, row in batters.iterrows():
        mlb_id = str(row['mlb_ID'])
        year = str(row['year_ID'])
        war = float(row['WAR'])
        
        ops_plus = row.get('OPS_plus') or row.get('ops_plus')
        ops_val = int(ops_plus) if pd.notna(ops_plus) else None
        pa_val = int(row.get('PA')) if pd.notna(row.get('PA')) else 0
        
        last_year_played = last_active_map.get(int(mlb_id), 0)
        target_vault = war_archive if last_year_played < YEAR_THRESHOLD else war_active
        
        if mlb_id not in target_vault:
            target_vault[mlb_id] = {"seasons": {}}
            
        if year not in target_vault[mlb_id]["seasons"]:
            target_vault[mlb_id]["seasons"][year] = {"war": 0.0, "pa": 0, "ipouts": 0}
            
        target_vault[mlb_id]["seasons"][year]["war"] += war
        target_vault[mlb_id]["seasons"][year]["pa"] += pa_val
        
        if ops_val is not None:
            if "ops" not in target_vault[mlb_id]["seasons"][year] or pa_val > target_vault[mlb_id]["seasons"][year].get("_max_ops_pa", 0):
                target_vault[mlb_id]["seasons"][year]["ops"] = ops_val
                target_vault[mlb_id]["seasons"][year]["_max_ops_pa"] = pa_val

    print("Processing historical pitcher metrics...")
    for _, row in pitchers.iterrows():
        mlb_id = str(row['mlb_ID'])
        year = str(row['year_ID'])
        war = float(row['WAR'])
        
        era_plus = row.get('ERA_plus') or row.get('era_plus')
        era_val = int(era_plus) if pd.notna(era_plus) else None
        ipouts_val = int(row.get('ipouts') or row.get('IPouts') or 0)
        
        last_year_played = last_active_map.get(int(mlb_id), 0)
        target_vault = war_archive if last_year_played < YEAR_THRESHOLD else war_active
        
        if mlb_id not in target_vault:
            target_vault[mlb_id] = {"seasons": {}}
            
        if year not in target_vault[mlb_id]["seasons"]:
            target_vault[mlb_id]["seasons"][year] = {"war": 0.0, "pa": 0, "ipouts": 0}
        else:
            target_vault[mlb_id]["seasons"][year].setdefault("pa", 0)
            target_vault[mlb_id]["seasons"][year].setdefault("ipouts", 0)
            
        target_vault[mlb_id]["seasons"][year]["war"] += war
        target_vault[mlb_id]["seasons"][year]["ipouts"] += ipouts_val
        
        if era_val is not None:
            if "era" not in target_vault[mlb_id]["seasons"][year] or ipouts_val > target_vault[mlb_id]["seasons"][year].get("_max_era_ipouts", 0):
                target_vault[mlb_id]["seasons"][year]["era"] = era_val
                target_vault[mlb_id]["seasons"][year]["_max_era_ipouts"] = ipouts_val

    print("Formatting structural outputs and calculating career aggregates...")
    global_career_data = []

    for vault_name, vault in [("active", war_active), ("archive", war_archive)]:
        for mlb_id in list(vault.keys()):
            v = vault[mlb_id]
            
            career_calc = sum(season_data["war"] for season_data in v["seasons"].values())
            career_total = round(career_calc, 1)
            
            global_career_data.append({
                "mlb_id": mlb_id,
                "career_total": career_total,
                "status": vault_name
            })
            
            for year in v["seasons"]:
                v["seasons"][year]["war"] = round(v["seasons"][year]["war"], 1)

    print("Calculating leaderboard rankings...")
    
    global_career_data.sort(key=lambda x: x["career_total"], reverse=True)
    
    for index, item in enumerate(global_career_data):
        career_leaderboard[item["mlb_id"]] = {
            "value": item["career_total"],
            "rank": index + 1,
            "status": item["status"]
        }

    yearly_war = {}
    yearly_ops = {}
    yearly_era = {}

    for vault_name, vault in [("active", war_active), ("archive", war_archive)]:
        for mlb_id, p_data in vault.items():
            for year, s_data in p_data["seasons"].items():
                yearly_war.setdefault(year, []).append((mlb_id, s_data["war"], vault_name))
                
                if "ops" in s_data:
                    if s_data.get("pa", 0) >= MIN_SEASONAL_PA:
                        yearly_ops.setdefault(year, []).append((mlb_id, s_data["ops"], vault_name))
                    else:
                        p_data["seasons"][year]["ops"] = {"value": s_data["ops"], "rank": None}
                        
                if "era" in s_data:
                    if s_data.get("ipouts", 0) >= MIN_SEASONAL_IPOUTS:
                        yearly_era.setdefault(year, []).append((mlb_id, s_data["era"], vault_name))
                    else:
                        p_data["seasons"][year]["era"] = {"value": s_data["era"], "rank": None}

    for year, players in yearly_war.items():
        players.sort(key=lambda x: x[1], reverse=True)
        for index, (mlb_id, val, vault_name) in enumerate(players):
            target_vault = war_active if vault_name == "active" else war_archive
            target_vault[mlb_id]["seasons"][year]["war"] = {"value": val, "rank": index + 1}

    for year, players in yearly_ops.items():
        players.sort(key=lambda x: x[1], reverse=True)
        for index, (mlb_id, val, vault_name) in enumerate(players):
            target_vault = war_active if vault_name == "active" else war_archive
            target_vault[mlb_id]["seasons"][year]["ops"] = {"value": val, "rank": index + 1}

    for year, players in yearly_era.items():
        players.sort(key=lambda x: x[1], reverse=True)
        for index, (mlb_id, val, vault_name) in enumerate(players):
            target_vault = war_active if vault_name == "active" else war_archive
            target_vault[mlb_id]["seasons"][year]["era"] = {"value": val, "rank": index + 1}

    for vault in [war_active, war_archive]:
        for mlb_id in vault:
            for year in vault[mlb_id]["seasons"]:
                vault[mlb_id]["seasons"][year].pop("pa", None)
                vault[mlb_id]["seasons"][year].pop("ipouts", None)
                vault[mlb_id]["seasons"][year].pop("_max_ops_pa", None)
                vault[mlb_id]["seasons"][year].pop("_max_era_ipouts", None)

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