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

# def load_gmk():
#     with open(GMK_PATH, "r", encoding="utf-8") as f:
#         data = json.load(f, object_pairs_hook=OrderedDict)
#     return data


# def save_gmk(data: OrderedDict):
#     # data là OrderedDict, đảm bảo giữ nguyên thứ tự
#     with open(GMK_PATH, "w", encoding="utf-8") as f:
#         json.dump(data, f, ensure_ascii=False, indent=2)


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
    items = list(load_json(FILES[tab]).items())
    return render_template("keysim.html", tab=tab, items=items, files=FILES)

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
            if k in updates:
                row = updates[k]
                new_data[row.get("new_key", k)] = row.get("color", v)
            else:
                new_data[k] = v
                
        save_json(filename, new_data)
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# @app.route("/keysim", methods=["GET"])
# def keysim_view():
#     gmk = load_gmk()
#     # truyền list các (key, value) ra template để hiển thị theo đúng thứ tự
#     items = list(gmk.items())
#     return render_template("keysim.html", items=items)


# @app.route("/api/keysim/go", methods=["PUT"])
# def update_go_colorway():
#     try:
#         payload = request.get_json(force=True)
#         # payload dạng:
#         # {
#         #   "items": [
#         #       {"old_key": "GE1", "new_key": "GE1_NEW", "color": "#ffffff"},
#         #       ...
#         #   ]
#         # }

#         if "items" not in payload:
#             return jsonify({"error": "Missing items"}), 400

#         # đọc file hiện tại để giữ đúng thứ tự gốc
#         current = load_gmk()
#         new_data = OrderedDict()

#         # map old_key -> (new_key, color) để dễ tra
#         updates = {row["old_key"]: row for row in payload["items"]}

#         for old_key, old_color in current.items():
#             if old_key in updates:
#                 row = updates[old_key]
#                 new_key = row.get("new_key", old_key)
#                 new_color = row.get("color", old_color)
#                 new_data[new_key] = new_color
#             else:
#                 # nếu row nào không gửi lên thì giữ nguyên
#                 new_data[old_key] = old_color

#         save_gmk(new_data)
#         return jsonify({"status": "ok"}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)


# if __name__ == "__main__":
#     # with app.app_context():
#     #     db.create_all()

#     t = threading.Thread(target=periodic_save_dump, daemon=True)
#     t.start()

#     # read_anphat_web()


#     scheduler = BackgroundScheduler(daemon=True)
#     scheduler.add_job(
#         func=read_web,
#         trigger='cron',
#         hour=20, 
#         minute=0, 
#         id='daily_anphat_scrape',
#         replace_existing=True
#     )
#     scheduler.start()
#     print("✅ Scheduler: read_anphat_web chạy 20:00 hàng ngày")



#     port = int(os.environ.get('PORT', 5050))
#     app.run(host='0.0.0.0', port=port, debug=True)


# from flask import Flask, request, jsonify, abort
# from flask_sqlalchemy import SQLAlchemy
# import json
# import datetime
# import os
# import sys
# from models import app, db, Product, LeadPayload, periodic_save_dump
# from dotenv import load_dotenv
# import threading
# from apscheduler.schedulers.background import BackgroundScheduler
# from flask import render_template
# from read_web import read_web
# from flask import redirect, url_for, render_template, request

# def split_after_underscore(value, index=1):
#     """Custom filter: cat.split('_')[1]"""
#     if value and '_' in value:
#         parts = value.split('_')
#         return parts[index] if index < len(parts) else value
#     return value

# # Register filter


# def format_currency(value):
#     """Format số thành tiền VNĐ: 1234567 → 1,234,567đ"""
#     if not value:
#         return '-'
#     try:
#         num = int(value)
#         return f"{num:,}đ"
#     except (ValueError, TypeError):
#         return str(value)

# # ĐĂNG KÝ FILTER
# app.jinja_env.filters['split_after'] = split_after_underscore
# app.jinja_env.filters['currency'] = format_currency

# reading_state = {"is_reading": False} 

# @app.route('/read-data/', methods=['GET', 'POST'])
# def read_data():
#     if request.method == 'POST':
#         reading_state["is_reading"] = True
#         # Gọi hàm đọc data (giả sử hàm này đồng bộ và blocking)
#         read_web()
#         reading_state["is_reading"] = False
#         return redirect(url_for('dashboard'))  # chuyển về dashboard khi xong
#     return render_template('read_data.html', reading=reading_state["is_reading"])

# from sqlalchemy import or_, and_
# import re

