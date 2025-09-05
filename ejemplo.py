from flask import Flask, request, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///DBSeleniosHPE.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# -------------------------------
# MODELOS
# -------------------------------
class HPEManager(db.Model):
    __tablename__ = 'HPEManager'
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

# -------------------------------
# RUTAS
# -------------------------------

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
    return render_template('usuarios_nuevo.html')

@app.route('/usuarios/listar')
def listar_usuarios_html():
    usuarios = Users.query.all()
    return render_template('usuarios_listar.html', usuarios=usuarios)

@app.route('/productos/nuevo', methods=['GET', 'POST'])
def crear_producto_form():
    if request.method == 'POST':
        HPERepId = request.form.get('HPERepId')
        ProductNumberEquipment = request.form.get('ProductNumberEquipment', '').strip()
        ProductDescription = request.form.get('ProductDescription', '').strip()
        CompanyProgram = request.form.get('CompanyProgram', '').strip()
        Price_raw = request.form.get('Price', '').strip()
        HPERepId = int(HPERepId) if HPERepId not in (None, '',) else None
        Price = float(Price_raw) if Price_raw not in (None, '',) else 0.0

        nuevo = Equipment(
            HPERepId=HPERepId,
            ProductNumberEquipment=ProductNumberEquipment,
            ProductDescription=ProductDescription,
            CompanyProgram=CompanyProgram,
            Price=Price
        )
        db.session.add(nuevo)
        db.session.commit()
        return (
            f"<h3>✅ Producto creado con éxito (SolutionId: {nuevo.SolutionId})</h3>"
            "<a href='/productos/listar'>Ver lista de productos</a> | "
            "<a href='/productos/nuevo'>Crear otro</a>"
        )
    return render_template('productos_nuevo.html')

@app.route('/productos/listar')
def listar_productos_html():
    productos = Equipment.query.order_by(Equipment.SolutionId.desc()).all()
    return render_template('productos_listar.html', productos=productos)

# -------------------------------
# MAIN
# -------------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
