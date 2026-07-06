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
    
    career_leaderboard = {}
    for index, item in enumerate(global_career_data):
        career_leaderboard[item["mlb_id"]] = {
            "value": item["career_total"],
            "rank": index + 1,
            "status": item["status"]
        }

    for vault in [war_active, war_archive]:
        yearly_war = {}
        yearly_ops = {}
        yearly_era = {}

        for mlb_id, p_data in vault.items():
            for year, s_data in p_data["seasons"].items():
                yearly_war.setdefault(year, []).append((mlb_id, s_data["war"]))
                if "ops" in s_data:
                    yearly_ops.setdefault(year, []).append((mlb_id, s_data["ops"]))
                if "era" in s_data:
                    yearly_era.setdefault(year, []).append((mlb_id, s_data["era"]))

   
        for year, players in yearly_war.items():
            players.sort(key=lambda x: x[1], reverse=True)
            for index, (mlb_id, val) in enumerate(players):
                vault[mlb_id]["seasons"][year]["war"] = {"value": val, "rank": index + 1}

  
        for year, players in yearly_ops.items():
            players.sort(key=lambda x: x[1], reverse=True)
            for index, (mlb_id, val) in enumerate(players):
                vault[mlb_id]["seasons"][year]["ops"] = {"value": val, "rank": index + 1}

   
        for year, players in yearly_era.items():
            players.sort(key=lambda x: x[1], reverse=True)
            for index, (mlb_id, val) in enumerate(players):
                vault[mlb_id]["seasons"][year]["era"] = {"value": val, "rank": index + 1}


    print("Saving compressed storage assets...")
    leaderboard_path = 'static/data/career_leaderboard.json'
    
    with open(active_path, 'w') as f:
        json.dump(war_active, f, separators=(',', ':'))
        
    with open(archive_path, 'w') as f:
        json.dump(war_archive, f, separators=(',', ':'))
        
    with open(leaderboard_path, 'w') as f:
        json.dump(career_leaderboard, f, separators=(',', ':'))
        
    print(f"Successfully sync'd! Active: {len(war_active)} | Archived: {len(war_archive)} | Leaderboard Entries: {len(career_leaderboard)}")