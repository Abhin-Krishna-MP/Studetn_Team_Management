# 🎓 Student Team Management System - Complete Guide

## ✅ System Overview

Your application now has **complete authentication** with separate logins for **Students** and **Tutors**, with all features working properly.

---

## 🚀 Quick Start

### Backend Server
```bash
cd /home/abhin-krishna-m-p/DBMS_Project
npm start
```
**Running on:** http://localhost:3000

### Frontend Server  
```bash
cd /home/abhin-krishna-m-p/DBMS_Project/frontend
npm run dev
```
**Running on:** http://localhost:5174

---

## 👥 Test Accounts

### Tutor Account
- **Email:** john.smith@university.edu
- **Password:** password123
- **Role:** Tutor

### Student Account
- **Email:** alice@university.edu
- **Password:** password123
- **Role:** Student

---

## 🔐 Authentication Features

### For Students:
✅ Register with email, password, name, and batch
✅ Login to access student workspace
✅ Save drafts while working
✅ Submit final work
✅ View analytics and velocity

### For Tutors:
✅ Register with email, password, name, and department
✅ Login to access tutor dashboard
✅ Create new task phases
✅ Upload student CSV files to create teams
✅ View all submissions for phases
✅ Grade submissions
✅ Delete phases
✅ Create batches
✅ View team velocity analytics

---

## 📋 Features by Role

### 🎓 Student Features

#### Dashboard
- Upload CSV (via tutor)
- View team information
- See project phases

#### Student Workspace
- Write and edit content
- Save drafts (tracks line changes)
- Submit final work
- View draft statistics

#### Task Phases
- View assigned phases
- See deadlines
- Check submission status

#### Analytics
- View team velocity heatmap
- See draft commit history
- Track individual contributions

---

### 👨‍🏫 Tutor Features

#### Dashboard
- **Upload Students:** Upload CSV to create students and auto-generate teams
- **Create Batch:** Create new batches for students
- **View Statistics:** See overview of phases and submissions

#### Task Phases  
- **Create New Phase:** Set title, description, start/end dates
- **View All Phases:** See all phases you've created
- **Delete Phase:** Remove phases you've created
- **View Submissions:** See all submissions for each phase
- **Grade Submissions:** Assign marks to team submissions

#### Teams Management
- View all teams under supervision
- See team members
- Monitor team submissions

#### Analytics
- View velocity data for any team
- Track student participation
- Identify inactive members

---

## 🔗 API Endpoints

### Public Endpoints
```
POST /api/auth/student/register - Register as student
POST /api/auth/student/login    - Student login
POST /api/auth/tutor/register   - Register as tutor
POST /api/auth/tutor/login      - Tutor login
```

### Protected Endpoints (Require Authentication)

#### Student Endpoints
```
POST /api/students/upload            - Upload CSV (requires token)
POST /api/drafts                     - Save draft
POST /api/submissions                - Submit final work
GET  /api/submissions/phase/:id      - Get submissions for phase
GET  /api/teams/:id/velocity/:phase  - Get velocity data
```

#### Tutor Endpoints
```
POST   /api/tutor/phases                    - Create new phase
GET    /api/tutor/phases                    - Get all tutor's phases
DELETE /api/tutor/phases/:id                - Delete phase
GET    /api/tutor/phases/:id/submissions    - Get phase submissions
PUT    /api/tutor/submissions/:id/grade     - Grade submission
POST   /api/tutor/batches                   - Create batch
GET    /api/tutor/batches                   - Get all batches
GET    /api/tutor/teams                     - Get tutor's teams
```

---

## 📁 Project Structure

### Backend
```
DBMS_Project/
├── controllers/
│   ├── authController.js       # Login/Register logic
│   ├── tutorController.js      # Tutor-specific features
│   ├── studentController.js    # Student features
│   ├── draftController.js      # Draft tracking
│   └── submissionController.js # Submission handling
├── middleware/
│   ├── auth.js                 # JWT authentication
│   └── upload.js               # File upload handling
├── models/
│   ├── Student.js              # Student model (with password)
│   ├── Tutor.js                # Tutor model (with password)
│   ├── Team.js
│   ├── TaskPhase.js
│   ├── Submission.js
│   ├── DraftCommit.js
│   └── index.js                # Model associations
├── routes/
│   ├── auth.js                 # Auth routes
│   ├── tutor.js                # Tutor routes
│   ├── students.js             # Student routes
│   ├── drafts.js               # Draft routes
│   └── submissions.js          # Submission routes
└── server.js                   # Main server file
```

