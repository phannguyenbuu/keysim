import os
import uuid
import shutil
import json
from typing import Dict, Any, List
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import Base, engine, get_db
import models
from schemas import (
    SwitchSchema, KeycapSchema, CableSchema, StoreDataResponse,
    OrderCreate, OrderResponse
)

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Keyhaus Custom Purchase Flow Backend")

# Enable CORS for local dev and remote clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/")
def root():
    return {"name": "Keyhaus API", "version": "1.0.0", "status": "online"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}


@app.get("/api/store-data", response_model=StoreDataResponse)
def get_store_data(db: Session = Depends(get_db)):
    switches = db.query(models.SwitchPersona).order_by(models.SwitchPersona.order_index).all()
    keycaps = db.query(models.Keycap).order_by(models.Keycap.order_index).all()
    cables = db.query(models.Cable).order_by(models.Cable.order_index).all()
    translations_rows = db.query(models.SiteTranslation).all()

    translations_dict = {row.key: row.value for row in translations_rows}

    return {
        "switchPersonas": [s.to_dict() for s in switches],
        "keycaps": [k.to_dict() for k in keycaps],
        "cables": [c.to_dict() for c in cables],
        "translations": translations_dict,
    }

@app.put("/api/store-data")
def update_store_data(data: StoreDataResponse, db: Session = Depends(get_db)):
    # 1. Update switches
    for idx, s in enumerate(data.switchPersonas):
        row = db.query(models.SwitchPersona).filter(models.SwitchPersona.id == s.id).first()
        if row:
            row.label = s.label
            row.tagline = s.tagline
            row.switch_name = s.switchName
            row.switch_spec = s.switchSpec
            row.badge = s.badge
            row.price = s.price
            row.description = s.description
            row.features = s.features
            row.image = s.image
            row.accent = s.accent
            row.accent_dim = s.accentDim or "rgba(96,165,250,0.15)"
            row.specs = s.specs or {}
            row.order_index = idx
        else:
            db.add(models.SwitchPersona(
                id=s.id, label=s.label, tagline=s.tagline, switch_name=s.switchName,
                switch_spec=s.switchSpec, badge=s.badge, price=s.price,
                description=s.description, features=s.features, image=s.image,
                accent=s.accent, accent_dim=s.accentDim or "rgba(96,165,250,0.15)",
                specs=s.specs or {},
                order_index=idx
            ))

    # 2. Update keycaps
    for idx, k in enumerate(data.keycaps):
        row = db.query(models.Keycap).filter(models.Keycap.id == k.id).first()
        if row:
            row.name = k.name
            row.subtitle = k.subtitle
            row.badge = k.badge
            row.price = k.price
            row.description = k.description
            row.image = k.image
            row.accent = k.accent
            row.order_index = idx
        else:
            db.add(models.Keycap(
                id=k.id, name=k.name, subtitle=k.subtitle, badge=k.badge,
                price=k.price, description=k.description, image=k.image,
                accent=k.accent, order_index=idx
            ))

    # 3. Update cables
    for idx, c in enumerate(data.cables):
        row = db.query(models.Cable).filter(models.Cable.id == c.id).first()
        if row:
            row.name = c.name
            row.subtitle = c.subtitle
            row.badge = c.badge
            row.price = c.price
            row.description = c.description
            row.image = c.image
            row.accent = c.accent
            row.order_index = idx
        else:
            db.add(models.Cable(
                id=c.id, name=c.name, subtitle=c.subtitle, badge=c.badge,
                price=c.price, description=c.description, image=c.image,
                accent=c.accent, order_index=idx
            ))

    # 4. Update translations
    for k, v in data.translations.items():
        row = db.query(models.SiteTranslation).filter(models.SiteTranslation.key == k).first()
        if row:
            row.value = v
        else:
            db.add(models.SiteTranslation(key=k, value=v))

    db.commit()
    return {"status": "success", "message": "All store data & images successfully saved to PostgreSQL"}


@app.get("/api/switches")
def get_switches(db: Session = Depends(get_db)):
    switches = db.query(models.SwitchPersona).order_by(models.SwitchPersona.order_index).all()
    return [s.to_dict() for s in switches]


@app.get("/api/keycaps")
def get_keycaps(db: Session = Depends(get_db)):
    keycaps = db.query(models.Keycap).order_by(models.Keycap.order_index).all()
    return [k.to_dict() for k in keycaps]


