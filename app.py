from flask import Flask, request, jsonify
from models import db, ClientCompany, User, Equipment, EquipmentItem, POC, POCEquipment
import re


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///DBSeleniosHPE.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()

# ---------------- CLIENT_COMPANY ----------------
@app.route('/client_company', methods=['GET'])
def get_client_companies():
    companies = ClientCompany.query.all()
    return jsonify([{'id': c.client_company_id, 'name': c.company_name, 'manager': c.manager_client_name} for c in companies])

@app.route('/client_company/<int:id>', methods=['GET'])
def obtener_company(id):
    companies = ClientCompany.query.get(id)
    if not companies:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify({'id': companies.client_company_id, 'name': companies.company_name, 'manager': companies.manager_client_name})

@app.route('/client_company', methods=['POST'])
def create_client_company():
    data = request.get_json()
    if data is None:
        return jsonify({"error": "Faltan datos"}), 400

    # normalizar a lista
    if not isinstance(data, list):
        data = [data]

    created = []
    errors = []

    for index, comp_data in enumerate(data):
        if not isinstance(comp_data, dict):
            errors.append({"index": index, "error": "Cada item debe ser un objeto JSON"})
            continue

        # validaciones
        name = comp_data.get('company_name')
        if not name or not re.match(r'^[A-Za-z0-9ÁÉÍÓÚÑáéíóú\s]+$', name):
            errors.append({"index": index, "error": "company_name inválido"})
            continue

        manager = comp_data.get('manager_client_name')
        if not manager and not re.match(r'^[A-Za-zÁÉÍÓÚÑáéíóú\s]+$', manager):
            errors.append({"index": index, "error": "manager_client_name inválido"})
            continue

        hpe = comp_data.get('hpe_rep_id')
        if hpe is not None:
            try:
                hpe = int(hpe)
            except (ValueError, TypeError):
                errors.append({"index": index, "error": "hpe_rep_id debe ser numérico"})
                continue

        # creación
        company = ClientCompany(
            company_name=name,
            manager_client_name=manager,
            hpe_rep_id=hpe
        )
        db.session.add(company)
        db.session.flush()   # opcional: hace INSERT ahora y nos da el id
        created.append({"index": index, "id": company.client_company_id, "company_name": name})

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al guardar en BD", "detail": str(e)}), 500

    return jsonify({"created": created, "errors": errors}), 201


#Nada
@app.route('/client_company/<int:id>', methods=['PUT'])
def update_client_company(id):
    company = ClientCompany.query.get_or_404(id)
    data = request.json
    company.company_name = data.get('company_name', company.company_name)
    company.manager_client_name = data.get('manager_client_name', company.manager_client_name)
    company.hpe_rep_id = data.get('hpe_rep_id', company.hpe_rep_id)
    db.session.commit()
    return jsonify({'message': 'Company updated'})

@app.route('/client_company/<int:id>', methods=['DELETE'])
def delete_client_company(id):
    company = ClientCompany.query.get_or_404(id)
    db.session.delete(company)
    db.session.commit()
    return jsonify({'message': 'Compañia Eliminada'})

# ---------------- USERS ----------------
@app.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{'id': u.user_id, 'name': u.name, 'role': u.role, 'mail':u.mail} for u in users])

@app.route('/users/<int:id>', methods=['GET'])
def obtener_usuario(id):
    users = User.query.get(id)
    if not users:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify({'id': users.user_id, 'name': users.name, 'role': users.role, 'mail':users.mail})

# Crear usuarios validados
@app.route('/users', methods=['POST'])
def create_users():
    data = request.json

    # Lista de roles permitidos
    ROLES = ['HPE_REP', 'HPE_MANAGER', 'CLIENT']

    # Asegurarnos de que siempre sea lista
    if not isinstance(data, list):
        data = [data]  # si el cliente manda solo un objeto, lo convertimos a lista

    created_users = []
    errors = []

    for index, user_data in enumerate(data):
        # Validaciones 
        # name
        if not user_data.get('name') or not re.match(r'^[A-ZÁÉÍÓÚa-záéíóú\s]+$', user_data['name']):
            errors.append({"index": index, "error": "Nombre inválido (solo letras y espacios)."})
            continue

        # mail
        if not user_data.get('mail') or not re.match(r'^[^@]+@[^@]+\.[^@]+$', user_data['mail']):
            errors.append({"index": index, "error": "Correo inválido."})
            continue

        # password
        if not user_data.get('password') or len(user_data['password']) < 6:
            errors.append({"index": index, "error": "La contraseña debe tener mínimo 6 caracteres."})
            continue

        # role
        role = user_data.get('role')
        if not role:
            errors.append({"index": index, "error": "El rol es obligatorio."})
            continue

        if role not in ROLES:
            errors.append({"index": index, "error": f"Rol inválido. Solo se permiten: {', '.join(ROLES)}."})
            continue

        # client_company_id
        if user_data.get('client_company_id') is not None:
            try:
                int(user_data.get('client_company_id'))
            except ValueError:
                errors.append({"index": index, "error": "El client_company_id debe ser un número."})
                continue

        # Si todo está bien, creamos el usuario
        user = User(
            client_company_id=user_data.get('client_company_id'),
            reports_to=user_data.get('reports_to'),
            mail=user_data.get('mail'),
            password=user_data.get('password'),
            role=role,
            name=user_data.get('name'),
            session_started=user_data.get('session_started', False)
        )
        db.session.add(user)
        db.session.flush()  # para obtener el ID antes del commit
        created_users.append({"id": user.user_id, "name": user.name})

    db.session.commit()

    return jsonify({
        "message": f"{len(created_users)} usuarios creados",
        "usuarios": created_users,
        "errores": errors
    }), 200


