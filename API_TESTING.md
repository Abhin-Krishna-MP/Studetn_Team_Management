# Student CSV Upload API

## Testing the uploadStudentCSV endpoint

### Prerequisites
1. Install dependencies:
```bash
npm install
```

2. Create sample tutors and batches:
```bash
npm run seed
```

### Using cURL

```bash
curl -X POST http://localhost:3000/api/students/upload \
  -F "file=@sample-students.csv" \
  -F "tutor_id=1" \
  -F "batch_id=1" \
  -F "group_size=3"
```

### Using Postman

1. **Method**: POST
2. **URL**: `http://localhost:3000/api/students/upload`
3. **Body**: Select "form-data"
4. Add the following fields:
   - `file` (File): Select your CSV file
   - `tutor_id` (Text): `1`
   - `batch_id` (Text): `1`
   - `group_size` (Text): `3`

### CSV Format

The CSV file must have the following columns:
```csv
name,email
Alice Johnson,alice.johnson@university.edu
Bob Smith,bob.smith@university.edu
Charlie Brown,charlie.brown@university.edu
```

### Expected Response

**Success (201)**:
```json
{
  "success": true,
  "message": "Students uploaded and teams created successfully",
  "data": {
    "students_created": 15,
    "teams_created": 5,
    "batch_info": {
      "batch_id": 1,
      "year": 2024,
      "department": "Computer Science"
    },
    "tutor_info": {
      "tutor_id": 1,
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@university.edu"
    },
    "teams": [
      {
        "team_id": 1,
        "team_name": "Team 1 - Computer Science 2024",
        "member_count": 3,
        "members": [
          {
            "student_id": 1,
            "name": "Alice Johnson",
            "email": "alice.johnson@university.edu"
          }
        ]
      }
    ]
  }
}
```

**Error Examples**:

Missing file (400):
```json
{
  "success": false,
  "message": "No CSV file uploaded"
}
```

Duplicate emails (409):
```json
{
  "success": false,
  "message": "Some students already exist in the database",
  "existingEmails": ["alice.johnson@university.edu"]
}
```

Invalid tutor (404):
```json
{
  "success": false,
  "message": "Tutor with ID 999 not found"
}
```

## How It Works

1. **File Upload**: Multer handles the CSV file upload (max 5MB)
2. **Validation**: Checks for required fields (tutor_id, batch_id, group_size)
3. **Verification**: Ensures tutor and batch exist in database
4. **CSV Parsing**: Reads and validates student data (name, email)
5. **Duplicate Check**: Prevents duplicate emails
6. **Transaction Start**: All operations wrapped in a Sequelize transaction
7. **Student Creation**: Bulk creates student records
8. **Shuffle**: Randomly shuffles students for fair team distribution
9. **Team Division**: Divides students into groups based on group_size
10. **Team Creation**: Creates team records and Team_Member associations
11. **Commit/Rollback**: Commits on success or rolls back on error
12. **Cleanup**: Removes uploaded CSV file after processing

## Error Handling

All database operations are wrapped in a transaction. If any step fails:
- Transaction is rolled back
- No partial data is saved
- Uploaded file is cleaned up
- Detailed error message is returned
