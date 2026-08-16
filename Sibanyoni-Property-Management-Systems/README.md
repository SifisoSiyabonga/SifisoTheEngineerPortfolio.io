@'
# Sibanyoni Property Management System 🏢

> **Apartment Rental Management System 🏢 Browse, book, and manage apartments effortlessly.**

A full-stack web application designed to streamline property rentals, tenant dashboard interactions, maintenance ticketing, and administrative overview.

---

## 🌟 Key Features

* **Role-Based Access & Authentication:** Dedicated interfaces for Tenants, Admins, and Technicians.
* **Tenant Dashboard:** Browse available apartments, submit maintenance/quality-service requests, and track request status.
* **Admin Dashboard:** Oversee listings, review tenant activity, and manage incoming requests.
* **Technician Dashboard:** View assigned service tickets and update maintenance resolutions.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript (ES6)
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas (Mongoose ORM)
* **Hosting & Deployment:** Render

---

## 📂 Project Structure

```text
SIBANYONI PROPERTY MANAGEMENT SYSTEM/
├── auth-app/
├── models/             # MongoDB Mongoose Schemas
├── public/             # Static Frontend Assets
│   ├── admin-dashboard.html
│   ├── dashboard.html
│   ├── index.html
│   ├── login.html
│   ├── register-new.html
│   ├── register.html
│   ├── script.js
│   ├── technician-dashboard.html
│   └── tenant-dashboard.html
├── routes/             # Express API Endpoints
├── .env                # Environment Variables (Ignored in Git)
├── package.json
├── server.js           # Express App Entry Point
└── User.js