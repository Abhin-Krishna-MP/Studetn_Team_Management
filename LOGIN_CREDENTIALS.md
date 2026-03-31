# Login Credentials

## Test Accounts

### Student Account
- **Email**: `alice@university.edu`
- **Password**: `password123`
- **Role**: Student

### CSV Imported Students
- **Email**: Use the email from the uploaded CSV file
- **Password**: `password123` (default for all CSV imports)
- **Role**: Student

### Tutor Account  
- **Email**: `john.smith@university.edu`
- **Password**: `password123`
- **Role**: Tutor

## Important Notes

1. The frontend `.env` file has been created with the correct API URL
2. **You need to restart the frontend dev server** for the environment variable to take effect
3. To restart:
   - Stop the current dev server (Ctrl+C in the terminal running npm run dev)
   - Start it again: `cd frontend && npm run dev`

## Troubleshooting

If login still doesn't work after restarting:

1. Check that backend is running on port 3000
2. Check that frontend is running on port 5173
3. Open browser console (F12) to check for any error messages
4. Verify the API URL in the network tab (should be http://localhost:3000/api)
