from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import json
# from datetime import datetime, date
import datetime
import os
from flask_cors import CORS
import random
from sqlalchemy.types import JSON
from sqlalchemy import inspect
import pytz
from sqlalchemy import create_engine, MetaData, Table, select, insert
from sqlalchemy.sql import func, text
from psycopg2.extras import Json
from datetime import timedelta
from flask import Flask, jsonify, request
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
import logging
import re
from flask_cors import CORS
from paramiko import SSHClient, AutoAddPolicy
from scp import SCPClient
import time
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy import Column

app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)
app.secret_key = 'webscrap-secret-token'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=15)
app.config['JWT_SECRET_KEY'] = 'webscrap-jwt-secret-key'
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'static')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

from dotenv import load_dotenv
load_dotenv()

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:myPass@31.97.76.62:5432/webscrap_db'
print('✅ HARDCODED DATABASE_URL:', app.config['SQLALCHEMY_DATABASE_URI'])
db = SQLAlchemy(app)

jwt = JWTManager(app)


CORS(app)

def generate_datetime_id():
    now = datetime.datetime.utcnow()
    timestamp_str = now.strftime("%Y%m%d%H%M%S%f")  # năm tháng ngày giờ phút giây micro giây
    random_str = ''.join(random.choices('0123456789abcdef', k=6))  # thêm 6 ký tự hex ngẫu nhiên
    return timestamp_str + random_str



def save_dump():
    # Kết nối SSH tới server Linux
    ssh = SSHClient()
    ssh.set_missing_host_key_policy(AutoAddPolicy())
    ssh.connect('127.0.0.1', username='root', password='@baoLong0511')

    now = datetime.datetime.now()
    timestamp = now.strftime("%y_%m_%d_%H_%M")

    remote_dump_path = f"/root/backup/webscrap_db_{timestamp}.dump"
    print("Dump file remote:", remote_dump_path)

    # Thực thi lệnh pg_dump trên server Linux
    pg_dump_cmd = f"pg_dump -U postgres -d webscrap_db -F c -f {remote_dump_path}"
    env_cmd = f"PGPASSWORD=myPass {pg_dump_cmd}"
    stdin, stdout, stderr = ssh.exec_command(env_cmd)

    # Đợi lệnh hoàn thành
    exit_status = stdout.channel.recv_exit_status()
    if exit_status == 0:
        print("Dump database thành công trên server.")
    else:
        error = stderr.read().decode()
        print("Lỗi khi dump database:", error)
        ssh.close()
        return

    # Tải file dump về local Windows
    local_folder = "./backup"
    os.makedirs(local_folder, exist_ok=True)
    local_dump_path = os.path.join(local_folder, f"webscrap_db_{timestamp}.dump")

    scp = SCPClient(ssh.get_transport())
    scp.get(remote_dump_path, local_dump_path)
    print(f"Đã tải file dump về: {local_dump_path}")

    scp.close()
    ssh.close()

def periodic_save_dump(interval_minutes=30):
    while True:
        # Gọi hàm save_dump hoặc tác vụ của bạn ở đây
        save_dump()
        time.sleep(interval_minutes * 60) 

class BaseModel(db.Model):
    __abstract__ = True

    deletedAt = db.Column(db.DateTime, nullable=True)
    createdAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    version = db.Column(db.Integer)

    def get_date(self):
        tz = pytz.timezone("Asia/Ho_Chi_Minh")  # múi giờ GMT+7
        # now = datetime.utcnow().replace(tzinfo=pytz.utc).astimezone(tz)
        return self.createdAt.replace(tzinfo=pytz.utc).astimezone(tz).date()
    
class Role(BaseModel):
    __tablename__ = 'role'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    permissions = db.Column(JSON)  # lưu list permissions
    name = db.Column(db.String(255))
    # lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    # lead = db.relationship('LeadPayload', backref='roles')

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result

    @staticmethod
    def create_item(params):
        item = Role(**params)
        # item.id = generate_datetime_id()
        db.session.add(item)
        db.session.commit()
        return item

