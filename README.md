# InventoryOS — Production-Ready Inventory Management System

A fully containerized, full-stack Inventory Management System built with **React + FastAPI + PostgreSQL + Redis**, orchestrated with **Docker Compose**.

---

## 🚀 Quick Start (Docker)

### Prerequisites
- Docker Desktop 24+ with Compose V2
- Git

### 1. Clone & configure
```bash
git clone <repo-url>
cd Inventory_management_system
# .env is already provided — change secrets before production deploy
```

### 2. Build & start all services
```bash
docker-compose up --build -d
```

### 3. Access the application
| Service    | URL                             |
|------------|---------------------------------|
| Frontend   | http://localhost:3000           |
| Backend API| http://localhost:8000           |
| API Docs   | http://localhost:8000/docs      |
| PostgreSQL  | localhost:5432 (DBeaver etc.)  |

### 4. Default credentials
| Role  | Email                    | Password      |
|-------|--------------------------|---------------|
| Admin | admin@inventory.com      | Admin@123456  |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Bridge Network                │
│  ┌──────────┐   ┌──────────┐   ┌──────┐   ┌────────┐  │
│  │ frontend │→  │ backend  │→  │  pg  │   │ redis  │  │
│  │ nginx:80 │   │ uvicorn  │   │ 5432 │   │  6379  │  │
│  │  →3000   │   │  →8000   │   │      │   │        │  │
│  └──────────┘   └──────────┘   └──────┘   └────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Inventory_management_system/
├── docker-compose.yml          # Orchestration
├── .env                        # Environment variables
├── frontend/
│   ├── Dockerfile              # Multi-stage: Node build → Nginx serve
│   ├── nginx.conf              # SPA routing + gzip
│   ├── src/
│   │   ├── App.jsx             # Routes + protected guards
│   │   ├── context/AuthContext.jsx
│   │   ├── services/api.js     # Axios + JWT interceptor
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── InventoryPage.jsx
│   │   │   ├── SuppliersPage.jsx
│   │   │   └── TransactionsPage.jsx
│   │   └── components/
│   │       ├── layout/         # Sidebar, Header, Layout
│   │       ├── dashboard/      # MetricsBar, StockChart, LowStockAlert
│   │       └── inventory/      # ProductTable, Add/Edit/QuickUpdate Modals
└── backend/
    ├── Dockerfile              # Python slim + unprivileged user
    ├── requirements.txt
    ├── sql/init.sql            # Full DDL + seed data
    └── app/
        ├── main.py             # FastAPI app + CORS + lifespan
        ├── core/               # config, database, security, redis
        ├── models/             # SQLAlchemy ORM models
        ├── schemas/            # Pydantic request/response schemas
        ├── middleware/auth.py  # JWT bearer + RBAC dependencies
        └── routers/            # auth, products, stock, analytics
```

---

## 🔒 Security Features

- **JWT Authentication** — HS256 signed tokens, 60-min expiry
- **RBAC** — Admin (full access) and Staff (view/update, no delete/analytics)
- **Unprivileged Docker user** — backend runs as `appuser`, not root
- **CORS** — locked to frontend origin only
- **Soft Delete** — `is_deleted` flag preserves audit history
- **ACID Transactions** — row-level `SELECT FOR UPDATE` locking prevents race conditions
- **Input Validation** — Pydantic schemas + React Hook Form client validation

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint                    | Auth     | Description        |
|--------|-----------------------------|----------|--------------------|
| POST   | `/api/v1/auth/register`     | Public   | Register user      |
| POST   | `/api/v1/auth/login`        | Public   | Login → JWT token  |
| POST   | `/api/v1/auth/password-reset`| Public  | Reset password     |
| GET    | `/api/v1/auth/me`           | Any user | Current user info  |

### Products
| Method | Endpoint                    | Auth     | Description              |
|--------|-----------------------------|----------|--------------------------|
| GET    | `/api/v1/products`          | Any user | List (paginated, filterable) |
| GET    | `/api/v1/products/{id}`     | Any user | Get single product        |
| POST   | `/api/v1/products`          | Admin    | Create product            |
| PUT    | `/api/v1/products/{id}`     | Admin    | Update product metadata   |
| DELETE | `/api/v1/products/{id}`     | Admin    | Soft-delete product       |

### Stock
| Method | Endpoint                    | Auth     | Description              |
|--------|-----------------------------|----------|--------------------------|
| POST   | `/api/v1/stock/adjust`      | Any user | Adjust stock (ACID)      |
| GET    | `/api/v1/stock/transactions`| Any user | Transaction history       |
| GET    | `/api/v1/stock/low-stock`   | Any user | Low stock items           |
| POST   | `/api/v1/stock/check-alerts`| Any user | Trigger reorder check     |
| GET    | `/api/v1/stock/purchase-orders` | Any user | View purchase orders  |

### Analytics
| Method | Endpoint                          | Auth     | Description              |
|--------|-----------------------------------|----------|--------------------------|
| GET    | `/api/v1/analytics/dashboard`     | Any user | KPI metrics (revenue: Admin only) |
| GET    | `/api/v1/analytics/stock-by-category` | Any user | Category breakdown   |
| GET    | `/api/v1/analytics/transaction-history` | Admin | 30-day activity chart |

---

## 🛠 Local Development (without Docker)

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Set DATABASE_URL to point to local postgres
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```

---

## 📊 Database Schema

```
users ──────────────────────────────────────────────────────┐
  id (UUID PK), email (UNIQUE), role (admin|staff)          │
                                                             │
suppliers                                                    │
  id (UUID PK), name, contact_name, email, phone            │
        │                                                    │
        ▼                                                    │
products                                                     │
  id (UUID PK), sku (UNIQUE INDEX), name, category          │
  quantity, reorder_point, cost_price, selling_price         │
  supplier_id (FK→suppliers), is_deleted                    │
        │                                                    │
        ├──────────────────────────────────────────────┐    │
        ▼                                              ▼    ▼
stock_transactions                              purchase_orders
  id, product_id (FK), user_id (FK)              id, product_id (FK)
  transaction_type (IN|OUT|ADJUSTMENT)            supplier_id (FK)
  quantity_before, quantity_after                 quantity_ordered
  notes, created_at                               status, triggered_by (FK)
```

---

## 🔧 Useful Commands

```bash
# View logs
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# Stop everything
docker-compose down

# Remove volumes (WIPES DATABASE)
docker-compose down -v

# Shell into backend
docker-compose exec backend bash
```
