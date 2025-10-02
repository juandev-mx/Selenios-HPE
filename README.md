# Información General
- Framework: Flask
- Usamos la librería en Python para la conexión a la BD: SQLAlchemy
- Formato de respuesta: JSON

- - -

# Endpoints de ClientCompany

### GET /client_company

Descripción: Obtiene lista de compañías cliente con filtros opcionales.

Parámetros de consulta:

- min_id (int, opcional): ID mínimo
- max_id (int, opcional): ID máximo
- company_name (string, opcional): Buscar por nombre (búsqueda parcial)
- manager (string, opcional): Buscar por manager (búsqueda parcial)
- hpe_rep_id (int, opcional): Filtrar por ID de representante HPE

Respuesta:

json
<pre> [
  {
    "id": 1,
    "name": "Nombre compañía",
    "manager": "Nombre manager",
    "hpe_rep_id": 5
  }
] </pre>

### GET /client_company/int:id 

Descripción: Obtiene una compañía específica por ID.

Respuesta:

json
<pre> {
  "id": 1,
  "name": "Nombre compañía",
  "manager": "Nombre manager"
} </pre>

### POST /client_company

Descripción: Crea una o varias compañías cliente.

Body (JSON individual o array):

json

<pre> {
  "company_name": "string (requerido)",
  "manager_client_name": "string (requerido)",
  "hpe_rep_id": "int (opcional)"
} </pre>

Validaciones:
- company_name: Solo letras, números y espacios
- manager_client_name: Solo letras y espacios
- hpe_rep_id: Debe ser numérico si se proporciona

### PUT /client_company/int:id

Descripción: Actualiza una compañía existente.

Body (JSON):

json

<pre> {
  "company_name": "string (opcional)",
  "manager_client_name": "string (opcional)",
  "hpe_rep_id": "int (opcional)"
} </pre>

### DELETE /client_company/int:id

Descripción: Elimina una compañía por ID.


- - -

# Endpoints de Users

### GET /users

Descripción: Obtiene lista de usuarios con filtros.

Parámetros de consulta:

- min_id, max_id (int): Filtros por ID
- name, mail, role (string): Búsquedas parciales
- 
Respuesta:

json
<pre> [
  {
    "id": 1,
    "name": "Nombre usuario",
    "role": "ROL",
    "mail": "email@ejemplo.com"
  }
] </pre>

### GET /users/int:id

Descripción: Obtiene un usuario específico.

### POST /users

Descripción: Crea uno o varios usuarios.

Body (JSON individual o array):

json

<pre> {
  "name": "string (requerido)",
  "mail": "string (requerido, formato email)",
  "password": "string (requerido, min 6 caracteres)",
  "role": "string (requerido, HPE_REP|HPE_MANAGER|CLIENT)",
  "client_company_id": "int (opcional)",
  "reports_to": "int (opcional)",
  "session_started": "boolean (opcional)"
} </pre>

### PUT /users/int:id

Descripción: Actualiza un usuario existente.

### DELETE /users/int:id

Descripción: Elimina un usuario.
- - -

# Endpoints de Equipment

### GET /equipment

Descripción: Obtiene equipos con filtros avanzados y ordenamiento.

Parámetros de consulta:

-	product_number, product_description, company_program (string): Búsquedas parciales
-	price, min_price, max_price (float): Filtros por precio
-	created_by (int): Filtrar por creador
-	sort_by (string): Campo para ordenar (product_number, product_description, etc.)
-	order (string): "asc" o "desc"

### GET /equipment/int:id

Descripción: Obtiene un equipo específico.

### POST /equipment

Descripción: Crea un nuevo equipo.

Body:

json

<pre> {
  "product_number": "string",
  "product_description": "string",
  "company_program": "string",
  "price": "float",
  "created_by": "int"
} </pre>

### PUT /equipment/int:id

Descripción: Actualiza un equipo existente.

### DELETE /equipment/int:id

Descripción: Elimina un equipo.

- - -

# Endpoints de EquipmentItems

### GET /equipment_items

Descripción: Obtiene items de equipo con filtros avanzados.

Parámetros de consulta:

-	solution_id (int): Filtrar por solución
-	product_number, product_name (string): Búsquedas parciales
-	qty, min_qty, max_qty (int): Filtros por cantidad
-	unit_price, min_unit_price, max_unit_price (float): Filtros por precio unitario
-	sort_by, order: Ordenamiento

### GET /equipment_items/int:id

Descripción: Obtiene un item específico.

### POST /equipment_items

Descripción: Crea un nuevo item de equipo.

### PUT /equipment_items/int:id

Descripción: Actualiza un item existente.

### DELETE /equipment_items/int:id

Descripción: Elimina un item.

- - -
# Endpoints de POC
### GET /pocs

Descripción: Obtiene POCs con filtros por fechas y estados.

Parámetros de consulta:

-	client_user_id (int): Filtrar por usuario cliente
-	business_justification (string): Búsqueda parcial
-	is_approved (boolean): Filtrar por aprobación
-	Filtros de fecha: completion_date, created_date, min_*_date, max_*_date
-	sort_by, order: Ordenamiento

### GET /pocs/int:id

Descripción: Obtiene un POC específico.

### POST /pocs

Descripción: Crea uno o varios POCs.

Body (JSON individual o array):

json

<pre> {
  "client_user_id": "int (requerido)",
  "business_justification": "string",
  "is_approved": "boolean",
  "completion_date": "date string",
  "created_date": "date string"
} </pre>

### PUT /pocs/int:id

Descripción: Actualiza un POC existente.

### DELETE /pocs/int:id

Descripción: Elimina un POC.

- - -
# Endpoints de POCEquipment

### GET /poc_equipment

Descripción: Obtiene relaciones entre POCs y equipos.

Parámetros de consulta:

- poc_id (int): Filtrar por POC
-	solution_id (int): Filtrar por solución

### POST /poc_equipment

Descripción: Crea relaciones entre POCs y equipos.

Body (JSON individual o array):

json

<pre> {
  "poc_id": "int (requerido)",
  "solution_id": "int (requerido)"
} </pre>

### DELETE /poc_equipment/int:poc_id/int:solution_id

Descripción: Elimina una relación específica.

- - -
# Características Comunes

### Validaciones Implementadas

-	Campos requeridos según operación (POST vs PUT)
-	Formatos específicos: emails, nombres, precios
-	Unicidad: Evita duplicados en campos únicos
-	Existencia: Verifica referencias a IDs existentes

### Manejo de Errores
-	400: Datos inválidos o faltantes
-	404: Recurso no encontrado
-	500: Errores internos del servidor

### Características Avanzadas
-	Búsqueda parcial con ilike
-	Filtros por rangos (min/max)
-	Ordenamiento múltiple