class User(BaseModel):
    __tablename__ = 'user'

    id = db.Column(db.String(50), primary_key=True)    
    username = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50))
    role_id = db.Column(db.Integer)
    type = db.Column(db.String(50))
    hashKey = db.Column(db.String(255))
    fullName = db.Column(db.String(255))
    salary = db.Column(db.Integer)
    phone = db.Column(db.String(20))
    avatar = db.Column(db.String(255))

    is_authenticated = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=False)
    is_anonymous = db.Column(db.Boolean, default=False)
    balanceAmount = db.Column(db.String(80), nullable=True)
    
    firstName = db.Column(db.String(80), nullable=True)
    lastName = db.Column(db.String(80), nullable=True)
    icon = db.Column(db.String)
    companyName = db.Column(db.String(80), nullable=True)
    localeCode = db.Column(db.String(80), nullable=True)
    languageCode = db.Column(db.String(80), nullable=True)
    socialInfor = db.Column(db.JSON)
    orderWebhook = db.Column(db.String(255), nullable=True)
    cryptoAddressList = db.Column(db.JSON)
    selectedProvider = db.Column(db.JSON)
    selectedServices = db.Column(db.JSON)

    gender = db.Column(db.Integer)
    address = db.Column(db.String(255))
    citizenId = db.Column(db.String(80))
    email = db.Column(db.String(80))
    facebookAccount = db.Column(db.String(80))
    bankAccount = db.Column(db.String(80))
    referrer = db.Column(db.String(80))

    taxCode = db.Column(db.String(50))

    # workpoints = db.relationship('Workpoint', backref='user', lazy=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref=db.backref('users', lazy='dynamic'))

    def update_role(self):
        role = db.session.get(Role, self.role_id)

        if role:
            return role.tdict()

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value

        result["role"] = self.update_role()

        return result
    
    @staticmethod
    def create_item(params):
        allowed_keys = set(c.name for c in User.__table__.columns)
        filtered_params = {k: v for k, v in params.items() if k in allowed_keys}

        # Xử lý role
        if params.get("role"):
            role = Role.query.filter_by(name=params.get("role")).first()
            if role:
                filtered_params["role_id"] = role.id

        if "role_id" not in filtered_params:
            filtered_params["role_id"] = 0

        # Chuyển giá trị gender từ string sang số
        gender_map = {
            "female": 1,
            "male": 0,
            "other": 2
        }
        if "gender" in filtered_params and isinstance(filtered_params["gender"], str):
            filtered_params["gender"] = gender_map.get(filtered_params["gender"].lower(), filtered_params["gender"])

        filtered_params["id"] = generate_datetime_id()

        return User(**filtered_params)


class UsingHistoryData(db.Model):
    __tablename__ = 'using'
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'), nullable=False)
    start_time = db.Column(db.Date)
    end_time = db.Column(db.Date)
    balance_amount = db.Column(db.Float)

class LeadPayload(BaseModel):
    __tablename__ = 'lead'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(120), nullable=True)
    # fullName = db.Column(db.String(120), nullable=False)

    user_id = db.Column(db.String(50), nullable=True)
    isInvited = db.Column(db.Boolean, default = False)
    isActivated = db.Column(db.Boolean, default = False)

    company = db.Column(db.String(120), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    description = db.Column(db.Text)
    industry = db.Column(db.String(100), nullable=True)
    companySize = db.Column(db.String(50), nullable=True)
    expiredAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    balance_amount = db.Column(db.Float)

    column_open_name = db.Column(db.String(255), default="Đơn hàng")
    column_in_progress_name = db.Column(db.String(255), default="Phân việc")
    column_done_name = db.Column(db.String(255), default="Thực hiện")
    column_reward_name = db.Column(db.String(255), default="Hoàn thiện")

    # Quan hệ 1-n: một Lead có nhiều historyUsing
    history_using = db.relationship('UsingHistoryData', backref='lead', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Lead {self.name}>'
    
    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.date().isoformat() if isinstance(value, datetime.datetime) else value.isoformat()

            result[column.name] = value

        user = db.session.get(User, self.user_id)
        if user:
            result["username"] = user.username
            result["password"] = user.password
            result["fullName"] = user.fullName
        return result

    @staticmethod
    def create_item(params):
        item = LeadPayload(**params)
        db.session.add(item)
        db.session.commit()
        return item
    

class ProductPrice(BaseModel):
    __tablename__ = 'product_price'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    product_id = db.Column(db.Integer)
    value = db.Column(db.String(120), nullable=True)

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.date().isoformat() if isinstance(value, datetime.datetime) else value.isoformat()

            result[column.name] = value
        return result
    
    @staticmethod
    def create_item(params):
        item = ProductPrice(**params)
        db.session.add(item)
        db.session.commit()
        return item

class Product(BaseModel):
    __tablename__ = 'product'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.Text, nullable=True)

    product_id = db.Column(db.String(50), nullable=True)
    isInvited = db.Column(db.Boolean, default = False)
    isActivated = db.Column(db.Boolean, default = False)

    company = db.Column(db.String(120), nullable=True)
    category = db.Column(db.String(255), nullable=True)
    category_index = db.Column(db.Integer)
    similar_ids = Column(JSONB, default=list, nullable=True)  # ✅ KHÔNG dùng db.
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    description = db.Column(db.Text)
    industry = db.Column(db.String(100), nullable=True)
    href = db.Column(db.Text, nullable=True)
    price = db.Column(db.ARRAY(db.Integer))

    def __repr__(self):
        return f'<Lead {self.name}>'
    
    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)

            if column.name == 'product_id' and value:
                value = value.replace('Mã SP:', '').strip()

            elif isinstance(value, (datetime.datetime, datetime.date)):
                value = value.date().isoformat() if isinstance(value, datetime.datetime) else value.isoformat()

            result[column.name] = value
        
        for i, price_id in enumerate(self.price):
            price = db.session.get(ProductPrice, price_id)
            if price:
                if i == 0:
                    result['old_price'] = price.value
                elif i == 1:
                    result['price'] = price.value

        return result

    @staticmethod
    def create_item(params):
        item = Product(**params)
        db.session.add(item)
        db.session.commit()
        return item