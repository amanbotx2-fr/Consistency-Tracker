const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const entryRoutes = require('./routes/entries');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic security and middleware
app.use(helmet());
app.use(cors());

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // max 100 requests per IP
});
app.use(limiter);

// Parse JSON and form data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/users', userRoutes);

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Catch all other routes
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Visit: http://localhost:${PORT}`);
    });
})
.catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

module.exports = app; 