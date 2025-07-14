const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Entry = require('../models/Entry');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all entries for current user
router.get('/', auth, [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('activity')
        .optional()
        .isIn(['coding', 'learning', 'project', 'practice', 'reading', 'tutorial', 'debugging', 'research'])
        .withMessage('Invalid activity type'),
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

        const { page = 1, limit = 20, activity, startDate, endDate } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = { user: req.user._id };
        
        if (activity) {
            query.activity = activity;
        }
        
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Get entries with pagination
        const entries = await Entry.find(query)
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const total = await Entry.countDocuments(query);

        // Get user stats
        const stats = await Entry.getUserStats(req.user._id);

        res.json({
            success: true,
            data: {
                entries: entries.map(entry => entry.getSummary()),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                },
                stats
            }
        });
    } catch (error) {
        console.error('Get entries error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get entries',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get entry by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const entry = await Entry.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Entry not found'
            });
        }

        res.json({
            success: true,
            data: {
                entry: entry.getSummary()
            }
        });
    } catch (error) {
        console.error('Get entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get entry',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Create new entry
router.post('/', auth, [
    body('date')
        .isISO8601()
        .withMessage('Date must be a valid date'),
    body('activity')
        .isIn(['coding', 'learning', 'project', 'practice', 'reading', 'tutorial', 'debugging', 'research'])
        .withMessage('Invalid activity type'),
    body('hours')
        .isFloat({ min: 0, max: 24 })
        .withMessage('Hours must be between 0 and 24'),
    body('minutes')
        .optional()
        .isInt({ min: 0, max: 59 })
        .withMessage('Minutes must be between 0 and 59'),
    body('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Notes cannot exceed 1000 characters'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    body('mood')
        .optional()
        .isIn(['excellent', 'good', 'neutral', 'challenging', 'frustrating'])
        .withMessage('Invalid mood value'),
    body('productivity')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Productivity must be between 1 and 10'),
    body('project')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Project name cannot exceed 100 characters'),
    body('location')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Location cannot exceed 100 characters')
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

        const {
            date,
            activity,
            hours,
            minutes = 0,
            notes,
            tags = [],
            mood = 'neutral',
            productivity = 5,
            project,
            location
        } = req.body;

        req.body.totalTime = (parseFloat(hours) || 0) + ((parseFloat(minutes) || 0) / 60);

        // Create new entry
        const entry = new Entry({
            user: req.user._id,
            date,
            activity,
            hours,
            minutes,
            notes,
            tags,
            mood,
            productivity,
            project,
            location,
            totalTime: req.body.totalTime
        });

        await entry.save();

        // Update user stats
        const userEntries = await Entry.find({ user: req.user._id });
        req.user.updateStats(userEntries);
        await req.user.save();

        res.status(201).json({
            success: true,
            message: 'Entry created successfully',
            data: {
                entry: entry.getSummary()
            }
        });
    } catch (error) {
        console.error('Create entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create entry',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update entry
router.put('/:id', auth, [
    body('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be a valid date'),
    body('activity')
        .optional()
        .isIn(['coding', 'learning', 'project', 'practice', 'reading', 'tutorial', 'debugging', 'research'])
        .withMessage('Invalid activity type'),
    body('hours')
        .optional()
        .isFloat({ min: 0, max: 24 })
        .withMessage('Hours must be between 0 and 24'),
    body('minutes')
        .optional()
        .isInt({ min: 0, max: 59 })
        .withMessage('Minutes must be between 0 and 59'),
    body('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Notes cannot exceed 1000 characters'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    body('mood')
        .optional()
        .isIn(['excellent', 'good', 'neutral', 'challenging', 'frustrating'])
        .withMessage('Invalid mood value'),
    body('productivity')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Productivity must be between 1 and 10'),
    body('project')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Project name cannot exceed 100 characters'),
    body('location')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Location cannot exceed 100 characters')
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

        const entry = await Entry.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Entry not found'
            });
        }

        // Update fields
        const updateFields = ['date', 'activity', 'hours', 'minutes', 'notes', 'tags', 'mood', 'productivity', 'project', 'location'];
        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                entry[field] = req.body[field];
            }
        });

        await entry.save();

        // Update user stats
        const userEntries = await Entry.find({ user: req.user._id });
        req.user.updateStats(userEntries);
        await req.user.save();

        res.json({
            success: true,
            message: 'Entry updated successfully',
            data: {
                entry: entry.getSummary()
            }
        });
    } catch (error) {
        console.error('Update entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update entry',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete entry
router.delete('/:id', auth, async (req, res) => {
    try {
        const entry = await Entry.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Entry not found'
            });
        }

        // Update user stats
        const userEntries = await Entry.find({ user: req.user._id });
        req.user.updateStats(userEntries);
        await req.user.save();

        res.json({
            success: true,
            message: 'Entry deleted successfully'
        });
    } catch (error) {
        console.error('Delete entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete entry',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get daily summary
router.get('/daily/:date', auth, async (req, res) => {
    try {
        const { date } = req.params;
        
        if (!Date.parse(date)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        const summary = await Entry.getDailySummary(req.user._id, new Date(date));

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get daily summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get daily summary',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get user stats
router.get('/stats/summary', auth, async (req, res) => {
    try {
        const stats = await Entry.getUserStats(req.user._id);
        
        // Get recent entries for streak calculation
        const recentEntries = await Entry.find({ user: req.user._id })
            .sort({ date: -1 })
            .limit(30);

        // Calculate streak
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const uniqueDates = [...new Set(recentEntries.map(e => e.date.toISOString().split('T')[0]))];
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

        res.json({
            success: true,
            data: {
                ...stats,
                currentStreak: streak,
                user: req.user.getPublicProfile()
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stats',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 