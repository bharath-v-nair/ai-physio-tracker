# AI Physio Tracker: Run & Deploy Guide

This guide explains how the project is put together, how to run it on a laptop, and how to put it online for free. Follow it step by step and copy commands exactly.

---

## Part 1: How the project is put together

The app has three parts. Each lives in a different place.

| Part | What it is | Code | Where it runs online |
|---|---|---|---|
| **Frontend** | The website you see: pages, buttons, charts, webcam view | `src/` (React + Vite + TypeScript) | **Vercel** |
| **Backend** | A Python program on a server. Handles login, saves/loads data, analyses posture, talks to the AI chatbot | `backend/` (FastAPI) | **Render** |
| **Database** | Permanent storage: users, exercises, assessments, sessions, plans, chats | Tables defined in `backend/app/models/` | **Neon** (PostgreSQL) |

How they talk to each other:

```
 Browser (Vercel website)
   │  normal requests (login, load exercises, save session)  ──►  Backend on Render  ──►  Neon database
   │  live WebSocket stream (camera analysis)                 ──►  Backend on Render
   └─ chatbot question  ──►  Backend  ──►  Google Gemini API
```

**Where the pose AI runs:**
- **Live Exercise page:** MediaPipe runs *in the browser*. Only 33 body-point coordinates are sent to the backend, which counts reps and scores form.
- **Assessment page:** the browser sends webcam frames to the backend, and MediaPipe runs *on the server* to find posture problems.

**Hosting vs deploying:**
- *Hosting* = the service that keeps the app running at a web address (Vercel, Render, Neon).
- *Deploying* = sending the latest code to that host. Here it happens automatically on every push to GitHub.

**Locally** (on a laptop) the database is a single file, `backend/physioai.db` (SQLite). **Online** it is PostgreSQL on Neon. The code switches automatically using the `DATABASE_URL` setting.

---

## Part 2: What was fixed before deployment (and why)

These are the problems that stopped the project from working on a fresh computer or server.

1. **Dependency list couldn't install.** `backend/requirements.txt` was a full export of every package on the development laptop (140+ packages). Two of them needed different versions of the same library (`protobuf`), so installation failed. It now lists only the ~15 packages the code actually imports. (The `app/rag/` folder isn't used by the running app, so its LangChain/ChromaDB packages were removed.)
2. **Missing packages.** `email-validator` (needed for the email field at sign-up) and the Gemini library were never in the list, so the backend couldn't start.
3. **Chatbot library replaced.** Google stopped supporting `google-generativeai`. The chatbot (`backend/app/services/gemini_service.py`) now uses the current library, `google-genai`. Same behaviour.
4. **Wrong start command.** `render.yaml` started `app.main:app`, but the entry file is `backend/main.py`, so it's now `main:app`.
5. **Empty database online.** Tables and exercises were never created on the server. The start command now runs `alembic upgrade head` (creates/updates tables) and the seeder (adds the 15 exercises) before starting.
6. **Seeder deleted data.** The seeder used to delete all exercises every time it ran, which would break saved sessions linked to them. It now only adds exercises when the table is empty.
7. **Sign-up didn't create accounts.** The Sign up page was calling the *login* endpoint. It now calls `/auth/register` first, then logs in.
8. **Dashboard/Profile showed a fake user ("Alex Johnson").** They now load the logged-in user's real details from `/users/profile`.
9. **Page refresh gave "404" online.** Added `vercel.json` so every URL loads the React app.
10. **Assessment lag on slow servers.** The page sent 10 frames/second without waiting. On a slow free server, frames piled up and the skeleton fell behind. It now sends the next frame only after the previous result arrives.
11. **Linux graphics library.** MediaPipe installs a desktop version of OpenCV that needs graphics libraries servers don't have. `backend/build.sh` swaps it for the "headless" version.
12. **Blank screens after some buttons.** "Stop & Save" on the assessment, "Generate Rehab Plan" and "Take Assessment" pointed to addresses that don't exist (e.g. `/dashboard/report` instead of `/assessment/report`). They now point to the right pages.
13. **Database connection drops.** Neon closes idle connections, so `pool_pre_ping=True` makes the backend reconnect automatically.

