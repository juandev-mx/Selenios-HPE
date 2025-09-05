
# Flask es el framework que me permite crear aplicaciones web de manera sencilla.
# Aquí importo Flask (para inicializar mi app), request (para leer datos que me envían desde el cliente),
# jsonify (para devolver respuestas en formato JSON) y render_template_string
# (para poder generar HTML directamente desde cadenas de texto si se necesita).
from flask import Flask, request, jsonify, render_template_string

# Importo SQLAlchemy, que es una extensión de Flask que facilita trabajar con bases de datos.
# Con esta librería puedo definir modelos como clases en Python en lugar de escribir SQL a mano.
from flask_sqlalchemy import SQLAlchemy

# Inicializo mi aplicación Flask.
# El parámetro __name__ le dice a Flask que tome el nombre del módulo actual,
# y con eso puede saber dónde están los recursos como las plantillas y los archivos estáticos.
# En pocas palabras, aquí arranca oficialmente mi aplicación web.
app = Flask(__name__)

# Configuración de la base de datos en la aplicación Flask

# Aquí le indico a Flask dónde está mi base de datos y qué motor usar.
# En este caso uso SQLite y le paso la ruta completa del archivo .db que generé en DB Browser.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///C:/Users/JuanCarlos/Desktop/Ejemplo/DBSeleniosHPE.db'

# Desactivo el seguimiento de modificaciones de SQLAlchemy porque no lo necesito
# y además consume memoria de manera innecesaria si lo dejo activo.

#Si lo dejara en True, Flask intentará rastrear cada cambio en los modelos, pero consume memoria extra.

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializo la extensión SQLAlchemy y la asocio a mi aplicación Flask.
# Este objeto "db" es el que me va a permitir crear modelos (tablas),
# hacer consultas e interactuar con la base de datos de manera sencilla.

db = SQLAlchemy(app)

# -------------------------------
# MODELOS BASADOS EN EL DIAGRAMA
# -------------------------------


class HPEManager(db.Model): #(db.Model) convierte la clase en un modelo de base de datos.
    __tablename__ = 'HPEManager' #En esta parte es indicar el nombre de la tabla que se encuentra en la base de datos
    HPEManagerId = db.Column(db.Integer, primary_key=True)
    HPEManagerName = db.Column(db.String)

class HPERep(db.Model):
    __tablename__ = 'HPERep'
    HPERepId = db.Column(db.Integer, primary_key=True)
    HPEManagerId = db.Column(db.Integer, db.ForeignKey('HPEManager.HPEManagerId'))
    HPERepName = db.Column(db.String)

class ClientCompany(db.Model):
    __tablename__ = 'ClientCompany'
    ClientCompanyId = db.Column(db.Integer, primary_key=True)
    HPERepId = db.Column(db.Integer, db.ForeignKey('HPERep.HPERepId'))
    ClientCompanyName = db.Column(db.String)
    ManagerClientName = db.Column(db.String)

class ClientCompanyRep(db.Model):
    __tablename__ = 'ClientCompanyRep'
    ClientCompanyRepId = db.Column(db.Integer, primary_key=True)
    ClientCompanyId = db.Column(db.Integer, db.ForeignKey('ClientCompany.ClientCompanyId'))
    ClientCompanyRepName = db.Column(db.String)

class Users(db.Model):
    __tablename__ = 'Users'
    UserId = db.Column(db.Integer, primary_key=True)
    ClientCompanyRepId = db.Column(db.Integer, db.ForeignKey('ClientCompanyRep.ClientCompanyRepId'))
    HPERepId = db.Column(db.Integer, db.ForeignKey('HPERep.HPERepId'))
    HPEManagerId = db.Column(db.Integer, db.ForeignKey('HPEManager.HPEManagerId'))
    Mail = db.Column(db.String)
    Password = db.Column(db.String)
    Role = db.Column(db.String)
    SessionStarted = db.Column(db.Boolean)

class Equipment(db.Model):
    __tablename__ = 'Equipment'
    SolutionId = db.Column(db.Integer, primary_key=True)
    HPERepId = db.Column(db.Integer, db.ForeignKey('HPERep.HPERepId'))
    ProductNumberEquipment = db.Column(db.String)
    ProductDescription = db.Column(db.String)
    CompanyProgram = db.Column(db.String)
    Price = db.Column(db.Float)

