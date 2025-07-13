const express = require('express');
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const Entry = require('../models/Entry');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user.getPublicProfile()
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get user statistics
router.get('/stats', auth, [
    query('period')
        .optional()
        .isIn(['week', 'month', 'year', 'all'])
        .withMessage('Period must be week, month, year, or all'),
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { period, startDate, endDate } = req.query;
        
        // Build date filter
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.date = {};
            if (startDate) dateFilter.date.$gte = new Date(startDate);
            if (endDate) dateFilter.date.$lte = new Date(endDate);
        } else if (period) {
            const now = new Date();
            let start;
            
            switch (period) {
                case 'week':
                    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    start = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    // 'all' - no date filter
                    break;
            }
            
            if (start) {
                dateFilter.date = { $gte: start };
            }
        }

        // Get entries for the user with date filter
        const query = { user: req.user._id, ...dateFilter };
        const entries = await Entry.find(query).sort({ date: -1 });

        // Calculate statistics
        const stats = {
            totalEntries: entries.length,
            totalHours: entries.reduce((sum, e) => sum + e.totalTime, 0),
            uniqueDays: new Set(entries.map(e => e.date.toISOString().split('T')[0])).size,
            activities: [...new Set(entries.map(e => e.activity))],
            averageHoursPerDay: 0,
            averageProductivity: 0,
            moodDistribution: {},
            activityDistribution: {}
        };

        if (stats.uniqueDays > 0) {
            stats.averageHoursPerDay = stats.totalHours / stats.uniqueDays;
        }

        if (entries.length > 0) {
            const productivityEntries = entries.filter(e => e.productivity);
            if (productivityEntries.length > 0) {
                stats.averageProductivity = productivityEntries.reduce((sum, e) => sum + e.productivity, 0) / productivityEntries.length;
            }

            // Calculate mood distribution
            entries.forEach(entry => {
                if (entry.mood) {
                    stats.moodDistribution[entry.mood] = (stats.moodDistribution[entry.mood] || 0) + 1;
                }
            });

            // Calculate activity distribution
            entries.forEach(entry => {
                stats.activityDistribution[entry.activity] = (stats.activityDistribution[entry.activity] || 0) + 1;
            });
        }

        // Calculate streak
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const uniqueDates = [...new Set(entries.map(e => e.date.toISOString().split('T')[0]))];
        const sortedDates = uniqueDates.sort((a, b) => new Date(b) - new Date(a));
        
        for (let i = 0; i < sortedDates.length; i++) {
            const entryDate = new Date(sortedDates[i]);
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);
            
            if (entryDate.getTime() === expectedDate.getTime()) {
                streak++;
            } else {
                break;
            }
        }

        stats.currentStreak = streak;

        res.json({
            success: true,
            data: {
                stats,
                user: req.user.getPublicProfile()
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get user activity timeline
router.get('/timeline', auth, [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const limit = parseInt(req.query.limit) || 30;
        
        const entries = await Entry.find({ user: req.user._id })
            .sort({ date: -1, createdAt: -1 })
            .limit(limit);

        // Group entries by date
        const timeline = {};
        entries.forEach(entry => {
            const dateKey = entry.date.toISOString().split('T')[0];
            if (!timeline[dateKey]) {
                timeline[dateKey] = {
                    date: entry.date,
                    entries: [],
                    totalHours: 0,
                    activities: []
                };
            }
            
            timeline[dateKey].entries.push(entry.getSummary());
            timeline[dateKey].totalHours += entry.totalTime;
            if (!timeline[dateKey].activities.includes(entry.activity)) {
                timeline[dateKey].activities.push(entry.activity);
            }
        });

        // Convert to array and sort by date
        const timelineArray = Object.values(timeline).sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            data: {
                timeline: timelineArray,
                totalEntries: entries.length
            }
        });
    } catch (error) {
        console.error('Get timeline error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get timeline',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get user achievements
router.get('/achievements', auth, async (req, res) => {
    try {
        const entries = await Entry.find({ user: req.user._id });
        const stats = await Entry.getUserStats(req.user._id);
        
        const achievements = [];
        
        // Calculate achievements based on various metrics
        if (stats.totalEntries >= 1) {
            achievements.push({
                id: 'first_entry',
                title: 'First Step',
                description: 'Logged your first activity',
                icon: '🎯',
                unlocked: true,
                unlockedAt: entries[0]?.createdAt
            });
        }
        
        if (stats.totalHours >= 10) {
            achievements.push({
                id: 'ten_hours',
                title: 'Dedicated Learner',
                description: 'Reached 10 total hours',
                icon: '⏰',
                unlocked: true,
                unlockedAt: entries.find(e => e.totalTime >= 10)?.createdAt
            });
        }
        
        if (stats.totalHours >= 100) {
            achievements.push({
                id: 'hundred_hours',
                title: 'Century Club',
                description: 'Reached 100 total hours',
                icon: '🏆',
                unlocked: true,
                unlockedAt: entries.find(e => e.totalTime >= 100)?.createdAt
            });
        }
        
        if (stats.uniqueDays >= 7) {
            achievements.push({
                id: 'week_streak',
                title: 'Week Warrior',
                description: 'Active for 7 different days',
                icon: '📅',
                unlocked: true,
                unlockedAt: entries.find(e => e.date >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))?.createdAt
            });
        }
        
        if (stats.uniqueDays >= 30) {
            achievements.push({
                id: 'month_streak',
                title: 'Monthly Master',
                description: 'Active for 30 different days',
                icon: '📊',
                unlocked: true,
                unlockedAt: entries.find(e => e.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))?.createdAt
            });
        }
        
        // Add streak achievements
        const uniqueDates = [...new Set(entries.map(e => e.date.toISOString().split('T')[0]))];
        const sortedDates = uniqueDates.sort((a, b) => new Date(b) - new Date(a));
        
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < sortedDates.length; i++) {
            const entryDate = new Date(sortedDates[i]);
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);
            
            if (entryDate.getTime() === expectedDate.getTime()) {
                currentStreak++;
            } else {
                break;
            }
        }
        
        if (currentStreak >= 3) {
            achievements.push({
                id: 'three_day_streak',
                title: 'Getting Started',
                description: '3-day streak',
                icon: '🔥',
                unlocked: true,
                unlockedAt: entries.find(e => e.date >= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))?.createdAt
            });
        }
        
        if (currentStreak >= 7) {
            achievements.push({
                id: 'week_streak',
                title: 'Week Warrior',
                description: '7-day streak',
                icon: '🔥🔥',
                unlocked: true,
                unlockedAt: entries.find(e => e.date >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))?.createdAt
            });
        }
        
        if (currentStreak >= 30) {
            achievements.push({
                id: 'month_streak',
                title: 'Consistency King',
                description: '30-day streak',
                icon: '🔥🔥🔥',
                unlocked: true,
                unlockedAt: entries.find(e => e.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))?.createdAt
            });
        }

        res.json({
            success: true,
            data: {
                achievements,
                totalAchievements: achievements.length,
                currentStreak
            }
        });
    } catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get achievements',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 