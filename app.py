from flask import Flask, request, jsonify
from models import db, ClientCompany, User, Equipment, EquipmentItem, POC, POCEquipment
import re

from dotenv import load_dotenv
import os

load_dotenv()  # carga variables de .env
DATABASE_URL = os.getenv("DATABASE_URL")

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)


# ---------------- CLIENT_COMPANY ----------------
@app.route('/client_company', methods=['GET'])
def get_client_companies():
    
    min_id = request.args.get('min_id', type=int)
    max_id = request.args.get('max_id', type=int)
    company_name = request.args.get('company_name', type=str)
    manager = request.args.get('manager', type=str)
    
    query = ClientCompany.query
    
    if min_id is not None:
        query = query.filter(ClientCompany.client_company_id >= min_id)
    
    if max_id is not None:
        query = query.filter(ClientCompany.client_company_id <= max_id)
        
    if company_name:
        query = query.filter(ClientCompany.company_name.ilike(f"%{company_name}%"))
    
    if manager:
        query = query.filter(ClientCompany.manager_client_name.ilike(f"%{manager}%"))
    
    companies = query.all()
    
    return jsonify([{'id': c.client_company_id, 'name': c.company_name, 'manager': c.manager_client_name} for c in companies])

@app.route('/client_company/<int:id>', methods=['GET'])
def obtener_company(id):
    companies = ClientCompany.query.get(id)
    if not companies:
        return jsonify({"error": "Compañia no encontrada"}), 404
    return jsonify({'id': companies.client_company_id, 'name': companies.company_name, 'manager': companies.manager_client_name})


def validar_client_company(comp_data, index=None, is_update=False, current_id=None):
    """
    Valida los datos de client_company.
    - is_update: True si es para PUT (actualización).
    - current_id: id de la compañía que se está actualizando (solo en PUT).
    """

    # company_name
    name = comp_data.get('company_name')
    if not is_update:  # En POST es obligatorio
        if not name:
            return {"index": index, "error": "company_name vacío."}
        elif not re.match(r'^[A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]+$', name):
            return {"index": index, "error": "company_name inválido (solo letras, números y espacios)."}
        # Checar unicidad
        existing = ClientCompany.query.filter_by(company_name=name).first()
        if existing:
            return {"index": index, "error": f"company_name '{name}' ya existe."}
    else:
        # En PUT puede ser opcional
        if name:
            if not re.match(r'^[A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]+$', name):
                return {"index": index, "error": "company_name inválido (solo letras, números y espacios)."}
            # Checar unicidad solo si pertenece a otra compañía
            existing = ClientCompany.query.filter_by(company_name=name).first()
            if existing and existing.client_company_id != current_id:
                return {"index": index, "error": f"company_name '{name}' ya existe."}
        else:
            # Si no mandan company_name en PUT, mantener el existente
            name = None

    # manager_client_name
    manager = comp_data.get('manager_client_name')
    if not is_update or manager is not None:  # En POST obligatorio, en PUT si viene debe validarse
        if not manager:
            return {"index": index, "error": "manager_client_name vacío."}
        elif not re.match(r'^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+$', manager):
            return {"index": index, "error": "manager_client_name inválido (solo letras y espacios)."}

    # hpe_rep_id
    hpe = comp_data.get('hpe_rep_id')
    if hpe not in (None, ""):
        try:
            hpe = int(hpe)
        except (ValueError, TypeError):
            return {"index": index, "error": "hpe_rep_id debe ser numérico."}
    else:
        hpe = None

    return {
        "company_name": name,
        "manager_client_name": manager,
        "hpe_rep_id": hpe
    }


@app.route('/client_company', methods=['POST'])
def create_client_company():
    data = request.get_json()
    if data is None:
        return jsonify({"error": "Faltan datos"}), 400

    if not isinstance(data, list):
        data = [data]  

    created = []
    errors = []

    for index, comp_data in enumerate(data):
        if not isinstance(comp_data, dict):
            errors.append({"index": index, "error": "Cada item debe ser un objeto JSON"})
            continue

        resultado = validar_client_company(comp_data, index=index, is_update=False)
        if "error" in resultado:
            errors.append(resultado)
            continue

        company = ClientCompany(**resultado)
        db.session.add(company)
        db.session.flush()  # para obtener id
        created.append({
            "index": index,
            "id": company.client_company_id,
            "company_name": resultado["company_name"]
        })

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al guardar en BD", "detail": str(e)}), 500

    return jsonify({"created": created, "errors": errors}), 201


@app.route('/client_company/<int:id>', methods=['PUT'])
def update_client_company(id):
    company = ClientCompany.query.get(id)
    if not company:
        return jsonify({"error": "Compañía no encontrada"}), 404

    data = request.get_json()
    if not isinstance(data, dict):
        return jsonify({"error": "Debe enviar un objeto JSON"}), 400

    resultado = validar_client_company(data, index=0, is_update=True, current_id=id)
    if "error" in resultado:
        return jsonify(resultado), 400

    # Actualizamos solo campos enviados
    for key, value in resultado.items():
        if value is not None:
            setattr(company, key, value)

    db.session.commit()
    return jsonify({"message": "Compañía actualizada", "id": company.client_company_id, "company":company.company_name})


@app.route('/client_company/<int:id>', methods=['DELETE'])
def delete_client_company(id):
    company = ClientCompany.query.get_or_404(id)
    db.session.delete(company)
    db.session.commit()
    return jsonify({'message': 'Compañia Eliminada'})

