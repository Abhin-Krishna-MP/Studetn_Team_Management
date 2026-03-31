# Final Submission API Documentation

## Overview
The Final Submission API processes team project submissions with AI-powered analysis and plagiarism detection using TF-IDF cosine similarity.

---

## Endpoint: Submit Final Submission

### `POST /api/submissions`

Processes and saves a final project submission with:
1. **AI Summary Generation** - Uses OpenAI to summarize content and analyze contribution balance
2. **Plagiarism Detection** - Uses TF-IDF + Cosine Similarity to detect cross-group copying
3. **Database Storage** - Saves with AI insights for tutor review

---

## Request

### Headers
```
Content-Type: application/json
```

### Body Parameters
```json
{
  "team_id": 1,
  "phase_id": 1,
  "submission_text": "Full text of the submission...",
  "file_url": "https://github.com/team/submission" // Optional
}
```

#### Field Descriptions
- **team_id** (required, integer): ID of the submitting team
- **phase_id** (required, integer): ID of the project phase
- **submission_text** (required, string): Full submission text (min 100 characters)
- **file_url** (optional, string): URL to submission repository or document

---

## Response

### Success Response (201)
```json
{
  "success": true,
  "message": "Submission processed successfully",
  "data": {
    "submission_id": 1,
    "team_id": 1,
    "team_name": "Alpha Team",
    "phase_id": 1,
    "phase_title": "Phase 1: Database Design",
    "submitted_at": "2024-01-25T14:30:00.000Z",
    "file_url": "https://github.com/alpha-team/phase1",
    "ai_analysis": {
      "summary": "This submission demonstrates a well-structured database design with proper normalization...",
      "contribution_balance": "The submission shows consistent writing quality and depth across all sections, suggesting balanced team participation.",
      "balance_score": 8,
      "red_flags": []
    },
    "similarity_check": {
      "flagged": false,
      "max_similarity": 35,
      "threshold": 80,
      "similar_submissions": [],
      "message": "No significant similarity detected"
    },
    "team_members": [
      {
        "student_id": 1,
        "name": "Alice Johnson",
        "email": "alice@university.edu"
      }
    ]
  },
  "warnings": []
}
```

### Plagiarism Detected Response (201)
```json
{
  "success": true,
  "message": "Submission processed successfully",
  "data": {
    "submission_id": 2,
    "similarity_check": {
      "flagged": true,
      "max_similarity": 87,
      "threshold": 80,
      "similar_submissions": [
        {
          "submission_id": 1,
          "team_id": 1,
          "similarity_score": 0.87,
          "percentage": 87
        }
      ],
      "message": "High similarity detected with 1 submission(s)"
    }
  },
  "warnings": [
    "⚠️ High similarity detected with existing submission(s). Manual review recommended."
  ]
}
```

### Error Responses

**Missing Fields (400)**
```json
{
  "success": false,
  "message": "team_id, phase_id, and submission_text are required"
}
```

**Text Too Short (400)**
```json
{
  "success": false,
  "message": "Submission text must be at least 100 characters"
}
```

**Team Not Found (404)**
```json
{
  "success": false,
  "message": "Team with ID 999 not found"
}
```

**Duplicate Submission (409)**
```json
{
  "success": false,
  "message": "Submission already exists for this team and phase",
  "existing_submission_id": 1
}
```

---

## Additional Endpoints

### Get Submissions by Phase

#### `GET /api/submissions/phase/:phase_id`

Returns all submissions for a specific phase.

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "submission_id": 1,
      "team_id": 1,
      "phase_id": 1,
      "submitted_at": "2024-01-25T14:30:00.000Z",
      "ai_summary": "...",
      "ai_similarity_flag": false,
      "group_marks": 85,
      "Team": {
        "team_id": 1,
        "team_name": "Alpha Team"
      }
    }
  ]
}
```

### Get Submission by ID

#### `GET /api/submissions/:submission_id`

Returns detailed information about a specific submission.

**Response:**
```json
{
  "success": true,
  "data": {
    "submission_id": 1,
    "team_id": 1,
    "phase_id": 1,
    "file_url": "https://github.com/team/submission",
    "submitted_at": "2024-01-25T14:30:00.000Z",
    "ai_summary": "Full AI analysis...",
    "ai_similarity_flag": false,
    "group_marks": 85,
    "Team": {
      "team_id": 1,
      "team_name": "Alpha Team",
      "Students": [
        {
          "student_id": 1,
          "name": "Alice Johnson",
          "email": "alice@university.edu"
        }
      ]
    },
    "Task_Phase": {
      "phase_id": 1,
      "title": "Phase 1: Database Design",
      "description": "Design and implement the database schema",
      "start_date": "2024-01-01",
      "end_date": "2024-01-31"
    }
  }
}
```

---

## How It Works

### 1. AI Summary Generation (`generateAISummary`)

**Technology:** OpenAI GPT-3.5-turbo or GPT-4

**Process:**
1. Validates and truncates text if needed (max ~2500 tokens)
2. Sends to OpenAI with specialized prompt
3. Receives structured analysis:
   - Content summary
   - Contribution balance assessment
   - Red flags (style inconsistencies, incomplete sections)
   - Balance score (0-10)
4. Falls back to mock summary if API unavailable

**Fallback Behavior:**
- Uses mock summary if API key not configured
- Continues processing even if AI call fails
- Logs warnings for troubleshooting

### 2. Plagiarism Detection (`checkCrossGroupSimilarity`)

**Technology:** TF-IDF (Term Frequency-Inverse Document Frequency) + Cosine Similarity

**Process:**
1. Fetches all existing submissions for the same phase
2. Preprocesses text (lowercase, remove special chars, normalize)
3. Builds TF-IDF vectors for all documents
4. Calculates cosine similarity between current and each existing submission
5. Flags if any similarity > threshold (default 80%)

**Similarity Score Interpretation:**
- **0-40%**: Normal overlap (common technical terms)
- **40-60%**: Moderate similarity (similar approaches)
- **60-80%**: High similarity (possible collaboration)
- **80-100%**: Very high similarity (potential plagiarism) ⚠️

### 3. Database Transaction

**Why Transactions?**
- Ensures atomicity (all-or-nothing)
- Prevents partial data if AI or similarity check fails
- Maintains data integrity

**Transaction Flow:**
```
START TRANSACTION
  ├─ Validate inputs
  ├─ Verify team and phase exist
  ├─ Check for duplicates
  ├─ Generate AI summary (async)
  ├─ Check similarity (async)
  ├─ Save submission
