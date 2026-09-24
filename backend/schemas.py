from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class SwitchSchema(BaseModel):
    id: str
    label: str
    tagline: str
    switchName: str
    switchSpec: str
    badge: Optional[str] = ""
    price: float
    description: str
    features: List[str] = []
    image: str
    accent: str
    accentDim: Optional[str] = ""
    specs: Optional[Dict[str, Any]] = None

class KeycapSchema(BaseModel):
    id: str
    name: str
    subtitle: str
    badge: Optional[str] = ""
    price: float
    description: str
    image: str
    accent: str

class CableSchema(BaseModel):
    id: str
    name: str
    subtitle: str
    badge: Optional[str] = ""
    price: float
    description: str
    image: str
    accent: str

class StoreDataResponse(BaseModel):
    switchPersonas: List[SwitchSchema]
    keycaps: List[KeycapSchema]
    cables: List[CableSchema]
    translations: Dict[str, str]

class OrderItem(BaseModel):
    id: str
    name: str
    type: str  # switches, keycaps, cable
    price: float
    config: Optional[Dict[str, Any]] = None

class OrderCreate(BaseModel):
    customerName: Optional[str] = "Customer"
    customerEmail: Optional[str] = None
    items: Dict[str, Any]
    subtotal: float
    discount: float = 0.0
    total: float

class OrderResponse(BaseModel):
    id: int
    orderCode: str
    customerName: Optional[str]
    customerEmail: Optional[str]
    items: Dict[str, Any]
    subtotal: float
    discount: float
    total: float
    status: str
    createdAt: Optional[str]