# ---------------- USERS ----------------
@app.route('/users', methods=['GET'])
def get_users():
    min_id = request.args.get('min_id', type=int)
    max_id = request.args.get('max_id', type=int)
    name = request.args.get('name', type=str)

    query = User.query

    if min_id is not None:
        query = query.filter(User.user_id >= min_id)

    if max_id is not None:
        query = query.filter(User.user_id <= max_id)

    if name:
        query = query.filter(User.name.ilike(f"%{name}%"))

    users = query.all()

    return jsonify([
        {'id': u.user_id, 'name': u.name, 'role': u.role, 'mail': u.mail}
        for u in users
    ])

@app.route('/users/<int:id>', methods=['GET'])
def obtener_usuario(id):
    users = User.query.get(id)
    if not users:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify({'id': users.user_id, 'name': users.name, 'role': users.role, 'mail':users.mail})


ROLES = ['HPE_REP', 'HPE_MANAGER', 'CLIENT']
#Funcion de validacion de datos
def validar_usuario(user_data, index=0):


    # name
    if not user_data.get('name'):
        return {"index": index, "error": "Nombre vacío."}
    elif not re.match(r'^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+$', user_data['name']):
        return {"index": index, "error": "Nombre inválido (solo letras y espacios)."}

    # mail
    if not user_data.get('mail'):
        return {"index": index, "error": "Correo vacío."}
    elif not re.match(r'^[^@]+@[^@]+\.[^@]+$', user_data['mail']):
        return {"index": index, "error": "Correo inválido."}

    # password
    if not user_data.get('password'):
        return {"index": index, "error": "Contraseña vacía."}
    elif len(user_data['password']) < 6:
        return {"index": index, "error": "La contraseña debe tener mínimo 6 caracteres."}

    # role
    role = user_data.get('role')
    if not role:
        return {"index": index, "error": "El rol es obligatorio."}
    if role not in ROLES:
        return {"index": index, "error": f"Rol inválido. Solo se permiten: {', '.join(ROLES)}."}

    # client_company_id
    if user_data.get('client_company_id') is not None:
        try:
            int(user_data.get('client_company_id'))
        except ValueError:
            return {"index": index, "error": "El client_company_id debe ser un número."}

    # Si todo está bien, devolver datos limpios
    return {
        "client_company_id": user_data.get('client_company_id'),
        "reports_to": user_data.get('reports_to'),
        "mail": user_data.get('mail'),
        "password": user_data.get('password'),
        "role": role,
        "name": user_data.get('name'),
        "session_started": user_data.get('session_started', False)
    }


# Crear usuarios validados
@app.route('/users', methods=['POST'])
def create_users():
    data = request.json
    if not isinstance(data, list):
        data = [data]

    created_users = []
    errors = []

    for index, user_data in enumerate(data):
        resultado = validar_usuario(user_data, index)
        if isinstance(resultado, dict) and "error" in resultado:
            errors.append(resultado)
            continue

        # Si pasó validaciones, crear usuario
        user = User(**resultado)
        db.session.add(user)
        db.session.flush()
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
    user = User.query.get(id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.json

    # Validar que venga un objeto JSON y no una lista
    if not isinstance(data, dict):
        return jsonify({"error": "Ingresa un diccionario para aceptarlo..."}), 400

    # Validar datos usando la función de validación
    resultado = validar_usuario(data)
    if isinstance(resultado, dict) and "error" in resultado:
        return jsonify(resultado), 400

    # Actualizamos atributos del usuario
    for key, value in resultado.items():
        setattr(user, key, value)

    db.session.commit()
    return jsonify({"message": "Usuario actualizado", "id": user.user_id})

@app.route('/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Usuario eliminado...'})

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
    return jsonify({'message': 'Equipment item actualizado'})

@app.route('/equipment_items/<int:id>', methods=['DELETE'])
def delete_equipment_item(id):
    equipment_item = EquipmentItem.query.get_or_404(id)
    db.session.delete(equipment_item)
    db.session.commit()
    return jsonify({'message': 'Equipment item eeliminado'})


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
    return jsonify({'message': 'POC eliminado'})


# ---------------- POC_EQUIPMENT ----------------
@app.route('/poc_equipment', methods=['GET'])
def get_poc_equipment():
    poc_equipment = POCEquipment.query.all()
    return jsonify([
        {
            'poc_id': pe.poc_id,
            'solution_id': pe.solution_id
        } for pe in poc_equipment
    ])

@app.route('/poc_equipment/<int:poc_id>', methods=['GET'])
def get_poc_equipment_by_poc(poc_id):
    poc_equipment = POCEquipment.query.filter_by(poc_id=poc_id).all()
    if not poc_equipment:
        return jsonify({'message': 'Equipment no encontrado para esta POC'}), 404
    
    return jsonify([
        {
            'poc_id': pe.poc_id,
            'solution_id': pe.solution_id
        } for pe in poc_equipment
    ])

@app.route('/poc_equipment', methods=['POST'])
def create_poc_equipment():
    data = request.json
    pe = POCEquipment(
        poc_id=data['poc_id'],
        solution_id=data['solution_id']
    )
    db.session.add(pe)
    db.session.commit()
    return jsonify({'message': 'poc_equipment creada'}), 201

@app.route('/poc_equipment/<int:poc_id>/<int:solution_id>', methods=['DELETE'])
def delete_poc_equipment(poc_id, solution_id):
    pe = POCEquipment.query.filter_by(poc_id=poc_id, solution_id=solution_id).first_or_404()
    db.session.delete(pe)
    db.session.commit()
    return jsonify({'message': 'POC Equipment eliminada'})


if __name__ == '__main__':
    app.run(debug=True)