---

## Part 3: Run it on a laptop (Mac)

### One-time installs
1. **Python 3.11**: download "macOS 64-bit universal2 installer" for **Python 3.11** from https://www.python.org/downloads/macos/ and install it. (MediaPipe does not work with Python 3.13 or newer.)
2. **Node.js**: download the **LTS** version from https://nodejs.org and install it.
3. Check both in Terminal:
   ```bash
   python3.11 --version
   node --version
   ```

### Backend (Terminal window 1)
```bash
cd path/to/ai-physio-tracker/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python -m app.database.seeder
uvicorn main:app --reload --port 8000
```
- Open `backend/.env` in a text editor and paste your Gemini key after `GEMINI_API_KEY=` (see Part 4, step 4). Without it, everything works except the chatbot.
- Check it's running: open http://127.0.0.1:8000/docs in the browser.
- Next time you only need: `cd backend`, `source venv/bin/activate`, `uvicorn main:app --reload --port 8000`.

### Frontend (Terminal window 2)
```bash
cd path/to/ai-physio-tracker
npm install
npm run dev
```
Open http://localhost:5173 in **Chrome** and allow the camera when asked.

---

## Part 4: Put it online (all free, no credit card)

Do the steps in this order. Sign up to every service with **"Continue with GitHub"**.

### Step 1: Code on GitHub
The code must be in a GitHub repository. Every service below reads it from there.

### Step 2: Database on Neon
1. Go to https://neon.com → Sign up → create a project (name: `physioai`, region: **AWS Asia Pacific (Singapore)**).
2. On the project dashboard click **Connect**.
3. Turn **Connection pooling OFF** and copy the connection string. It looks like
   `postgresql://neondb_owner:xxxx@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
4. Keep it private (it contains the password). You'll paste it into Render.

### Step 3: Gemini API key (for the chatbot)
1. Go to https://aistudio.google.com and sign in with a Google account.
2. Click **Get API key** (left menu) → **Create API key**.
3. If asked for a project, choose the default one (or click "Create project").
4. Copy the key (starts with `AIza`). Keep it private.

### Step 4: Backend on Render
1. Go to https://render.com → sign up with GitHub.
2. Click **New +** → **Web Service** (not Static Site, not Postgres).
3. Choose **Build and deploy from a Git repository** → connect GitHub → select `ai-physio-tracker`.
4. Fill in:

   | Field | Value |
   |---|---|
   | Name | `physioai-backend` |
   | Language / Runtime | `Python 3` |
   | Branch | `main` |
   | Region | `Singapore` |
   | Root Directory | `backend` |
   | Build Command | `bash build.sh` |
   | Start Command | `alembic upgrade head && python -m app.database.seeder && uvicorn main:app --host 0.0.0.0 --port $PORT` |
   | Instance Type | **Free** |

5. Under **Environment Variables** add:

   | Key | Value |
   |---|---|
   | `PYTHON_VERSION` | `3.11.8` |
   | `DATABASE_URL` | the Neon connection string |
   | `GEMINI_API_KEY` | the Gemini key |
   | `GEMINI_MODEL` | `gemini-3.5-flash` |
   | `SECRET_KEY` | any long random text (e.g. mash the keyboard for 40 characters) |

6. Click **Deploy Web Service**. The first build takes about 5–10 minutes. Wait until it says **Live**.
7. Copy your backend address from the top of the page, e.g. `https://physioai-backend.onrender.com`.
8. Test: open `https://physioai-backend.onrender.com/docs`. You should see the API page.

