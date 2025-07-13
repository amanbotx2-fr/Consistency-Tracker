const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    activity: {
        type: String,
        required: [true, 'Activity is required'],
        enum: ['coding', 'learning', 'project', 'practice', 'reading', 'tutorial', 'debugging', 'research'],
        default: 'coding'
    },
    hours: {
        type: Number,
        required: [true, 'Hours is required'],
        min: [0, 'Hours cannot be negative'],
        max: [24, 'Hours cannot exceed 24']
    },
    minutes: {
        type: Number,
        default: 0,
        min: [0, 'Minutes cannot be negative'],
        max: [59, 'Minutes cannot exceed 59']
    },
    totalTime: {
        type: Number,
        required: true
    },
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        trim: true
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    mood: {
        type: String,
        enum: ['excellent', 'good', 'neutral', 'challenging', 'frustrating'],
        default: 'neutral'
    },
    productivity: {
        type: Number,
        min: [1, 'Productivity must be at least 1'],
        max: [10, 'Productivity cannot exceed 10'],
        default: 5
    },
    isCompleted: {
        type: Boolean,
        default: true
    },
    location: {
        type: String,
        trim: true,
        maxlength: [100, 'Location cannot exceed 100 characters']
    },
    project: {
        type: String,
        trim: true,
        maxlength: [100, 'Project name cannot exceed 100 characters']
    }
}, {
    timestamps: true
});

entrySchema.index({ user: 1, date: -1 });
entrySchema.index({ user: 1, activity: 1 });
entrySchema.index({ date: -1 });
entrySchema.index({ user: 1, 'date': { $gte: new Date() } });

entrySchema.pre('save', function(next) {
    this.totalTime = this.hours + (this.minutes / 60);
    next();
});

entrySchema.virtual('formattedTime').get(function() {
    const hours = Math.floor(this.totalTime);
    const minutes = Math.round((this.totalTime - hours) * 60);
    return `${hours}h ${minutes}m`;
});

entrySchema.virtual('activityDisplay').get(function() {
    const activityNames = {
        'coding': 'Coding',
        'learning': 'Learning',
        'project': 'Project Work',
        'practice': 'Practice/Exercise',
        'reading': 'Reading',
        'tutorial': 'Tutorial/Course',
        'debugging': 'Debugging',
        'research': 'Research'
    };
    return activityNames[this.activity] || this.activity;
});

entrySchema.methods.getSummary = function() {
    return {
        id: this._id,
        date: this.date,
        activity: this.activity,
        activityDisplay: this.activityDisplay,
        totalTime: this.totalTime,
        formattedTime: this.formattedTime,
        notes: this.notes,
        tags: this.tags,
        mood: this.mood,
        productivity: this.productivity,
        project: this.project,
        createdAt: this.createdAt
    };
};

entrySchema.statics.getUserStats = async function(userId) {
    const stats = await this.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalEntries: { $sum: 1 },
                totalHours: { $sum: '$totalTime' },
                uniqueDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
                activities: { $addToSet: '$activity' }
            }
        }
    ]);

    if (stats.length === 0) {
        return {
            totalEntries: 0,
            totalHours: 0,
            uniqueDays: 0,
            activities: []
        };
    }

    return {
        totalEntries: stats[0].totalEntries,
        totalHours: stats[0].totalHours,
        uniqueDays: stats[0].uniqueDays.length,
        activities: stats[0].activities
    };
};

entrySchema.statics.getDailySummary = async function(userId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await this.find({
        user: userId,
        date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 });

    const totalHours = entries.reduce((sum, entry) => sum + entry.totalTime, 0);
    const activities = [...new Set(entries.map(e => e.activity))];

    return {
        date: date,
        entries: entries.map(e => e.getSummary()),
        totalHours: totalHours,
        totalEntries: entries.length,
        activities: activities
    };
};

entrySchema.set('toJSON', { virtuals: true });
entrySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Entry', entrySchema); 