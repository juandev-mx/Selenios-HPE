from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class ClientCompany(db.Model):
    __tablename__ = 'client_company'
    client_company_id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(255), nullable=False)
    manager_client_name = db.Column(db.String(255))
    hpe_rep_id = db.Column(db.Integer)

    users = db.relationship('User', backref='client_company', lazy=True)


class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    client_company_id = db.Column(db.Integer, db.ForeignKey('client_company.client_company_id'), nullable=False)
    reports_to = db.Column(db.Integer)  # podría ser otro user_id
    mail = db.Column(db.String(255))
    password = db.Column(db.String(255))
    role = db.Column(db.String(100))
    name = db.Column(db.String(255), nullable = False)
    session_started = db.Column(db.Boolean, default=False)

    equipments_created = db.relationship('Equipment', backref='creator', lazy=True)
    pocs_client_user = db.relationship('POC', backref='client_user', lazy=True)


class Equipment(db.Model):
    __tablename__ = 'equipment'
    solution_id = db.Column(db.Integer, primary_key=True)
    product_number = db.Column(db.String(255))
    product_description = db.Column(db.Text)
    company_program = db.Column(db.String(255))
    price = db.Column(db.Numeric)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'))

    items = db.relationship('EquipmentItem', backref='equipment', lazy=True)
    poc_equipments = db.relationship('POCEquipment', backref='equipment', lazy=True)


class EquipmentItem(db.Model):
    __tablename__ = 'equipment_items'
    item_id = db.Column(db.Integer, primary_key=True)
    solution_id = db.Column(db.Integer, db.ForeignKey('equipment.solution_id'), nullable=False)
    product_number = db.Column(db.String(255))
    product_name = db.Column(db.String(255))
    qty = db.Column(db.Integer)
    unit_price = db.Column(db.Numeric)


class POC(db.Model):
    __tablename__ = 'pocs'
    poc_id = db.Column(db.Integer, primary_key=True)
    client_user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    business_justification = db.Column(db.Text)
    is_approved = db.Column(db.Boolean, default=False)
    completion_date = db.Column(db.Date)
    created_date = db.Column(db.Date)

    poc_equipments = db.relationship('POCEquipment', backref='poc', lazy=True)


class POCEquipment(db.Model):
    __tablename__ = 'poc_equipment'
    poc_id = db.Column(db.Integer, db.ForeignKey('pocs.poc_id'), primary_key=True)
    solution_id = db.Column(db.Integer, db.ForeignKey('equipment.solution_id'), primary_key=True)