class EquipmentItems(db.Model):
    __tablename__ = 'EquipmentItems'
    ItemsId = db.Column(db.Integer, primary_key=True)
    SolutionId = db.Column(db.Integer, db.ForeignKey('Equipment.SolutionId'))
    ProductNumberItems = db.Column(db.String)
    ProductName = db.Column(db.String)
    Qty = db.Column(db.Integer)
    UnitPrice = db.Column(db.Float)

class POCs(db.Model):
    __tablename__ = 'POCs'
    POCId = db.Column(db.Integer, primary_key=True)
    SolutionId = db.Column(db.Integer, db.ForeignKey('Equipment.SolutionId'))
    ClientCompanyRepId = db.Column(db.Integer, db.ForeignKey('ClientCompanyRep.ClientCompanyRepId'))
    BusinessJustification = db.Column(db.Text)
    IsApproved = db.Column(db.Boolean)
    CompletionDate = db.Column(db.Date)
    CreatedDate = db.Column(db.Date)

# -------------------------------
# ENDPOINTS DE EJEMPLO
# -------------------------------

# Formulario para crear usuario
@app.route('/usuarios/nuevo', methods=['GET', 'POST'])
def crear_usuario_form():
    if request.method == 'POST':
        nuevo = Users(
            ClientCompanyRepId=request.form.get('ClientCompanyRepId'),
            HPERepId=request.form.get('HPERepId'),
            HPEManagerId=request.form.get('HPEManagerId'),
            Mail=request.form.get('Mail'),
            Password=request.form.get('Password'),
            Role=request.form.get('Role'),
            SessionStarted=bool(request.form.get('SessionStarted'))
        )
        db.session.add(nuevo)
        db.session.commit()
        return f"<h3>✅ Usuario {nuevo.Mail} creado con éxito</h3><a href='/usuarios/listar'>Ver lista</a>"

    # HTML del formulario
    html_form = """
    <h2>Crear Usuario</h2>
    <form method="POST">
        <label>ClientCompanyRepId:</label><br>
        <input type="number" name="ClientCompanyRepId"><br><br>

        <label>HPERepId:</label><br>
        <input type="number" name="HPERepId"><br><br>

        <label>HPEManagerId:</label><br>
        <input type="number" name="HPEManagerId"><br><br>

        <label>Mail:</label><br>
        <input type="email" name="Mail"><br><br>

        <label>Password:</label><br>
        <input type="password" name="Password"><br><br>

        <label>Role:</label><br>
        <input type="text" name="Role"><br><br>

        <label>Session Started:</label>
        <input type="checkbox" name="SessionStarted" value="1"><br><br>

        <button type="submit">Crear Usuario</button>
    </form>
    """
    return render_template_string(html_form)

# Listar usuarios en tabla HTML
@app.route('/usuarios/listar')
def listar_usuarios_html():
    usuarios = Users.query.all()
    html_table = """
    <h2>Lista de Usuarios</h2>
    <table border="1" cellpadding="5">
        <tr>
            <th>UserId</th>
            <th>Mail</th>
            <th>Role</th>
            <th>SessionStarted</th>
        </tr>
    """
    for u in usuarios:
        html_table += f"""
        <tr>
            <td>{u.UserId}</td>
            <td>{u.Mail}</td>
            <td>{u.Role}</td>
            <td>{"Sí" if u.SessionStarted else "No"}</td>
        </tr>
        """
    html_table += "</table><br><a href='/usuarios/nuevo'>➕ Crear otro usuario</a>"
    return render_template_string(html_table)

