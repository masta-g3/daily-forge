# Daily Forge - Project Structure

This document provides a comprehensive overview of the Daily Forge project structure and implemented features for new developers.

## 📁 Project Structure

```
daily-forge/
├── components/                  # React components
│   └── DailyProjectTracker.jsx  # Main app component containing all functionality
├── pages/                       # Next.js pages
│   ├── _app.js                  # Custom App component
│   └── index.js                 # Home page (wraps the main tracker component)
├── styles/                      # CSS styles
│   └── globals.css              # Global styles with Tailwind imports
├── public/                      # Static assets (if any)
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration for Tailwind
├── package.json                 # Project dependencies and scripts
├── README.md                    # Project overview and setup instructions
└── LICENSE                      # MIT License
```

## 🧩 Component Architecture

The app follows a monolithic component structure where most of the functionality is contained within the `DailyProjectTracker` component. This is a deliberate choice for simplicity and maintaining a small footprint.

### Main Component Breakdown

`DailyProjectTracker.jsx` handles:
- Task state management and persistence
- Timer functionality
- UI rendering for all views
- Import/export capabilities
- Settings management

## 🔑 Key Features Implemented

### Task Management
- ✅ Create, edit, and delete tasks
- ✅ Add descriptions to tasks
- ✅ Mark tasks as complete
- ✅ Drag and drop reordering
- ✅ Backfill tasks for previous dates

### Focus Timer
- ⏱️ Adjustable session duration (15-90 minutes)
- ⏱️ Start/pause functionality
- ⏱️ Break mode
- ⏱️ Visual and audio notifications

### Data Visualization
- 📊 Calendar view showing daily progress
- 📊 Month navigation for viewing past and future months
- 📊 Current streak tracking
- 📊 Completed tasks history
- 📊 Drag and drop calendar entries to move tasks between dates
- 📊 Task conflict resolution when moving to occupied dates

### Data Management
- 💾 LocalStorage persistence
- 💾 JSON export/import functionality
- 💾 Shareable URL generation with encoded data

### UI/UX
- 🎨 Dark/light mode toggle
- 🎨 Responsive design for all device sizes
- 🎨 Custom project title
- 🎨 Status notifications

## 🧠 State Management

The app uses React's built-in useState hooks for state management:

- `tasks`: Array of task objects with properties:
  - id, text, description, completed, completedAt, etc.
- `activeTask`: Currently active task (for timer)
- Timer states: `timerRunning`, `timeRemaining`, `timerDuration`
- UI states: `view`, `darkMode`, `statusMessage`, etc.

## 🔄 Data Flow

1. User interactions trigger state changes
2. State changes are persisted to localStorage
3. UI updates to reflect current state
4. Import/export functions allow data portability

## 🔌 External Dependencies

- React and Next.js for the UI framework
- Tailwind CSS for styling
- Lucide for icons
- react-beautiful-dnd for drag and drop functionality

## 🔒 Security and Privacy

- All data stays in browser localStorage by default
- No backend dependencies or external API calls
- Optional data sharing via URL with base64 encoding

## 🧪 Testing

Currently relies on manual testing. Future improvements could include:
- Unit tests for core functionality
- Integration tests for data persistence
- E2E tests for user flows

## 🚀 Future Enhancement Opportunities

- Component refactoring for better separation of concerns
- Server-side synchronization (optional)
- Additional data visualization options
- Mobile app wrapper using frameworks like Capacitor or React Native 