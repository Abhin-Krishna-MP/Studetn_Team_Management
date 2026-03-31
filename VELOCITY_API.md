# Velocity Heatmap API Documentation

## Overview
The Velocity Heatmap feature tracks student coding activity through draft commits, showing when and how much each student worked on a project phase.

---

## Endpoint 1: Record Draft Commit

### `POST /api/drafts`

Records a new draft commit when a student saves work in the text editor.

#### Request Body
```json
{
  "student_id": 1,
  "submission_id": 1,
  "lines_added": 50,
  "lines_deleted": 10
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Draft commit recorded successfully",
  "data": {
    "commit_id": 123,
    "student_id": 1,
    "submission_id": 1,
    "lines_added": 50,
    "lines_deleted": 10,
    "total_lines_changed": 60,
    "timestamp": "2024-01-20T14:30:00.000Z"
  }
}
```

#### Error Responses

**Missing Fields (400)**
```json
{
  "success": false,
  "message": "student_id and submission_id are required"
}
```

**Student Not Found (404)**
```json
{
  "success": false,
  "message": "Student with ID 999 not found"
}
```

**Permission Denied (403)**
```json
{
  "success": false,
  "message": "Student is not a member of the team for this submission"
}
```

#### cURL Example
```bash
curl -X POST http://localhost:3000/api/drafts \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "submission_id": 1,
    "lines_added": 50,
    "lines_deleted": 10
  }'
```

---

## Endpoint 2: Get Team Velocity Heatmap

### `GET /api/teams/:team_id/velocity/:phase_id`

Retrieves aggregated draft commit data for a team during a specific project phase, formatted for charting libraries.

#### URL Parameters
- `team_id` (number) - The team ID
- `phase_id` (number) - The task phase ID

#### Success Response (200)
```json
{
  "success": true,
  "message": "Velocity data retrieved successfully",
  "data": {
    "team_id": 1,
    "phase_id": 1,
    "team_name": "Alpha Team",
    "phase_title": "Phase 1: Database Design",
    "phase_dates": {
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-01-31T00:00:00.000Z"
    },
    "students": [
      {
        "student_id": 1,
        "name": "Alice Johnson",
        "email": "alice@university.edu",
        "total_commits": 45,
        "total_lines_added": 1250,
        "total_lines_deleted": 340,
        "total_lines_changed": 1590,
        "first_commit": "2024-01-20T09:15:00.000Z",
        "last_commit": "2024-01-25T11:45:00.000Z"
      },
      {
        "student_id": 2,
        "name": "Bob Smith",
        "email": "bob@university.edu",
        "total_commits": 32,
        "total_lines_added": 1680,
        "total_lines_deleted": 450,
        "total_lines_changed": 2130,
        "first_commit": "2024-01-20T20:30:00.000Z",
        "last_commit": "2024-01-24T23:15:00.000Z"
      }
    ],
    "timeline": [
      {
        "timestamp": "2024-01-20T09:15:00.000Z",
        "date": "2024-01-20",
        "time": "2024-01-20T09:15:00.000Z",
        "hour": 9,
        "student_id": 1,
        "student_name": "Alice Johnson",
        "lines_added": 45,
        "lines_deleted": 12,
        "lines_changed": 57,
        "commit_id": 123
      }
    ],
    "heatmap": [
      {
        "date": "2024-01-20",
        "hour": 9,
        "student_id": 1,
        "student_name": "Alice Johnson",
        "commits": 3,
        "lines_changed": 185
      }
    ],
    "summary": {
      "total_commits": 77,
      "total_lines_added": 2930,
      "total_lines_deleted": 790,
      "total_lines_changed": 3720
    }
  }
}
```

#### Error Responses

**Invalid Parameters (400)**
```json
{
  "success": false,
  "message": "team_id and phase_id must be valid numbers"
}
```

**Team Not Found (404)**
```json
{
  "success": false,
  "message": "Team with ID 999 not found"
}
```

**No Data Available (404)**
```json
{
  "success": false,
  "message": "No submissions found for this team and phase"
}
```

#### cURL Example
```bash
curl http://localhost:3000/api/teams/1/velocity/1
```

---

## Data Structure Explanation

### Timeline Data
Perfect for line charts showing activity over time:
- Each entry represents a single draft commit
- Includes timestamp, student info, and lines changed
- Sorted chronologically

### Heatmap Data
Perfect for calendar heatmaps or activity grids:
- Aggregated by date and hour
- Shows intensity of work (commits and lines changed)
- Easy to visualize when students were active

### Students Array
Summary statistics per student:
- Total contribution metrics
- First and last commit timestamps
- Sorted by total lines changed (most active first)
- Includes students with zero commits

---

## Frontend Integration Examples

### Recharts - Line Chart (Timeline)
```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

<LineChart data={data.timeline}>
  <XAxis dataKey="time" />
  <YAxis />
  <CartesianGrid strokeDasharray="3 3" />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="lines_changed" stroke="#8884d8" name="Lines Changed" />
</LineChart>
```

### Recharts - Bar Chart (Student Comparison)
```jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

<BarChart data={data.students}>
  <XAxis dataKey="name" />
  <YAxis />
  <CartesianGrid strokeDasharray="3 3" />
  <Tooltip />
  <Legend />
  <Bar dataKey="total_lines_added" fill="#82ca9d" name="Lines Added" />
  <Bar dataKey="total_lines_deleted" fill="#ff7c7c" name="Lines Deleted" />
</BarChart>
```

### Activity Heatmap (Custom or react-calendar-heatmap)
```jsx
import CalendarHeatmap from 'react-calendar-heatmap';

const heatmapData = data.heatmap.map(item => ({
  date: item.date,
  count: item.lines_changed
}));

<CalendarHeatmap
  startDate={data.phase_dates.start_date}
  endDate={data.phase_dates.end_date}
  values={heatmapData}
/>
```

---

## Testing Setup

### 1. Seed Database with Sample Data
```bash
npm run seed:velocity
```

This creates:
- 2 tutors
- 1 batch
- 6 students
- 2 teams (3 students each)
- 2 task phases
- 2 submissions
- ~100+ draft commits with realistic patterns (morning workers, night owls, afternoon workers)

### 2. Test the APIs

**Get velocity data:**
```bash
curl http://localhost:3000/api/teams/1/velocity/1
```

**Record a draft commit:**
```bash
curl -X POST http://localhost:3000/api/drafts \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "submission_id": 1,
    "lines_added": 50,
    "lines_deleted": 10
  }'
```

---

## Use Cases

1. **Monitor Team Activity**: See which students are actively working
2. **Identify Patterns**: Understand when students prefer to work
3. **Fair Grading**: Use contribution metrics to adjust individual grades
4. **Early Intervention**: Detect students who aren't participating
5. **Workload Balance**: Ensure work is distributed fairly across team members
6. **Timeline Visualization**: Show project progress over time

---

## Security Considerations

⚠️ **Important**: Add authentication middleware to protect these endpoints in production:

```javascript
// Example authentication middleware
const authenticate = require('../middleware/authenticate');

router.post('/', authenticate, createDraftCommit);
router.get('/teams/:team_id/velocity/:phase_id', authenticate, getTeamVelocity);
```

Ensure users can only:
- Record commits for their own student_id
- View velocity data for teams they're authorized to see (tutor or team member)
