# 🍞 Bakery Management System

A full-stack bakery management system with Node.js backend and React frontend, featuring user management, product catalog, shopping cart, and order system with RabbitMQ + PostgreSQL integration.

🔄 System Workflow
Below is a high-level workflow of the Bakery Management System showcasing the interaction between the frontend, backend, message queue, and database components:

![Bakery Management System Workflow](./A_flowchart_infographic_presents_a_Bakery_Manageme.png)

---

## ✨ Key Features

### **Backend (Node.js + Express)**
| Component | Details |
|-----------|---------|
| **User Management** | JWT authentication • Role-based access control |
| **Product Catalog** | CRUD operations • Prisma ORM integration • PostgreSQL database |
| **Shopping Cart** | Cart operations with real-time validations |
| **Order System** | RabbitMQ message queuing for order processing |
| **Performance** | Optimized Prisma queries • Dockerized microservices architecture |

### **Frontend (React)**
- User login and registration
- Product browsing and shopping cart management
- Token-based session handling (JWT)
- Responsive UI built with Tailwind CSS
- Axios for API communication
- Role-based access views (user/admin)

---

## ⚙️ Tech Stack

**Backend**
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)

**Frontend**
![React](https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 🚀 Quick Start

### Docker Setup (Recommended)
```bash
# Start all services
docker-compose up --build

# Access:
- API Server: http://localhost:5000 (or your backend port)
- React Frontend: http://localhost:3000 (or your frontend port)
- RabbitMQ Dashboard: http://localhost:15672 (guest/guest)
- PostgreSQL database: localhost:5432

🔧 Implementation Details
Prisma (ORM)
Database schema management

Auto-migration system

Type-safe queries

RabbitMQ
Order processing queue

Event-driven notifications

Scalable background job handling

PostgreSQL
Persistent relational database

Data models managed by Prisma

React Frontend
JWT authentication flow (login, register)

Cart system with live updates

Product browsing UI

Role-based dashboard access

🛠️ Local Development
Backend:
cd bakery-backend
npm install
node src/index.js

Frontend:
cd frontend
npm install
npm start

📝 Environment Variables
Backend (bakery-backend/.env)
DATABASE_URL= postgresql://postgres:Your_Password@localhost:5432/bakery?schema=public
PORT=Port_no.
NODE_ENV=development
RABBITMQ_URL=amqp://guest:guest@localhost:5672
JWT_SECRET=yourSuperSecretKey

Frontend (frontend/.env)
REACT_APP_API_URL=http://localhost:3001/api

