import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Play, Pause, Trash2, Circle, Download, Upload, Settings, Save, Moon, Sun } from 'lucide-react';

const LLMpediaTracker = () => {
  // State management
  const [tasks, setTasks] = useState([
    { id: 1, text: "Create database schema for LLM comparison", description: "Define entities and relationships for comparing different LLM architectures", completed: true, date: "2025-03-01" },
    { id: 2, text: "Design interactive visualization for model parameters", description: "Create a flexible chart system that shows model size, training data, and performance metrics", completed: true, date: "2025-03-02" },
    { id: 3, text: "Implement citation system for research papers", description: "Allow users to link claims to academic papers with proper citation format", completed: false, date: null },
    { id: 4, text: "Build user profile system for contributors", description: "Create profiles that track expertise and contribution areas", completed: false, date: null },
    { id: 5, text: "Create taxonomy for LLM capabilities", description: "Develop a standardized way to classify and compare model capabilities", completed: false, date: null },
  ]);
  const [newTask, setNewTask] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [activeTask, setActiveTask] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(45 * 60); // 45 minutes in seconds
  const [timerDuration, setTimerDuration] = useState(45); // in minutes
  const [view, setView] = useState("dashboard"); // "dashboard", "calendar", "timer", "settings"
  const [statusMessage, setStatusMessage] = useState("");
  const [completedTasksToShow, setCompletedTasksToShow] = useState(3);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportDataString, setExportDataString] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Data persistence functions
  const saveToLocalStorage = () => {
    try {
      // Explicitly stringify with null replacer and no whitespace
      const tasksJson = JSON.stringify(tasks, null, 0);
      const settingsJson = JSON.stringify({ timerDuration, darkMode }, null, 0);
      
      localStorage.setItem('llmpedia-tasks', tasksJson);
      localStorage.setItem('llmpedia-settings', settingsJson);
      
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
      const savedTasks = localStorage.getItem('llmpedia-tasks');
      const savedSettings = localStorage.getItem('llmpedia-settings');
      
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.timerDuration) {
          setTimerDuration(settings.timerDuration);
        }
        if (settings.darkMode !== undefined) {
          setDarkMode(settings.darkMode);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return false;
    }
  };

  const prepareDataExport = () => {
    try {
      const data = {
        tasks,
        settings: { timerDuration }
      };
      
      const jsonStr = JSON.stringify(data, null, 2);
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
          
          if (data.tasks && Array.isArray(data.tasks)) {
            setTasks(data.tasks);
          }
          
          if (data.settings && typeof data.settings === 'object') {
            if (data.settings.timerDuration) {
              setTimerDuration(data.settings.timerDuration);
            }
          }
          
          setStatusMessage("Data imported successfully");
          setTimeout(() => setStatusMessage(""), 3000);
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

  // Save data when tasks or timer duration changes
  useEffect(() => {
    // Use a timeout to avoid saving during render cycles
    const saveTimeout = setTimeout(() => {
      saveToLocalStorage();
      console.log("Data saved to localStorage", new Date().toISOString());
    }, 500);
    
    return () => clearTimeout(saveTimeout);
  }, [tasks, timerDuration]);

  // Load data from URL hash if present
  useEffect(() => {
    try {
      if (window.location.hash.length > 1) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const dataParam = hashParams.get('data');
        
        if (dataParam) {
          try {
            // Decode base64
            const jsonStr = atob(dataParam);
            const data = JSON.parse(jsonStr);
            
            if (data.tasks && Array.isArray(data.tasks)) {
              setTasks(data.tasks);
              console.log("Tasks loaded from URL hash:", data.tasks.length);
            }
            
            if (data.settings && typeof data.settings === 'object') {
              if (data.settings.timerDuration) {
                setTimerDuration(data.settings.timerDuration);
              }
            }
            
            setStatusMessage("Data loaded from URL");
            setTimeout(() => setStatusMessage(""), 3000);
            
            // Clear hash after loading
            window.location.hash = '';
          } catch (error) {
            console.error('Failed to parse data from URL:', error);
            setStatusMessage("Error loading data from URL");
            setTimeout(() => setStatusMessage(""), 3000);
          }
        }
      }
    } catch (error) {
      console.error('Error processing URL hash:', error);
    }
  }, []);

  // Load data on initial render - with a slight delay to avoid conflicts with hash loading
  useEffect(() => {
    // Small delay to make sure URL hash loading takes precedence
    const initialLoadTimeout = setTimeout(() => {
      try {
        console.log("Attempting to load from localStorage");
        const dataFromStorage = loadFromLocalStorage();
        
        // If nothing in local storage, load example data
        if (!dataFromStorage && tasks.length === 0) {
          console.log("No data in localStorage, loading example data");
          setTasks([
            { id: 1, text: "Create database schema for LLM comparison", description: "Define entities and relationships for comparing different LLM architectures", completed: true, date: "2025-03-01" },
            { id: 2, text: "Design interactive visualization for model parameters", description: "Create a flexible chart system that shows model size, training data, and performance metrics", completed: true, date: "2025-03-02" },
            { id: 3, text: "Implement citation system for research papers", description: "Allow users to link claims to academic papers with proper citation format", completed: false, date: null },
            { id: 4, text: "Build user profile system for contributors", description: "Create profiles that track expertise and contribution areas", completed: false, date: null },
            { id: 5, text: "Create taxonomy for LLM capabilities", description: "Develop a standardized way to classify and compare model capabilities", completed: false, date: null },
          ]);
        }
      } catch (error) {
        console.error("Error during initial data loading:", error);
      }
    }, 100);
    
    return () => clearTimeout(initialLoadTimeout);
  }, []);
  
  // Set custom favicon
  useEffect(() => {
    // Create an SVG favicon
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="black"/>
        <text x="50%" y="50%" font-family="monospace" font-size="20" 
              fill="white" text-anchor="middle" dominant-baseline="middle">LLM</text>
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
    
    // Update the document title as well
    document.title = "LLMpedia Tracker";
  }, []);

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
    }
    
    return () => clearInterval(interval);
  }, [timerRunning, timeRemaining]);
  
  // Calendar generation
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
  
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });
  
  // Task handlers
  const addTask = () => {
    if (newTask.trim() !== "") {
      setTasks([
        ...tasks,
        {
          id: Date.now(),
          text: newTask,
          description: newDescription.trim(),
          completed: false,
          date: null
        }
      ]);
      setNewTask("");
      setNewDescription("");
    }
  };
  
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  const startTask = (task) => {
    setActiveTask(task);
    setTimeRemaining(timerDuration * 60);
    setTimerRunning(true);
    setView("timer");
  };
  
  const completeTask = () => {
    if (activeTask) {
      setTasks(tasks.map(task => 
        task.id === activeTask.id 
          ? { ...task, completed: true, date: new Date().toISOString().split('T')[0] } 
          : task
      ));
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
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.some(task => task.date === dateStr);
  };
  
  // Calculate streak
  const getStreak = () => {
    const sortedCompletedTasks = tasks
      .filter(task => task.completed)
      .map(task => new Date(task.date))
      .sort((a, b) => b - a); // Sort descending
    
    if (sortedCompletedTasks.length === 0) return 0;
    
    let streak = 1;
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < sortedCompletedTasks.length - 1; i++) {
      const current = sortedCompletedTasks[i];
      const next = sortedCompletedTasks[i + 1];
      
      const diffDays = Math.round((current - next) / oneDayMs);
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
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
    
    // Save preference to localStorage
    saveToLocalStorage();
  }, [darkMode]);
  
  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-900 dark:text-gray-100">
      {/* Minimal header */}
      <header className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-normal tracking-tight">LLMpedia</h1>
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
              <div>
                <div className="text-4xl font-light">{getStreak()}</div>
                <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">Day streak</div>
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
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1">Waiting for today's commit</span>
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
                  className="bg-black text-white p-3 ml-2"
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
            
            {/* Pending tasks */}
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">Pending features</div>
              {tasks.filter(task => !task.completed).length === 0 ? (
                <div className="py-6 text-center text-gray-400 border border-gray-100">
                  <p>All tasks completed. Add more to keep building.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.filter(task => !task.completed).map(task => (
                    <div key={task.id} className="p-4 flex flex-col border border-gray-100 hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-grow mr-4">
                          <p>{task.text}</p>
                          {task.description && (
                            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => startTask(task)}
                            className="p-2 text-gray-700 hover:bg-black hover:text-white transition-colors"
                            title="Start working on this task"
                          >
                            <Play size={18} />
                          </button>
                          <button 
                            onClick={() => deleteTask(task.id)}
                            className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Completed tasks */}
            {tasks.filter(task => task.completed).length > 0 && (
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">Completed features</div>
                <div className="space-y-2">
                  {tasks.filter(task => task.completed)
                    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
                    .slice(0, completedTasksToShow)
                    .map(task => (
                      <div key={task.id} className="p-4 flex items-center justify-between bg-gray-50 border border-gray-100 group">
                        <div className="flex-grow mr-4">
                          <p className="text-gray-500">{task.text}</p>
                          {task.description && (
                            <p className="text-xs text-gray-400 mt-1">{task.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(task.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="text-gray-400 mr-2">
                            <Check size={18} />
                          </div>
                          <button 
                            onClick={() => deleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-gray-500"
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
                      className="w-full py-2 text-center text-sm text-gray-500 border border-gray-200 hover:bg-gray-50"
                    >
                      Show {Math.min(5, tasks.filter(task => task.completed).length - completedTasksToShow)} more completed
                    </button>
                  )}
                  
                  {completedTasksToShow > 3 && completedTasksToShow >= tasks.filter(task => task.completed).length && (
                    <button 
                      onClick={() => setCompletedTasksToShow(3)}
                      className="w-full py-2 text-center text-sm text-gray-500 hover:bg-gray-50"
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
              <div className="text-2xl font-light">{monthName} {currentYear}</div>
              
              {/* Stats section */}
              <div className="grid grid-cols-3 gap-8 text-right">
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Completion rate</div>
                  <div className="text-xl font-light">
                    {(() => {
                      const pastDays = Math.min(today.getDate(), daysInMonth);
                      const completedDays = tasks.filter(t => 
                        t.completed && 
                        new Date(t.date).getMonth() === currentMonth &&
                        new Date(t.date).getFullYear() === currentYear
                      ).length;
                      const rate = pastDays > 0 ? Math.round((completedDays / pastDays) * 100) : 0;
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
                      new Date(t.date).getMonth() === currentMonth &&
                      new Date(t.date).getFullYear() === currentYear
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
                                currentMonth === today.getMonth() && 
                                currentYear === today.getFullYear();
                const hasCommit = hasCompletedTask(day);
                
                // Find task that was completed on this day (if any)
                const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTask = tasks.find(t => t.date === dayStr);
                
                return (
                  <div 
                    key={day} 
                    className={`h-20 p-2 relative flex flex-col border-r border-b border-gray-100 ${
                      isToday ? 'bg-gray-50' : ''
                    }`}
                  >
                    <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>{day}</span>
                    
                    {dayTask && (
                      <div className="mt-1 overflow-hidden">
                        <p className="text-xs truncate">{dayTask.text}</p>
                      </div>
                    )}
                    
                    {hasCommit && (
                      <div className="mt-auto mb-2 self-center">
                        <Circle className="fill-black text-black" size={8} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center gap-6 justify-center text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Circle className="fill-black text-black" size={8} />
                <span>Feature committed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-50 border border-gray-200"></div>
                <span>Today</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Timer view */}
        {view === "timer" && activeTask && (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="mb-12 text-center">
              <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                Current focus
              </div>
              <p className="text-xl">{activeTask.text}</p>
              {activeTask.description && (
                <p className="text-sm text-gray-600 mt-2 max-w-md">{activeTask.description}</p>
              )}
            </div>
            
            <div className="w-64 h-64 border-2 border-gray-200 rounded-full flex items-center justify-center relative mb-12">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="48"
                  fill="transparent"
                  stroke="black" 
                  strokeWidth="4"
                  strokeDasharray={`${(1 - timeRemaining / (timerDuration * 60)) * 301} 301`}
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
              
              <button
                onClick={completeTask}
                className="px-6 py-3 bg-white text-black border border-gray-200"
              >
                Complete
              </button>
              
              <button
                onClick={() => {
                  setActiveTask(null);
                  setTimerRunning(false);
                  setView("dashboard");
                }}
                className="px-6 py-3 text-gray-500"
              >
                Cancel
              </button>
            </div>
            
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
                  setTimeRemaining(newDuration * 60);
                  setTimerRunning(false);
                }}
                className="w-full appearance-none h-1 bg-gray-200 rounded outline-none"
              />
            </div>
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
                          // For URL sharing, we'll only include necessary data to reduce size
                          const compactTasks = tasks.map(task => ({
                            id: task.id,
                            text: task.text,
                            description: task.description,
                            completed: task.completed,
                            date: task.date
                          }));
                          
                          const dataToEncode = {
                            tasks: compactTasks,
                            settings: { timerDuration, darkMode }
                          };
                          
                          const jsonString = JSON.stringify(dataToEncode);
                          const base64Data = btoa(jsonString);
                          const url = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(base64Data)}`;
                          
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
    </div>
  );
};

export default LLMpediaTracker;