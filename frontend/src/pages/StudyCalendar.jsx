import React, { useState, useEffect } from 'react';
import { apCourses } from '../data/apCourses.js';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { generateAIStudyPlan, generateAdaptiveStudyPlan } from '../utils/api.js';
import { useTheme } from '../context/ThemeContext.jsx';

// Custom MultiSelectDropdown component to match the template
const CustomMultiSelectDropdown = ({ options, selectedValues, onChange, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleOption = (id) => {
    if (selectedValues.includes(id)) {
      onChange(selectedValues.filter(v => v !== id));
    } else {
      onChange([...selectedValues, id]);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={styles.dropdownButton}
        disabled={disabled}
      >
        {selectedValues.length === 0 ? placeholder : `${selectedValues.length} course(s) selected`}
        <span style={{ marginLeft: 'auto' }}>▼</span>
      </button>
      {isOpen && (
        <div style={styles.dropdownMenu}>
          {options.map(option => (
            <label key={option.id} style={styles.dropdownItem}>
              <input
                type="checkbox"
                checked={selectedValues.includes(option.id)}
                onChange={() => toggleOption(option.id)}
                style={{ marginRight: '0.5rem' }}
              />
              {option.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default function StudyCalendar() {
  // Theme context
  const { resolvedTheme } = useTheme();
  
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [studySessions, setStudySessions] = useState({});
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [studyPlanData, setStudyPlanData] = useState(null);
  const [performanceData, setPerformanceData] = useState({});

  // Form states
  const [newSession, setNewSession] = useState({
    courseId: '',
    duration: 60,
    type: 'mcq',
    notes: ''
  });
  const [scheduleForm, setScheduleForm] = useState({
    courseId: '',
    weeks: 4,
    hoursPerDay: 2
  });

  // Streak data
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    studyMinutes: {}
  });

  // Color palette for AP courses
  const courseColors = {
    'ap-psychology': '#FF6B6B',
    'ap-united-states-history': '#4ECDC4',
    'ap-world-history': '#45B7D1',
    'ap-english-language': '#96CEB4',
    'ap-english-literature': '#FFEAA7',
    'ap-biology': '#DDA0DD',
    'ap-chemistry': '#98D8C8',
    'ap-physics-1': '#F7DC6F',
    'ap-calculus-ab': '#BB8FCE',
    'ap-calculus-bc': '#85C1E9',
    'ap-statistics': '#F8C471',
    'ap-economics-macro': '#82E0AA',
    'ap-economics-micro': '#F1948A',
    'ap-government': '#85C1E9',
    'ap-human-geography': '#D7BDE2',
    'ap-african-american-studies': '#F9E79F',
    'ap-art-history': '#AED6F1',
    'ap-comparative-government-and-politics': '#A9DFBF',
    'ap-drawing': '#FADBD8',
    'ap-european-history': '#D5DBDB',
    'ap-macroeconomics': '#D2B4DE',
    'ap-microeconomics': '#AED6F1',
    'ap-music-theory': '#FCF3CF',
    'ap-research': '#D1F2EB',
    'ap-seminar': '#FAD7A0',
    'ap-studio-art-2d': '#E8DAEF',
    'ap-studio-art-3d': '#D5F4E6',
    'ap-us-government-and-politics': '#FDEBD0'
  };

  // Function to get session color based on theme
  const getSessionColor = (courseId) => {
    const baseColor = courseColors[courseId] || '#6B7280';
    
    if (resolvedTheme === 'light') {
      // For light mode, make colors darker and more saturated
      const colorMap = {
        '#FF6B6B': '#E53E3E', // Red
        '#4ECDC4': '#38B2AC', // Teal
        '#45B7D1': '#3182CE', // Blue
        '#96CEB4': '#68D391', // Green
        '#FFEAA7': '#F6E05E', // Yellow
        '#DDA0DD': '#B794F6', // Purple
        '#98D8C8': '#68D391', // Light Green
        '#F7DC6F': '#F6E05E', // Light Yellow
        '#BB8FCE': '#9F7AEA', // Light Purple
        '#85C1E9': '#63B3ED', // Light Blue
        '#F8C471': '#F6E05E', // Orange
        '#82E0AA': '#68D391', // Light Green
        '#F1948A': '#FC8181', // Light Red
        '#D7BDE2': '#B794F6', // Light Purple
        '#F9E79F': '#F6E05E', // Light Yellow
        '#AED6F1': '#90CDF4', // Light Blue
        '#A9DFBF': '#68D391', // Light Green
        '#FADBD8': '#FED7D7', // Light Pink
        '#D5DBDB': '#A0AEC0', // Light Gray
        '#D2B4DE': '#B794F6', // Light Purple
        '#FCF3CF': '#F6E05E', // Light Yellow
        '#D1F2EB': '#9AE6B4', // Light Green
        '#FAD7A0': '#F6E05E', // Light Orange
        '#E8DAEF': '#D6BCFA', // Light Purple
        '#D5F4E6': '#9AE6B4', // Light Green
        '#FDEBD0': '#F6E05E'  // Light Orange
      };
      return colorMap[baseColor] || baseColor;
    }
    
    return baseColor; // Dark mode uses original colors
  };

  // AP Exam dates for 2025 (typically in May)
  const apExamDates = {
    'ap-psychology': new Date('2025-05-05'),
    'ap-united-states-history': new Date('2025-05-06'),
    'ap-world-history': new Date('2025-05-07'),
    'ap-english-language': new Date('2025-05-08'),
    'ap-english-literature': new Date('2025-05-09'),
    'ap-biology': new Date('2025-05-12'),
    'ap-chemistry': new Date('2025-05-13'),
    'ap-physics-1': new Date('2025-05-14'),
    'ap-calculus-ab': new Date('2025-05-15'),
    'ap-calculus-bc': new Date('2025-05-15'),
    'ap-statistics': new Date('2025-05-16'),
    'ap-economics-macro': new Date('2025-05-19'),
    'ap-economics-micro': new Date('2025-05-20'),
    'ap-government': new Date('2025-05-21'),
    'ap-human-geography': new Date('2025-05-22')
  };

  // Load study sessions and streak data from localStorage
  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('studySessions') || '{}');
    const savedStreakData = JSON.parse(localStorage.getItem('streakData') || '{}');
    setStudySessions(savedSessions);
    setStreakData({
      currentStreak: savedStreakData.currentStreak || 0,
      longestStreak: savedStreakData.longestStreak || 0,
      lastStudyDate: savedStreakData.lastStudyDate || null,
      studyMinutes: savedStreakData.studyMinutes || {}
    });
  }, []);

  // Calculate streak based on study minutes
  const calculateStreak = (studyMinutes) => {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    while (true) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const minutes = studyMinutes[dateKey] || 0;
      
      if (minutes >= 15) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Update streak data when study sessions change
  useEffect(() => {
    const studyMinutes = {};
    Object.keys(studySessions).forEach(date => {
      const sessions = studySessions[date];
      const totalMinutes = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
      if (totalMinutes > 0) {
        studyMinutes[date] = totalMinutes;
      }
    });

    const currentStreak = calculateStreak(studyMinutes);
    const longestStreak = Math.max(currentStreak, streakData.longestStreak);
    
    setStreakData(prev => ({
      ...prev,
      currentStreak,
      longestStreak,
      studyMinutes
    }));

    // Save to localStorage
    localStorage.setItem('streakData', JSON.stringify({
      currentStreak,
      longestStreak,
      studyMinutes
    }));
  }, [studySessions]);

  // Save study sessions to localStorage
  const saveStudySessions = (sessions) => {
    localStorage.setItem('studySessions', JSON.stringify(sessions));
    setStudySessions(sessions);
  };

  // Generate AI study plan using backend service
  const generateStudyPlan = async () => {
    if (!selectedCourses || selectedCourses.length === 0) {
      alert('Please select at least one AP course to generate a study plan');
      return;
    }

    setIsGeneratingPlan(true);
    
    try {
      // Test backend connectivity first
      try {
        const testResponse = await fetch('http://localhost:5001/api/study-plan/health');
        const testData = await testResponse.json();
        console.log('Backend connectivity test:', testData);
      } catch (testError) {
        console.error('Backend connectivity test failed:', testError);
        alert('Cannot connect to backend server. Please make sure the backend is running on port 5001.');
        setIsGeneratingPlan(false);
        return;
      }
      
      // Prepare exam dates for selected courses
      const examDatesForPlan = {};
      selectedCourses.forEach(courseId => {
        if (apExamDates[courseId]) {
          examDatesForPlan[courseId] = apExamDates[courseId].toISOString().split('T')[0];
        }
      });

      // Get performance data from localStorage
      const savedPerformanceData = JSON.parse(localStorage.getItem('performanceData') || '{}');
      
      // Generate study plan using backend AI service
      const response = await generateAIStudyPlan({
        selectedCourses,
        examDates: examDatesForPlan,
        currentDate: new Date().toISOString().split('T')[0],
        studyPreferences: {
          preferredStudyTime: 'evening',
          sessionLength: 60,
          difficultyProgression: true
        },
        performanceData: savedPerformanceData
      });
      
      if (response.success && response.studyPlan) {
        setStudyPlanData(response.studyPlan);
        
        // Convert AI study plan to calendar sessions
        const sessions = {};
        if (response.studyPlan.studyPlan.dailySchedule && Array.isArray(response.studyPlan.studyPlan.dailySchedule)) {
          response.studyPlan.studyPlan.dailySchedule.forEach(day => {
            const dateKey = day.date;
            if (day.sessions && Array.isArray(day.sessions)) {
              sessions[dateKey] = day.sessions.map(session => ({
                id: `${session.courseId}-${dateKey}-${Math.random().toString(36).substr(2, 9)}`,
                courseId: session.courseId,
                courseName: session.courseName,
                duration: session.duration,
                type: session.type,
                notes: session.notes,
                focus: session.focus,
                difficulty: session.difficulty,
                priority: session.priority,
                isAIGenerated: true
              }));
            }
          });
        }

        // Merge with existing sessions
        const updatedSessions = { ...studySessions };
        Object.keys(sessions).forEach(date => {
          if (!updatedSessions[date]) {
            updatedSessions[date] = [];
          }
          updatedSessions[date] = [...updatedSessions[date], ...sessions[date]];
        });

        saveStudySessions(updatedSessions);
        alert(`AI study plan generated for ${selectedCourses.length} course(s)!`);
      } else {
        throw new Error(response.message || 'Failed to generate study plan');
      }
    } catch (error) {
      console.error('Error generating study plan:', error);
      alert(`Failed to generate study plan: ${error.message}. Please check the console for details.`);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Generate adaptive study plan based on performance
  const generateAdaptivePlan = async () => {
    if (selectedCourses.length === 0) {
      alert('Please select at least one AP course to generate an adaptive study plan');
      return;
    }

    setIsGeneratingPlan(true);
    
    try {
      // Prepare exam dates for selected courses
      const examDatesForPlan = {};
      selectedCourses.forEach(courseId => {
        if (apExamDates[courseId]) {
          examDatesForPlan[courseId] = apExamDates[courseId].toISOString().split('T')[0];
        }
      });

      // Get performance data from localStorage
      const savedPerformanceData = JSON.parse(localStorage.getItem('performanceData') || '{}');
      
      if (Object.keys(savedPerformanceData).length === 0) {
        alert('No performance data found. Please complete some practice sessions first to generate an adaptive study plan.');
        setIsGeneratingPlan(false);
        return;
      }

      // Generate adaptive study plan using backend AI service
      const response = await generateAdaptiveStudyPlan({
        selectedCourses,
        examDates: examDatesForPlan,
        currentDate: new Date().toISOString().split('T')[0],
        studyPreferences: {
          preferredStudyTime: 'evening',
          sessionLength: 60,
          difficultyProgression: true,
          adaptiveMode: true
        },
        performanceData: savedPerformanceData
      });

      if (response.success && response.studyPlan) {
        setStudyPlanData(response.studyPlan);
        
        // Convert AI study plan to calendar sessions
        const sessions = {};
        if (response.studyPlan.studyPlan.dailySchedule && Array.isArray(response.studyPlan.studyPlan.dailySchedule)) {
          response.studyPlan.studyPlan.dailySchedule.forEach(day => {
            const dateKey = day.date;
            if (day.sessions && Array.isArray(day.sessions)) {
              sessions[dateKey] = day.sessions.map(session => ({
                id: `${session.courseId}-${dateKey}-${Math.random().toString(36).substr(2, 9)}`,
                courseId: session.courseId,
                courseName: session.courseName,
                duration: session.duration,
                type: session.type,
                notes: session.notes,
                focus: session.focus,
                difficulty: session.difficulty,
                priority: session.priority,
                isAIGenerated: true,
                isAdaptive: true
              }));
            }
          });
        }

        // Merge with existing sessions
        const updatedSessions = { ...studySessions };
        Object.keys(sessions).forEach(date => {
          if (!updatedSessions[date]) {
            updatedSessions[date] = [];
          }
          updatedSessions[date] = [...updatedSessions[date], ...sessions[date]];
        });

        saveStudySessions(updatedSessions);
        alert(`Adaptive study plan generated for ${selectedCourses.length} course(s)!`);
      } else {
        throw new Error(response.message || 'Failed to generate adaptive study plan');
      }
    } catch (error) {
      console.error('Error generating adaptive study plan:', error);
      alert(`Failed to generate adaptive study plan: ${error.message}. Please check the console for details.`);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Add study session
  const addStudySession = () => {
    if (!newSession.courseId) {
      alert('Please select a course');
      return;
    }

    const dateKey = selectedDate.toISOString().split('T')[0];
    const session = {
      id: Date.now().toString(),
      courseId: newSession.courseId,
      courseName: apCourses.find(c => c.id === newSession.courseId)?.name || newSession.courseId,
      duration: newSession.duration,
      type: newSession.type,
      notes: newSession.notes,
      isAIGenerated: false
    };

    const updatedSessions = { ...studySessions };
    if (!updatedSessions[dateKey]) {
      updatedSessions[dateKey] = [];
    }
    updatedSessions[dateKey].push(session);

    saveStudySessions(updatedSessions);
    setShowAddSession(false);
    setNewSession({ courseId: '', duration: 60, type: 'mcq', notes: '' });
  };

  // Generate AI study schedule
  const generateStudySchedule = async () => {
    if (!scheduleForm.courseId) {
      alert('Please select a course');
      return;
    }

    const course = apCourses.find(c => c.id === scheduleForm.courseId);
    if (!course) {
      alert('Course not found');
      return;
    }

    setIsGeneratingPlan(true);
    
    try {
      // Test backend connectivity first
      try {
        const testResponse = await fetch('http://localhost:5001/api/study-plan/health');
        const testData = await testResponse.json();
        console.log('Backend connectivity test:', testData);
      } catch (testError) {
        console.error('Backend connectivity test failed:', testError);
        alert('Cannot connect to backend server. Please make sure the backend is running on port 5001.');
        setIsGeneratingPlan(false);
        return;
      }

      // Prepare exam dates for the selected course
      const examDatesForPlan = {};
      if (apExamDates[scheduleForm.courseId]) {
        examDatesForPlan[scheduleForm.courseId] = apExamDates[scheduleForm.courseId].toISOString().split('T')[0];
      }

      // Get performance data from localStorage
      const savedPerformanceData = JSON.parse(localStorage.getItem('performanceData') || '{}');
      
      // Calculate end date based on weeks input
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (scheduleForm.weeks * 7));
      
      // Generate AI study plan using the schedule form inputs
      const response = await generateAIStudyPlan({
        selectedCourses: [scheduleForm.courseId],
        examDates: examDatesForPlan,
        currentDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        studyPreferences: {
          preferredStudyTime: 'evening',
          sessionLength: Math.floor((scheduleForm.hoursPerDay * 60) / Math.ceil(scheduleForm.hoursPerDay)),
          difficultyProgression: true,
          totalWeeks: scheduleForm.weeks,
          hoursPerDay: scheduleForm.hoursPerDay,
          skipWeekends: true,
          studyDaysPerWeek: 5,
          includeWeekends: false
        },
        performanceData: savedPerformanceData
      });
      
      if (response.success && response.studyPlan) {
        // Check if the AI returned an empty schedule (fallback case)
        const dailySchedule = response.studyPlan.studyPlan.dailySchedule;
        if (!dailySchedule || dailySchedule.length === 0) {
          console.warn('AI returned empty schedule, creating basic schedule instead');
          // Create basic schedule directly
          const startDate = new Date();
          const updatedSessions = { ...studySessions };
          
          // Generate basic sessions for the specified number of weeks
          for (let week = 0; week < scheduleForm.weeks; week++) {
            for (let day = 0; day < 7; day++) {
              const sessionDate = new Date(startDate);
              sessionDate.setDate(startDate.getDate() + (week * 7) + day);
              
              // Skip weekends
              if (sessionDate.getDay() === 0 || sessionDate.getDay() === 6) {
                continue;
              }
              
              const dateKey = sessionDate.toISOString().split('T')[0];
              
              // Create study sessions based on hours per day
              const sessionsPerDay = Math.ceil(scheduleForm.hoursPerDay);
              for (let session = 0; session < sessionsPerDay; session++) {
                const sessionId = `${Date.now()}-${week}-${day}-${session}`;
                const sessionType = session % 2 === 0 ? 'mcq' : 'frq';
                
                const studySession = {
                  id: sessionId,
                  courseId: scheduleForm.courseId,
                  courseName: course.name,
                  duration: Math.floor((scheduleForm.hoursPerDay * 60) / sessionsPerDay),
                  type: sessionType,
                  notes: `Week ${week + 1}, Day ${day + 1} - ${sessionType.toUpperCase()} practice (AI Fallback)`,
                  isAIGenerated: false,
                  isScheduled: true
                };

                if (!updatedSessions[dateKey]) {
                  updatedSessions[dateKey] = [];
                }
                updatedSessions[dateKey].push(studySession);
              }
            }
          }

          saveStudySessions(updatedSessions);
          setShowSchedulePopup(false);
          setScheduleForm({ courseId: '', weeks: 4, hoursPerDay: 2 });
          alert(`Basic study schedule created for ${course.name} over ${scheduleForm.weeks} weeks! (AI returned empty schedule)`);
          return;
        }
        
        setStudyPlanData(response.studyPlan);
        
        // Convert AI study plan to calendar sessions
        const sessions = {};
        if (dailySchedule && Array.isArray(dailySchedule)) {
          dailySchedule.forEach(day => {
            const dateKey = day.date;
            if (day.sessions && Array.isArray(day.sessions)) {
              sessions[dateKey] = day.sessions.map(session => ({
                id: `${session.courseId}-${dateKey}-${Math.random().toString(36).substr(2, 9)}`,
                courseId: session.courseId,
                courseName: session.courseName,
                duration: session.duration,
                type: session.type,
                notes: session.notes,
                focus: session.focus,
                difficulty: session.difficulty,
                priority: session.priority,
                isAIGenerated: true,
                isScheduled: true
              }));
            }
          });
        }

        // Merge with existing sessions
        const updatedSessions = { ...studySessions };
        Object.keys(sessions).forEach(date => {
          if (!updatedSessions[date]) {
            updatedSessions[date] = [];
          }
          updatedSessions[date] = [...updatedSessions[date], ...sessions[date]];
        });

        saveStudySessions(updatedSessions);
        setShowSchedulePopup(false);
        setScheduleForm({ courseId: '', weeks: 4, hoursPerDay: 2 });
        alert(`AI study schedule created for ${course.name} over ${scheduleForm.weeks} weeks with ${scheduleForm.hoursPerDay} hours per day!`);
      } else {
        throw new Error(response.message || 'Failed to generate study schedule');
      }
    } catch (error) {
      console.error('Error generating study schedule:', error);
      
      // Offer fallback to create basic schedule
      const useFallback = confirm(`AI study plan generation failed: ${error.message}\n\nWould you like to create a basic study schedule instead?`);
      
      if (useFallback) {
        // Create basic study schedule as fallback
        const course = apCourses.find(c => c.id === scheduleForm.courseId);
        const startDate = new Date();
        const updatedSessions = { ...studySessions };
        
        // Generate basic sessions for the specified number of weeks
        for (let week = 0; week < scheduleForm.weeks; week++) {
          for (let day = 0; day < 7; day++) {
            const sessionDate = new Date(startDate);
            sessionDate.setDate(startDate.getDate() + (week * 7) + day);
            
            // Skip weekends
            if (sessionDate.getDay() === 0 || sessionDate.getDay() === 6) {
              continue;
            }
            
            const dateKey = sessionDate.toISOString().split('T')[0];
            
            // Create study sessions based on hours per day
            const sessionsPerDay = Math.ceil(scheduleForm.hoursPerDay);
            for (let session = 0; session < sessionsPerDay; session++) {
              const sessionId = `${Date.now()}-${week}-${day}-${session}`;
              const sessionType = session % 2 === 0 ? 'mcq' : 'frq';
              
              const studySession = {
                id: sessionId,
                courseId: scheduleForm.courseId,
                courseName: course.name,
                duration: Math.floor((scheduleForm.hoursPerDay * 60) / sessionsPerDay),
                type: sessionType,
                notes: `Week ${week + 1}, Day ${day + 1} - ${sessionType.toUpperCase()} practice (Basic Schedule)`,
                isAIGenerated: false,
                isScheduled: true
              };

              if (!updatedSessions[dateKey]) {
                updatedSessions[dateKey] = [];
              }
              updatedSessions[dateKey].push(studySession);
            }
          }
        }

        saveStudySessions(updatedSessions);
        setShowSchedulePopup(false);
        setScheduleForm({ courseId: '', weeks: 4, hoursPerDay: 2 });
        alert(`Basic study schedule created for ${course.name} over ${scheduleForm.weeks} weeks!`);
      } else {
        alert('Study schedule creation cancelled.');
      }
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Delete study session
  const deleteStudySession = (dateKey, sessionId) => {
    const updatedSessions = { ...studySessions };
    updatedSessions[dateKey] = updatedSessions[dateKey].filter(s => s.id !== sessionId);
    saveStudySessions(updatedSessions);
  };

  // Remove all AI-generated study plans
  const removeAllAIPlans = () => {
    if (window.confirm('Are you sure you want to remove all AI-generated study plans? This action cannot be undone.')) {
      const updatedSessions = {};
      Object.keys(studySessions).forEach(dateKey => {
        const nonAISessions = studySessions[dateKey].filter(session => !session.isAIGenerated);
        if (nonAISessions.length > 0) {
          updatedSessions[dateKey] = nonAISessions;
        }
      });
      saveStudySessions(updatedSessions);
      alert('All AI-generated study plans have been removed.');
    }
  };

  // Remove all scheduled study plans
  const removeAllScheduledPlans = () => {
    if (window.confirm('Are you sure you want to remove all scheduled study plans? This action cannot be undone.')) {
      const updatedSessions = {};
      Object.keys(studySessions).forEach(dateKey => {
        const nonScheduledSessions = studySessions[dateKey].filter(session => !session.isScheduled);
        if (nonScheduledSessions.length > 0) {
          updatedSessions[dateKey] = nonScheduledSessions;
        }
      });
      saveStudySessions(updatedSessions);
      alert('All scheduled study plans have been removed.');
    }
  };

  // Navigate months
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Get sessions for a specific date
  const getSessionsForDate = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return studySessions[dateKey] || [];
  };

  // Check if date has AP exam
  const getExamForDate = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    for (const [courseId, examDate] of Object.entries(apExamDates)) {
      if (examDate.toISOString().split('T')[0] === dateKey) {
        return [courseId, examDate];
      }
    }
    return null;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <>
      <style>
        {`
          @keyframes streakPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          
          @keyframes statusDotPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .calendar-day-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          
          .calendar-day-hover:hover {
            transform: translateY(-3px) !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
            border-color: rgba(59, 130, 246, 0.4) !important;
            background-color: rgba(255, 255, 255, 0.08) !important;
          }
          
          .session-card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          
          .session-card-hover:hover {
            transform: translateY(-3px) !important;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2) !important;
            border-color: rgba(59, 130, 246, 0.4) !important;
          }
          
          .fade-in-up {
            animation: fadeInUp 0.6s ease-out;
          }
          
          .slide-in-right {
            animation: slideInRight 0.5s ease-out;
          }
        `}
      </style>
      <section style={styles.wrapper}>
        {/* Top Content - Full Width */}
        <div style={styles.topContent}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Study Calendar</h1>
              <p style={styles.subtitle}>
                Plan your AP study sessions and track your progress leading up to exam dates.
              </p>
            </div>
            <div style={styles.headerActions}>
          <button
            style={styles.primaryButton}
            onClick={() => setShowAddSession(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 12px rgba(59, 130, 246, 0.4), 0 0 20px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3)";
              e.currentTarget.style.backgroundColor = "#2563EB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(59, 130, 246, 0.3)";
              e.currentTarget.style.backgroundColor = "#3B82F6";
            }}
          >
            + Add Study Session
          </button>
          <button
            style={styles.scheduleButton}
            onClick={() => setShowSchedulePopup(true)}
            disabled={isGeneratingPlan}
            onMouseEnter={(e) => {
              if (!isGeneratingPlan) {
                e.currentTarget.style.boxShadow = "0 8px 12px rgba(59, 130, 246, 0.4), 0 0 20px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3)";
                e.currentTarget.style.backgroundColor = "#2563EB";
              }
            }}
            onMouseLeave={(e) => {
              if (!isGeneratingPlan) {
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(59, 130, 246, 0.3)";
                e.currentTarget.style.backgroundColor = "#3B82F6";
              }
            }}
          >
            {isGeneratingPlan ? '⏳ Generating AI Plan...' : 'Create AI Study Schedule'}
          </button>
          <button
            style={styles.secondaryButton}
            onClick={generateStudyPlan}
            disabled={isGeneratingPlan}
            onMouseEnter={(e) => {
              if (!isGeneratingPlan) {
                e.currentTarget.style.boxShadow = "0 8px 12px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.5), 0 0 30px rgba(16, 185, 129, 0.3)";
                e.currentTarget.style.backgroundColor = "#059669";
              }
            }}
            onMouseLeave={(e) => {
              if (!isGeneratingPlan) {
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(16, 185, 129, 0.3)";
                e.currentTarget.style.backgroundColor = "#10B981";
              }
            }}
          >
            {isGeneratingPlan ? '⏳ Generating...' : 'Generate AI Study Plan'}
          </button>
          <button
            style={styles.adaptiveButton}
            onClick={generateAdaptivePlan}
            disabled={isGeneratingPlan}
            onMouseEnter={(e) => {
              if (!isGeneratingPlan) {
                e.currentTarget.style.boxShadow = "0 8px 12px rgba(59, 130, 246, 0.4), 0 0 20px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3)";
                e.currentTarget.style.backgroundColor = "#2563EB";
              }
            }}
            onMouseLeave={(e) => {
              if (!isGeneratingPlan) {
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(59, 130, 246, 0.3)";
                e.currentTarget.style.backgroundColor = "#3B82F6";
              }
            }}
          >
            {isGeneratingPlan ? '⏳ Generating...' : 'Generate Adaptive Plan'}
          </button>
        </div>
      </div>

      {/* Streak Display */}
      <div style={styles.streakContainer}>
        <div className="fade-in-up" style={styles.streakCard}>
          <div style={styles.streakIcon}>🔥</div>
          <div style={styles.streakInfo}>
            <div style={styles.streakNumber}>{streakData.currentStreak}</div>
            <div style={styles.streakLabel}>
              {streakData.currentStreak === 0 ? 'Start your streak!' : 
               streakData.currentStreak === 1 ? 'day streak' : 'day streak'}
            </div>
            <div style={styles.streakSubtext}>
              {streakData.currentStreak === 0 ? 'Study 15+ minutes to begin' :
               streakData.currentStreak >= 50 ? 'Incredible! You\'re unstoppable!' :
               streakData.currentStreak >= 30 ? 'Amazing! You\'re on fire!' :
               streakData.currentStreak >= 7 ? 'Great job! Keep it up!' :
               'Keep studying daily!'}
            </div>
          </div>
          <div style={styles.streakStats}>
            <div style={styles.longestStreak}>
              <div style={styles.longestNumber}>{streakData.longestStreak}</div>
              <div style={styles.longestLabel}>Longest</div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Selection */}
      <div style={styles.courseSelectionContainer}>
        <h3 style={styles.courseSelectionTitle}>Select Courses for AI Study Plans</h3>
        <MultiSelectDropdown
          options={apCourses}
          selectedValues={selectedCourses}
          onChange={setSelectedCourses}
          placeholder="Choose AP courses..."
          disabled={isGeneratingPlan}
        />
        {selectedCourses.length > 0 && (
          <div style={styles.selectedCoursesStatus}>
            <div style={styles.statusDot}></div>
            <span style={styles.statusText}>
              {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        )}
        {selectedCourses.length === 0 && (
          <div style={styles.noCourseStatus}>
            <div style={styles.statusDot}></div>
            <span style={styles.statusText}>No courses selected</span>
          </div>
        )}
      </div>

      {/* Calendar and Sidebar Section */}
      <div style={styles.mainContent}>

        {/* Calendar */}
        <div style={styles.calendarContainer}>
          <div style={styles.calendarHeader}>
            <button
              style={styles.navButton}
              onClick={() => navigateMonth(-1)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateX(-4px) scale(1.1)";
                e.currentTarget.style.borderColor = "#0078C8";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 120, 200, 0.3)";
                e.currentTarget.style.backgroundColor = "rgba(0, 120, 200, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateX(0) scale(1)";
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              }}
            >
              ←
            </button>
            <h2 style={styles.monthTitle}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              style={styles.navButton}
              onClick={() => navigateMonth(1)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateX(4px) scale(1.1)";
                e.currentTarget.style.borderColor = "#0078C8";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 120, 200, 0.3)";
                e.currentTarget.style.backgroundColor = "rgba(0, 120, 200, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateX(0) scale(1)";
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              }}
            >
              →
            </button>
          </div>

          <div style={styles.calendarGrid}>
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={styles.dayHeader}>{day}</div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} style={styles.emptyDay}></div>;
              }

              const sessions = getSessionsForDate(day);
              const exam = getExamForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = day.toDateString() === selectedDate.toDateString();
              
              // Check if this date has any exam for selected courses
              const selectedCourseExam = selectedCourses.find(courseId => {
                const examDate = apExamDates[courseId];
                return examDate && examDate.toDateString() === day.toDateString();
              });

              return (
                <div
                  key={index}
                  className="calendar-day-hover fade-in-up"
                  style={{
                    ...styles.calendarDay,
                    ...(isToday ? styles.today : {}),
                    ...(isSelected ? styles.selectedDay : {}),
                    ...(exam ? styles.examDay : {}),
                    ...(selectedCourseExam ? styles.selectedExamDay : {}),
                    animationDelay: `${index * 0.05}s`
                  }}
                  onClick={() => setSelectedDate(day)}
                >
                  <div style={styles.dayNumber}>{day.getDate()}</div>
                  
                  {exam && (
                    <div style={styles.examBadge}>
                      📝 {apCourses.find(c => c.id === exam[0])?.name || exam[0]}
                    </div>
                  )}
                  
                  {selectedCourseExam && !exam && (
                    <div style={styles.selectedExamBadge}>
                      📝 {apCourses.find(c => c.id === selectedCourseExam)?.name || selectedCourseExam}
                    </div>
                  )}
                  
                  {sessions.length > 0 && (
                    <div style={styles.sessionIndicators}>
                      {sessions.slice(0, 2).map((session, idx) => (
                        <div
                          key={idx}
                          style={{
                            ...styles.sessionBar,
                            backgroundColor: getSessionColor(session.courseId),
                            opacity: session.type === 'mcq' ? 0.8 : 0.6
                          }}
                          title={`${session.courseName} - ${session.type.toUpperCase()}`}
                        />
                      ))}
                      {sessions.length > 2 && (
                        <div style={styles.moreIndicator}>+{sessions.length - 2}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

          {/* Selected Date Details - Side Panel */}
          <div style={styles.sidePanel}>
          <div style={styles.sidePanelHeader}>
            <div style={styles.dateInfo}>
              <h3 style={styles.dateTitle}>
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </h3>
              <p style={styles.dateSubtitle}>
                {selectedDate.getFullYear()}
              </p>
            </div>
            <div style={styles.sessionCount}>
              <span style={styles.sessionCountNumber}>
                {getSessionsForDate(selectedDate).length}
              </span>
              <span style={styles.sessionCountLabel}>
                {getSessionsForDate(selectedDate).length === 1 ? 'Session' : 'Sessions'}
              </span>
            </div>
          </div>

          
          <div style={styles.sessionsList}>
            {getSessionsForDate(selectedDate).map((session, index) => (
                <div key={session.id} className="session-card-hover slide-in-right" style={{
                  ...styles.sessionCard,
                  animationDelay: `${index * 0.1}s`
                }}>
                <div style={styles.sessionHeader}>
                  <div style={styles.sessionInfo}>
                    <div style={styles.sessionTitle}>
                      {session.courseName}
                    </div>
                    <div style={styles.sessionMeta}>
                      <span style={styles.sessionType}>
                        {session.type.toUpperCase()}
                      </span>
                      <span style={styles.sessionDuration}>
                        {session.duration} min
                      </span>
                      {session.isAIGenerated && (
                        <span style={styles.aiBadge}>AI</span>
                      )}
                      {session.isAdaptive && (
                        <span style={styles.adaptiveBadge}>Adaptive</span>
                      )}
                    </div>
                    {session.focus && (
                      <div style={styles.sessionFocus}>
                        <span style={styles.focusLabel}>Focus:</span>
                        <span style={styles.focusText}>{session.focus}</span>
                      </div>
                    )}
                    {session.difficulty && (
                      <div style={styles.sessionDifficulty}>
                        <span style={styles.difficultyLabel}>Level:</span>
                        <span style={{
                          ...styles.difficultyBadge,
                          backgroundColor: session.difficulty === 'beginner' ? 'rgba(34, 197, 94, 0.1)' : 
                                         session.difficulty === 'intermediate' ? 'rgba(251, 191, 36, 0.1)' : 
                                         'rgba(239, 68, 68, 0.1)',
                          color: session.difficulty === 'beginner' ? '#22C55E' : 
                                session.difficulty === 'intermediate' ? '#F59E0B' : 
                                '#EF4444'
                        }}>
                          {session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)}
                        </span>
                      </div>
                    )}
                    {session.priority && (
                      <div style={styles.sessionPriority}>
                        <span style={styles.priorityLabel}>Priority:</span>
                        <span style={{
                          ...styles.priorityBadge,
                          backgroundColor: session.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 
                                         session.priority === 'medium' ? 'rgba(251, 191, 36, 0.1)' : 
                                         'rgba(34, 197, 94, 0.1)',
                          color: session.priority === 'high' ? '#EF4444' : 
                                session.priority === 'medium' ? '#F59E0B' : 
                                '#22C55E'
                        }}>
                          {session.priority.charAt(0).toUpperCase() + session.priority.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    style={styles.deleteButton}
                    onClick={() => deleteStudySession(selectedDate.toISOString().split('T')[0], session.id)}
                    title="Delete session"
                  >
                    ×
                  </button>
                </div>
                {session.notes && (
                  <p style={styles.sessionNotes}>{session.notes}</p>
                )}
              </div>
            ))}
            
            {getSessionsForDate(selectedDate).length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>📅</div>
                <p style={styles.emptyStateText}>No study sessions scheduled for this date.</p>
                <button 
                  style={styles.addSessionButton}
                  onClick={() => setShowAddSession(true)}
                >
                  + Add Study Session
                </button>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Add Session Modal */}
        {showAddSession && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={styles.modalTitle}>Add Study Session</h3>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Course:</label>
                <select
                  style={styles.select}
                  value={newSession.courseId}
                  onChange={(e) => setNewSession({...newSession, courseId: e.target.value})}
                >
                  <option value="">Select a course</option>
                  {apCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Duration (minutes):</label>
                <input
                  type="number"
                  style={styles.input}
                  value={newSession.duration}
                  onChange={(e) => setNewSession({...newSession, duration: parseInt(e.target.value)})}
                  min="15"
                  max="180"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Type:</label>
                <select
                  style={styles.select}
                  value={newSession.type}
                  onChange={(e) => setNewSession({...newSession, type: e.target.value})}
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="frq">Free Response</option>
                  <option value="mixed">Mixed Practice</option>
                  <option value="review">Review</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notes (optional):</label>
                <textarea
                  style={styles.textarea}
                  value={newSession.notes}
                  onChange={(e) => setNewSession({...newSession, notes: e.target.value})}
                  placeholder="Add any notes about this study session..."
                  rows="3"
                />
              </div>

              <div style={styles.modalActions}>
                <button 
                  style={styles.cancelButton}
                  onClick={() => setShowAddSession(false)}
                >
                  Cancel
                </button>
                <button 
                  style={styles.saveButton}
                  onClick={addStudySession}
                >
                  Add Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Study Schedule Modal */}
        {showSchedulePopup && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={styles.modalTitle}>Create AI Study Schedule</h3>
              <p style={styles.modalSubtitle}>Generate a personalized AI-powered study plan for your AP course</p>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>For which class do you want a schedule?</label>
                <select
                  style={styles.select}
                  value={scheduleForm.courseId}
                  onChange={(e) => setScheduleForm({...scheduleForm, courseId: e.target.value})}
                >
                  <option value="">Select a course</option>
                  {apCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>For how many weeks do we want it?</label>
                <input
                  type="number"
                  style={styles.input}
                  value={scheduleForm.weeks}
                  onChange={(e) => setScheduleForm({...scheduleForm, weeks: parseInt(e.target.value)})}
                  min="1"
                  max="12"
                />
                <small style={styles.inputHelp}>Recommended: 4-8 weeks</small>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>How many hours per day do we want to spend on it?</label>
                <input
                  type="number"
                  style={styles.input}
                  value={scheduleForm.hoursPerDay}
                  onChange={(e) => setScheduleForm({...scheduleForm, hoursPerDay: parseFloat(e.target.value)})}
                  min="0.5"
                  max="8"
                  step="0.5"
                />
                <small style={styles.inputHelp}>Recommended: 1-3 hours per day</small>
              </div>

              <div style={styles.modalActions}>
                <button 
                  style={styles.cancelButton}
                  onClick={() => setShowSchedulePopup(false)}
                >
                  Cancel
                </button>
                <button 
                  style={styles.scheduleCreateButton}
                  onClick={generateStudySchedule}
                  disabled={isGeneratingPlan}
                >
                  {isGeneratingPlan ? '⏳ Generating...' : 'Generate AI Schedule'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </section>
    </>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
    backgroundColor: "var(--bg-secondary)",
    borderRadius: "1.5rem",
    padding: "2.5rem",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)",
    boxSizing: "border-box",
    minHeight: "85vh",
    color: "var(--text-primary)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  topContent: {
    width: "100%",
    marginBottom: "2rem",
  },
  mainContent: {
    display: "flex",
    gap: "1rem",
    minHeight: "60vh",
    alignItems: "flex-start",
  },
  leftContent: {
    flex: "3.5",
    minWidth: 0,
  },
  sidePanel: {
    width: "320px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "1.5rem",
    padding: "1.25rem",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)",
    height: "fit-content",
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    flex: "0 0 320px",
  },
  sidePanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  dateInfo: {
    flex: 1,
  },
  sessionCount: {
    textAlign: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: "0.75rem",
    padding: "0.75rem",
    border: "1px solid rgba(59, 130, 246, 0.2)",
  },
  sessionCountNumber: {
    display: "block",
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#3B82F6",
    lineHeight: 1,
  },
  sessionCountLabel: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    fontWeight: 500,
    marginTop: "0.25rem",
  },
  dateSubtitle: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    margin: "0.25rem 0 0 0",
    fontWeight: 400,
  },
  emptyStateIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
    opacity: 0.6,
  },
  emptyStateText: {
    fontSize: "1rem",
    color: "var(--text-secondary)",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    margin: 0,
    background: "linear-gradient(135deg, var(--text-primary) 0%, #0078C8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    transition: "color 0.3s ease",
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "var(--text-secondary)",
    margin: "0.5rem 0 0 0",
    fontWeight: 400,
    transition: "color 0.3s ease",
  },
  headerActions: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.75rem",
    padding: "0.75rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 6px rgba(59, 130, 246, 0.3)",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  scheduleButton: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.75rem",
    padding: "0.75rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 6px rgba(59, 130, 246, 0.3)",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  secondaryButton: {
    backgroundColor: "#10B981",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.75rem",
    padding: "0.75rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 6px rgba(16, 185, 129, 0.3)",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  adaptiveButton: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.75rem",
    padding: "0.75rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 6px rgba(59, 130, 246, 0.3)",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  streakContainer: {
    marginBottom: "2rem",
    display: "flex",
    justifyContent: "center",
  },
  streakCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "1.25rem",
    padding: "2rem",
    display: "flex",
    alignItems: "center",
    gap: "2rem",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    maxWidth: "600px",
    width: "100%",
    backdropFilter: "blur(10px)",
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
  },
  streakIcon: {
    fontSize: "3rem",
    animation: "streakPulse 2s ease-in-out infinite",
    filter: "drop-shadow(0 0 10px rgba(255, 69, 0, 0.5))",
    background: "linear-gradient(45deg, #FF6B35, #F7931E)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  streakInfo: {
    flex: 1,
    textAlign: "center",
  },
  streakNumber: {
    fontSize: "3rem",
    fontWeight: 900,
    background: "linear-gradient(135deg, #FF6B35, #F7931E, #FFD700)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    lineHeight: 1,
    filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
  },
  streakLabel: {
    fontSize: "1rem",
    color: "var(--text-secondary)",
    fontWeight: 600,
    marginTop: "0.25rem",
    transition: "color 0.3s ease",
  },
  streakSubtext: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    marginTop: "0.5rem",
    fontWeight: 400,
    transition: "color 0.3s ease",
  },
  streakStats: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  longestStreak: {
    textAlign: "center",
  },
  longestNumber: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    transition: "color 0.3s ease",
  },
  longestLabel: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    fontWeight: 500,
    marginTop: "0.25rem",
    transition: "color 0.3s ease",
  },
  courseSelectionContainer: {
    backgroundColor: "var(--bg-primary)",
    borderRadius: "1rem",
    padding: "1.5rem",
    marginBottom: "2rem",
    border: "1px solid var(--border-color)",
    transition: "all 0.3s ease",
  },
  courseSelectionTitle: {
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "1rem",
    transition: "color 0.3s ease",
  },
  selectedCoursesStatus: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  noCourseStatus: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  statusDot: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    backgroundColor: "#EF4444",
    flexShrink: 0,
    animation: "statusDotPulse 2s ease-in-out infinite",
    boxShadow: "0 0 8px rgba(239, 68, 68, 0.6), 0 0 16px rgba(239, 68, 68, 0.4), 0 0 24px rgba(239, 68, 68, 0.2)",
  },
  statusText: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    fontWeight: 500,
    transition: "color 0.3s ease",
  },
  calendarContainer: {
    backgroundColor: "var(--bg-primary)",
    borderRadius: "1rem",
    padding: "1.5rem",
    marginBottom: "1rem",
    boxShadow: "0 4px 12px var(--shadow-color)",
    border: "1px solid var(--border-color)",
    transition: "all 0.3s ease",
  },
  calendarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  navButton: {
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "0.5rem",
    padding: "0.5rem 1rem",
    fontSize: "1.2rem",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    color: "var(--text-primary)",
    fontWeight: 600,
  },
  monthTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    margin: 0,
    transition: "color 0.3s ease",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "0.75rem",
    padding: "1rem",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: "1rem",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  dayHeader: {
    padding: "0.75rem",
    textAlign: "center",
    fontWeight: 600,
    color: "var(--text-secondary)",
    fontSize: "0.9rem",
    transition: "color 0.3s ease",
  },
  emptyDay: {
    height: "100px",
  },
  calendarDay: {
    height: "120px",
    minWidth: "70px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "0.75rem",
    padding: "0.75rem",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    position: "relative",
    backdropFilter: "blur(5px)",
    overflow: "hidden",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
      borderColor: "rgba(59, 130, 246, 0.3)",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
    },
  },
  today: {
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    borderColor: "#F59E0B",
  },
  selectedDay: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderColor: "#3B82F6",
  },
  examDay: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#EF4444",
  },
  selectedExamDay: {
    backgroundColor: "rgba(251, 191, 36, 0.2)",
    borderColor: "#F59E0B",
    borderWidth: "2px",
  },
  dayNumber: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    transition: "color 0.3s ease",
  },
  examBadge: {
    fontSize: "0.7rem",
    color: "#DC2626",
    fontWeight: 600,
    marginTop: "0.25rem",
  },
  selectedExamBadge: {
    fontSize: "0.7rem",
    color: "#D97706",
    fontWeight: 600,
    marginTop: "0.25rem",
  },
  sessionIndicators: {
    position: "absolute",
    bottom: "0.25rem",
    left: "0.25rem",
    right: "0.25rem",
    display: "flex",
    gap: "0.125rem",
    flexWrap: "wrap",
  },
  sessionBar: {
    height: "4px",
    borderRadius: "2px",
    flex: 1,
    marginBottom: "2px",
  },
  moreIndicator: {
    fontSize: "0.6rem",
    color: "var(--text-secondary)",
    fontWeight: 600,
    transition: "color 0.3s ease",
  },
  dateDetails: {
    backgroundColor: "var(--bg-primary)",
    borderRadius: "1rem",
    padding: "1.5rem",
    border: "1px solid var(--border-color)",
    transition: "all 0.3s ease",
  },
  dateTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "1rem",
    transition: "color 0.3s ease",
  },
  sessionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  sessionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "1rem",
    padding: "1.25rem",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(10px)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.2)",
      borderColor: "rgba(59, 130, 246, 0.3)",
    },
  },
  sessionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "0.5rem",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "0.25rem",
    transition: "color 0.3s ease",
  },
  sessionMeta: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  sessionType: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    color: "#3B82F6",
    padding: "0.25rem 0.5rem",
    borderRadius: "0.375rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  sessionDuration: {
    color: "var(--text-secondary)",
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "color 0.3s ease",
  },
  aiBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    color: "#10B981",
    padding: "0.25rem 0.5rem",
    borderRadius: "0.375rem",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  adaptiveBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    color: "#3B82F6",
    padding: "0.25rem 0.5rem",
    borderRadius: "0.375rem",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  sessionNotes: {
    color: "var(--text-secondary)",
    fontSize: "0.875rem",
    lineHeight: 1.5,
    margin: 0,
    transition: "color 0.3s ease",
  },
  sessionFocus: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "0.5rem",
  },
  focusLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    transition: "color 0.3s ease",
  },
  focusText: {
    fontSize: "0.8rem",
    color: "var(--text-primary)",
    fontWeight: 500,
    transition: "color 0.3s ease",
  },
  sessionDifficulty: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "0.25rem",
  },
  difficultyLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    transition: "color 0.3s ease",
  },
  difficultyBadge: {
    padding: "0.2rem 0.5rem",
    borderRadius: "0.375rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "capitalize",
  },
  sessionPriority: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "0.25rem",
  },
  priorityLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    transition: "color 0.3s ease",
  },
  priorityBadge: {
    padding: "0.2rem 0.5rem",
    borderRadius: "0.375rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "capitalize",
  },
  deleteButton: {
    backgroundColor: "transparent",
    border: "none",
    color: "#EF4444",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "0.25rem",
    borderRadius: "0.25rem",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2rem",
    height: "2rem",
  },
  emptyState: {
    textAlign: "center",
    padding: "2rem",
    color: "var(--text-secondary)",
    transition: "color 0.3s ease",
  },
  addSessionButton: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.75rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "1rem",
    transition: "all 0.3s ease",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "var(--bg-secondary)",
    borderRadius: "1rem",
    padding: "2rem",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
    border: "1px solid var(--border-color)",
    transition: "all 0.3s ease",
  },
  modalTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "1.5rem",
    transition: "color 0.3s ease",
  },
  modalSubtitle: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
    marginBottom: "1.5rem",
    transition: "color 0.3s ease",
  },
  formGroup: {
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "0.5rem",
    transition: "color 0.3s ease",
  },
  select: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid var(--border-color)",
    borderRadius: "0.5rem",
    fontSize: "0.9rem",
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-primary)",
    transition: "all 0.3s ease",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid var(--border-color)",
    borderRadius: "0.5rem",
    fontSize: "0.9rem",
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-primary)",
    transition: "all 0.3s ease",
  },
  textarea: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid var(--border-color)",
    borderRadius: "0.5rem",
    fontSize: "0.9rem",
    resize: "vertical",
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-primary)",
    transition: "all 0.3s ease",
  },
  inputHelp: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    marginTop: "0.25rem",
    display: "block",
    transition: "color 0.3s ease",
  },
  modalActions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
    marginTop: "1.5rem",
  },
  cancelButton: {
    backgroundColor: "var(--bg-secondary)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "0.5rem",
    padding: "0.75rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.75rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  scheduleCreateButton: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.75rem 1.5rem",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 6px rgba(59, 130, 246, 0.3)",
  },
};