### Step 5: Frontend on Vercel
1. Go to https://vercel.com → sign up with GitHub (Hobby plan).
2. **Add New…** → **Project** → **Import** `ai-physio-tracker`.
3. Vercel may show "Multiple applications detected" with the Application Preset set to **Services**, listing `physioai-backend (FastAPI)` and `app (Vite)`. Click **Import single project** on the **`app` (Vite)** row only. The backend stays on Render: Vercel's Python hosting can't keep WebSocket connections open and has a package size limit that MediaPipe exceeds.
4. Framework Preset: **Vite**. Root Directory: leave as `./`.
5. Open **Environment Variables** and add:
   - Key: `VITE_API_URL`
   - Value: your Render address, e.g. `https://physioai-backend.onrender.com` (**no** `/` at the end)
6. Click **Deploy**. After about a minute you get a link like `https://ai-physio-tracker.vercel.app`.

> If you ever change `VITE_API_URL`, go to Vercel → Project → Deployments → ⋯ → **Redeploy**. The value is baked in at build time.

### Step 6: Keep the backend awake (cron-job.org)
Render's free server sleeps after 15 minutes without visitors, and the next visit then waits ~1 minute. To prevent this:
1. Go to https://cron-job.org → sign in → **Create cronjob**.
2. Title: `physioai keep-awake`. URL: your Render address, e.g. `https://physioai-backend.onrender.com/`
3. Schedule: **Every 10 minutes**. Save.

---

## Part 5: Presentation-day checklist

- [ ] 10 minutes before: open the Vercel link and log in. The Dashboard should load within a few seconds.
- [ ] Use **Google Chrome**. Allow the camera once beforehand.
- [ ] Good lighting on your face and upper body. Sit or stand so your head and shoulders are fully in frame.
- [ ] Do one short exercise session and one assessment before presenting, so the Dashboard and Progress pages have data.
- [ ] Ask the chatbot one question to confirm it replies.
- [ ] **Backup 1:** a screen recording of the full demo (Mac: QuickTime Player → File → New Screen Recording).
- [ ] **Backup 2:** the laptop setup from Part 3, in case the college Wi-Fi blocks something.

**Demo order that works well:** Landing page → Sign up / Log in → Live Assessment (skeleton + posture score) → Save → Report and recommended exercises → Exercise detail → Live Exercise (rep counting + form score) → Save session → Dashboard / Progress → AI Assistant question.

---

## Part 6: Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Site loads but login spins ~1 min | Backend was asleep | Wait once. Set up Part 4 Step 6 |
| "Error connecting to backend" | `VITE_API_URL` wrong or backend down | Check Render shows **Live**; check the Vercel env var has no trailing `/`; Redeploy on Vercel |
| "Failed to access camera" | Camera permission blocked | Click the camera icon in Chrome's address bar → Allow → reload |
| Chatbot says "temporarily unavailable" | Gemini key missing or wrong | Check `GEMINI_API_KEY` on Render → Environment; save (it redeploys) |
| Render build fails on `pip install` | Wrong Python version | Make sure `PYTHON_VERSION` = `3.11.8` |
| Render log: `could not connect to server` | Bad `DATABASE_URL` | Re-copy the Neon string (pooling OFF), paste again |
| 404 when refreshing a page | `vercel.json` missing | Make sure `vercel.json` is in the repo root |
| Assessment skeleton is slow online | Free server has very little CPU | Expected on the free plan; it still works. Live Exercise is smooth because its AI runs in the browser |

---

## Part 7: Moving the repository to another GitHub account

**Option A: transfer (keeps everything):** on GitHub, open the repo → **Settings** → scroll to **Danger Zone** → **Transfer ownership** → type the new owner's username. The new owner accepts the email. Then, in Render and Vercel, reconnect the repo from the new account (Settings → Git / Repository).

**Option B: fresh copy:** the new owner creates an empty repo named `ai-physio-tracker`, then on a laptop:
```bash
git clone https://github.com/OLD-OWNER/ai-physio-tracker.git
cd ai-physio-tracker
git remote set-url origin https://github.com/NEW-OWNER/ai-physio-tracker.git
git push -u origin main
```
Then repeat Part 4 Steps 4–5 with the new repo (Neon can stay as it is).
