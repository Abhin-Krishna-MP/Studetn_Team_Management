# Student Team Management and Project Tracking System

A comprehensive backend system for managing student teams and tracking their project progress, built with Node.js, Express, MySQL, and Sequelize ORM.

## Database Schema

### Entities

1. **Tutor** - University tutors who supervise teams
2. **Batch** - Student batches by year and department
3. **Student** - Individual students in batches
4. **Team** - Project teams supervised by tutors
5. **Team_Member** - Junction table for team-student relationship
6. **Task_Phase** - Project phases/milestones created by tutors
7. **Submission** - Team submissions for project phases
8. **Draft_Commit** - Individual student contributions to submissions
9. **Individual_Grade** - Individual grades for students on submissions

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory

2. Install dependencies:
```bash
npm install
```

3. Create a MySQL database:
```sql
CREATE DATABASE student_project_tracker;
```

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=student_project_tracker
DB_PORT=3306
PORT=3000
```

5. Sync the database (create tables):
```bash
npm run sync
```

6. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Project Structure

```
DBMS_Project/
├── config/
│   └── database.js          # Database connection configuration
├── models/
│   ├── index.js            # Model associations and exports
│   ├── Tutor.js
│   ├── Batch.js
│   ├── Student.js
│   ├── Team.js
│   ├── TeamMember.js
│   ├── TaskPhase.js
│   ├── Submission.js
│   ├── DraftCommit.js
│   └── IndividualGrade.js
├── .env                     # Environment variables (not in repo)
├── .env.example            # Example environment variables
├── .gitignore
├── package.json
├── server.js               # Express server
├── sync.js                 # Database synchronization script
└── README.md
```

## Model Associations

### One-to-Many Relationships
- `Batch` → `Student` (one batch has many students)
- `Tutor` → `Team` (one tutor supervises many teams)
- `Tutor` → `Task_Phase` (one tutor creates many phases)
- `Team` → `Submission` (one team makes many submissions)
- `TaskPhase` → `Submission` (one phase has many submissions)
- `Submission` → `DraftCommit` (one submission has many commits)
- `Student` → `DraftCommit` (one student makes many commits)
- `Submission` → `IndividualGrade` (one submission has many individual grades)
- `Student` → `IndividualGrade` (one student receives many grades)

### Many-to-Many Relationships
- `Team` ↔ `Student` (through `Team_Member` junction table)

## API Endpoints

The server runs on `http://localhost:3000` by default.

### Health Check
- `GET /health` - Check database connection status

## Usage Examples

### Creating Records with Sequelize

```javascript
const { Tutor, Student, Team } = require('./models');

// Create a tutor
const tutor = await Tutor.create({
  name: 'Dr. John Doe',
  email: 'john.doe@university.edu',
  department: 'Computer Science'
});

// Create a team with associations
const team = await Team.create({
  team_name: 'Alpha Team',
  tutor_id: tutor.tutor_id
});

// Add students to team
await team.addStudents([student1, student2, student3]);

// Query with associations
const teamWithMembers = await Team.findOne({
  where: { team_id: 1 },
  include: [
    { model: Student },
    { model: Tutor }
  ]
});
```

## Database Sync Options

In `sync.js`, you can modify the sync behavior:

- `{ force: false, alter: false }` - Only creates tables that don't exist (safe)
- `{ alter: true }` - Modifies existing tables to match models (use carefully)
- `{ force: true }` - **DROPS and recreates all tables (DESTRUCTIVE)**

## Next Steps

1. Create route handlers for CRUD operations
2. Add authentication and authorization
3. Implement business logic for submissions and grading
4. Add validation and error handling
5. Create API documentation

## License

ISC
