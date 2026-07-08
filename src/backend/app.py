from flask import Flask, request, jsonify
from flask_cors import CORS
import pybaseball
import pandas as pd
import numpy as np
import time

app = Flask(__name__)
CORS(app)

SCRAPING_FUNCTIONS = {
    'batting_stats_bref',
    'pitching_stats_bref',
}

def serialize_data(data):
    """Helper function to cleanly format Pandas DataFrames to dictionaries."""
    if isinstance(data, pd.DataFrame):
        cleaned_df = data.replace({np.nan: None, np.inf: None, -np.inf: None})
        return cleaned_df.to_dict(orient='records')
    return data

@app.route('/api/<function_name>', methods=['POST'])
def dynamic_api(function_name):
    func = getattr(pybaseball, function_name, None)
    if not func or not callable(func):
        return jsonify({"error": f"Function '{function_name}' not found."}), 404

    try:
        kwargs = request.json or {}
        
        if function_name == 'playerid_reverse_lookup' and 'player_ids' in kwargs:
            raw_ids = kwargs['player_ids']
            if isinstance(raw_ids, list):
                kwargs['player_ids'] = [int(x) for x in raw_ids if str(x).isdigit()]

        if function_name in SCRAPING_FUNCTIONS:
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
                            print(f"[Flask Proxy] Connection dropped on {function_name}. Retrying in {backoff_delay}s... (Attempt {attempt+1}/{max_retries})")
                            time.sleep(backoff_delay)
                            backoff_delay *= 2 
                            continue
                    raise exc
        else:
       
            data = func(**kwargs)

        if isinstance(data, (tuple, list)):
            serialized_list = [serialize_data(item) for item in data]
            return jsonify(serialized_list)

     
        if isinstance(data, pd.DataFrame):
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