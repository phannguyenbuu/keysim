from collections import OrderedDict
from flask import Flask, render_template, request, jsonify
import os
import json
from flask_cors import CORS
from pathlib import Path
import re
import math

app = Flask(__name__)
CORS(app)
# COLORWAYS_CONFIG_DIR = os.path.join(os.path.dirname(__file__), '../frontend/src/config/colorways/')


BASE_DIR = Path(__file__).parent
COLORS_CONFIG_DIR = BASE_DIR / "colors"
COLORWAYS_CONFIG_DIR = BASE_DIR / "colorways"
COLORWAYS_CONFIG_DIR.mkdir(parents=True, exist_ok=True)


@app.route("/api/textures/<key>", methods=["POST"])
def upload_texture(key):
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file"}), 400

        save_dir = os.path.join(os.path.dirname(__file__), "textures")
        os.makedirs(save_dir, exist_ok=True)

        filepath = os.path.join(save_dir, f"{key}.png")
        file.save(filepath)

        return jsonify({
            "status": "ok",
            "key": key,
            "path": filepath
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
@app.route('/api/colorways', methods=['GET'])
def list_colorways():
    try:
        colorways = []
        if not os.path.exists(COLORWAYS_CONFIG_DIR):
            return jsonify([]), 200
            
        for filename in os.listdir(COLORWAYS_CONFIG_DIR):
            if filename.endswith('.json'):
                file_path = os.path.join(COLORWAYS_CONFIG_DIR, filename)
                
                # ✅ ĐỌC NỘI DUNG JSON FILE
                with open(file_path, 'r', encoding='utf-8') as f:
                    colorway_data = json.load(f)
                
                name = filename[:-5]
                colorways.append({
                    'id': name,
                    'label': name,
                    'swatches': colorway_data.get('swatches', {}),  # ✅ THÊM NÀY
                    'override': colorway_data.get('override', {})    # ✅ VÀ NÀY
                })

        return jsonify(colorways), 200
        
    except Exception as e:
        print(f"❌ GET ERROR: {e}")
        return jsonify([]), 200



@app.route('/api/colorways/<string:json_name>', methods=['PUT'])
def update_colorway(json_name):
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        # ?o. SANITIZE TASN FILE - Lo??i b??/kh?_c ph??c kA? t?? ?`??c bi??t
        safe_prev = re.sub(r'[^\w\-_.]', '_', json_name)  # Thay space b??ng _
        new_name = data.get("id") or data.get("label") or json_name
        safe_name = re.sub(r'[^\w\-_.]', '_', new_name)
        json_path = COLORWAYS_CONFIG_DIR / f"{safe_name}.json"
        prev_path = COLORWAYS_CONFIG_DIR / f"{safe_prev}.json"
        
        print(f"Original: {json_name} ?+' Safe: {safe_name}")
        print(f"Writing to: {json_path}")
        if safe_prev != safe_name and prev_path.exists():
            prev_path.replace(json_path)
        
        # Kiểm tra thư mục tồn tại
        json_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Ghi file
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        return jsonify({
            "message": "Colorway updated successfully",
            "file": safe_name + '.json'
        }), 200

    except FileNotFoundError:
        return jsonify({"error": "File path not found"}), 404
    except PermissionError:
        return jsonify({"error": "Không có quyền ghi file"}), 403
    except Exception as e:
        print(f"ERROR: {str(e)}")  # Log chi tiết
        return jsonify({"error": str(e)}), 500

    



FILES = {
    "gmk": "gmk.json",
    "sa": "sa.json"
}
PAGE_SIZE = 10


def load_json(filename):
    path = COLORS_CONFIG_DIR / filename
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f, object_pairs_hook=OrderedDict)

def save_json(filename, data):
    path = COLORS_CONFIG_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route("/admin/<tab>", methods=["GET"])
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

    items.sort(key=lambda kv: kv[0])
    total_items = len(items)
    total_pages = max(1, math.ceil(total_items / PAGE_SIZE))
    page = request.args.get("page", default=1, type=int)
    if page < 1:
        page = 1
    if page > total_pages:
        page = total_pages
    start = (page - 1) * PAGE_SIZE
    end = start + PAGE_SIZE
    page_items = items[start:end]

    return render_template(
        "keysim.html",
        tab=tab,
        items=page_items,
        files=FILES,
        page=page,
        total_pages=total_pages
    )

@app.route("/api/colors/<tab>", methods=["GET"])
def get_color_codes(tab):
    if tab not in FILES:
        return jsonify({"error": "Invalid tab"}), 404
    try:
        data = load_json(FILES[tab])
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/<tab>/go", methods=["PUT"])
def update_go_colorway(tab):
    try:
        if tab not in FILES:
            return jsonify({"error": "Invalid file"}), 400
        
        filename = FILES[tab]
        payload = request.get_json(force=True) or {}

        current = load_json(filename)
        items = payload.get("items", [])
        deleted = set(payload.get("deleted", []))

        updates = {}
        creates = []
        for row in items:
            old_key = (row.get("old_key") or "").strip()
            new_key = (row.get("new_key") or "").strip()
            if not new_key:
                continue
            if old_key and old_key in current:
                updates[old_key] = row
            else:
                creates.append(row)

        new_data = OrderedDict()
        for k, v in current.items():
            if k in deleted:
                continue
            # normalize dữ liệu cũ
            if isinstance(v, str):
                v = {
                    "bg": v,
                    "text": "#000000"
                }
            if k in updates:
                row = updates[k]
                new_key = (row.get("new_key") or k).strip() or k
                if new_key in new_data and new_key != k:
                    new_key = k
                new_data[new_key] = {
                    "bg": row.get("bg_color", v["bg"]),
                    "text": row.get("text_color", v["text"])
                }
            else:
                new_data[k] = v

        for row in creates:
            new_key = (row.get("new_key") or "").strip()
            if not new_key:
                continue
            if new_key in new_data:
                continue
            new_data[new_key] = {
                "bg": row.get("bg_color", "#ffffff"),
                "text": row.get("text_color", "#000000")
            }

        save_json(filename, new_data)
        return jsonify({"status": "ok"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

