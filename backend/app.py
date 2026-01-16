from collections import OrderedDict
from flask import Flask, render_template, request, jsonify
import os
import json
from flask_cors import CORS
from pathlib import Path

app = Flask(__name__)
CORS(app)
COLORWAY_PATH = os.path.join(os.path.dirname(__file__), '../src/config/colorways/')

@app.route('/api/colorways/<string:json_name>', methods=['PUT'])
def update_colorway(json_name):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        json_path = os.path.join(COLORWAY_PATH, json_name + '.json')
        print(json_path)
        # Ghi đè file json
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

        return jsonify({"message": "Colorway updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


BASE_DIR = Path(__file__).parent.parent  # 2 parent
CONFIG_DIR = BASE_DIR / "src" / "config" / "colors"

FILES = {
    "gmk": "gmk.json",
    "sa": "sa.json"
}


def load_json(filename):
    path = CONFIG_DIR / filename
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f, object_pairs_hook=OrderedDict)

def save_json(filename, data):
    path = CONFIG_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route("/<tab>", methods=["GET"])
def colorway_view(tab):
    if tab not in FILES:
        return "Invalid tab", 404

    raw = load_json(FILES[tab])
    items = []

    for k, v in raw.items():
        # nếu là string cũ → convert
        if isinstance(v, str):
            v = {
                "bg": v,
                "text": "#000000"
            }
        else:
            v.setdefault("bg", "#ffffff")
            v.setdefault("text", "#000000")

        items.append((k, v))

    return render_template(
        "keysim.html",
        tab=tab,
        items=items,
        files=FILES
    )


@app.route("/api/<tab>/go", methods=["PUT"])
def update_go_colorway(tab):
    try:
        if tab not in FILES:
            return jsonify({"error": "Invalid file"}), 400
        
        filename = FILES[tab]
        payload = request.get_json(force=True)

        current = load_json(filename)
        new_data = OrderedDict()
        updates = {r["old_key"]: r for r in payload["items"]}

        for k, v in current.items():
            # normalize dữ liệu cũ
            if isinstance(v, str):
                v = {
                    "bg": v,
                    "text": "#000000"
                }

            if k in updates:
                row = updates[k]
                new_key = row.get("new_key", k)

                new_data[new_key] = {
                    "bg": row.get("bg_color", v["bg"]),
                    "text": row.get("text_color", v["text"])
                }
            else:
                new_data[k] = v

        save_json(filename, new_data)
        return jsonify({"status": "ok"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)

