# 🏋️‍♀️ AI Physio Tracker

An intelligent, real-time computer vision physical therapy and posture rehabilitation platform. **AI Physio Tracker** tracks body movements using live webcam pose detection, provides real-time form scoring and feedback, counts exercise repetitions, generates posture analysis reports, and delivers customized rehabilitation plans.

---

## ✨ Features Built So Far

### 1. 🎥 Real-Time Computer Vision Exercise Tracking
* **Live Webcam Analysis**: Integrates MediaPipe Pose landmarks over WebSockets to analyze exercise movements frame-by-frame.
* **State-Machine Repetition Counter**: Uses state machines (`REST -> MOVING -> TARGET_REACHED -> RETURNING -> REP_COMPLETED`) to count reps accurately.
* **Custom Pose Analyzers**:
  * **Chin Tucks** (Neck posture & retraction tracking with dynamic baseline calibration).
  * **Wall Angels** (Shoulder mobility & upper back alignment).
  * **Scapular Retraction** (Scapular squeeze & mid-back posture).
* **Live HUD & Visual Overlay**:
  * Glowing futuristic joint skeleton overlay (rendered offscreen to eliminate canvas flickering).
  * Real-time form accuracy percentage score (`0% - 100%`).
  * Instant corrective audio/visual feedback (e.g., *"Pull chin straight back"*, *"Good hold!"*).
* **Session Summaries**: Saves session duration, form score, completed reps, and feedback directly to the backend database.

### 2. 🩺 Posture Assessment & Diagnostics
* Interactive camera-based posture alignment detector.
* Identifies posture concerns such as **Forward Neck**, **Uneven Shoulders**, **Round Shoulders**, and **Body Lean**.
* Generates comprehensive Assessment Reports with score breakdown and target recovery recommendations.

### 3. 📚 Targeted Exercise Library
* Browse recommended exercises filtered by specific posture concerns.
* Detailed exercise instructions, target muscle groups, sets/reps breakdown, common mistakes, and expert tips.

### 4. 📋 Personalized Rehabilitation Plans
* Dynamic rehab program generation based on user assessment history.
* Daily exercise schedule tracking with session completion status.

### 5. 🤖 AI Physio Assistant (RAG Chatbot)
* Intelligent assistant powered by a Retrieval-Augmented Generation (RAG) knowledge base.
* Answers physiotherapy queries, offers posture improvement advice, and suggests exercise modifications.

### 6. 📊 Progress Analytics & Profile
* Historical tracking of completed exercise sessions, average form scores, total practice time, and weekly streak metrics.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework**: React 18, Vite, TypeScript
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **Rendering**: HTML5 Canvas API (Offscreen frame processing & skeleton overlays)
* **Routing**: React Router DOM v6

### **Backend**
* **Framework**: FastAPI (Python 3.11)
* **AI / CV**: Google MediaPipe Pose, OpenCV, NumPy
* **Real-time Streaming**: WebSockets
* **Database**: SQLite locally, PostgreSQL (Neon) in production, with SQLAlchemy ORM
* **Database Migrations**: Alembic
* **Auth**: JWT Authentication with Password Hashing (Bcrypt)

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18+) & **npm**
* **Python** (3.11, MediaPipe does not support 3.13+)

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create your settings file (add your Gemini API key inside it)
cp .env.example .env

# Run database migrations and load the exercise library
alembic upgrade head
python -m app.database.seeder

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```
Backend server will start on: `http://127.0.0.1:8000`

---

### 2. Frontend Setup

Open a **new terminal window**:

```bash
# Navigate to project root directory
cd ai-physio-tracker

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend web application will run on: `http://localhost:5175` (or `http://localhost:5173`)

---

## ☁️ Deployment

The app is deployed with the frontend on **Vercel**, the backend on **Render** and the database on **Neon**. See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for step-by-step instructions.

---

## 📂 Folder Structure

```
.
├── backend/
│   ├── alembic/                      # DB migration scripts
│   ├── app/
│   │   ├── ai/                       # Computer Vision modules
│   │   │   ├── exercises/            # Chin Tucks, Wall Angels, Scapular Retraction analyzers
│   │   │   ├── pose_detector.py      # MediaPipe detector wrapper
│   │   │   └── posture_analyzer.py   # Posture assessment logic
│   │   ├── api/                      # REST API & WebSocket routers
│   │   ├── models/                   # SQLAlchemy DB models
│   │   ├── rag/                      # RAG Chatbot engine
│   │   └── schemas/                  # Pydantic request/response schemas
│   └── main.py                       # FastAPI entrypoint
│
├── src/
│   ├── components/                   # UI components & Dashboard Layout
│   ├── pages/                        # App Pages (LiveExercise, ExerciseDetail, Assessment, etc.)
│   ├── App.tsx                       # Main App routes
│   └── main.tsx                      # Vite React entrypoint
│
├── README.md                         # Documentation
└── package.json
```

---

## 📄 License
This project is for educational and physiotherapy tracking purposes.
