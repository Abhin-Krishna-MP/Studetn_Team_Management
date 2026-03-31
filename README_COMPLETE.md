# 🎓 Student Team Project Management System

A comprehensive web application for managing student teams, task phases, submissions, and performance tracking with AI-powered analytics.

## 🌟 Features

### For Tutors
- **Team Management**: Create and manage student teams
- **Phase Assignment**: Create task phases with deadlines for all teams
- **Submission Review**: View and evaluate team submissions
- **Grading System**: Assign both group and individual marks
- **Analytics Dashboard**: Track team performance and velocity
- **Student Overview**: View all students and their team assignments

### For Students
- **Team View**: See team members and assigned tutor
- **Phase Tracking**: View all assigned phases with deadlines
- **Submission History**: Access past submissions and grades
- **Performance Metrics**: Track individual contribution and velocity
- **Grade Visibility**: View both group and individual marks

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd DBMS_Project
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
cd ..
```

4. **Configure environment variables**
Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=student_project_tracker
DB_PORT=3306
PORT=3000
OPENAI_API_KEY=your_openai_key
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

5. **Create database**
```sql
CREATE DATABASE student_project_tracker;
```

6. **Sync database schema**
```bash
node sync.js
```

7. **Seed test data**
```bash
node seed-complete.js
```

### Running the Application

1. **Start backend server**
```bash
npm start
# or
node server.js
```

2. **Start frontend dev server** (in a new terminal)
```bash
cd frontend
npm run dev
```

3. **Access the application**
Open your browser and navigate to: `http://localhost:5173`

## 🔐 Test Credentials

### Tutor Accounts
| Name | Email | Password | Teams |
|------|-------|----------|-------|
| Dr. John Smith | john.smith@university.edu | password123 | Alpha, Beta, Gamma |
| Dr. Sarah Johnson | sarah.johnson@university.edu | password123 | Delta, Epsilon |

### Student Accounts (all use `password123`)
| Name | Email | Team |
|------|-------|------|
| Alice Johnson | alice@university.edu | Alpha |
| Bob Smith | bob@university.edu | Alpha |
| Charlie Brown | charlie@university.edu | Alpha |
| Diana Prince | diana@university.edu | Beta |
| Eve Martinez | eve@university.edu | Beta |

*See [LOGIN_CREDENTIALS.md](./LOGIN_CREDENTIALS.md) for complete list*

## 📁 Project Structure

```
DBMS_Project/
├── config/              # Database configuration
├── controllers/         # Business logic
│   ├── authController.js
│   ├── tutorController.js
│   ├── studentController.js
│   └── submissionController.js
├── models/              # Sequelize models
│   ├── Student.js
│   ├── Tutor.js
│   ├── Team.js
│   ├── TaskPhase.js
│   ├── Submission.js
│   ├── DraftCommit.js
│   └── IndividualGrade.js
├── routes/              # API routes
├── middleware/          # Authentication & upload
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── api/
│   └── package.json
├── server.js            # Express server
└── package.json         # Backend dependencies
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/student/login` - Student login
- `POST /api/auth/student/register` - Student registration
- `POST /api/auth/tutor/login` - Tutor login
- `POST /api/auth/tutor/register` - Tutor registration
- `GET /api/auth/me` - Get current user

### Tutor Endpoints (Protected)
- `GET /api/tutor/teams` - Get all teams
- `POST /api/tutor/teams` - Create new team
- `GET /api/tutor/students` - Get all students
- `GET /api/tutor/phases` - Get all phases
- `POST /api/tutor/phases` - Create new phase
- `DELETE /api/tutor/phases/:id` - Delete phase
- `GET /api/tutor/phases/:id/submissions` - Get submissions
- `PUT /api/tutor/submissions/:id/grade` - Grade submission
- `GET /api/tutor/batches` - Get all batches
- `POST /api/tutor/batches` - Create batch

### Student Endpoints (Protected)
- `GET /api/students/my-team` - Get team details
- `GET /api/students/my-submissions` - Get submissions
- `GET /api/students/team-phases` - Get assigned phases

