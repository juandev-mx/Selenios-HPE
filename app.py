from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from models import db, ClientCompany, User, Equipment, EquipmentItem, POC, POCEquipment
from analytics import analytics_bp
import re

from dotenv import load_dotenv
import os
# comentario para que les carguen los archivos...................
load_dotenv() 
DATABASE_URL = os.getenv("DATABASE_URL")
#te sale esto abraham??
app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')

# Habilitar CORS para desarrollo
CORS(app)
app.register_blueprint(analytics_bp)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# ---------------- RUTAS HTML ----------------
@app.route('/')
def index():
    return render_template('login.html')

@app.route('/login.html')
def login_page():
    return render_template('login.html')

@app.route('/solutions_catalog.html')
def solutions_catalog():
    return render_template('solutions_catalog.html')


@app.route('/crear_cuenta.html')
def crear_cuenta_page():
    return render_template('crear_cuenta.html')

@app.route('/home_cliente.html')
def client_dashboard():
    return render_template('home_cliente.html')

@app.route('/pocs_clientes.html')
def pocs_clientes():
    return render_template('pocs_clientes.html')

@app.route('/PocsHPEManager.html')
def hpe_pocs():
    return render_template('PocsHPEManager.html')

# Ruta alternativa
@app.route('/home_hpe.html')
def home_hpe():
    return render_template('home_hpe.html')

