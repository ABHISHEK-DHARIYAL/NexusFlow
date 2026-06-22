# ThreadForge – Scalable Concurrency Monorepo Creator Hub

ThreadForge is a highly optimized systems-programming portal and automated dashboard that demonstrates multi-threading synchronization, thread pool task schedulers, and reactive execution flows. 

The project has been refactored into a professional monorepo setup consisting of a React/Vite/Three.js frontend, a modular Express backend API with Supabase/PostgreSQL client layers, and an autonomous custom JVM-based execution engine.

---

## 📂 Monorepo Architecture

```
threadforge/
├── frontend/             # React SPA with Three.js webGL particle visualizers
│   ├── public/           # Static icons/assets
│   ├── src/              # App components, pages, context, and state services
│   ├── vite.config.ts    # Frontend Vite bundler configuration (with Dev proxy)
│   ├── tsconfig.json     # Client TypeScript config
│   ├── .env.example      # Frontend variables template
│   └── index.html        # Main HTML entry-point
│
├── backend/              # Modular Express API Gateway
│   ├── src/
│   │   ├── config/       # pg database connectors and Gemini configurations
│   │   ├── controllers/  # REST api controllers (auth, profiles, channels, tasks)
│   │   ├── middleware/   # Token Authorization guards
│   │   ├── routes/       # Segmented API routing models
│   │   ├── services/     # TypeScript fallback ThreadPool managers and AI Services
│   │   ├── utils/        # Seeding and offline JSON fallback emulators
│   │   └── server.ts     # Central application bootstrapper
│   ├── tsconfig.json     # Node.js TypeScript compilation config
│   ├── .env.example      # Backend environment variables
│   └── README.md         # Express subsystem documentation
│
├── java-engine/          # Native High-Performance JVM execution engine
│   ├── src/
│   │   ├── ThreadPool.java     # Handcrafted core executor (no java.util.concurrent)
│   │   ├── Worker.java         # Custom worker execution loop
│   │   ├── BlockingQueue.java   # Condition-signaled priority blocking queue
│   │   ├── Task.java           # Abstract Task model definition
│   │   ├── PriorityTask.java   # Executable priority task implementation
│   │   ├── ScheduledTask.java  # Delay-managed task implementation
│   │   ├── RetryTask.java      # Error fault-tolerant task implementation
│   │   ├── CancellableTask.java# Interruption-safe task implementation
│   │   └── Main.java           # I/O process controller and process link entrypoint
│   ├── pom.xml           # Maven Java project build configuration
│   └── README.md         # Compilation and testing instructions
│
├── package.json          # Root Monorepo configuration and workspace scripts
└── README.md             # Central guides (this file)
```

---

## 🛠️ Step-by-Step Portability Setup

Follow the instructions below to configure and run the unified ThreadForge monorepo.

### Prerequisites

- [Node.js](https://nodejs.org/) (Version 18.x or above)
- [Java Development Kit (JDK)](https://www.oracle.com/java/technologies/) (Version 17 or above)
- [Maven](https://maven.apache.org/) (Optional, for building the Java Engine via POM)

### Phase 1: Install Monorepo Dependencies

At the monorepo root folder, run:
```bash
npm install
```
This installs the required shared and workspace manager packages, including `concurrently` for simultaneous development streams.

---

## ⚙️ Environment Variables & Database Configuration

To run both services correctly, configure your environment templates.

### 1. Backend Service Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

Set the following parameters:
- **`PORT`**: The express server port in standalone mode (Default: `5000`).
- **`JWT_SECRET`**: Private key used to sign simulator authentication tokens.
- **`JWT_EXPIRY`**: Duration for access tokens (e.g., `7d`).
- **`GEMINI_API_KEY`**: Your Google Gemini API Key. *(If left blank, the system automatically activates a local, high-fidelity offline AI generation mock-simulation).*

#### Supabase/PostgreSQL Connection
If you want to plug in a live relational database (like **Supabase** or another PostgreSQL instance), configure these variables in `backend/.env`:
```env
DB_HOST=your-supabase-db-host.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-secure-supabase-password
```
*Note: If `DB_HOST` is omitted, the systems safely falls back to a persistent local JSON Database Emulator (`/data/sqlite_emulator.json`), allowing you to develop 100% offline with zero external cloud dependencies.*

### 2. Frontend Settings (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:
```bash
cp frontend/.env.example frontend/.env
```
Ensure it points to your API base route:
```env
VITE_API_BASE_URL=/api
```
*(Using `/api` triggers Vite's built-in reverse proxy, preventing CORS issues and directing traffic seamlessly to port 5000 in development).*

---

## 🚀 Running the Application

### Development Mode

To start the frontend and backend together in a hot-reloading development workspace:
```bash
npm run dev
```
- The **React Frontend** launches on: **`http://localhost:3000`**
- The **Express Backend** launches on: **`http://localhost:5000`** (and is proxied via frontend port 3000)

### Production Build

To bundle and build all compiled assets for high-performance production hosting:
```bash
# 1. Build React client and Express service 
npm run build

# 2. Boot production server on port 3000 (binds Express + serves built SPA assets)
npm run start
```

---

## ☕ Running the Java Subsystem

The Java execution engine is highly autonomous and compiles into standard package JARs.

### Compilation

Navigate into `java-engine/` and run:
`mvn clean package` or compile raw code:
```bash
cd java-engine
javac src/*.java -d classes
```

### Process Linking
Once built into `target/threadforge-java-engine-1.0.0.jar` or compiled classes, the Node.js backend communicates directly with this subsystem to delegate raw scheduling algorithms and stream state transitions to the 3D monitoring dashboard in real-time.