# @app.route('/api/search/keyword', methods=['POST'])
# def search_by_keyword():
#     data = request.json
#     keywords = data.get('keywords', [])  # ["hp", "630"]
    
#     if not keywords:
#         return jsonify([])
    
#     # Tách thêm từ phức tạp (630 → 630 G8, Elitebook → EliteBook)
#     expanded_keywords = []
#     for kw in keywords:
#         # Tách số + chữ (hp630 → hp, 630)
#         words = re.findall(r'\b\w+\b', kw.lower())
#         expanded_keywords.extend(words)
    
#     # Loại trùng lặp
#     unique_keywords = list(set(expanded_keywords))
    
#     # Query: TÌM SẢN PHẨM CHỨA TẤT CẢ từ khóa (bất kỳ thứ tự)
#     query = Product.query
#     for keyword in keywords:
#         query = query.filter(
#             or_(
#                 Product.name.ilike(f'%{keyword}%'),     # Tìm trong name
#                 Product.href.ilike(f'%{keyword}%')      # Tìm trong href/URL
#             )
#         )
    
#     products = query.all()
#     return jsonify([p.tdict() for p in products])

# @app.route('/api/categories')
# def api_categories():
#     company = request.args.get('company', '')
    
#     if company:
#         # Lấy categories START WITH company name
#         categories = db.session.query(Product.category)\
#             .filter(
#                 Product.company == company,
#                 Product.category.isnot(None)
#             )\
#             .distinct(Product.category)\
#             .order_by(Product.category)\
#             .all()
#     else:
#         # Tất cả categories
#         categories = db.session.query(Product.category)\
#             .filter(Product.category.isnot(None))\
#             .distinct(Product.category)\
#             .order_by(Product.category)\
#             .all()
    
#     categories_list = [cat[0] for cat in categories if cat[0]]
#     return jsonify(categories_list)

# @app.route('/dashboard/')
# def dashboard():
#     page = request.args.get('page', 1, type=int)
#     per_page = 30
#     company_filter = request.args.get('company', '')  # ← Thêm company filter
#     category_filter = request.args.get('category', '')
#     active_tab = request.args.get('tab', 'all')

#     # Base query
#     query = Product.query
    
#     # FILTER THEO COMPANY + CATEGORY
#     if company_filter:
#         query = query.filter(Product.company == company_filter)
#     if category_filter:
#         query = query.filter(Product.category.ilike(f'%{category_filter}%'))
    
#     # Pagination với filter
#     pagination = query.order_by(Product.id.desc()).paginate(
#         page=page, per_page=per_page, error_out=False
#     )
    
#     # Lấy tất cả COMPANIES unique từ Product table
#     all_companies = db.session.query(Product.company)\
#         .filter(Product.company.isnot(None))\
#         .distinct(Product.company)\
#         .order_by(Product.company)\
#         .all()
#     companies = [comp[0] for comp in all_companies if comp[0]]
    
#     # Lấy tất cả CATEGORIES unique từ Product table
#     all_categories = db.session.query(Product.category)\
#         .filter(Product.category.isnot(None))\
#         .distinct(Product.category)\
#         .order_by(Product.category)\
#         .all()
#     categories = [cat[0] for cat in all_categories if cat[0]]
    
#     products_data = [p.tdict() for p in pagination.items]
    
#     return render_template('dashboard.html',
#                         active_tab=active_tab,
#                          products=products_data,
#                          pagination=pagination,
#                          companies=companies,  # ← Đã thêm
#                          categories=categories,
#                          current_company=company_filter,
#                          current_category=category_filter,
#                          page=page,
#                          total_pages=pagination.pages)



# base_dir = os.path.abspath(os.path.dirname(__file__))
# # print(base_dir)
# sys.path.append(base_dir)

# load_dotenv()

# if __name__ == "__main__":
#     # with app.app_context():
#     #     db.create_all()

#     t = threading.Thread(target=periodic_save_dump, daemon=True)
#     t.start()

#     # read_anphat_web()


#     scheduler = BackgroundScheduler(daemon=True)
#     scheduler.add_job(
#         func=read_web,
#         trigger='cron',
#         hour=20, 
#         minute=0, 
#         id='daily_anphat_scrape',
#         replace_existing=True
#     )
#     scheduler.start()
#     print("✅ Scheduler: read_anphat_web chạy 20:00 hàng ngày")



#     port = int(os.environ.get('PORT', 5050))
#     app.run(host='0.0.0.0', port=port, debug=True)

