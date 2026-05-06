![HPE](https://img.shields.io/badge/HPE-00B388?style=for-the-badge&logo=hewlettpackardenterprise&logoColor=white)
![Scrum](https://img.shields.io/badge/Scrum-6DB33F?style=for-the-badge&logo=scrumalliance&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge)
![JSON](https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

# General Information
- **Framework:** Flask
- **ORM / Database Connection:** SQLAlchemy (Python library)
- **Response Format:** JSON

- - -

# ClientCompany Endpoints

### GET /client_company

**Description:** Retrieves a list of client companies with optional filters.

**Query Parameters:**

- `min_id` (int, optional): Minimum ID
- `max_id` (int, optional): Maximum ID
- `company_name` (string, optional): Search by name (partial match)
- `manager` (string, optional): Search by manager (partial match)
- `hpe_rep_id` (int, optional): Filter by HPE representative ID

**Response:**

```json
 [
  {
    "id": 1,
    "name": "Company Name",
    "manager": "Manager Name",
    "hpe_rep_id": 5
  }
] 
```

### GET /client_company/<int:id>

**Description:** Retrieves a specific company by ID.

**Response:**

```json
 {
  "id": 1,
  "name": "Company Name",
  "manager": "Manager Name"
} 
```

### POST /client_company

**Description:** Creates one or multiple client companies.

**Body (Individual JSON or Array):**

```json
 {
  "company_name": "string (required)",
  "manager_client_name": "string (required)",
  "hpe_rep_id": "int (optional)"
} 
```

**Validations:**
- `company_name`: Only letters, numbers, and spaces allowed.
- `manager_client_name`: Only letters and spaces allowed.
- `hpe_rep_id`: Must be numeric if provided.

### PUT /client_company/<int:id>

**Description:** Updates an existing company.

**Body (JSON):**

```json
 {
  "company_name": "string (optional)",
  "manager_client_name": "string (optional)",
  "hpe_rep_id": "int (optional)"
} 
```

### DELETE /client_company/<int:id>

**Description:** Deletes a company by ID.

- - -

# Users Endpoints

### GET /users

**Description:** Retrieves a list of users with filters.

**Query Parameters:**

- `min_id`, `max_id` (int): ID range filters.
- `name`, `mail`, `role` (string): Partial match searches.

**Response:**

```json
 [
  {
    "id": 1,
    "name": "User Name",
    "role": "ROLE",
    "mail": "email@example.com"
  }
] 
```

### GET /users/<int:id>

**Description:** Retrieves a specific user.

### POST /users

**Description:** Creates one or multiple users.

**Body (Individual JSON or Array):**

```json
 {
  "name": "string (required)",
  "mail": "string (required, email format)",
  "password": "string (required, min 6 characters)",
  "role": "string (required, HPE_REP|HPE_MANAGER|CLIENT)",
  "client_company_id": "int (optional)",
  "reports_to": "int (optional)",
  "session_started": "boolean (optional)"
} 
```

### PUT /users/<int:id>

**Description:** Updates an existing user.

### DELETE /users/<int:id>

**Description:** Deletes a user.

- - -

# Equipment Endpoints

### GET /equipment

**Description:** Retrieves equipment with advanced filters and sorting.

**Query Parameters:**

- `product_number`, `product_description`, `company_program` (string): Partial match searches.
- `price`, `min_price`, `max_price` (float): Price filters.
- `created_by` (int): Filter by creator ID.
- `sort_by` (string): Field to sort by (`product_number`, `product_description`, etc.).
- `order` (string): "asc" or "desc".

### GET /equipment/<int:id>

**Description:** Retrieves a specific piece of equipment.

### POST /equipment

**Description:** Creates new equipment.

**Body:**

```json
 {
  "product_number": "string",
  "product_description": "string",
  "company_program": "string",
  "price": "float",
  "created_by": "int"
} 
```

### PUT /equipment/<int:id>

**Description:** Updates existing equipment.

### DELETE /equipment/<int:id>

**Description:** Deletes equipment.

- - -

# EquipmentItems Endpoints

### GET /equipment_items

**Description:** Retrieves equipment items with advanced filters.

**Query Parameters:**

- `solution_id` (int): Filter by solution.
- `product_number`, `product_name` (string): Partial match searches.
- `qty`, `min_qty`, `max_qty` (int): Quantity range filters.
- `unit_price`, `min_unit_price`, `max_unit_price` (float): Unit price range filters.
- `sort_by`, `order`: Sorting options.

### GET /equipment_items/<int:id>

**Description:** Retrieves a specific item.

### POST /equipment_items

**Description:** Creates a new equipment item.

### PUT /equipment_items/<int:id>

**Description:** Updates an existing item.

### DELETE /equipment_items/<int:id>

**Description:** Deletes an item.

- - -

# POC Endpoints

### GET /pocs

**Description:** Retrieves POCs (Proof of Concepts) with date and status filters.

**Query Parameters:**

- `client_user_id` (int): Filter by client user ID.
- `business_justification` (string): Partial match search.
- `is_approved` (boolean): Filter by approval status.
- **Date Filters:** `completion_date`, `created_date`, `min_*_date`, `max_*_date`.
- `sort_by`, `order`: Sorting options.

### GET /pocs/<int:id>

**Description:** Retrieves a specific POC.

### POST /pocs

**Description:** Creates one or multiple POCs.

**Body (Individual JSON or Array):**

```json
 {
  "client_user_id": "int (required)",
  "business_justification": "string",
  "is_approved": "boolean",
  "completion_date": "date string",
  "created_date": "date string"
} 
```

### PUT /pocs/<int:id>

**Description:** Updates an existing POC.

### DELETE /pocs/<int:id>

**Description:** Deletes a POC.

- - -

# POCEquipment Endpoints

### GET /poc_equipment

**Description:** Retrieves relationships between POCs and equipment.

**Query Parameters:**

- `poc_id` (int): Filter by POC ID.
- `solution_id` (int): Filter by solution ID.

### POST /poc_equipment

**Description:** Creates relationships between POCs and equipment.

**Body (Individual JSON or Array):**

```json
 {
  "poc_id": "int (required)",
  "solution_id": "int (required)"
} 
```

### DELETE /poc_equipment/<int:poc_id>/<int:solution_id>

**Description:** Deletes a specific relationship.

- - -

# Common Features

### Implemented Validations

- **Required Fields:** Based on the operation (POST vs. PUT).
- **Specific Formats:** Validations for emails, names, and prices.
- **Uniqueness:** Prevents duplicate entries in unique fields.
- **Existence:** Verifies that referenced IDs exist in the database.

### Error Handling
- **400:** Invalid or missing data.
- **404:** Resource not found.
- **500:** Internal server errors.

### Advanced Features
- **Partial Search:** Implemented using `ilike`.
- **Range Filters:** Support for `min/max` filtering.
- **Multiple Sorting:** Flexible ordering options.