COMMIT or ROLLBACK
```

---

## Configuration

### Environment Variables

Create a `.env` file with:

```bash
# OpenAI Configuration (Required for AI summaries)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx

# Similarity Threshold (Optional, default: 0.8)
SIMILARITY_THRESHOLD=0.8
```

### Getting API Keys

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Add to `.env` as `OPENAI_API_KEY`

**Alternative - Google Gemini:**
1. Uncomment Gemini code in `utils/aiService.js`
2. Get key from https://makersuite.google.com/app/apikey
3. Add to `.env` as `GEMINI_API_KEY`

---

## Testing

### Prerequisites
```bash
# Install dependencies
npm install

# Seed database
npm run seed:velocity
```

### Test Submission

```bash
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "team_id": 1,
    "phase_id": 1,
    "submission_text": "This is a comprehensive database design project. We implemented a normalized schema with proper foreign key relationships. The design follows best practices including third normal form normalization. Our team worked collaboratively to ensure data integrity and efficient querying. The implementation includes proper indexing strategies and transaction management.",
    "file_url": "https://github.com/alpha-team/phase1"
  }'
```

### Test Plagiarism Detection

Submit twice with same text to trigger similarity flag:

```bash
# First submission (Team 1)
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"team_id": 1, "phase_id": 2, "submission_text": "Unique content here..."}'

# Second submission (Team 2) - will be flagged
curl -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"team_id": 2, "phase_id": 2, "submission_text": "Unique content here..."}'
```

### View Submissions

```bash
# Get all submissions for phase 1
curl http://localhost:3000/api/submissions/phase/1

# Get specific submission
curl http://localhost:3000/api/submissions/1
```

---

## Production Considerations

### 1. Authentication & Authorization
```javascript
// Add middleware to verify user permissions
router.post('/', authenticate, authorizeTeamMember, submitFinalSubmission);
```

### 2. Rate Limiting
```javascript
// Prevent abuse of AI API
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 submissions per 15 min
});
router.post('/', limiter, submitFinalSubmission);
```

### 3. File Storage
- Store actual submission files in cloud storage (S3, Azure Blob)
- Save file URLs in database
- Use files for full-text similarity checking

### 4. Async Processing
- Move AI and similarity checks to background jobs (Bull, Celery)
- Return immediate response, process asynchronously
- Update submission record when complete

### 5. Caching
- Cache TF-IDF vectors for existing submissions
- Reduce computation on each new submission

### 6. Monitoring
- Track AI API usage and costs
- Monitor similarity detection accuracy
- Log flagged submissions for review

---

## Error Handling

All endpoints include comprehensive error handling:

1. **Validation Errors** - Clear messages about missing/invalid fields
2. **Database Errors** - Proper transaction rollback
3. **AI API Errors** - Graceful fallback to mock summaries
4. **Similarity Check Errors** - Non-blocking (don't prevent submission)

---

## Code Quality Features

✅ **Comprehensive Comments** - Every function and section documented  
✅ **Transaction Safety** - All DB operations in transactions  
✅ **Error Recovery** - Graceful fallbacks for external services  
✅ **Validation** - Input validation at every step  
✅ **Clean Architecture** - Separated utilities (AI, similarity)  
✅ **Logging** - Detailed console logs for debugging  
✅ **Type Safety** - Input type conversion and checking  

---

## Future Enhancements

1. **Advanced Similarity** - Implement semantic similarity using embeddings
2. **Multiple AI Providers** - Support GPT-4, Claude, Gemini
3. **Batch Processing** - Analyze multiple submissions simultaneously
4. **Similarity Reports** - Generate detailed comparison reports
5. **Historical Analysis** - Track team improvement over phases
6. **AI Grading** - Suggest grade ranges based on AI analysis
