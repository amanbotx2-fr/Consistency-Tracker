const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Demo data
let users = [
    {
        id: 1,
        username: 'demo',
        email: 'demo@example.com',
        profile: { firstName: 'Demo', lastName: 'User' },
        preferences: { goalHoursPerDay: 2 }
    }
];

let entries = [
    {
        id: 1,
        userId: 1,
        date: '2024-01-15',
        activity: 'coding',
        activityDisplay: 'Coding',
        totalTime: 3.5,
        formattedTime: '3h 30m',
        notes: 'Worked on the consistency tracker project',
        mood: 'good',
        productivity: 8,
        project: 'Consistency Tracker',
        createdAt: new Date()
    },
    {
        id: 2,
        userId: 1,
        date: '2024-01-14',
        activity: 'learning',
        activityDisplay: 'Learning',
        totalTime: 2.0,
        formattedTime: '2h 0m',
        notes: 'Studied React and Node.js',
        mood: 'excellent',
        productivity: 9,
        project: 'Web Development',
        createdAt: new Date()
    }
];

// Demo API Routes
app.get('/api/auth/me', (req, res) => {
    res.json({
        success: true,
        data: { user: users[0] }
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'demo@example.com' && password === 'demo123') {
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: users[0],
                token: 'demo-token'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

app.post('/api/auth/register', (req, res) => {
    res.json({
        success: true,
        message: 'Registration successful (demo mode)',
        data: {
            user: users[0],
            token: 'demo-token'
        }
    });
});

app.get('/api/entries', (req, res) => {
    const userEntries = entries.filter(entry => entry.userId === 1);
    res.json({
        success: true,
        data: {
            entries: userEntries,
            pagination: {
                page: 1,
                limit: 10,
                total: userEntries.length,
                pages: 1
            },
            stats: {
                totalEntries: userEntries.length,
                totalHours: userEntries.reduce((sum, e) => sum + e.totalTime, 0),
                uniqueDays: new Set(userEntries.map(e => e.date)).size,
                activities: [...new Set(userEntries.map(e => e.activity))]
            }
        }
    });
});

app.post('/api/entries', (req, res) => {
    const { date, activity, hours = 0, minutes = 0, notes, project, mood = 'neutral', productivity = 5, location, tags = [] } = req.body;
    
    if (!date || !activity) {
        return res.status(400).json({
            success: false,
            message: 'Date and activity are required'
        });
    }
    
    const totalTime = hours + (minutes / 60);
    const newEntry = {
        id: entries.length + 1,
        userId: 1,
        date: date,
        activity: activity,
        activityDisplay: activity.charAt(0).toUpperCase() + activity.slice(1),
        totalTime: totalTime,
        formattedTime: `${Math.floor(totalTime)}h ${Math.round((totalTime - Math.floor(totalTime)) * 60)}m`,
        notes: notes || '',
        mood: mood,
        productivity: productivity,
        project: project || '',
        location: location || '',
        tags: Array.isArray(tags) ? tags : [],
        createdAt: new Date()
    };
    
    entries.push(newEntry);
    
    res.status(201).json({
        success: true,
        message: 'Entry added successfully',
        data: newEntry
    });
});

app.get('/api/entries/stats/summary', (req, res) => {
    const userEntries = entries.filter(entry => entry.userId === 1);
    const totalHours = userEntries.reduce((sum, e) => sum + e.totalTime, 0);
    const uniqueDays = new Set(userEntries.map(e => e.date)).size;
    
    res.json({
        success: true,
        data: {
            totalEntries: userEntries.length,
            totalHours: totalHours,
            uniqueDays: uniqueDays,
            currentStreak: 2,
            averageHoursPerDay: uniqueDays > 0 ? totalHours / uniqueDays : 0,
            averageProductivity: 8.5,
            activityDistribution: {
                coding: 1,
                learning: 1
            },
            moodDistribution: {
                good: 1,
                excellent: 1
            }
        }
    });
});

app.get('/api/users/achievements', (req, res) => {
    res.json({
        success: true,
        data: {
            achievements: [
                {
                    id: 'first_entry',
                    title: 'First Step',
                    description: 'Logged your first activity',
                    icon: '🎯',
                    unlocked: true,
                    unlockedAt: new Date()
                },
                {
                    id: 'ten_hours',
                    title: 'Dedicated Learner',
                    description: 'Reached 10 total hours',
                    icon: '⏰',
                    unlocked: true,
                    unlockedAt: new Date()
                }
            ],
            totalAchievements: 2,
            currentStreak: 2
        }
    });
});

app.get('/api/users/stats', (req, res) => {
    const userEntries = entries.filter(entry => entry.userId === 1);
    const totalHours = userEntries.reduce((sum, e) => sum + e.totalTime, 0);
    const uniqueDays = new Set(userEntries.map(e => e.date)).size;
    
    res.json({
        success: true,
        data: {
            stats: {
                totalEntries: userEntries.length,
                totalHours: totalHours,
                uniqueDays: uniqueDays,
                currentStreak: 2,
                averageHoursPerDay: uniqueDays > 0 ? totalHours / uniqueDays : 0,
                averageProductivity: 8.5,
                activityDistribution: {
                    coding: 1,
                    learning: 1
                },
                moodDistribution: {
                    good: 1,
                    excellent: 1
                }
            },
            user: users[0]
        }
    });
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Demo server running on port ${PORT}`);
    console.log(`📱 Visit: http://localhost:${PORT}`);
    console.log(`🔐 Demo credentials: demo@example.com / demo123`);
    console.log(`📖 This is a demo version without MongoDB`);
});

module.exports = app; 