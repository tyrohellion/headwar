from flask import Flask, request, jsonify
from flask_cors import CORS
import pybaseball
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

@app.route('/api/<function_name>', methods=['POST'])
def dynamic_api(function_name):
    func = getattr(pybaseball, function_name, None)
    if not func or not callable(func):
        return jsonify({"error": f"Function '{function_name}' not found."}), 404

    try:
        kwargs = request.json or {}
        data = func(**kwargs)
        if isinstance(data, pd.DataFrame):
            # Clean up NaN / Infinity formatting which breaks standard native JSON serializers
            data = data.replace({np.nan: None, np.inf: None, -np.inf: None})
            return jsonify(data.to_dict(orient='records'))
        elif data is None:
            return jsonify([])
        else:
            return jsonify(data)
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)