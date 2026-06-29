from flask import Flask, request, jsonify
from flask_cors import CORS
import pybaseball
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

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
        
        # Keep your reverse lookup fix
        if function_name == 'playerid_reverse_lookup' and 'player_ids' in kwargs:
            raw_ids = kwargs['player_ids']
            if isinstance(raw_ids, list):
                kwargs['player_ids'] = [int(x) for x in raw_ids if str(x).isdigit()]

        data = func(**kwargs)

        # --- CRITICAL FIX FOR MULTI-RETURN FUNCTIONS (TUPLES) ---
        # If get_splits returns (df, player_info_dict), handle both elements
        if isinstance(data, (tuple, list)):
            serialized_list = [serialize_data(item) for item in data]
            return jsonify(serialized_list)

        # Single item serialization fallback
        if isinstance(data, pd.DataFrame):
            return jsonify(serialize_data(data))
        elif data is None:
            return jsonify([])
        else:
            return jsonify(data)
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)