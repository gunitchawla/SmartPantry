# 🥫 SmartPantry

### Cloud-Based Pantry Inventory Management System

SmartPantry is a modern pantry inventory management system designed to help users manage products, track quantities, and monitor expiry dates through an intuitive web dashboard.

The project demonstrates a **distributed cloud-style architecture** using separate virtual machines for the frontend, backend, and database. It uses **Vagrant** for virtual machine provisioning and **Docker** for containerisation.

---

## 📌 Table of Contents

* [Project Overview](#-project-overview)
* [Key Features](#-key-features)
* [Architecture](#-architecture)
* [Technology Stack](#-technology-stack)
* [Project Structure](#-project-structure)
* [Virtual Machines](#-virtual-machines)
* [Prerequisites](#-prerequisites)
* [Installation](#-installation)
* [Running the Project](#-running-the-project)
* [Frontend](#-frontend)
* [Backend API](#-backend-api)
* [Database](#-database)
* [Adding Products](#-adding-products)
* [Testing](#-testing)
* [Docker](#-docker)
* [Troubleshooting](#-troubleshooting)
* [Git Workflow](#-git-workflow)
* [Future Improvements](#-future-improvements)
* [Conclusion](#-conclusion)

---

# 📖 Project Overview

SmartPantry provides a centralised interface for managing pantry inventory.

Users can:

* View all pantry products
* Add new products
* Track product quantities
* Monitor expiry dates
* Identify products that are expiring soon
* Identify expired products
* Identify low-stock products
* Search the inventory
* Filter products by status

The application is designed using a multi-tier architecture:

```text
                    ┌──────────────────────┐
                    │      User / Mac      │
                    └──────────┬───────────┘
                               │
                               │ HTTP
                               ▼
                 ┌──────────────────────────┐
                 │      Frontend VM         │
                 │   React + Vite           │
                 │   192.168.56.10:5173    │
                 └────────────┬─────────────┘
                              │
                              │ REST API
                              ▼
                 ┌──────────────────────────┐
                 │       Backend VM         │
                 │    Node.js + Express     │
                 │   192.168.56.11:5000    │
                 └────────────┬─────────────┘
                              │
                              │ MySQL
                              ▼
                 ┌──────────────────────────┐
                 │      Database VM         │
                 │         MySQL            │
                 │   192.168.56.12:3306    │
                 └──────────────────────────┘
```

This separation allows each application layer to operate independently.

---

# ✨ Key Features

## 📊 Dashboard

The dashboard provides an overview of the pantry, including:

* Total products
* Expiring products
* Expired products
* Low-stock products

## 🔎 Product Search

Users can search for products by name.

## 🏷️ Product Status

Products are automatically categorised according to their expiry date:

| Status           | Description                            |
| ---------------- | -------------------------------------- |
| 🟢 Fresh         | Product has more than 3 days remaining |
| 🟠 Expiring Soon | Product expires within 3 days          |
| 🔴 Expired       | Product has already expired            |

## ➕ Add Product

Users can add a product through the website using:

* Product name
* Quantity
* Expiry date

## 📱 Responsive UI

The React interface is designed to work across different screen sizes.

---

# 🏗️ Architecture

SmartPantry follows a **three-tier architecture**.

### 1. Presentation Layer

The React frontend is responsible for:

* User interface
* Product display
* Search and filtering
* Product creation form
* Dashboard statistics

### 2. Application Layer

The Node.js backend is responsible for:

* REST API endpoints
* Processing requests
* Validating and handling product data
* Communicating with MySQL

### 3. Data Layer

The MySQL database is responsible for:

* Persistent product storage
* Product quantities
* Expiry dates
* Product identifiers

---

# 🛠️ Technology Stack

| Technology     | Purpose                     |
| -------------- | --------------------------- |
| React          | Frontend UI                 |
| Vite           | Frontend development server |
| Node.js        | Backend runtime             |
| Express        | REST API                    |
| MySQL          | Database                    |
| Docker         | Containerisation            |
| Docker Compose | Multi-container management  |
| Vagrant        | VM provisioning             |
| VMware Fusion  | Virtualisation              |
| Git            | Version control             |
| GitHub         | Source-code hosting         |

---

# 📁 Project Structure

```text
SmartPantry/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── server.js
│   ├── controllers/
│   ├── routes/
│   ├── Dockerfile
│   └── ...
│
├── database/
│   └── ...
│
├── scripts/
│   └── provision.sh
│
├── Vagrantfile
│
├── docker-compose.yml
│
└── README.md
```

---

# 💻 Virtual Machines

The project uses three Vagrant virtual machines.

| VM       | IP Address      | Role              |
| -------- | --------------- | ----------------- |
| Frontend | `192.168.56.10` | React application |
| Backend  | `192.168.56.11` | Node.js API       |
| Database | `192.168.56.12` | MySQL             |

Each VM uses:

```text
Ubuntu 24.04
2 GB RAM
2 CPUs
```

The VMs communicate through Vagrant's private network.

---

# 📋 Prerequisites

Before running SmartPantry, ensure the host system has:

* VMware Fusion
* Vagrant
* Git
* Docker
* Node.js/npm

The project VMs are provisioned using the Vagrant configuration and provisioning script.

---

# 🚀 Installation

## 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Move into the project:

```bash
cd SmartPantry
```

---

## 2. Check Vagrant

```bash
vagrant --version
```

Check the configured machines:

```bash
vagrant status
```

---

## 3. Start the VMs

```bash
vagrant up
```

This starts:

```text
frontend
backend
database
```

---

# ▶️ Running the Project

## Start Frontend

Connect to the frontend VM:

```bash
vagrant ssh frontend
```

Move to the frontend directory:

```bash
cd /vagrant/frontend
```

Install dependencies if required:

```bash
npm install
```

Start Vite:

```bash
npm run dev -- --host
```

The frontend should be accessible from the Mac at:

```text
http://192.168.56.10:5173
```

---

# 🔌 Backend

Connect to the backend VM:

```bash
vagrant ssh backend
```

Move to the backend directory:

```bash
cd /vagrant/backend
```

Install dependencies:

```bash
npm install
```

Start the backend:

```bash
npm run dev
```

The backend runs on:

```text
http://192.168.56.11:5000
```

---

# 🗄️ Database

The database VM uses:

```text
IP: 192.168.56.12
Port: 3306
Database: MySQL
```

The backend connects to the database using the database VM's private IP.

The product information is stored in the `products` table.

A product contains:

```text
id
name
quantity
expiry_date
```

---

# 🔗 Backend API

## Get Products

### Request

```http
GET /products
```

Example:

```bash
curl http://192.168.56.11:5000/products
```

This retrieves the current product inventory.

---

## Add Product

### Request

```http
POST /products
```

### Example

```bash
curl -X POST http://192.168.56.11:5000/products \
-H "Content-Type: application/json" \
-d '{
  "name": "Butter",
  "quantity": 2,
  "expiry_date": "2026-09-01"
}'
```

A successful request should return an HTTP `201` response.

---

# ➕ Adding Products

There are two ways to add products.

## Method 1 — Website

Open:

```text
http://192.168.56.10:5173
```

Click:

```text
+ Add Product
```

Enter:

```text
Product Name
Quantity
Expiry Date
```

Then click:

```text
Add Product
```

The React frontend sends the information to:

```text
Backend → POST /products
```

The backend then stores the product in MySQL.

---

## Method 2 — Terminal

Use:

```bash
curl -X POST http://192.168.56.11:5000/products \
-H "Content-Type: application/json" \
-d '{
  "name": "Butter",
  "quantity": 2,
  "expiry_date": "2026-09-01"
}'
```

Then verify:

```bash
curl http://192.168.56.11:5000/products
```

---

# 🧪 Testing

Testing should be performed layer by layer.

## 1. Check VM status

```bash
vagrant status
```

All required VMs should be running.

---

## 2. Check Backend

```bash
vagrant ssh backend
```

Then check that the Node.js server is running on:

```text
Port 5000
```

---

## 3. Test API

```bash
curl http://192.168.56.11:5000/products
```

---

## 4. Test POST API

```bash
curl -X POST http://192.168.56.11:5000/products \
-H "Content-Type: application/json" \
-d '{
  "name": "Milk",
  "quantity": 3,
  "expiry_date": "2026-09-05"
}'
```

---

## 5. Test Frontend

Open:

```text
http://192.168.56.10:5173
```

Verify that:

* Dashboard loads
* Products are displayed
* Search works
* Filters work
* Add Product works
* Newly added products appear

---

# 🐳 Docker

Docker is used to containerise application services.

A backend Docker image can be built from the directory containing the Dockerfile:

```bash
docker build -t smartpantry-backend .
```

If Docker Compose is being used, make sure the directory contains:

```text
docker-compose.yml
```

or:

```text
compose.yml
```

Then run:

```bash
docker compose up -d --build
```

> **Important:** `Dockerfile` and `docker-compose.yml` serve different purposes. A Dockerfile defines how an individual image is built, while Compose YAML defines how one or more containers are configured and run.

---

# 🔧 Troubleshooting

## `npm: command not found`

Check:

```bash
node --version
npm --version
```

If npm is unavailable, Node.js needs to be installed or correctly added to PATH.

---

## Node.js `styleText` Error

If you see:

```text
SyntaxError:
The requested module 'node:util'
does not provide an export named 'styleText'
```

this indicates a Node.js compatibility issue with the installed Vite/Rolldown dependencies.

Check:

```bash
node --version
```

Use a Node.js version compatible with the project's installed dependencies.

---

## Database `ECONNREFUSED`

Example:

```text
ECONNREFUSED 192.168.56.12:3306
```

Check:

1. Database VM is running.
2. MySQL service is running.
3. MySQL is listening on the required interface.
4. Port `3306` is accessible.
5. Backend database configuration uses:

```text
192.168.56.12
```

---

## Docker Compose "no configuration found"

If you see:

```text
no configuration found
```

check that you are inside the directory containing:

```text
docker-compose.yml
```

Run:

```bash
ls
```

Then:

```bash
docker compose up -d --build
```

---

## VMware Disk Error

If VMware reports an error such as:

```text
Cannot open the disk
```

or:

```text
Directory not empty
```

the VM's virtual disk/snapshot chain may have an issue.

Check the VM state:

```bash
vagrant status
```

If the affected VM is disposable, it can be recreated after ensuring important project files are stored in the shared `/vagrant` directory or Git repository.

---

# 🔄 Git Workflow

After making changes:

```bash
git status
```

Stage the changes:

```bash
git add .
```

Create a commit:

```bash
git commit -m "Update SmartPantry application"
```

Push to GitHub:

```bash
git push origin main
```

For a feature branch:

```bash
git push origin <branch-name>
```

---

# 🔐 Security Considerations

The project should follow basic security practices.

### Do not commit secrets

Avoid committing:

```text
database passwords
API keys
authentication secrets
.env files containing credentials
```

### Use environment variables

Configuration such as database credentials should ideally be stored using environment variables.

### Backend validation

The backend should validate incoming product data rather than relying exclusively on frontend validation.

### Database security

MySQL should not be unnecessarily exposed to external networks. Access should preferably be restricted to the backend service.

---

# 🔮 Future Improvements

Potential improvements include:

* 🔐 User authentication and authorisation
* 👤 Multiple user accounts
* ✏️ Edit existing products
* 🗑️ Delete products
* 📦 Product categories
* 📈 Inventory analytics
* 🔔 Expiry notifications
* 📧 Email notifications
* 📱 Improved mobile interface
* ☁️ Cloud deployment
* 🔄 Automated CI/CD pipeline
* 🧪 Automated unit and integration tests
* 📊 Advanced inventory reports

---

# 📈 Cloud Computing Concepts Demonstrated

SmartPantry demonstrates several important cloud-computing concepts:

### Virtualisation

Vagrant and VMware are used to create isolated virtual machines.

### Service Separation

Frontend, backend and database operate as separate services.

### Networking

The VMs communicate using private IP addresses.

```text
Frontend
192.168.56.10
      ↓
Backend
192.168.56.11
      ↓
Database
192.168.56.12
```

### Containerisation

Docker provides a consistent environment for application services.

### Reproducibility

Vagrant provisioning allows the development environment to be recreated consistently.

### Scalability

The separated architecture provides a foundation for independently scaling application components.

---

# 👨‍💻 Author

**Gunit Chawla**

Cloud Computing Assignment 1

---

# 📄 License

This project was developed for academic purposes as part of a Cloud Computing assignment.

---

# 🎯 Conclusion

SmartPantry combines a modern React interface with a Node.js REST API and MySQL database. The application is deployed across separate Vagrant virtual machines and uses Docker to demonstrate containerisation.

The project demonstrates practical implementation of:

```text
React
   ↓
Node.js / Express
   ↓
MySQL
   ↓
Vagrant + VMware
   ↓
Docker
   ↓
Git / GitHub
```

This architecture provides a clear, modular and reproducible foundation for a cloud-based inventory management application.
