from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, JSON
from database import Base

class SwitchPersona(Base):
    __tablename__ = "switches"

    id = Column(String(64), primary_key=True, index=True)
    label = Column(String(100), nullable=False)
    tagline = Column(String(200), nullable=False)
    switch_name = Column(String(200), nullable=False)
    switch_spec = Column(String(200), nullable=False)
    badge = Column(String(50), nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    description = Column(Text, nullable=False)
    features = Column(JSON, nullable=False, default=list)
    image = Column(String(500), nullable=False)
    accent = Column(String(50), nullable=False, default="#60a5fa")
    accent_dim = Column(String(50), nullable=False, default="rgba(96,165,250,0.15)")
    order_index = Column(Integer, default=0)
    specs = Column(JSON, nullable=True, default=dict)

    def to_dict(self):
        return {
            "id": self.id,
            "label": self.label,
            "tagline": self.tagline,
            "switchName": self.switch_name,
            "switchSpec": self.switch_spec,
            "badge": self.badge or "",
            "price": self.price,
            "description": self.description,
            "features": self.features or [],
            "image": self.image,
            "accent": self.accent,
            "accentDim": self.accent_dim,
            "specs": self.specs or {},
        }

class Keycap(Base):
    __tablename__ = "keycaps"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    subtitle = Column(String(200), nullable=False)
    badge = Column(String(50), nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    description = Column(Text, nullable=False)
    image = Column(String(500), nullable=False)
    accent = Column(String(50), nullable=False, default="#e8e8e8")
    order_index = Column(Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "subtitle": self.subtitle,
            "badge": self.badge or "",
            "price": self.price,
            "description": self.description,
            "image": self.image,
            "accent": self.accent,
        }

class Cable(Base):
    __tablename__ = "cables"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    subtitle = Column(String(200), nullable=False)
    badge = Column(String(50), nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    description = Column(Text, nullable=False)
    image = Column(String(500), nullable=False)
    accent = Column(String(50), nullable=False, default="#CAFF00")
    order_index = Column(Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "subtitle": self.subtitle,
            "badge": self.badge or "",
            "price": self.price,
            "description": self.description,
            "image": self.image,
            "accent": self.accent,
        }

class SiteTranslation(Base):
    __tablename__ = "translations"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, nullable=False)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    order_code = Column(String(64), unique=True, index=True, nullable=False)
    customer_name = Column(String(100), nullable=True)
    customer_email = Column(String(100), nullable=True)
    items = Column(JSON, nullable=False)
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, nullable=False, default=0.0)
    total = Column(Float, nullable=False)
    status = Column(String(50), default="confirmed")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "orderCode": self.order_code,
            "customerName": self.customer_name,
            "customerEmail": self.customer_email,
            "items": self.items,
            "subtotal": self.subtotal,
            "discount": self.discount,
            "total": self.total,
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