#
@app.route('/users/<int:id>', methods=['PUT'])
def update_user(id):
    user = User.query.get_or_404(id)
    data = request.json
    for field in ['client_company_id', 'reports_to', 'mail', 'password', 'role', 'name', 'session_started']:
        if field in data:
            setattr(user, field, data[field])
    db.session.commit()
    return jsonify({'message': 'User updated'})

@app.route('/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted'})

# ---------------- EQUIPMENT ----------------
@app.route('/equipment', methods=['GET'])
def get_equipment():
    equipment = Equipment.query.all()
    return jsonify([{'solution_id': e.solution_id, 'product_number': e.product_number} for e in equipment])

@app.route('/equipment', methods=['POST'])
def create_equipment():
    data = request.json
    e = Equipment(
        product_number=data.get('product_number'),
        product_description=data.get('product_description'),
        company_program=data.get('company_program'),
        price=data.get('price'),
        created_by=data.get('created_by')
    )
    db.session.add(e)
    db.session.commit()
    return jsonify({'message': 'Equipment created', 'solution_id': e.solution_id}), 201

@app.route('/equipment/<int:id>', methods=['PUT'])
def update_equipment(id):
    e = Equipment.query.get_or_404(id)
    data = request.json
    for field in ['product_number', 'product_description', 'company_program', 'price', 'created_by']:
        if field in data:
            setattr(e, field, data[field])
    db.session.commit()
    return jsonify({'message': 'Equipment updated'})

@app.route('/equipment/<int:id>', methods=['DELETE'])
def delete_equipment(id):
    e = Equipment.query.get_or_404(id)
    db.session.delete(e)
    db.session.commit()
    return jsonify({'message': 'Equipment deleted'})


# ---------------- EQUIPMENT ITEMS ----------------
@app.route('/equipment_items', methods=['GET'])
def get_equipment_items():
    equipment_items = EquipmentItem.query.all()
    return jsonify([{'item_id': e.item_id, 'solution_id': e.solution_id, 'product_number': e.product_number, 'product_name': e.product_name, 'qty': e.qty, 'unit_price': e.unit_price} for e in equipment_items])

@app.route('/equipment_items', methods=['POST'])
def create_equipment_item():
    data = request.json
    equipment_item = EquipmentItem(
        solution_id=data['solution_id'],
        product_number=data.get('product_number'),
        product_name=data.get('product_name'),
        qty=data.get('qty', 1),
        unit_price=data.get('unit_price', 0.0)
    )
    db.session.add(equipment_item)
    db.session.commit()
    return jsonify({'message': 'Equipment item created', 'item_id': equipment_item.item_id}), 201

@app.route('/equipment_items/<int:id>', methods=['PUT'])
def update_equipment_item(id):
    equipment_item = EquipmentItem.query.get_or_404(id)
    data = request.json
    for field in ['solution_id', 'product_number', 'product_name', 'qty', 'unit_price']:
        if field in data:
            setattr(equipment_item, field, data[field])
    db.session.commit()
    return jsonify({'message': 'Equipment item updated'})

@app.route('/equipment_items/<int:id>', methods=['DELETE'])
def delete_equipment_item(id):
    equipment_item = EquipmentItem.query.get_or_404(id)
    db.session.delete(equipment_item)
    db.session.commit()
    return jsonify({'message': 'Equipment item deleted'})


# ---------------- POC ----------------
@app.route('/pocs', methods=['GET'])
def get_pocs():
    pocs = POC.query.all()
    return jsonify([{'poc_id': p.poc_id, 'business_justification': p.business_justification} for p in pocs])

@app.route('/pocs', methods=['POST'])
def create_poc():
    data = request.json
    poc = POC(
        client_user_id=data['client_user_id'],
        business_justification=data.get('business_justification'),
        is_approved=data.get('is_approved', False),
        completion_date=data.get('completion_date'),
        created_date=data.get('created_date')
    )
    db.session.add(poc)
    db.session.commit()
    return jsonify({'message': 'POC created', 'poc_id': poc.poc_id}), 201

@app.route('/pocs/<int:id>', methods=['PUT'])
def update_poc(id):
    poc = POC.query.get_or_404(id)
    data = request.json
    for field in ['client_user_id', 'business_justification', 'is_approved', 'completion_date', 'created_date']:
        if field in data:
            setattr(poc, field, data[field])
    db.session.commit()
    return jsonify({'message': 'POC updated'})

@app.route('/pocs/<int:id>', methods=['DELETE'])
def delete_poc(id):
    poc = POC.query.get_or_404(id)
    db.session.delete(poc)
    db.session.commit()
    return jsonify({'message': 'POC deleted'})

# ---------------- POC_EQUIPMENT ----------------
@app.route('/poc_equipment', methods=['POST'])
def create_poc_equipment():
    data = request.json
    pe = POCEquipment(
        poc_id=data['poc_id'],
        solution_id=data['solution_id']
    )
    db.session.add(pe)
    db.session.commit()
    return jsonify({'message': 'POCEquipment created'}), 201

@app.route('/poc_equipment/<int:poc_id>/<int:solution_id>', methods=['DELETE'])
def delete_poc_equipment(poc_id, solution_id):
    pe = POCEquipment.query.filter_by(poc_id=poc_id, solution_id=solution_id).first_or_404()
    db.session.delete(pe)
    db.session.commit()
    return jsonify({'message': 'POCEquipment deleted'})

if __name__ == '__main__':
    app.run(debug=True)