# ---------------- LOGIN ----------------
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Faltan datos"}), 400
    
    mail = data.get('mail')
    password = data.get('password')
    
    if not mail or not password:
        return jsonify({"error": "Correo y contraseña son requeridos"}), 400
    
    # Buscar usuario por correo
    user = User.query.filter_by(mail=mail).first()
    
    if not user:
        return jsonify({"error": "Credenciales inválidas"}), 401
    
    # Verificar contraseña
    if user.password != password:
        return jsonify({"error": "Credenciales inválidas"}), 401
    
    # Actualizar session_started a True
    user.session_started = True
    db.session.commit()
    
    # Obtener información de la compañía si es cliente
    company_name = None
    if user.client_company_id:
        company = ClientCompany.query.get(user.client_company_id)
        if company:
            company_name = company.company_name
    
    return jsonify({
        "message": "Login exitoso",
        "user": {
            "id": user.user_id,
            "name": user.name,
            "mail": user.mail,
            "role": user.role,
            "client_company_id": user.client_company_id,
            "company_name": company_name,
            "reports_to": user.reports_to
        }
    }), 200

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Faltan datos"}), 400
    
    # Validar campos requeridos
    required_fields = ['name', 'mail', 'password', 'company_name']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"El campo {field} es requerido"}), 400
    
    # Verificar si el correo ya existe
    existing_user = User.query.filter_by(mail=data['mail']).first()
    if existing_user:
        return jsonify({"error": "El correo electrónico ya está registrado"}), 400
    
    # Verificar si la compañía existe, si no, crearla
    company = ClientCompany.query.filter(
        db.func.lower(db.func.trim(ClientCompany.company_name)) == company_name.lower().strip()
        ).first()
    
    if not company:
        # Crear nueva compañía
        company = ClientCompany(
            company_name=data['company_name'],
            manager_client_name=data['name']
        )
        db.session.add(company)
        db.session.flush()
    
    # Crear nuevo usuario con rol CLIENT
    new_user = User(
        name=data['name'],
        mail=data['mail'],
        password=data['password'],
        role='CLIENT',
        client_company_id=company.client_company_id,
        session_started=False
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            "message": "Usuario registrado exitosamente",
            "user": {
                "id": new_user.user_id,
                "name": new_user.name,
                "mail": new_user.mail,
                "role": new_user.role,
                "company_name": company.company_name
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al registrar usuario", "detail": str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"error": "user_id requerido"}), 400
    
    user = User.query.get(user_id)
    if user:
        user.session_started = False
        db.session.commit()
        return jsonify({"message": "Logout exitoso"}), 200
    
    return jsonify({"error": "Usuario no encontrado"}), 404


# ---------------- CLIENT_COMPANY ----------------
@app.route('/client_company', methods=['GET'])
def get_client_companies():

    allowed_filters = {"min_id", "max_id", "company_name", "manager", "hpe_rep_id"}

    unexpected_filters = set(request.args.keys()) - allowed_filters
    if unexpected_filters:
        return jsonify({"error": f"Filtro no esperado: {', '.join(unexpected_filters)}"}), 400

    min_id = request.args.get('min_id', type=int)
    max_id = request.args.get('max_id', type=int)
    hpe_rep_id = request.args.get('hpe_rep_id', type=int)
    company_name = request.args.get('company_name', type=str)
    manager = request.args.get('manager', type=str)

    query = ClientCompany.query

    if min_id is not None:
        query = query.filter(ClientCompany.client_company_id >= min_id)

    if max_id is not None:
        query = query.filter(ClientCompany.client_company_id <= max_id)

    if hpe_rep_id is not None:
        query = query.filter(ClientCompany.hpe_rep_id == hpe_rep_id)

    if company_name:
        query = query.filter(ClientCompany.company_name.ilike(f"%{company_name}%"))

    if manager:
        query = query.filter(ClientCompany.manager_client_name.ilike(f"%{manager}%"))

    companies = query.all()

    return jsonify([
        {
            'id': c.client_company_id,
            'name': c.company_name,
            'manager': c.manager_client_name,
            'hpe_rep_id' : c.hpe_rep_id
        } for c in companies
    ])

@app.route('/client_company/<int:id>', methods=['GET'])
def obtener_company(id):
    companies = ClientCompany.query.get(id)
    if not companies:
        return jsonify({"error": "Compañia no encontrada"}), 404
    return jsonify({'id': companies.client_company_id, 'name': companies.company_name, 'manager': companies.manager_client_name})


def validar_client_company(comp_data, index=None, is_update=False, current_id=None):
 

    name = comp_data.get('company_name')
    if not is_update:
        if not name:
            return {"index": index, "error": "company_name vacío."}
        elif not re.match(r'^[A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]+$', name):
            return {"index": index, "error": "company_name inválido (solo letras, números y espacios)."}
        existing = ClientCompany.query.filter_by(company_name=name).first()
        if existing:
            return {"index": index, "error": f"company_name '{name}' ya existe."}
    else:
        if name:
            if not re.match(r'^[A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]+$', name):
                return {"index": index, "error": "company_name inválido (solo letras, números y espacios)."}
            existing = ClientCompany.query.filter_by(company_name=name).first()
            if existing and existing.client_company_id != current_id:
                return {"index": index, "error": f"company_name '{name}' ya existe."}
        else:
            name = None

    manager = comp_data.get('manager_client_name')
    if not is_update or manager is not None:
        if not manager:
            return {"index": index, "error": "manager_client_name vacío."}
        elif not re.match(r'^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+$', manager):
            return {"index": index, "error": "manager_client_name inválido (solo letras y espacios)."}

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
        db.session.flush()
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
    try:
        allowed_filters = {
            "min_id", 
            "max_id", 
            "name", 
            "mail", 
            "role",
            "client_company_id",
            "reports_to",
            "password",
            "session_started"
        }

        unexpected_filters = set(request.args.keys()) - allowed_filters
        if unexpected_filters:
            return jsonify({"error": f"Filtro no esperado: {', '.join(unexpected_filters)}"}), 400
        
        min_id = request.args.get('min_id', type=int)
        max_id = request.args.get('max_id', type=int)
        name = request.args.get('name', type=str)
        mail = request.args.get('mail', type=str)
        role = request.args.get('role', type=str)
        client_company_id = request.args.get('client_company_id', type=int)
        reports_to = request.args.get('reports_to', type=int)
        password = request.args.get('password', type=str)
        session_started = request.args.get('session_started', type=lambda v: v.lower() in ['true', '1', 'yes'])

        # Usar User.query directamente (como en el resto de tu código)
        query = User.query

        if min_id is not None:
            query = query.filter(User.user_id >= min_id)

        if max_id is not None:
            query = query.filter(User.user_id <= max_id)

        if name:
            query = query.filter(User.name.ilike(f"%{name}%"))

        if mail:
            query = query.filter(User.mail.ilike(f"%{mail}%"))
        
        if role:
            query = query.filter(User.role.ilike(f"%{role}%"))
        
        if client_company_id is not None:
            query = query.filter(User.client_company_id == client_company_id)

        if reports_to is not None:
            query = query.filter(User.reports_to == reports_to)

        if password:
            query = query.filter(User.password == password)

        if session_started is not None:
            query = query.filter(User.session_started == session_started)
        
        users = query.all()

        # Construir respuesta
        result = [
            {
                'id': u.user_id, 
                'name': u.name, 
                'role': u.role, 
                'mail': u.mail,
                'client_company_id': u.client_company_id,
                'reports_to': u.reports_to,
                'session_started': u.session_started
            }
            for u in users
        ]

        return jsonify(result)
    
    except Exception as e:
        # Log del error
        app.logger.error(f"Error en get_users: {str(e)}")
        return jsonify({"error": "Error interno del servidor"}), 500


@app.route('/users/<int:id>', methods=['GET'])
def obtener_usuario(id):
    users = User.query.get(id)
    if not users:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify({'id': users.user_id, 'name': users.name, 'role': users.role, 'mail':users.mail})


ROLES = ['HPE_REP', 'HPE_MANAGER', 'CLIENT']

def validar_usuario(user_data, index=0, is_update=False, current_id=None):
    result = {}

    # name
    if not is_update:  
        if not user_data.get('name'):
            return {"index": index, "error": "Nombre vacío."}
    if user_data.get('name'):  
        if not re.match(r'^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]+$', user_data['name']):
            return {"index": index, "error": "Nombre inválido (solo letras y espacios)."}
        result["name"] = user_data['name']

    # mail
    if not is_update:  
        if not user_data.get('mail'):
            return {"index": index, "error": "Correo vacío."}
    if user_data.get('mail'):
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', user_data['mail']):
            return {"index": index, "error": "Correo inválido."}
        existing = User.query.filter_by(mail=user_data['mail']).first()
        if existing and (not current_id or existing.user_id != current_id):
            return {"index": index, "error": f"Correo '{user_data['mail']}' ya está en uso."}
        result["mail"] = user_data['mail']

    # password
    if not is_update:
        if not user_data.get('password'):
            return {"index": index, "error": "Contraseña vacía."}
    if user_data.get('password'):
        if len(user_data['password']) < 6:
            return {"index": index, "error": "La contraseña debe tener mínimo 6 caracteres."}
        result["password"] = user_data['password']

    # role
    if not is_update:
        if not user_data.get('role'):
            return {"index": index, "error": "El rol es obligatorio."}
    if user_data.get('role'):
        role = user_data['role']
        if role not in ROLES:
            return {"index": index, "error": f"Rol inválido. Solo se permiten: {', '.join(ROLES)}."}
        result["role"] = role

    if user_data.get('client_company_id') is not None:
        try:
            client_company_id = int(user_data['client_company_id'])
        except ValueError:
            return {"index": index, "error": "El client_company_id debe ser un número."}

        company = ClientCompany.query.get(client_company_id)
        if not company:
            return {"index": index, "error": f"El client_company_id {client_company_id} no existe."}
        result["client_company_id"] = client_company_id

    if user_data.get('reports_to') is not None:
        try:
            reports_to = int(user_data['reports_to'])
        except ValueError:
            return {"index": index, "error": "El reports_to debe ser un número."}

        report_user = User.query.get(reports_to)
        if not report_user:
            return {"index": index, "error": f"El usuario para reports_to {reports_to} no existe."}
        result["reports_to"] = reports_to

    if "session_started" in user_data:
        result["session_started"] = user_data.get("session_started", False)

    return result

@app.route('/users', methods=['POST'])
def create_users():
    data = request.json
    if not isinstance(data, list):
        data = [data]

    created_users = []
    errors = []

    for index, user_data in enumerate(data):
        resultado = validar_usuario(user_data, index=index, is_update=False)
        if "error" in resultado:
            errors.append(resultado)
            continue

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


@app.route('/users/<int:id>', methods=['PUT'])
def update_user(id):
    user = User.query.get(id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.json

    if not isinstance(data, dict):
        return jsonify({"error": "Ingresa un diccionario para aceptarlo..."}), 400

    allowed_fields = {
        "client_company_id", "reports_to", "mail", "password",
        "role", "name", "session_started"
    }

    invalid_keys = [k for k in data.keys() if k not in allowed_fields]
    if invalid_keys:
        return jsonify({
            "error": f"Atributo incorrecto: '{', '.join(invalid_keys)}'"
        }), 400

    resultado = validar_usuario(data, is_update=True)
    if isinstance(resultado, dict) and "error" in resultado:
        return jsonify(resultado), 400

    for key, value in resultado.items():
        if value is not None: 
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

    allowed_filters = {
        "product_number", "product_description", "company_program",
        "price", "created_by", "min_price", "max_price",
        "sort_by", "order"
    }

    allowed_sort_fields = {
        "product_number": Equipment.product_number,
        "product_description": Equipment.product_description,
        "company_program": Equipment.company_program,
        "price": Equipment.price,
        "created_by": Equipment.created_by
    }

    unexpected_filters = set(request.args.keys()) - allowed_filters
    if unexpected_filters:
        return jsonify({"error": f"Filtro no esperado: {', '.join(unexpected_filters)}"}), 400


    product_number = request.args.get('product_number', type=str)
    product_description = request.args.get('product_description', type=str)
    company_program = request.args.get('company_program', type=str)
    price = request.args.get('price', type=float)
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    created_by = request.args.get('created_by', type=int)

    sort_by = request.args.get('sort_by', type=str)
    order = request.args.get('order', type=str, default="asc").lower()


    if sort_by and sort_by not in allowed_sort_fields:
        return jsonify({"error": f"Campo para ordenamiento no permitido: {sort_by}"}), 400

    query = Equipment.query

    if product_number:
        query = query.filter(Equipment.product_number.ilike(f"%{product_number}%"))

    if product_description:
        query = query.filter(Equipment.product_description.ilike(f"%{product_description}%"))

    if company_program:
        query = query.filter(Equipment.company_program.ilike(f"%{company_program}%"))

    if price is not None:
        query = query.filter(Equipment.price == price)

    if min_price is not None:
        query = query.filter(Equipment.price >= min_price)

    if max_price is not None:
        query = query.filter(Equipment.price <= max_price)

    if created_by is not None:
        query = query.filter(Equipment.created_by == created_by)

    if sort_by:
        column = allowed_sort_fields[sort_by]
        if order == "desc":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())

    equipment = query.all()

    return jsonify([
        {
            'solution_id': e.solution_id,
            'product_number': e.product_number,
            'product_description': e.product_description,
            'company_program': e.company_program,
            'price': e.price,
            'created_by': e.created_by
        }
        for e in equipment
    ])


@app.route('/equipment/<int:id>', methods=['GET'])
def get_equipment_by_id(id):
    equipment = Equipment.query.get(id)

    if equipment is None:
        return jsonify({"error": "Equipo no encontrado"}), 404

    return jsonify({
        'solution_id': equipment.solution_id,
        'product_number': equipment.product_number,
        'product_description': equipment.product_description,
        'company_program': equipment.company_program,
        'price': equipment.price,
        'created_by': equipment.created_by
    })




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
    return jsonify({'message': 'Equipment creado', 'solution_id': e.solution_id}), 201

@app.route('/equipment/<int:id>', methods=['PUT'])
def update_equipment(id):
    e = Equipment.query.get_or_404(id)
    data = request.json
    for field in ['product_number', 'product_description', 'company_program', 'price', 'created_by']:
        if field in data:
            setattr(e, field, data[field])
    db.session.commit()
    return jsonify({'message': 'Equipment actualizado'})

@app.route('/equipment/<int:id>', methods=['DELETE'])
def delete_equipment(id):
    e = Equipment.query.get_or_404(id)
    db.session.delete(e)
    db.session.commit()
    return jsonify({'message': 'Equipment eliminado'})


# ---------------- EQUIPMENT ITEMS ----------------
@app.route('/equipment_items', methods=['GET'])
def get_equipment_items():

    allowed_filters = {
        "solution_id", "product_number", "product_name",
        "qty", "unit_price", "min_qty", "max_qty",
        "min_unit_price", "max_unit_price", "sort_by", "order"
    }

    allowed_sort_fields = {
        "solution_id": EquipmentItem.solution_id,
        "product_number": EquipmentItem.product_number,
        "product_name": EquipmentItem.product_name,
        "qty": EquipmentItem.qty,
        "unit_price": EquipmentItem.unit_price
    }

    unexpected_filters = set(request.args.keys()) - allowed_filters
    if unexpected_filters:
        return jsonify({"error": f"Filtro no esperado: {', '.join(unexpected_filters)}"}), 400

    solution_id = request.args.get('solution_id', type=int)
    product_number = request.args.get('product_number', type=str)
    product_name = request.args.get('product_name', type=str)
    qty = request.args.get('qty', type=int)
    unit_price = request.args.get('unit_price', type=float)
    min_qty = request.args.get('min_qty', type=int)
    max_qty = request.args.get('max_qty', type=int)
    min_unit_price = request.args.get('min_unit_price', type=float)
    max_unit_price = request.args.get('max_unit_price', type=float)
    sort_by = request.args.get('sort_by', type=str)
    order = request.args.get('order', type=str, default="asc").lower()

    query = EquipmentItem.query

    if solution_id is not None:
        query = query.filter(EquipmentItem.solution_id == solution_id)

    if product_number:
        query = query.filter(EquipmentItem.product_number.ilike(f"%{product_number}%"))

    if product_name:
        query = query.filter(EquipmentItem.product_name.ilike(f"%{product_name}%"))

    if qty is not None:
        query = query.filter(EquipmentItem.qty == qty)

    if unit_price is not None:
        query = query.filter(EquipmentItem.unit_price == unit_price)

    if min_qty is not None:
        query = query.filter(EquipmentItem.qty >= min_qty)

    if max_qty is not None:
        query = query.filter(EquipmentItem.qty <= max_qty)

    if min_unit_price is not None:
        query = query.filter(EquipmentItem.unit_price >= min_unit_price)

    if max_unit_price is not None:
        query = query.filter(EquipmentItem.unit_price <= max_unit_price)

    if sort_by:
        if sort_by not in allowed_sort_fields:
            return jsonify({"error": f"Campo para ordenamiento no permitido: {sort_by}"}), 400

        column = allowed_sort_fields[sort_by]
        if order == "desc":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())

    equipment_items = query.all()

    return jsonify([
        {
            'item_id': e.item_id,
            'solution_id': e.solution_id,
            'product_number': e.product_number,
            'product_name': e.product_name,
            'qty': e.qty,
            'unit_price': e.unit_price
        }
        for e in equipment_items
    ])


@app.route('/equipment_items/<int:id>', methods=['GET'])
def get_equipment_item_by_id(id):
    equipment_item = EquipmentItem.query.get(id)

    if equipment_item is None:
        return jsonify({"error": "Item de equipo no encontrado"}), 404

    return jsonify({
        'item_id': equipment_item.item_id,
        'solution_id': equipment_item.solution_id,
        'product_number': equipment_item.product_number,
        'product_name': equipment_item.product_name,
        'qty': equipment_item.qty,
        'unit_price': equipment_item.unit_price
    })


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
    return jsonify({'message': 'Equipment item creado', 'item_id': equipment_item.item_id}), 201

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
    return jsonify({'message': 'Equipment item eliminado'})


# ---------------- POC ----------------
@app.route('/pocs', methods=['GET'])
def get_pocs():
    from sqlalchemy import cast, Date

    allowed_filters = {
        "client_user_id", "business_justification", "is_approved",
        "completion_date", "created_date",
        "min_completion_date", "max_completion_date",
        "min_created_date", "max_created_date",
        "sort_by", "order"
    }

    allowed_sort_fields = {
        "client_user_id": POC.client_user_id,
        "business_justification": POC.business_justification,
        "is_approved": POC.is_approved,
        "completion_date": POC.completion_date,
        "created_date": POC.created_date
    }

    unexpected_filters = set(request.args.keys()) - allowed_filters
    if unexpected_filters:
        return jsonify({"error": f"Filtro no esperado: {', '.join(unexpected_filters)}"}), 400

    client_user_id = request.args.get('client_user_id', type=int)
    business_justification = request.args.get('business_justification', type=str)
    is_approved = request.args.get('is_approved', type=lambda v: v.lower() in ['true', '1', 'yes'])
    completion_date = request.args.get('completion_date', type=str)
    created_date = request.args.get('created_date', type=str)
    min_completion_date = request.args.get('min_completion_date', type=str)
    max_completion_date = request.args.get('max_completion_date', type=str)
    min_created_date = request.args.get('min_created_date', type=str)
    max_created_date = request.args.get('max_created_date', type=str)

    sort_by = request.args.get('sort_by', type=str)
    order = request.args.get('order', type=str, default="asc").lower()

    if sort_by and sort_by not in allowed_sort_fields:
        return jsonify({"error": f"Campo para ordenamiento no permitido: {sort_by}"}), 400

    # Hacer JOIN con User y ClientCompany para obtener nombres
    query = db.session.query(
        POC,
        User.name.label('client_user_name'),
        ClientCompany.company_name.label('company_name')
    ).join(
        User, POC.client_user_id == User.user_id
    ).outerjoin(
        ClientCompany, User.client_company_id == ClientCompany.client_company_id
    )

    if client_user_id is not None:
        query = query.filter(POC.client_user_id == client_user_id)

    if business_justification:
        query = query.filter(POC.business_justification.ilike(f"%{business_justification}%"))

    if is_approved is not None:
        query = query.filter(POC.is_approved == is_approved)

    if completion_date:
        query = query.filter(cast(POC.completion_date, Date) == completion_date)

    if created_date:
        query = query.filter(cast(POC.created_date, Date) == created_date)

    if min_completion_date:
        query = query.filter(cast(POC.completion_date, Date) >= min_completion_date)

    if max_completion_date:
        query = query.filter(cast(POC.completion_date, Date) <= max_completion_date)

    if min_created_date:
        query = query.filter(cast(POC.created_date, Date) >= min_created_date)

    if max_created_date:
        query = query.filter(cast(POC.created_date, Date) <= max_created_date)

    if sort_by:
        column = allowed_sort_fields[sort_by]
        query = query.order_by(column.desc() if order == "desc" else column.asc())

    results = query.all()

    return jsonify([
        {
            'poc_id': p.POC.poc_id,
            'client_user_id': p.POC.client_user_id,
            'client_user_name': p.client_user_name,
            'company_name': p.company_name,
            'business_justification': p.POC.business_justification,
            'is_approved': p.POC.is_approved,
            'completion_date': p.POC.completion_date.isoformat() if p.POC.completion_date else None,
            'created_date': p.POC.created_date.isoformat() if p.POC.created_date else None
        }
        for p in results
    ])


@app.route('/pocs/<int:id>', methods=['GET'])
def get_poc_by_id(id):
    # Hacer JOIN para obtener nombres
    result = db.session.query(
        POC,
        User.name.label('client_user_name'),
        ClientCompany.company_name.label('company_name')
    ).join(
        User, POC.client_user_id == User.user_id
    ).outerjoin(
        ClientCompany, User.client_company_id == ClientCompany.client_company_id
    ).filter(POC.poc_id == id).first()

    if result is None:
        return jsonify({"error": "POC no encontrado"}), 404

    poc = result.POC
    return jsonify({
        'poc_id': poc.poc_id,
        'client_user_id': poc.client_user_id,
        'client_user_name': result.client_user_name,
        'company_name': result.company_name,
        'business_justification': poc.business_justification,
        'is_approved': poc.is_approved,
        'completion_date': poc.completion_date.isoformat() if poc.completion_date else None,
        'created_date': poc.created_date.isoformat() if poc.created_date else None
    })


@app.route('/pocs', methods=['POST'])
def create_pocs():
    data = request.get_json()
    if data is None:
        return jsonify({"error": "Faltan datos"}), 400

    if not isinstance(data, list):
        data = [data]

    created = []
    errors = []

    for index, poc_data in enumerate(data):
        if not isinstance(poc_data, dict):
            errors.append({"index": index, "error": "Cada item debe ser un objeto JSON"})
            continue

        try:
            poc = POC(
                client_user_id=poc_data['client_user_id'],
                business_justification=poc_data.get('business_justification'),
                completion_date=poc_data.get('completion_date'),
                created_date=poc_data.get('created_date')
            )
            
            # Solo establecer is_approved si viene explícitamente en los datos
            if 'is_approved' in poc_data:
                poc.is_approved = poc_data['is_approved']
            # Si no viene, se usa el default=None del modelo
            
            db.session.add(poc)
            db.session.flush()
            created.append({
                "index": index,
                "poc_id": poc.poc_id,
                "client_user_id": poc.client_user_id,
                "is_approved": poc.is_approved  # Para verificar que es None
            })
        except Exception as e:
            errors.append({"index": index, "error": str(e)})

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al guardar en BD", "detail": str(e)}), 500

    return jsonify({"created": created, "errors": errors}), 201

@app.route('/pocs/<int:id>', methods=['PUT'])
def update_poc(id):
    poc = POC.query.get_or_404(id)
    data = request.json
    for field in ['client_user_id', 'business_justification', 'is_approved', 'completion_date', 'created_date']:
        if field in data:
            setattr(poc, field, data[field])
    db.session.commit()
    return jsonify({'message': 'POC actualizada'})

@app.route('/pocs/<int:id>', methods=['DELETE'])
def delete_poc(id):
    poc = POC.query.get_or_404(id)
    db.session.delete(poc)
    db.session.commit()
    return jsonify({'message': 'POC eliminado'})


# ---------------- POC_EQUIPMENT ----------------
@app.route('/poc_equipment', methods=['GET'])
def get_poc_equipment():

    allowed_filters = {"poc_id", "solution_id"}

    unexpected_filters = set(request.args.keys()) - allowed_filters
    if unexpected_filters:
        return jsonify({"error": f"Filtro no esperado: {', '.join(unexpected_filters)}"}), 400

    poc_id = request.args.get('poc_id', type=int)
    solution_id = request.args.get('solution_id', type=int)

    query = POCEquipment.query

    if poc_id is not None:
        query = query.filter(POCEquipment.poc_id == poc_id)

    if solution_id is not None:
        query = query.filter(POCEquipment.solution_id == solution_id)

    poc_equipment = query.all()

    return jsonify([
        {
            'poc_id': pe.poc_id,
            'solution_id': pe.solution_id
        }
        for pe in poc_equipment
    ])


@app.route('/poc_equipment', methods=['POST'])
def create_poc_equipment():
    data = request.get_json()
    if data is None:
        return jsonify({"error": "Faltan datos"}), 400

    if not isinstance(data, list):
        data = [data]

    created = []
    errors = []

    for index, item in enumerate(data):
        if not isinstance(item, dict):
            errors.append({"index": index, "error": "Cada item debe ser un objeto JSON"})
            continue

        if 'poc_id' not in item or 'solution_id' not in item:
            errors.append({"index": index, "error": "Faltan poc_id o solution_id"})
            continue

        try:
            pe = POCEquipment(
                poc_id=item['poc_id'],
                solution_id=item['solution_id']
            )
            db.session.add(pe)
            db.session.flush()
            created.append({
                "index": index,
                "poc_id": pe.poc_id,
                "solution_id": pe.solution_id
            })
        except Exception as e:
            errors.append({"index": index, "error": str(e)})

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al guardar en BD", "detail": str(e)}), 500

    return jsonify({"created": created, "errors": errors}), 201


@app.route('/poc_equipment/<int:poc_id>/<int:solution_id>', methods=['DELETE'])
def delete_poc_equipment(poc_id, solution_id):
    pe = POCEquipment.query.filter_by(poc_id=poc_id, solution_id=solution_id).first_or_404()
    db.session.delete(pe)
    db.session.commit()
    return jsonify({'message': 'POC Equipment eliminada'})


if __name__ == '__main__':
    app.run(debug=True)
