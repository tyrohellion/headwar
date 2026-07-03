import os
import json
import pandas as pd
from pybaseball import bwar_bat, bwar_pitch

def generate_compressed_war_vault():
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

    # Target data-store map hashed by stringified ID
    war_vault = {}

    # 1. COMPILE BATTER DATA (WAR & OPS+)
    print("Processing historical batter metrics...")
    for _, row in batters.iterrows():
        mlb_id = str(row['mlb_ID'])
        year = str(row['year_ID'])
        war = float(row['WAR'])
        
        # Pull raw performance indices
        ops_plus = row.get('OPS_plus') or row.get('ops_plus')
        ops_val = int(ops_plus) if pd.notna(ops_plus) else None
        
        if mlb_id not in war_vault:
            war_vault[mlb_id] = {"career_total": 0.0, "seasons": {}}
            
        if year not in war_vault[mlb_id]["seasons"]:
            war_vault[mlb_id]["seasons"][year] = {"war": 0.0}
            
        war_vault[mlb_id]["seasons"][year]["war"] += war
        if ops_val is not None:
            # Handle multi-stint seasons by preserving the highest values or row entries
            war_vault[mlb_id]["seasons"][year]["ops"] = ops_val

    # 2. COMPILE PITCHER DATA (WAR & ERA+)
    print("Processing historical pitcher metrics...")
    for _, row in pitchers.iterrows():
        mlb_id = str(row['mlb_ID'])
        year = str(row['year_ID'])
        war = float(row['WAR'])
        
        era_plus = row.get('ERA_plus') or row.get('era_plus')
        era_val = int(era_plus) if pd.notna(era_plus) else None
        
        if mlb_id not in war_vault:
            war_vault[mlb_id] = {"career_total": 0.0, "seasons": {}}
            
        if year not in war_vault[mlb_id]["seasons"]:
            war_vault[mlb_id]["seasons"][year] = {"war": 0.0}
            
        war_vault[mlb_id]["seasons"][year]["war"] += war
        if era_val is not None:
            war_vault[mlb_id]["seasons"][year]["era"] = era_val

    # 3. NORMALIZE CAREER TOTALS & PRECISION
    print("Formatting structural outputs and calculating career aggregates...")
    for mlb_id in list(war_vault.keys()):
        v = war_vault[mlb_id]
        
        # Calculate full macro-career aggregate across all collected seasons
        career_calc = sum(season_data["war"] for season_data in v["seasons"].values())
        v["career_total"] = round(career_calc, 1)
        
        # Round seasonal outputs cleanly to single decimals
        for year in v["seasons"]:
            v["seasons"][year]["war"] = round(v["seasons"][year]["war"], 1)

    # 4. SAVE COMPRESSED ASSET
    os.makedirs('static/data', exist_ok=True)
    with open('static/data/war_vault.json', 'w') as f:
        # separators blocks layout spaces saving roughly ~30% physical disk size
        json.dump(war_vault, f, separators=(',', ':'))
        
    print("Successfully compiled static database file!")

if __name__ == "__main__":
    generate_compressed_war_vault()