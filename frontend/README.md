# Student Team Management System - Frontend

A modern, responsive React application for managing student teams and tracking project progress.

## 🚀 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API requests
- **Lucide React** - Modern icon library

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── axios.js           # API configuration and methods
│   ├── components/
│   │   └── Layout.jsx         # Main layout with sidebar
│   ├── pages/
│   │   ├── Dashboard.jsx      # Overview and statistics
│   │   ├── TaskPhases.jsx     # Phase management
│   │   ├── StudentWorkspace.jsx # Collaborative editor
│   │   └── Analytics.jsx      # Velocity heatmaps
│   ├── App.jsx               # Router configuration
│   ├── main.jsx              # Application entry point
│   └── index.css             # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure API Endpoint

Create a `.env` file in the frontend directory:

```bash
VITE_API_URL=http://localhost:3000/api
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
npm run preview
```

## 🎨 Features

### Responsive Layout
- **Sidebar Navigation** - Collapsible on mobile with smooth animations
- **Top Bar** - Displays current page and user info
- **Main Content Area** - Renders child routes
- **Mobile-First Design** - Optimized for all screen sizes

### Pages

#### 1. Dashboard
- Overview statistics (teams, phases, submissions, scores)
- Recent activity feed
- Quick action buttons
- Upcoming deadlines

#### 2. Task Phases
- Phase list with status tabs (all, active, upcoming, completed)
- Progress tracking per phase
- Submission statistics
- Action buttons for details and submissions

#### 3. Student Workspace
- Text editor for submissions
- Real-time character count
- Draft auto-save functionality
- Team member list with online status
- Recent activity sidebar
- Tips and guidelines

#### 4. Analytics
- Student velocity heatmap
- Team performance comparison
- Contribution metrics (commits, lines added/deleted)
- Exportable reports
- Interactive filters (team, phase, date range)

## 🔌 API Integration

The app includes pre-configured API methods in `src/api/axios.js`:

```javascript
// Student APIs
studentAPI.uploadCSV(formData)

// Draft Commits
draftAPI.createCommit(data)
draftAPI.getTeamVelocity(teamId, phaseId)

// Submissions
submissionAPI.submit(data)
submissionAPI.getByPhase(phaseId)
submissionAPI.getById(submissionId)
```

### Axios Configuration
- Base URL: Configurable via environment variable
- Request interceptor: Adds auth token automatically
- Response interceptor: Handles common errors (401, 403, 404, 500)
- Proxy setup: All `/api` requests proxied to backend

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to customize the color scheme:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      }
    }
  }
}
```

### Icons
Using Lucide React icons. Import from `lucide-react`:

```javascript
import { Icon1, Icon2 } from 'lucide-react';
```

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

Sidebar automatically collapses on mobile and expands on desktop.

## 🔐 Authentication (To Be Implemented)

The app includes placeholders for authentication:
- Token storage in localStorage
- Auth header in API requests
- Redirect on 401 Unauthorized
- Logout functionality

## 🚀 Deployment

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel/Netlify
1. Connect your Git repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL`

## 📦 Dependencies

### Core
- `react` & `react-dom` - v18.2.0
- `react-router-dom` - v6.21.0
- `axios` - v1.6.2

### UI
- `tailwindcss` - v3.3.6
- `lucide-react` - v0.294.0

### Dev Tools
- `vite` - v5.0.8
- `@vitejs/plugin-react` - v4.2.1
- `autoprefixer` - v10.4.16
- `postcss` - v8.4.32

## 🐛 Troubleshooting

### Port Already in Use
Change port in `vite.config.js`:
```javascript
server: {
  port: 3001, // Change this
}
```

### API Connection Issues
1. Check backend is running on `localhost:3000`
2. Verify `VITE_API_URL` in `.env`
3. Check browser console for CORS errors

### Build Errors
1. Clear node_modules: `rm -rf node_modules`
2. Clear cache: `rm -rf .vite`
3. Reinstall: `npm install`

## 🎯 Next Steps

1. **Implement real API integration** - Connect to backend endpoints
2. **Add authentication** - Implement login/register flows
3. **State management** - Consider Redux/Zustand for complex state
4. **Form validation** - Use libraries like React Hook Form
5. **Charts** - Integrate Recharts for visualizations
6. **Tests** - Add Jest/React Testing Library
7. **Error boundaries** - Handle React errors gracefully

## 📄 License

ISC