# ---------- FORMULARIO: crear producto ----------
@app.route('/productos/nuevo', methods=['GET', 'POST'])
def crear_producto_form():
    if request.method == 'POST':
        try:
            HPERepId = request.form.get('HPERepId')
            ProductNumberEquipment = request.form.get('ProductNumberEquipment', '').strip()
            ProductDescription = request.form.get('ProductDescription', '').strip()
            CompanyProgram = request.form.get('CompanyProgram', '').strip()
            Price_raw = request.form.get('Price', '').strip()

            # Conversión de tipos de datos antes de guardarlos en la base de datos

            # Si HPERepId viene con un valor válido (no es None ni una cadena vacía),
            # lo convierto a número entero porque en la base de datos está definido como Integer.
            # Si no tiene valor, lo dejo como None (para que la base de datos lo guarde como NULL).
            HPERepId = int(HPERepId) if HPERepId not in (None, '',) else None
            
            # Si el precio (Price_raw) trae un valor válido (no es None ni cadena vacía),
            # lo convierto a número decimal con float, ya que en la base de datos está como Float.
            # Si no tiene valor, se le asigna 0.0 por defecto para evitar errores al guardar.
            Price = float(Price_raw) if Price_raw not in (None, '',) else 0.0

            # Aquí creo un nuevo objeto de tipo Equipment (que corresponde a la tabla "Equipment" en la base de datos).
            # Le paso los valores que recibí y procesé anteriormente (ya convertidos al tipo correcto).
            # Cada argumento corresponde a una columna en la tabla:

            nuevo = Equipment(
                HPERepId=HPERepId, # Identificador del representante (foráneo hacia HPERep)
                ProductNumberEquipment=ProductNumberEquipment, # Número de producto del equipo
                ProductDescription=ProductDescription, # Descripción del equipo
                CompanyProgram=CompanyProgram, # Programa o compañía asociada
                Price=Price # Precio del producto (ya convertido a float)
            )
            # Agrego el nuevo objeto (registro) a la sesión actual de la base de datos.
            # En este punto todavía no se guarda físicamente en el archivo .db,
            # solo queda "pendiente" en la memoria de SQLAlchemy.
            db.session.add(nuevo)

            # Confirmo (commit) todos los cambios pendientes en la sesión
            # y los aplico de forma definitiva en la base de datos.
            # Aquí es cuando realmente se inserta el nuevo registro en la tabla Equipment.
            db.session.commit()

            return (
                f"<h3>✅ Producto creado con éxito (SolutionId: {nuevo.SolutionId})</h3>"
                "<a href='/productos/listar'>Ver lista de productos</a> | "
                "<a href='/productos/nuevo'>Crear otro</a>"
            )
        except Exception as e:
            # Si hay error (por ejemplo FK inválida), Se muestra
            return (
                f"<h3>❌ Error al crear el producto:</h3><pre>{e}</pre>"
                "<a href='/productos/nuevo'>Volver al formulario</a>"
            ), 400

    # HTML del formulario
    html_form = """
    <h2>Crear Producto (Equipment)</h2>
    <form method="POST">
        <label>HPERepId (opcional si no aplica FK):</label><br>
        <input type="number" name="HPERepId" min="1" step="1"><br><br>

        <label>Product Number (ProductNumberEquipment):</label><br>
        <input type="text" name="ProductNumberEquipment" required><br><br>

        <label>Descripción (ProductDescription):</label><br>
        <textarea name="ProductDescription" rows="3" required></textarea><br><br>

        <label>Programa (CompanyProgram):</label><br>
        <input type="text" name="CompanyProgram"><br><br>

        <label>Precio (Price):</label><br>
        <input type="number" name="Price" step="0.01" min="0" required><br><br>

        <button type="submit">Crear Producto</button>
    </form>
    <br>
    <a href="/productos/listar">Ver lista de productos</a> | <a href="/usuarios/listar">Ver usuarios</a>
    """
    return render_template_string(html_form)

# ---------- LISTADO: productos en tabla HTML ----------
@app.route('/productos/listar')
def listar_productos_html():
    productos = Equipment.query.order_by(Equipment.SolutionId.desc()).all()
    html_table = """
    <h2>Lista de Productos (Equipment)</h2>
    <a href="/productos/nuevo">➕ Crear producto</a><br><br>
    <table border="1" cellpadding="6" cellspacing="0">
        <tr>
            <th>SolutionId</th>
            <th>HPERepId</th>
            <th>ProductNumberEquipment</th>
            <th>ProductDescription</th>
            <th>CompanyProgram</th>
            <th>Price</th>
        </tr>
    """
    for p in productos:
        html_table += f"""
        <tr>
            <td>{p.SolutionId}</td>
            <td>{p.HPERepId if p.HPERepId is not None else ""}</td>
            <td>{p.ProductNumberEquipment or ""}</td>
            <td>{p.ProductDescription or ""}</td>
            <td>{p.CompanyProgram or ""}</td>
            <td>{p.Price if p.Price is not None else 0}</td>
        </tr>
        """
    html_table += """
    </table>
    <br>
    <a href="/productos/nuevo">➕ Crear producto</a> | <a href="/usuarios/listar">Ver usuarios</a>
    """
    return render_template_string(html_table)

# -------------------------------
# MAIN
# -------------------------------

if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # Esto crea las tablas Users y Products si no existen
    app.run(debug=True)

