const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    profile: {
        firstName: {
            type: String,
            trim: true,
            maxlength: [50, 'First name cannot exceed 50 characters']
        },
        lastName: {
            type: String,
            trim: true,
            maxlength: [50, 'Last name cannot exceed 50 characters']
        },
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters']
        },
        timezone: {
            type: String,
            default: 'UTC'
        }
    },
    preferences: {
        defaultActivity: {
            type: String,
            enum: ['coding', 'learning', 'project', 'practice', 'reading', 'tutorial', 'debugging', 'research'],
            default: 'coding'
        },
        goalHoursPerDay: {
            type: Number,
            default: 2,
            min: [0, 'Goal hours cannot be negative']
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            browser: {
                type: Boolean,
                default: true
            }
        }
    },
    stats: {
        totalDays: {
            type: Number,
            default: 0
        },
        totalHours: {
            type: Number,
            default: 0
        },
        currentStreak: {
            type: Number,
            default: 0
        },
        longestStreak: {
            type: Number,
            default: 0
        },
        lastActivityDate: {
            type: Date
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'stats.lastActivityDate': -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

// Method to update stats
userSchema.methods.updateStats = function(entries) {
    if (!entries || entries.length === 0) {
        this.stats.totalDays = 0;
        this.stats.totalHours = 0;
        this.stats.currentStreak = 0;
        this.stats.lastActivityDate = null;
        return;
    }

    const uniqueDates = [...new Set(entries.map(e => e.date))];
    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    
    this.stats.totalDays = uniqueDates.length;
    this.stats.totalHours = totalHours;
    this.stats.lastActivityDate = new Date(Math.max(...entries.map(e => new Date(e.date))));
    
    // Calculate current streak
    const sortedDates = uniqueDates.sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
    
    this.stats.currentStreak = streak;
    if (streak > this.stats.longestStreak) {
        this.stats.longestStreak = streak;
    }
};

module.exports = mongoose.model('User', userSchema); 