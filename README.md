# Sagar Suraksha - Ocean Hazard Reporting & Social Media Analytics

Sagar Suraksha is an integrated, real-time crowdsourcing and analytics platform designed for the **Indian National Centre for Ocean Information Services (INCOIS)** to bridge the gap between ocean hazard predictions and ground-level validation.

---

## 📌 Smart India Hackathon (SIH) Details
*   **Problem Statement ID:** 25039 (also referenced as SIH-1629)
*   **Problem Title:** Integrated Platform for Crowdsourced Ocean Hazard Reporting and Social Media Analytics
*   **Theme:** Disaster Management & Coastal Safety
*   **Nodal Agency:** Ministry of Earth Sciences (MoES) / Indian National Centre for Ocean Information Services (INCOIS)
*   **Category:** Software

---

## 🌟 Importance & Key Objectives

Traditional early warning systems rely heavily on satellite remote sensing, tidal gauges, deep-ocean buoys, and complex numerical models. While highly accurate, they lack **real-time ground validation** and face the following challenges:
1.  **The "Last Mile" Ground Truth Gap:** Satellite data and models may forecast high waves or coastal flooding, but actual impacts (such as harbor damage or road blocks) require local observers.
2.  **Unstructured Social Media Intelligence:** During extreme weather events (e.g., swell surges, cyclones), coastal residents and fishermen upload real-time images, videos, and updates to platforms like X (Twitter), Facebook, and Instagram long before official agencies inspect the area.

### Sagar Suraksha solves this by:
*   Providing a mobile-responsive **Citizen Portal** for instant, geotagged hazard reporting with photo/video attachments.
*   Integrating a **Social Media Analytics Engine** that ingests raw social posts, classifies hazard types, gauges threat severity (Critical, Warning, Informational) using sentiment analysis, and places them on interactive maps.
*   Empowering **INCOIS Officials** with an administrative dashboard to monitor crowdsourced data, view hazard heatmaps, review social media flags, and verify alerts to trigger disaster response protocols.

---

## 🛠️ Technology Stack

### Backend
*   **FastAPI:** High-performance web framework for build APIs.
*   **SQLAlchemy ORM:** SQL database client and mapper.
*   **GeoAlchemy2 & PostGIS:** Spatial database extensions to handle coordinates and geographical `POINT` geometries natively.
*   **python-dotenv:** Secure configuration management.
*   **WebSockets:** Standard protocols for live data broadcasts to admin panels.

### Frontend
*   **React:** Declarative component-based UI.
*   **React Leaflet (OpenStreetMap):** Custom map wrappers for rendering geotagged markers, custom icons, and hazard heatmaps.
*   **CSS / SVG Data Visualizations:** Lightweight and compatible widgets to show threat levels and hazard distribution.
*   **React Hot Toast:** Slick, asynchronous user feedback notifications.

---

## 🚀 Core Features

### 🧑‍💼 1. Citizen Portal
*   **OTP-verified Registration:** Ensures authentic, traceable reporters. Includes verification resend flows to prevent lockout.
*   **Geotagged Submissions:** Captures coordinates automatically via browser-based GPS.
*   **Visual Logs:** Citizens can track the verification status (`UNVERIFIED`, `VERIFIED`, `FALSE`) of their submitted reports in a personal feed.

### 👮 2. Admin & Official Dashboard
*   **Interactive Spatial View:** Geotagged markers distinguish citizen reports from social media flags using distinct icons. Includes a Heatmap layer to spot hazard clusters.
*   **WebSocket Stream:** Live updates populate map alerts instantly without manual refreshes.
*   **Social Media Analytics Feed:**
    *   *Simulated Crawler/Ingestion:* Mimics API sync of platforms like X/Twitter for hashtags such as `#highwaves`, `#coastalflooding`, and `#swellsurges`.
    *   *Classification Dashboard:* Displays counts of threat categories and sentiment classifications.
    *   *One-Click Verification:* Allows administrators to review unverified social posts and convert them into official hazard reports mapped in real-time.

---

## ⚙️ Project Structure
```text
INCOIS_SIH_Project/
│
├── backend/                  # FastAPI Application
│   ├── .env                  # Configuration variables (DB url, JWT keys)
│   ├── requirements.txt      # Python dependencies
│   ├── database.py           # Database connection & session setup
│   ├── models.py             # User, Report, and SocialMediaPost ORM models
│   ├── schemas.py            # Pydantic models for serialization
│   ├── crud.py               # Database queries
│   ├── main.py               # FastAPI routers and WebSockets
│   ├── security.py           # Password hashing & JWT token services
│   ├── otp_utils.py          # OTP generation & mock mail dispatch
│   └── websocket_manager.py  # WebSocket connection manager
│
├── frontend-web/             # React Application
│   ├── src/
│   │   ├── components/       # Header, Sidebar, ProtectedRoute, MapLegends
│   │   ├── context/          # Authentication & Refetching context
│   │   ├── pages/            # Landing, Login, OTP, Report Submit, Admin Dashboard
│   │   ├── App.js            # Routing setup
│   │   └── index.js          # Root injection
│   └── package.json          # Node dependencies
│
└── README.md                 # Root documentation file
```

---

## 💾 Installation & Setup

### Prerequisites
*   **Python 3.10+**
*   **Node.js 18+**
*   **PostgreSQL** with **PostGIS** extension installed.

---

### Step 1: Database Setup
1. Create a database in PostgreSQL named `incois_db`:
   ```sql
   CREATE DATABASE incois_db;
   ```
2. Connect to the database and enable the PostGIS extension:
   ```sql
   \c incois_db;
   CREATE EXTENSION postgis;
   ```

---

### Step 2: Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify the database configurations inside `.env`:
   ```text
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost/incois_db
   SECRET_KEY=YOUR_JWT_SECRET_KEY
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```
   *The server will run on `http://localhost:8000`. Database tables will be auto-generated on startup.*

---

### Step 3: Frontend Setup
1. Navigate to the `frontend-web` directory:
   ```bash
   cd ../frontend-web
   ```
2. Install the node packages:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   *The client will open in your browser at `http://localhost:3000`.*

---

## 🧑‍💻 How to Test the Integrated Workflow
1.  **Register a User:** Navigate to the citizen sign-up page. An OTP is generated and printed in the backend console (simulating SMS/Email dispatch). 
2.  **Verify & Login:** Input the OTP on the verification page. If expired or missed, click **Resend OTP** to fetch a fresh token. Log in to access the citizen report submission page.
3.  **Submit a Report:** Geotag a hazard (e.g., high waves), enter details, upload a media file, and click submit.
4.  **Admin Portal:** Login at `/admin-login` with an admin account (role: `admin` in database). 
5.  **WebSocket Broadcast & Maps:** Check the real-time map. The report you submitted as a citizen is mapped automatically.
6.  **Social Ingestion:** Toggle the view to **Social Feed** and click **Sync Live Social Data**. Mock posts from X/Twitter and Facebook will be ingested, classified, and displayed in the analytics charts.
7.  **Map Verification:** Click **Verify & Convert to Official Report** on a geotagged post from the social feed or directly from the purple social map markers. The post turns verified and joins the official map layer immediately.
