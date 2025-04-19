import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Check, X, Play, Pause, Trash2, Circle, Download, Upload, Settings, Save, Moon, Sun, Coffee, ChevronDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const LLMpediaTracker = () => {
  // State management
  const [newTask, setNewTask] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [activeTask, setActiveTask] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(45 * 60); // 45 minutes in seconds
  const [isBreakMode, setIsBreakMode] = useState(false); // New state for break mode
  const [view, setView] = useState("dashboard"); // "dashboard", "calendar", "timer", "settings"
  const [statusMessage, setStatusMessage] = useState("");
  const [completedTasksToShow, setCompletedTasksToShow] = useState(3);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportDataString, setExportDataString] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);  // Add initialization flag
  const [selectedDate, setSelectedDate] = useState("");
  const [backfillDialogVisible, setBackfillDialogVisible] = useState(false);
  const [backfillText, setBackfillText] = useState("");
  const [backfillDescription, setBackfillDescription] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showCalendarOverlapDialog, setShowCalendarOverlapDialog] = useState(false);
  const [draggedTaskDate, setDraggedTaskDate] = useState(null);
  const [dropTargetDate, setDropTargetDate] = useState(null);
  const [displayMonth, setDisplayMonth] = useState(new Date().getMonth());
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());
  const [showProjectDropdown, setShowProjectDropdown] = useState(false); // State for dropdown visibility
  const projectDropdownRef = useRef(null); // Ref for dropdown element

  // NEW: Multi-project state
  const [allProjectsData, setAllProjectsData] = useState({
    projects: {}, // { [projectId]: { id, title, tasks: [], settings: { timerDuration } } }
    globalSettings: { darkMode: false },
    activeProjectId: null, // ID of the currently active project
  });

  // DERIVED STATE: Get data for the active project
  const activeProject = useMemo(() => {
    return allProjectsData.projects[allProjectsData.activeProjectId] || null;
  }, [allProjectsData.projects, allProjectsData.activeProjectId]);

  const tasks = useMemo(() => {
    return activeProject ? activeProject.tasks : [];
  }, [activeProject]);

  const title = useMemo(() => {
    return activeProject ? activeProject.title : "Project";
  }, [activeProject]);

  // Need setters that update allProjectsData
  const setTitle = (newTitle) => {
    if (!allProjectsData.activeProjectId || !allProjectsData.projects[allProjectsData.activeProjectId]) return;
    setAllProjectsData(prevData => ({
      ...prevData,
      projects: {
        ...prevData.projects,
        [allProjectsData.activeProjectId]: {
          ...prevData.projects[allProjectsData.activeProjectId],
          title: newTitle
        }
      }
    }));
  };

  const timerDuration = useMemo(() => {
    return activeProject?.settings?.timerDuration || 45;
  }, [activeProject]);

  const setTimerDuration = (newDuration) => {
    if (!allProjectsData.activeProjectId || !allProjectsData.projects[allProjectsData.activeProjectId]) return;
    setAllProjectsData(prevData => ({
      ...prevData,
      projects: {
        ...prevData.projects,
        [allProjectsData.activeProjectId]: {
          ...prevData.projects[allProjectsData.activeProjectId],
          settings: {
            ...prevData.projects[allProjectsData.activeProjectId]?.settings,
            timerDuration: newDuration
          }
        }
      }
    }));
    // Also reset timer state when duration changes
    setTimeRemaining(newDuration * 60);
    setTimerRunning(false);
  };

  const darkMode = useMemo(() => {
    return allProjectsData.globalSettings?.darkMode || false;
  }, [allProjectsData.globalSettings]);

  const setDarkMode = (isDark) => {
    setAllProjectsData(prevData => ({
      ...prevData,
      globalSettings: {
        ...prevData.globalSettings,
        darkMode: isDark
      }
    }));
  };

  // Close project dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setShowProjectDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to add a new project
  const addNewProject = () => {
    const newProjectName = prompt("Enter name for the new project:");
    if (newProjectName && newProjectName.trim() !== "") {
      const newProjectId = `proj_${Date.now()}`;
      const newProject = {
        id: newProjectId,
        title: newProjectName.trim(),
        tasks: [], // Start with empty tasks
        settings: { timerDuration: 45 } // Default settings
      };

      setAllProjectsData(prevData => ({
        ...prevData,
        projects: {
          ...prevData.projects,
          [newProjectId]: newProject
        },
        activeProjectId: newProjectId // Switch to the new project
      }));

      setShowProjectDropdown(false); // Close dropdown
    }
  };

  // Data persistence functions
  const saveToLocalStorage = () => {
    try {
      // Don't save if we haven't initialized yet
      if (!isInitialized) {
        console.log('Skipping save - not yet initialized');
        return false;
      }

      // Explicitly stringify with null replacer and no whitespace
      const dataJson = JSON.stringify(allProjectsData, null, 0);
      
      console.log('Saving to localStorage:', allProjectsData);
      
      localStorage.setItem('daily-forge-data', dataJson);
      
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      setStatusMessage("Error saving data");
      setTimeout(() => setStatusMessage(""), 3000);
      return false;
    }
  };

  const loadFromLocalStorage = () => {
    try {
      console.log("Loading from localStorage");
      const savedData = localStorage.getItem('daily-forge-data');
      
      console.log('Retrieved from localStorage:', {
        daily_forge_data: savedData ? JSON.parse(savedData) : null
      });
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setAllProjectsData(parsedData);
        console.log("Loaded data using new format.");
        return true;
      } else {
        console.log("No data found in localStorage.");
        return false;
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return false;
    }
  };

  const prepareDataExport = () => {
    try {
      // Export the entire multi-project structure
      const data = allProjectsData;

      const jsonStr = JSON.stringify(data, null, 2); // Pretty print for readability
      setExportDataString(jsonStr);
      setExportModalVisible(true);
      
      setStatusMessage("Data ready for export");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      console.error('Export preparation failed:', error);
      setStatusMessage("Export failed");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  const importData = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          console.log('Importing data:', data);

          // Validate the imported data structure (basic check)
          if (data && data.projects && data.globalSettings && data.activeProjectId) {
            setAllProjectsData(data); // Replace existing data

            // Save imported data to localStorage immediately
            // Use setTimeout to ensure state update is processed
            setTimeout(() => {
              const saved = saveToLocalStorage();
              if (saved) {
                 setStatusMessage("Data imported successfully and saved");
              } else {
                setStatusMessage("Data imported but failed to save");
              }
              setTimeout(() => setStatusMessage(""), 3000);
            }, 0);

          } else {
            console.error('Invalid data structure in import file.');
            setStatusMessage("Invalid import file structure");
            setTimeout(() => setStatusMessage(""), 3000);
          }
        } catch (error) {
          console.error('Failed to parse import file:', error);
          setStatusMessage("Failed to parse import file");
          setTimeout(() => setStatusMessage(""), 3000);
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Import failed:', error);
      setStatusMessage("Import failed");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  // Function to safely export via blob (for browsers that support it)
  const downloadViaBlob = () => {
    try {
      const blob = new Blob([exportDataString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `llmpedia-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // Some browsers need the element to be in the DOM
      a.style.display = 'none';
      document.body.appendChild(a);
      
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      setStatusMessage("Download triggered");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      console.error('Download via blob failed:', error);
      setStatusMessage("Download failed - use copy method instead");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  // Save data when tasks or settings change
  useEffect(() => {
    // Only save if initialization is complete
    if (!isInitialized) {
      console.log("Skipping auto-save - not yet initialized");
      return;
    }

    // Use a timeout to avoid saving during render cycles
    const saveTimeout = setTimeout(() => {
      console.log("Auto-saving changes");
      saveToLocalStorage();
      console.log("Data saved to localStorage", new Date().toISOString());
    }, 500);
    
    return () => clearTimeout(saveTimeout);
  }, [allProjectsData, isInitialized]);

  // Load data from URL hash if present
  useEffect(() => {
    try {
      if (window.location.hash.length > 1) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const dataParam = hashParams.get('data');
        
        if (dataParam) {
          try {
            // Decode base64
            const jsonStr = atob(decodeURIComponent(dataParam)); // Ensure decoding before atob
            const data = JSON.parse(jsonStr);

            // Load the full structure from URL
            if (data && data.projects && data.globalSettings && data.activeProjectId) {
              console.log("Loading full data structure from URL hash:", data);
              setAllProjectsData(data); // Replace current state

              // Mark as initialized after loading URL data
              setIsInitialized(true);
              console.log("Initialization complete from URL data");

              setStatusMessage("Data loaded from URL");
              setTimeout(() => setStatusMessage(""), 3000);

              // Clear hash after loading
              window.location.hash = '';
            } else {
              console.error('Invalid data structure in URL hash.');
              setStatusMessage("Error loading data from URL: Invalid structure");
              setTimeout(() => setStatusMessage(""), 3000);
              // Still mark as initialized even on error to allow app to load default/local data
              setIsInitialized(true);
              window.location.hash = ''; // Clear invalid hash
            }
          } catch (error) {
            console.error('Failed to parse data from URL:', error);
            setStatusMessage("Error loading data from URL");
            setTimeout(() => setStatusMessage(""), 3000);
            // Still mark as initialized even on error
            setIsInitialized(true);
          }
        }
      }
    } catch (error) {
      console.error('Error processing URL hash:', error);
      // Still mark as initialized even on error
      setIsInitialized(true);
    }
  }, []);

  // Load data on initial render - with a slight delay to avoid conflicts with hash loading
  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        console.log("Starting initialization");
        
        // First try to load from localStorage
        console.log("Attempting initial load from localStorage");
        const dataFromStorage = loadFromLocalStorage();
        console.log("Initial load result:", dataFromStorage);
        
        // If component is still mounted
        if (mounted) {
          // If nothing in local storage, load example data into the new structure
          if (!dataFromStorage) {
            console.log("No data in localStorage, creating default project structure");
            const defaultProjectId = `proj_${Date.now()}`;
            const exampleTasks = [
                  { id: 1, text: "Create database schema for LLM comparison", description: "Define entities and relationships for comparing different LLM architectures", completed: true, date: "2025-03-01" },
                  { id: 2, text: "Design interactive visualization for model parameters", description: "Create a flexible chart system that shows model size, training data, and performance metrics", completed: true, date: "2025-03-02" },
                  { id: 3, text: "Implement citation system for research papers", description: "Allow users to link claims to academic papers with proper citation format", completed: false, date: null },
                  { id: 4, text: "Build user profile system for contributors", description: "Create profiles that track expertise and contribution areas", completed: false, date: null },
                  { id: 5, text: "Create taxonomy for LLM capabilities", description: "Develop a standardized way to classify and compare model capabilities", completed: false, date: null },
                ];

            const initialData = {
              projects: {
                [defaultProjectId]: {
                  id: defaultProjectId,
                  title: "My First Project",
                  tasks: exampleTasks,
                  settings: { timerDuration: 45 }
                }
              },
              globalSettings: { darkMode: false },
              activeProjectId: defaultProjectId
            };

            setAllProjectsData(initialData);

            // Wait for state to update before saving
            await new Promise(resolve => setTimeout(resolve, 0));

            if (mounted) {
              console.log("Saving default data structure");
              saveToLocalStorage();
            }
          }
          
          // Mark initialization as complete
          console.log("Marking initialization as complete");
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Error during initialization:", error);
        if (mounted) {
          setIsInitialized(true); // Still mark as initialized to prevent lockup
        }
      }
    };

    // Start initialization with a small delay
    const initTimeout = setTimeout(initializeApp, 100);
    
    // Cleanup function
    return () => {
      mounted = false;
      clearTimeout(initTimeout);
    };
  }, []); // Empty dependency array since this should only run once on mount
  
  // Set custom favicon and title
  useEffect(() => {
    // Create an SVG favicon
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="black"/>
        <text x="50%" y="50%" font-family="monospace" font-size="20" 
              fill="white" text-anchor="middle" dominant-baseline="middle">DF</text>
      </svg>
    `;
    
    // Convert SVG to base64 data URL
    const dataUrl = `data:image/svg+xml;base64,${btoa(svgString.trim())}`;
    
    // Check if favicon already exists
    let link = document.querySelector("link[rel*='icon']");
    
    // Create new link element if it doesn't exist
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    
    // Set the href of the link to our data URL
    link.href = dataUrl;
    
    // Update the document title to match project title
    document.title = `${title} Tracker`;
  }, [title]); // Add title as dependency so it updates when title changes

  // Reset completed tasks view when changing views
  useEffect(() => {
    if (view !== "dashboard") {
      setCompletedTasksToShow(3);
    }
  }, [view]);

  // Timer functionality
  useEffect(() => {
    let interval;
    
    if (timerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setTimerRunning(false);
      if (isBreakMode) {
        setIsBreakMode(false);
        setView("dashboard");
      }
    }
    
    return () => clearInterval(interval);
  }, [timerRunning, timeRemaining, isBreakMode]);
  
  // Calendar generation
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
  
  const daysInMonth = getDaysInMonth(displayMonth, displayYear);
  const firstDayOfMonth = getFirstDayOfMonth(displayMonth, displayYear);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = new Date(displayYear, displayMonth).toLocaleString('default', { month: 'long' });
  
  // Month navigation
  const goToPreviousMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };
  
  const goToCurrentMonth = () => {
    setDisplayMonth(currentMonth);
    setDisplayYear(currentYear);
  };
  
  // Task handlers
  const addTask = () => {
    if (newTask.trim() !== "") {
      setAllProjectsData(prevData => ({
        ...prevData,
        projects: {
          ...prevData.projects,
          [allProjectsData.activeProjectId]: {
            ...prevData.projects[allProjectsData.activeProjectId],
            tasks: [
              ...prevData.projects[allProjectsData.activeProjectId].tasks,
              {
                id: Date.now(),
                text: newTask,
                description: newDescription.trim(),
                completed: false,
                date: null
              }
            ]
          }
        }
      }));
      setNewTask("");
      setNewDescription("");
    }
  };
  
  const deleteTask = (id) => {
    setAllProjectsData(prevData => ({
      ...prevData,
      projects: {
        ...prevData.projects,
        [allProjectsData.activeProjectId]: {
          ...prevData.projects[allProjectsData.activeProjectId],
          tasks: prevData.projects[allProjectsData.activeProjectId].tasks.filter(task => task.id !== id)
        }
      }
    }));
  };
  
  // Check if we already completed a task today
  const hasCompletedTaskToday = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return tasks.some(task => task.completed && task.date === todayStr);
  };

  const startTask = (task) => {
    // Don't allow starting new tasks if we already completed one today
    if (hasCompletedTaskToday()) {
      setStatusMessage("You've already completed a task today. Take a break!");
      setTimeout(() => setStatusMessage(""), 3000);
      return;
    }
    
    setActiveTask(task);
    setTimeRemaining(timerDuration * 60);
    setTimerRunning(true);
    setView("timer");
  };
  
  const completeTask = () => {
    if (activeTask) {
      // Get today's date in YYYY-MM-DD format in local timezone
      const today = new Date();
      const localDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      setAllProjectsData(prevData => ({
        ...prevData,
        projects: {
          ...prevData.projects,
          [allProjectsData.activeProjectId]: {
            ...prevData.projects[allProjectsData.activeProjectId],
            tasks: prevData.projects[allProjectsData.activeProjectId].tasks.map(task => 
              task.id === activeTask.id 
                ? { ...task, completed: true, date: localDateStr } 
                : task
            )
          }
        }
      }));
      setActiveTask(null);
      setTimerRunning(false);
      setView("dashboard");
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Check if a day has a completed task
  const hasCompletedTask = (day) => {
    // Format date string in YYYY-MM-DD format
    const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Check if any task has this exact date string
    return tasks.some(task => {
      // Ensure we're comparing the date part only (YYYY-MM-DD)
      const taskDate = task.date ? task.date.split('T')[0] : null;
      return taskDate === dateStr && task.completed;
    });
  };
  
  // Calculate streak
  const getStreak = () => {
    const sortedCompletedTasks = tasks
      .filter(task => task.completed && task.date) // Ensure date exists
      .map(task => {
        // Parse YYYY-MM-DD string correctly into a Date object at the start of the day (local time)
        const [year, month, day] = task.date.split('-').map(Number);
        return new Date(year, month - 1, day); 
      })
      .sort((a, b) => b - a); // Sort descending
    
    if (sortedCompletedTasks.length === 0) return 0;
    
    const mostRecentCompletionDate = sortedCompletedTasks[0];

    // Get today's date at the start of the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get yesterday's date at the start of the day
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Check if the most recent completion was today or yesterday
    if (mostRecentCompletionDate.getTime() !== today.getTime() && mostRecentCompletionDate.getTime() !== yesterday.getTime()) {
      return 0; // Streak is broken if not completed today or yesterday
    }
    
    // If streak is current (completed today or yesterday), calculate its length
    let streak = 1;
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < sortedCompletedTasks.length - 1; i++) {
      const current = sortedCompletedTasks[i];
      const next = sortedCompletedTasks[i + 1];
      
      // Ensure comparison uses time at start of day
      const diffDays = Math.round((current.getTime() - next.getTime()) / oneDayMs);
      
      if (diffDays === 1) {
        streak++;
      } else {
        break; // Found a gap, streak ends
      }
    }
    
    return streak;
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Add or update a task for a specific date
  const addBackfilledTask = () => {
    if (backfillText.trim() !== "") {
      if (editingTaskId) {
        // Update existing task
        setAllProjectsData(prevData => ({
          ...prevData,
          projects: {
            ...prevData.projects,
            [allProjectsData.activeProjectId]: {
              ...prevData.projects[allProjectsData.activeProjectId],
              tasks: prevData.projects[allProjectsData.activeProjectId].tasks.map(task => 
                task.id === editingTaskId 
                  ? { 
                      ...task, 
                      text: backfillText,
                      description: backfillDescription.trim(),
                      date: selectedDate,
                      completed: true
                    } 
                  : task
              )
            }
          }
        }));
      } else {
        // Add new task
        const newTask = {
          id: Date.now(),
          text: backfillText,
          description: backfillDescription.trim(),
          completed: true,
          date: selectedDate
        };
        
        setAllProjectsData(prevData => ({
          ...prevData,
          projects: {
            ...prevData.projects,
            [allProjectsData.activeProjectId]: {
              ...prevData.projects[allProjectsData.activeProjectId],
              tasks: [...prevData.projects[allProjectsData.activeProjectId].tasks, newTask]
            }
          }
        }));
      }
      
      // Reset form
      setBackfillText("");
      setBackfillDescription("");
      setEditingTaskId(null);
      setBackfillDialogVisible(false);
    }
  };

  const startBreak = () => {
    setIsBreakMode(true);
    setActiveTask(null);
    setTimeRemaining(5 * 60); // 5 minutes in seconds
    setTimerRunning(true);
    setView("timer");
  };

  // Handle drag end event
  const onDragEnd = (result) => {
    // Drop outside the list
    if (!result.destination) {
      return;
    }

    const pendingTasks = tasks.filter(task => !task.completed);
    const reorderedPendingTasks = Array.from(pendingTasks);
    
    // Move the dragged item
    const [movedItem] = reorderedPendingTasks.splice(result.source.index, 1);
    reorderedPendingTasks.splice(result.destination.index, 0, movedItem);
    
    // Update the tasks array with the new order, keeping completed tasks unchanged
    const newTasks = [
      ...reorderedPendingTasks,
      ...tasks.filter(task => task.completed)
    ];
    
    setAllProjectsData(prevData => ({
      ...prevData,
      projects: {
        ...prevData.projects,
        [allProjectsData.activeProjectId]: {
          ...prevData.projects[allProjectsData.activeProjectId],
          tasks: newTasks
        }
      }
    }));
  };

  // Handle moving a task from one date to another in the calendar
  const handleCalendarDateMove = (sourceDate, targetDate) => {
    // Don't do anything if source and target are the same
    if (sourceDate === targetDate) return;
    
    // Find the task for the source date
    const sourceTask = tasks.find(task => {
      const taskDate = task.date ? task.date.split('T')[0] : null;
      return taskDate === sourceDate && task.completed;
    });
    
    if (!sourceTask) return;
    
    // Check if there's already a task on the target date
    const existingTaskOnTarget = tasks.find(task => {
      const taskDate = task.date ? task.date.split('T')[0] : null;
      return taskDate === targetDate && task.completed;
    });
    
    if (existingTaskOnTarget) {
      // Store the dates for the overlap dialog
      setDraggedTaskDate(sourceDate);
      setDropTargetDate(targetDate);
      setShowCalendarOverlapDialog(true);
    } else {
      // No conflict, update the task date directly
      setAllProjectsData(prevData => ({
        ...prevData,
        projects: {
          ...prevData.projects,
          [allProjectsData.activeProjectId]: {
            ...prevData.projects[allProjectsData.activeProjectId],
            tasks: prevData.projects[allProjectsData.activeProjectId].tasks.map(task => 
              task.id === sourceTask.id 
                ? { ...task, date: targetDate } 
                : task
            )
          }
        }
      }));
      
      setStatusMessage(`Task moved to ${targetDate}`);
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };
  
  // Replace task on target date with the one from source date
  const confirmCalendarDateReplace = () => {
    if (!draggedTaskDate || !dropTargetDate) return;
    
    // Find source task
    const sourceTask = tasks.find(task => {
      const taskDate = task.date ? task.date.split('T')[0] : null;
      return taskDate === draggedTaskDate && task.completed;
    });
    
    if (!sourceTask) return;
    
    // Find and remove the task on target date
    const targetTask = tasks.find(task => {
      const taskDate = task.date ? task.date.split('T')[0] : null;
      return taskDate === dropTargetDate && task.completed;
    });
    
    if (targetTask) {
      // Remove the target task
      const filteredTasks = tasks.filter(task => task.id !== targetTask.id);
      
      // Update the source task with the new date
      const updatedTasks = filteredTasks.map(task => 
        task.id === sourceTask.id 
          ? { ...task, date: dropTargetDate } 
          : task
      );
      
      setAllProjectsData(prevData => ({
        ...prevData,
        projects: {
          ...prevData.projects,
          [allProjectsData.activeProjectId]: {
            ...prevData.projects[allProjectsData.activeProjectId],
            tasks: updatedTasks
          }
        }
      }));
    }
    
    setShowCalendarOverlapDialog(false);
    setDraggedTaskDate(null);
    setDropTargetDate(null);
    
    setStatusMessage(`Task replaced on ${dropTargetDate}`);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-900 dark:text-gray-100">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  setIsEditingTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false);
                  }
                  if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                  }
                }}
                className="text-xl font-normal tracking-tight bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:outline-none focus:border-black dark:focus:border-white"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2 relative" ref={projectDropdownRef}>
                <h1
                  className="text-xl font-normal tracking-tight cursor-pointer hover:opacity-80"
                  onClick={() => setIsEditingTitle(true)}
                  title="Click to edit project name"
                >
                  {title}
                </h1>
                <button
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Switch Project"
                  aria-haspopup="true"
                  aria-expanded={showProjectDropdown}
                >
                  <ChevronDown size={16} />
                </button>

                {showProjectDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-20">
                    <ul className="py-1">
                      {Object.values(allProjectsData.projects).map(project => (
                        <li key={project.id}>
                          <button
                            onClick={() => {
                              setAllProjectsData(prevData => ({
                                ...prevData,
                                activeProjectId: project.id
                              }));
                              setShowProjectDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${project.id === allProjectsData.activeProjectId ? 'font-bold bg-gray-100 dark:bg-gray-700' : ''}`}
                          >
                            {project.title}
                          </button>
                        </li>
                      ))}
                      {/* Add New Project button */}
                      <li>
                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                        <button
                          onClick={addNewProject} // Call the new function
                          className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          + Add New Project
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-6 items-center">
            <button 
              onClick={() => setView("dashboard")} 
              className={`text-sm ${view === "dashboard" ? "text-black dark:text-white font-bold" : "text-gray-500 dark:text-gray-400"}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setView("calendar")} 
              className={`text-sm ${view === "calendar" ? "text-black dark:text-white font-bold" : "text-gray-500 dark:text-gray-400"}`}
            >
              Calendar
            </button>
            <button 
              onClick={() => setView("settings")} 
              className={`text-sm ${view === "settings" ? "text-black dark:text-white font-bold" : "text-gray-500 dark:text-gray-400"}`}
            >
              Settings
            </button>
            <button
              onClick={toggleDarkMode}
              className="ml-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content area */}
      <main className="flex-grow container mx-auto p-8 max-w-4xl">
        {/* Dashboard view */}
        {view === "dashboard" && (
          <div className="space-y-12">
            {/* Top stats section */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-4xl font-light">{getStreak()}</div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">Day streak</div>
                </div>
                <button
                  onClick={startBreak}
                  className="p-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                  title="Take a 5-minute break"
                >
                  <Coffee size={20} />
                </button>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                <div className="mt-1">
                  {tasks.some(task => 
                    task.completed && 
                    task.date === new Date().toISOString().split('T')[0]
                  ) ? (
                    <span className="bg-black text-white text-xs px-2 py-1">Today's commit complete</span>
                  ) : (
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1">Waiting for today's commit</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Task input */}
            <div className="space-y-2">
              <div className="flex">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (newDescription.trim()) {
                        addTask();
                      } else {
                        document.getElementById('description-input')?.focus();
                      }
                    }
                  }}
                  placeholder="Add a new feature to work on..."
                  className="flex-grow p-3 border-b-2 border-gray-200 bg-transparent focus:outline-none focus:border-black"
                />
                <button
                  onClick={addTask}
                  className="bg-black dark:bg-gray-700 text-white p-3 ml-2"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              {newTask.trim() !== "" && (
                <div className="flex">
                  <input
                    id="description-input"
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    placeholder="Optional: add details about this feature..."
                    className="flex-grow p-3 border-b border-gray-100 bg-transparent focus:outline-none focus:border-gray-300 text-sm text-gray-600"
                  />
                </div>
              )}
            </div>
            
            {/* Active tasks list */}
            <div className="space-y-3 mt-8">
              <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Pending features</div>
              {statusMessage && (
                <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 text-center text-sm">
                  {statusMessage}
                </div>
              )}
              {tasks.filter(task => !task.completed).length === 0 ? (
                <div className="py-6 text-center text-gray-400 border border-gray-100">
                  <p>All tasks completed. Add more to keep building.</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="pending-tasks">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {tasks.filter(task => !task.completed).map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-4 flex flex-col border border-gray-100 hover:border-gray-300 transition-all duration-200 cursor-grab active:cursor-grabbing group ${
                                  snapshot.isDragging 
                                    ? 'bg-gray-50 dark:bg-gray-800 shadow-md scale-[1.02] border-gray-300 dark:border-gray-600 z-10' 
                                    : ''
                                }`}
                                style={{
                                  ...provided.draggableProps.style,
                                  transition: snapshot.isDragging ? 'none' : 'box-shadow 0.2s ease, transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease'
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-grow mr-4 relative pl-3">
                                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-10 w-1.5 -ml-1 rounded-full bg-gray-200 dark:bg-gray-700 opacity-40 group-hover:opacity-70 transition-opacity"></div>
                                    <p>{task.text}</p>
                                    {task.description && (
                                      <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startTask(task);
                                      }}
                                      className="p-2 text-gray-700 hover:bg-black hover:text-white transition-colors"
                                      title="Start working on this task"
                                    >
                                      <Play size={18} />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTask(task.id);
                                      }}
                                      className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
                                      title="Delete task"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
            
            {/* Completed tasks */}
            {tasks.filter(task => task.completed).length > 0 && (
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Completed features</div>
                <div className="space-y-2">
                  {tasks.filter(task => task.completed)
                    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
                    .slice(0, completedTasksToShow)
                    .map(task => (
                      <div key={task.id} className="p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group">
                        <div className="flex-grow mr-4">
                          <p className="text-gray-500 dark:text-gray-300">{task.text}</p>
                          {task.description && (
                            <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">{task.description}</p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {(() => {
                              // Parse the date parts directly from YYYY-MM-DD format
                              const [year, month, day] = task.date.split('-').map(Number);
                              return new Date(year, month - 1, day).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              });
                            })()}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="text-gray-400 dark:text-gray-300 mr-2">
                            <Check size={18} />
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(task.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-gray-500 dark:hover:text-gray-300"
                            title="Delete task"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  
                  {tasks.filter(task => task.completed).length > completedTasksToShow && (
                    <button 
                      onClick={() => setCompletedTasksToShow(prev => prev + 5)}
                      className="w-full py-2 text-center text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Show {Math.min(5, tasks.filter(task => task.completed).length - completedTasksToShow)} more completed
                    </button>
                  )}
                  
                  {completedTasksToShow > 3 && completedTasksToShow >= tasks.filter(task => task.completed).length && (
                    <button 
                      onClick={() => setCompletedTasksToShow(3)}
                      className="w-full py-2 text-center text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Calendar view */}
        {view === "calendar" && (
          <div className="space-y-8">
            <div className="flex justify-between items-end mb-8">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-light">{monthName} {displayYear}</div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={goToPreviousMonth}
                    className="p-1 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Previous month"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={goToCurrentMonth}
                    className="p-1 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Current month"
                  >
                    Today
                  </button>
                  <button 
                    onClick={goToNextMonth}
                    className="p-1 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Next month"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Stats section */}
              <div className="grid grid-cols-3 gap-8 text-right">
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Completion rate</div>
                  <div className="text-xl font-light">
                    {(() => {
                      const today = new Date();
                      const daysInMonth = getDaysInMonth(displayMonth, displayYear);
                      
                      // Determine if the currently displayed month/year is the current actual month/year
                      const isCurrentMonthView = displayMonth === today.getMonth() && displayYear === today.getFullYear();
                      
                      // Use today's date for the current month, otherwise use the total days in the viewed month
                      const denominatorDays = isCurrentMonthView ? today.getDate() : daysInMonth;

                      const completedDays = tasks.filter(t => 
                        t.completed && 
                        new Date(t.date).getMonth() === displayMonth &&
                        new Date(t.date).getFullYear() === displayYear
                      ).length;
                      
                      // Avoid division by zero if denominatorDays is 0 (e.g., viewing future month or current month on day 0 - though unlikely)
                      const rate = denominatorDays > 0 ? Math.round((completedDays / denominatorDays) * 100) : 0;
                      return `${rate}%`;
                    })()}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Best streak</div>
                  <div className="text-xl font-light">
                    {(() => {
                      const completedDates = tasks
                        .filter(task => task.completed)
                        .map(task => new Date(task.date))
                        .sort((a, b) => a - b);
                      
                      if (completedDates.length === 0) return '0';
                      
                      let bestStreak = 1;
                      let currentStreak = 1;
                      const oneDayMs = 24 * 60 * 60 * 1000;
                      
                      for (let i = 1; i < completedDates.length; i++) {
                        const current = completedDates[i];
                        const prev = completedDates[i - 1];
                        
                        const diffDays = Math.round((current - prev) / oneDayMs);
                        
                        if (diffDays === 1) {
                          currentStreak++;
                          bestStreak = Math.max(bestStreak, currentStreak);
                        } else {
                          currentStreak = 1;
                        }
                      }
                      
                      return bestStreak;
                    })()}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">This month</div>
                  <div className="text-xl font-light">
                    {tasks.filter(t => 
                      t.completed && 
                      new Date(t.date).getMonth() === displayMonth &&
                      new Date(t.date).getFullYear() === displayYear
                    ).length} / {daysInMonth}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-px mb-2 border-t border-l border-gray-100">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div key={i} className="text-center text-xs text-gray-500 p-2 border-r border-b border-gray-100">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 border-r border-b border-gray-100"></div>
              ))}
              
              {days.map(day => {
                const isToday = day === today.getDate() && 
                                displayMonth === today.getMonth() && 
                                displayYear === today.getFullYear();
                const hasCommit = hasCompletedTask(day);
                
                // Find task that was completed on this day (if any)
                const dayStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTask = tasks.find(t => {
                  // Ensure we're comparing the date part only (YYYY-MM-DD)
                  const taskDate = t.date ? t.date.split('T')[0] : null;
                  return taskDate === dayStr && t.completed;
                });
                
                // Past date check (today or earlier)
                const isPastDate = new Date(displayYear, displayMonth, day) <= new Date(today.getFullYear(), today.getMonth(), today.getDate());
                
                return (
                  <div 
                    key={day} 
                    className={`h-20 p-2 relative flex flex-col border-r border-b border-gray-100 dark:border-gray-700 ${
                      isToday ? 'bg-gray-50 dark:bg-gray-700' : ''
                    } ${isPastDate ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
                    onClick={() => {
                      if (isPastDate) {
                        // Check if there's already a task for this date
                        const existingTask = tasks.find(t => t.date === dayStr);
                        setSelectedDate(dayStr);
                        
                        if (existingTask) {
                          // Pre-fill the form with existing task data for editing
                          setBackfillText(existingTask.text);
                          setBackfillDescription(existingTask.description || "");
                          setEditingTaskId(existingTask.id);
                        } else {
                          // Clear the form for a new task
                          setBackfillText("");
                          setBackfillDescription("");
                          setEditingTaskId(null);
                        }
                        
                        setBackfillDialogVisible(true);
                      }
                    }}
                    draggable={hasCommit}
                    onDragStart={(e) => {
                      if (hasCommit) {
                        e.dataTransfer.setData('text/plain', dayStr);
                        e.dataTransfer.effectAllowed = 'move';
                      }
                    }}
                    onDragOver={(e) => {
                      if (isPastDate) {
                        e.preventDefault(); // Allow drop
                        e.dataTransfer.dropEffect = 'move';
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const sourceDateStr = e.dataTransfer.getData('text/plain');
                      if (sourceDateStr && isPastDate) {
                        handleCalendarDateMove(sourceDateStr, dayStr);
                      }
                    }}
                  >
                    <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>{day}</span>
                    
                    {dayTask && (
                      <div className="mt-1 overflow-hidden">
                        <p className="text-xs truncate">{dayTask.text}</p>
                      </div>
                    )}
                    
                    {hasCommit && (
                      <div className="mt-auto mb-2 self-center">
                        <Circle className="fill-black dark:fill-gray-300 text-black dark:text-gray-300" size={8} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center gap-6 justify-center text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Circle className="fill-black dark:fill-gray-300 text-black dark:text-gray-300" size={8} />
                <span>Feature committed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"></div>
                <span>Today</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Timer view */}
        {view === "timer" && (isBreakMode || activeTask) && (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="mb-12 text-center">
              <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                {isBreakMode ? "Break time" : "Current focus"}
              </div>
              {!isBreakMode && (
                <>
                  <p className="text-xl">{activeTask.text}</p>
                  {activeTask.description && (
                    <p className="text-sm text-gray-600 mt-2 max-w-md">{activeTask.description}</p>
                  )}
                </>
              )}
            </div>
            
            <div className={`w-64 h-64 border-2 ${isBreakMode ? 'border-gray-400' : 'border-gray-200'} rounded-full flex items-center justify-center relative mb-12`}>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="48"
                  fill="transparent"
                  stroke={isBreakMode ? "#9CA3AF" : "black"}
                  strokeWidth="4"
                  strokeDasharray={`${(1 - timeRemaining / (isBreakMode ? 300 : timerDuration * 60)) * 301} 301`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="text-4xl font-light tracking-wide">{formatTime(timeRemaining)}</div>
            </div>
            
            <div className="flex gap-6">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-6 py-3 ${timerRunning ? 'bg-white text-black border border-black' : 'bg-black text-white'}`}
              >
                {timerRunning ? 'Pause' : 'Start'}
              </button>
              
              {!isBreakMode && (
                <button
                  onClick={completeTask}
                  className="px-6 py-3 bg-white text-black border border-gray-200"
                >
                  Complete
                </button>
              )}
              
              <button
                onClick={() => {
                  setActiveTask(null);
                  setTimerRunning(false);
                  setIsBreakMode(false);
                  setView("dashboard");
                }}
                className="px-6 py-3 text-gray-500"
              >
                Cancel
              </button>
            </div>
            
            {!isBreakMode && (
              <div className="mt-12 w-64">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>15m</span>
                  <span>{timerDuration}m</span>
                  <span>90m</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="5"
                  value={timerDuration}
                  onChange={(e) => {
                    const newDuration = parseInt(e.target.value);
                    setTimerDuration(newDuration);
                  }}
                  className="w-full appearance-none h-1 bg-gray-200 rounded outline-none"
                />
              </div>
            )}
          </div>
        )}
        
        {/* Settings view */}
        {view === "settings" && (
          <div className="space-y-8 py-4">
            <div>
              <h2 className="text-xl mb-6">Appearance</h2>
              <div className="p-6 border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-lg mb-4">Dark Mode</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Toggle between light and dark mode for your preferred viewing experience.
                </p>
                <div className="flex items-center">
                  <span className="mr-2">{darkMode ? <Moon size={18} /> : <Sun size={18} />}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={darkMode}
                      onChange={toggleDarkMode}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-black"></div>
                    <span className="ml-3 text-sm font-medium">
                      {darkMode ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </label>
                </div>
              </div>
              
              <h2 className="text-xl mb-6">Data Management</h2>
              
              {statusMessage && (
                <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 text-center">
                  {statusMessage}
                </div>
              )}
              
              <div className="space-y-6">
                <div className="p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg mb-4">Local Storage</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Your data is automatically saved in your browser's local storage. This means it will persist when you close the browser, but only on this device.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        const saved = saveToLocalStorage();
                        if (saved) {
                          console.log("Manually saved data to localStorage");
                          setStatusMessage("Data saved to local storage");
                          setTimeout(() => setStatusMessage(""), 3000);
                        }
                      }}
                      className="flex items-center gap-2 p-2 bg-black dark:bg-gray-800 text-white text-sm"
                    >
                      <Save size={16} /> Save manually
                    </button>
                    <button 
                      onClick={() => {
                        console.log("Manual load from localStorage requested");
                        const loaded = loadFromLocalStorage();
                        if (loaded) {
                          console.log("Successfully loaded data from localStorage");
                          setStatusMessage("Data loaded from local storage");
                        } else {
                          console.log("No data found in localStorage");
                          setStatusMessage("No data found in local storage");
                        }
                        setTimeout(() => setStatusMessage(""), 3000);
                      }}
                      className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 text-sm"
                    >
                      <Upload size={16} /> Load from storage
                    </button>
                  </div>
                </div>
                
                <div className="p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg mb-4">Portable Backup</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Export your data as a JSON file that can be backed up or transferred to another device.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={prepareDataExport}
                      className="flex items-center gap-2 p-2 bg-black dark:bg-gray-800 text-white text-sm"
                    >
                      <Download size={16} /> Export data
                    </button>
                    
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 text-sm cursor-pointer">
                        <Upload size={16} /> Import data
                        <input
                          type="file"
                          accept=".json"
                          onChange={importData}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg mb-4">Data Sharing via URL</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Generate a URL containing your data that can be bookmarked or shared.
                  </p>
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => {
                        try {
                          // For URL sharing, encode the entire allProjectsData structure
                          const dataToEncode = allProjectsData;

                          const jsonString = JSON.stringify(dataToEncode);
                          const base64Data = btoa(jsonString);
                          // Use hash (#) and ensure proper encoding for URL
                          const url = `${window.location.origin}${window.location.pathname}#data=${encodeURIComponent(base64Data)}`;

                          setGeneratedUrl(url);
                          
                          // Copy to clipboard
                          navigator.clipboard.writeText(url)
                            .then(() => {
                              setStatusMessage("URL copied to clipboard");
                              setTimeout(() => setStatusMessage(""), 3000);
                            })
                            .catch(err => {
                              console.error("Failed to copy URL: ", err);
                              setStatusMessage("URL generated but couldn't copy to clipboard");
                              setTimeout(() => setStatusMessage(""), 3000);
                            });
                        } catch (error) {
                          console.error("Error generating URL: ", error);
                          setStatusMessage("Error generating URL");
                          setTimeout(() => setStatusMessage(""), 3000);
                        }
                      }}
                      className="flex items-center gap-2 p-2 bg-black dark:bg-gray-800 text-white text-sm"
                    >
                      Generate & copy URL
                    </button>
                    
                    {generatedUrl && (
                      <div className="mt-4 w-full overflow-hidden">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Generated URL (click to select all):</p>
                        <div 
                          className="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 overflow-x-auto whitespace-nowrap cursor-pointer"
                          onClick={(e) => {
                            if (e.target.tagName === 'DIV') {
                              // Select all text in the div for easy copying
                              const range = document.createRange();
                              range.selectNodeContents(e.target);
                              const selection = window.getSelection();
                              selection.removeAllRanges();
                              selection.addRange(range);
                            }
                          }}
                        >
                          {generatedUrl}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Export data modal */}
      {exportModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-auto shadow-lg">
            <h3 className="text-lg font-medium mb-4">Export Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Copy the JSON data below or try downloading directly:
            </p>
            
            <div className="flex space-x-4 mb-4">
              <button 
                onClick={downloadViaBlob} 
                className="bg-black dark:bg-gray-700 text-white px-4 py-2 text-sm"
              >
                Download as file
              </button>
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(exportDataString)
                    .then(() => {
                      setStatusMessage("Data copied to clipboard");
                      setTimeout(() => setStatusMessage(""), 3000);
                    })
                    .catch(err => {
                      console.error("Failed to copy: ", err);
                      setStatusMessage("Failed to copy to clipboard");
                      setTimeout(() => setStatusMessage(""), 3000);
                    });
                }}
                className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm"
              >
                Copy to clipboard
              </button>
              
              <button 
                onClick={() => setExportModalVisible(false)}
                className="ml-auto border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 rounded overflow-auto max-h-[50vh]">
              <pre className="text-xs text-gray-800 dark:text-gray-300 whitespace-pre-wrap">{exportDataString}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Backfill Dialog */}
      {backfillDialogVisible && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            // Close dialog when clicking the backdrop (outside the dialog)
            if (e.target === e.currentTarget) {
              setBackfillDialogVisible(false);
              setBackfillText("");
              setBackfillDescription("");
              setEditingTaskId(null);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-medium mb-4">
              {editingTaskId ? `Edit task for ${selectedDate}` : `Add task for ${selectedDate}`}
            </h3>
            
            <input
              type="text"
              value={backfillText}
              onChange={(e) => setBackfillText(e.target.value)}
              placeholder="What did you accomplish?"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded mb-2"
              autoFocus
            />
            
            <textarea
              value={backfillDescription}
              onChange={(e) => setBackfillDescription(e.target.value)}
              placeholder="Add any details (optional)"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded mb-4 h-24"
            />
            
            <div className="flex justify-between items-center">
              {/* Delete button - only show for existing tasks */}
              {editingTaskId && (
                <button
                  onClick={() => {
                    // Delete the task
                    setAllProjectsData(prevData => ({
                      ...prevData,
                      projects: {
                        ...prevData.projects,
                        [allProjectsData.activeProjectId]: {
                          ...prevData.projects[allProjectsData.activeProjectId],
                          tasks: prevData.projects[allProjectsData.activeProjectId].tasks.filter(task => task.id !== editingTaskId)
                        }
                      }
                    }));
                    setBackfillDialogVisible(false);
                    setBackfillText("");
                    setBackfillDescription("");
                    setEditingTaskId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Delete
                </button>
              )}
              
              <div className={`flex gap-2 ${editingTaskId ? '' : 'ml-auto'}`}>
                <button
                  onClick={() => {
                    setBackfillDialogVisible(false);
                    setBackfillText("");
                    setBackfillDescription("");
                    setEditingTaskId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                
                <button
                  onClick={addBackfilledTask}
                  disabled={backfillText.trim() === ""}
                  className={`px-4 py-2 rounded ${
                    backfillText.trim() === "" 
                      ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                      : "bg-black dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600"
                  }`}
                >
                  {editingTaskId ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Overlap Dialog */}
      {showCalendarOverlapDialog && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCalendarOverlapDialog(false);
              setDraggedTaskDate(null);
              setDropTargetDate(null);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-medium mb-4">Replace Existing Task?</h3>
            
            <p className="mb-4">
              There is already a task on {dropTargetDate}. Do you want to replace it with the task from {draggedTaskDate}?
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCalendarOverlapDialog(false);
                  setDraggedTaskDate(null);
                  setDropTargetDate(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              
              <button
                onClick={confirmCalendarDateReplace}
                className="px-4 py-2 bg-black dark:bg-gray-700 text-white rounded hover:bg-gray-800 dark:hover:bg-gray-600"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LLMpediaTracker;