### Submission Endpoints
- `POST /api/submissions` - Submit work
- `GET /api/submissions/phase/:id` - Get phase submissions
- `GET /api/submissions/:id` - Get submission details

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM for MySQL
- **MySQL** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - Authentication
- **Multer** - File uploads
- **OpenAI API** - AI summaries (optional)

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📊 Database Schema

### Main Tables
- **Batch** - Student batches by year and department
- **Tutor** - Tutor accounts and information
- **Student** - Student accounts and information
- **Team** - Student teams managed by tutors
- **Team_Member** - Junction table (Team ↔ Student)
- **Task_Phase** - Project phases with deadlines
- **Submission** - Team submissions for phases
- **Draft_Commit** - Individual code commits
- **Individual_Grade** - Individual student grades

## 🧪 Testing

### Reset Database
```bash
node clean-database.js
```

### Reseed Data
```bash
node seed-complete.js
```

### Test APIs
```bash
# Test student login
curl -X POST http://localhost:3000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@university.edu","password":"password123"}'

# Test tutor login
curl -X POST http://localhost:3000/api/auth/tutor/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.smith@university.edu","password":"password123"}'
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt (10 rounds)
- Role-based access control (Student/Tutor)
- Protected API endpoints
- CORS configuration
- SQL injection prevention via Sequelize ORM

## 📝 Development

### Adding New Features
1. Create model in `models/`
2. Add associations in `models/index.js`
3. Create controller in `controllers/`
4. Add routes in `routes/`
5. Update frontend components in `frontend/src/`

### Database Migrations
```bash
# Sync database with models
node sync.js

# Reseed database
node clean-database.js && node seed-complete.js
```

## 🐛 Troubleshooting

### Login Issues
- Restart frontend: `cd frontend && npm run dev`
- Check backend is running: `ps aux | grep server.js`
- Verify credentials in LOGIN_CREDENTIALS.md
- Clear browser localStorage

### Database Errors
- Check MySQL service is running
- Verify database exists: `SHOW DATABASES;`
- Check .env configuration
- Resync schema: `node sync.js`

### API Errors
- Check browser console (F12)
- Verify backend logs
- Test endpoints with curl
- Check CORS configuration

## 📚 Documentation

- [QUICK_START.md](./QUICK_START.md) - Quick setup guide
- [LOGIN_CREDENTIALS.md](./LOGIN_CREDENTIALS.md) - All login credentials
- [API_TESTING.md](./API_TESTING.md) - API testing guide
- [SUBMISSION_API.md](./SUBMISSION_API.md) - Submission endpoints
- [VELOCITY_API.md](./VELOCITY_API.md) - Velocity tracking

## 👥 Team Roles

### Tutor Role
- Create and manage teams
- Assign phases to teams
- Review and grade submissions
- View analytics and reports
- Manage batches and students

### Student Role
- View team information
- Access assigned phases
- Submit work
- View grades and feedback
- Track individual performance

## 🎯 Use Cases

1. **Team Formation**: Tutor creates teams from uploaded CSV or manually
2. **Phase Assignment**: Tutor creates phases visible to all teams
3. **Work Submission**: Students submit work before deadlines
4. **Grading**: Tutor grades submissions with group and individual marks
5. **Analytics**: Track velocity and performance metrics
6. **Reporting**: Generate insights on team and individual progress

## 🌐 Deployment

### Production Considerations
- Use environment vari
Upload student CSVs, track submissions, and monitor team progress.

Upload Students & Create Groups
Import CSV file to automatically generate teams

Student CSV File *
￼￼Choose FileNo file chosen
Drop your CSV file here or click to browse

CSV file with columns: name, email

💡 CSV format: name, email (one student per row)

Uploading as
Dr. John Smith (ID: 1)
Batch *
￼
Select batch
Group Size *
ables for sensitive data
- Enable HTTPS
- Set up proper CORS origins
- Use production database
- Configure logging
- Set up monitoring
- Enable rate limiting

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

For issues and questions:
- Check documentation files
- Review error logs
- Test with provided credentials
- Verify database connectivity

---

**Ready to go!** Start the servers and test with the provided credentials. See [QUICK_START.md](./QUICK_START.md) for a step-by-step guide.