### Frontend
```
frontend/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication state
│   ├── pages/
│   │   ├── Login.jsx           # Login page
│   │   ├── Register.jsx        # Registration page
│   │   ├── Dashboard.jsx       # Main dashboard
│   │   ├── TaskPhases.jsx      # Phase management
│   │   ├── StudentWorkspace.jsx # Student editor
│   │   └── Analytics.jsx       # Velocity analytics
│   ├── components/
│   │   └── Layout.jsx          # Main layout (with auth)
│   ├── api/
│   │   └── axios.js            # API configuration
│   └── App.jsx                 # Routes & protection
```

---

## 🔧 How It Works

### Authentication Flow

1. **Register/Login**
   - User enters credentials
   - Backend validates and creates JWT token
   - Token stored in localStorage
   - User data stored in React context

2. **Protected Routes**
   - Frontend checks if user is authenticated
   - If not, redirects to login
   - If yes, loads requested page

3. **API Requests**
   - Axios interceptor adds JWT token to all requests
   - Backend middleware verifies token
   - Grants access based on role (student/tutor)

### Draft Tracking System

1. Student types in workspace
2. Clicks "Save Draft"
3. System calculates lines added/deleted
4. Creates/finds submission automatically
5. Saves draft commit with statistics
6. Updates baseline for next diff

### Team Creation (Tutor)

1. Tutor uploads CSV with student names/emails
2. System validates data
3. Creates students in database
4. Auto-generates teams based on group size
5. Assigns students to teams

### Submission & Grading

1. Student submits final work
2. AI analyzes content (if OpenAI key provided)
3. Checks similarity with other submissions
4. Stores submission in database
5. Tutor can view and grade
6. Students see their grades

---

## 🛠️ Database Changes

### New Fields Added

**Student Table:**
- `password` VARCHAR(255) - Hashed password

**Tutor Table:**
- `password` VARCHAR(255) - Hashed password (required)

**All data was cleared** to accommodate the new schema.

---

## 🎯 Usage Guide

### For Students

1. **Register**
   - Go to http://localhost:5174
   - Click "Register"
   - Select "Student"
   - Fill in details and select batch
   - Submit

2. **Login**
   - Enter email and password
   - Click "Sign In"

3. **Use Workspace**
   - Navigate to "Student Workspace"
   - Type your content
   - Click "Save Draft" periodically
   - Click "Final Submit" when done

4. **View Analytics**
   - Go to "Analytics"
   - Select your team and phase
   - See velocity heatmap

### For Tutors

1. **Register**
   - Go to http://localhost:5174
   - Click "Register"
   - Select "Tutor"
   - Fill in details
   - Submit

2. **Login**
   - Enter email and password
   - Click "Sign In"

3. **Create Phase**
   - Go to "Task Phases"
   - Click "New Phase"
   - Fill in details (title, dates, description)
   - Submit

4. **Upload Students**
   - Go to "Dashboard"
   - Click "Upload CSV"
   - Select CSV file with columns: name, email
   - Set batch ID, tutor ID, group size
   - Upload

5. **Grade Submissions**
   - Go to "Task Phases"
   - Click on a phase
   - View submissions
   - Click "Grade"
   - Enter marks (0-100)
   - Save

---

## 📝 Notes

- **Password Security:** All passwords are hashed with bcrypt
- **JWT Expiration:** Tokens expire after 7 days
- **Role-Based Access:** Routes check user role before allowing access
- **Auto-Create Submissions:** Drafts auto-create submissions if needed
- **CORS Configured:** Frontend can access backend APIs

---

## 🎉 Everything is Working!

✅ Student Login/Register  
✅ Tutor Login/Register  
✅ Protected Routes  
✅ Create Task Phases  
✅ Upload Students & Create Teams  
✅ Save Drafts  
✅ Submit Work  
✅ Grade Submissions  
✅ View Analytics  
✅ Delete Phases  
✅ JWT Authentication  
✅ Role-Based Access Control  
✅ Database Clean & Synced  

---

**Access Your App:** http://localhost:5174  
**API Endpoint:** http://localhost:3000  

**Default Test Accounts Available!**