@app.get("/api/cables")
def get_cables(db: Session = Depends(get_db)):
    cables = db.query(models.Cable).order_by(models.Cable.order_index).all()
    return [c.to_dict() for c in cables]


@app.get("/api/config")
def get_translations(db: Session = Depends(get_db)):
    translations_rows = db.query(models.SiteTranslation).all()
    return {row.key: row.value for row in translations_rows}


@app.put("/api/config")
def update_translations(translations: Dict[str, str], db: Session = Depends(get_db)):
    for k, v in translations.items():
        row = db.query(models.SiteTranslation).filter(models.SiteTranslation.key == k).first()
        if row:
            row.value = v
        else:
            db.add(models.SiteTranslation(key=k, value=v))
    db.commit()
    return {"message": "Translations updated successfully"}


@app.post("/api/orders", response_model=OrderResponse)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    random_suffix = uuid.uuid4().hex[:6].upper()
    order_code = f"#KH-{random_suffix}"

    new_order = models.Order(
        order_code=order_code,
        customer_name=order.customerName or "Customer",
        customer_email=order.customerEmail,
        items=order.items,
        subtotal=order.subtotal,
        discount=order.discount,
        total=order.total,
        status="confirmed",
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return new_order.to_dict()


@app.get("/api/orders")
def list_orders(limit: int = 50, db: Session = Depends(get_db)):
    orders = db.query(models.Order).order_by(models.Order.id.desc()).limit(limit).all()
    return [o.to_dict() for o in orders]


@app.post("/api/upload")
def upload_file(file: UploadFile = File(...)):
    filename = f"{uuid.uuid4().hex}_{file.filename.replace(' ', '_')}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "url": f"/uploads/{filename}",
        "filename": filename
    }


DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(os.path.join(DATA_DIR, "colors"), exist_ok=True)


@app.get("/api/render-settings")
def get_render_settings():
    path = os.path.join(DATA_DIR, "render_settings.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "primaryIntensity": 1.00,
        "primaryColor": "#fffdf5",
        "sunAngle": -60,
        "sunHeight": 6.0,
        "secIntensity": 0.80,
        "secColor": "#dbeafe",
        "secAngle": -5,
        "secHeight": 7.0,
        "ambientIntensity": 0.10,
        "ambientColor": "#ffffff",
        "lightIntensity": 1.00,
        "brightness": 1.00,
        "contrast": 1.25,
        "hue": 0.0,
        "saturation": 1.00,
        "lightness": 1.00,
    }


@app.put("/api/render-settings")
def save_render_settings(payload: Dict[str, Any]):
    path = os.path.join(DATA_DIR, "render_settings.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    return payload


@app.get("/api/colors/{tab}")
def get_colors(tab: str):
    path = os.path.join(DATA_DIR, "colors", f"{tab.lower()}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Color palette not found")


@app.put("/api/{tab}/go")
@app.put("/api/colors/{tab}")
def update_colors(tab: str, payload: Dict[str, Any]):
    path = os.path.join(DATA_DIR, "colors", f"{tab.lower()}.json")
    current = {}
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                current = json.load(f)
        except Exception:
            current = {}

    if "items" in payload:
        items = payload.get("items", [])
        deleted = set(payload.get("deleted", []))
        new_data = {k: v for k, v in current.items() if k not in deleted}
        for item in items:
            old_k = (item.get("old_key") or "").strip()
            new_k = (item.get("new_key") or "").strip()
            if not new_k:
                continue
            if old_k and old_k != new_k and old_k in new_data:
                del new_data[old_k]
            new_data[new_k] = {
                "bg": item.get("bg_color") or item.get("bg") or "#ffffff",
                "text": item.get("text_color") or item.get("text") or "#000000"
            }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(new_data, f, indent=2)
        return {"status": "ok"}
    else:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        return {"status": "ok"}


@app.get("/api/3d-transforms")
def get_3d_transforms():
    path = os.path.join(DATA_DIR, "3d_transforms.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "base": {"x": -0.60, "y": -0.35, "z": 0.10, "rx": 0.10472, "rxDeg": 6.0, "scaleX": 1.14, "scaleZ": 1.14},
        "clusterOffsets": {
            "nav_cluster": {"x": -0.42, "z": 0.00},
            "arrow_cluster": {"x": -0.16, "z": -0.09},
            "rctl": {"x": -0.67, "z": 0.00}
        }
    }


@app.put("/api/3d-transforms")
def save_3d_transforms(payload: Dict[str, Any]):
    path = os.path.join(DATA_DIR, "3d_transforms.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    return {"status": "ok", "data": payload}

