# Consistency Tracker

A productivity tracking app I built to help me stay consistent with my daily activities. Built with Node.js, Express, and MongoDB. Track your activities, see your progress, and build better habits.

## Features

- **User authentication** - Register, login, manage your profile
- **Activity tracking** - Log what you do, how long, and how you felt
- **Progress visualization** - See your stats, streaks, and trends
- **Achievement system** - Unlock badges as you build consistency
- **Responsive design** - Works on desktop and mobile

## Tech Stack

**Backend:** Node.js, Express, MongoDB, Mongoose
**Frontend:** Vanilla JS, HTML5, CSS3
**Auth:** JWT, bcryptjs
**Security:** Helmet, CORS, rate limiting

## Quick Start

1. **Clone and install**
   ```bash
   git clone https://github.com/amanbotx2-fr/Consistency-Tracker.git
   cd Consistency-Tracker
   yarn install
   ```

2. **Set up environment**
   ```bash
   cp config.env.example config.env
   # Edit config.env with your settings
   ```

3. **Start MongoDB** (local or Atlas)

4. **Run the app**
   ```bash
   yarn dev
   ```

5. **Visit** `http://localhost:3000`

## 📁 Project Structure

```
consistency-tracker/
├── public/                 # Frontend static files
│   ├── index.html         # Main application page
│   ├── style.css          # Styles and responsive design
│   └── script.js          # Frontend JavaScript logic
├── models/                # Database models
│   ├── User.js           # User model with authentication
│   └── Entry.js          # Activity entry model
├── routes/               # API routes
│   ├── auth.js          # Authentication routes
│   ├── entries.js       # Entry CRUD operations
│   └── users.js         # User management routes
├── middleware/           # Custom middleware
│   └── auth.js          # JWT authentication middleware
├── server.js            # Main server file
├── package.json         # Dependencies and scripts
├── config.env           # Environment variables
└── README.md           # Project documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/preferences` - Update user preferences
- `PUT /api/auth/password` - Change password

### Entries
- `GET /api/entries` - Get user entries (with pagination and filters)
- `POST /api/entries` - Create new entry
- `GET /api/entries/:id` - Get specific entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry
- `GET /api/entries/stats/summary` - Get user statistics
- `GET /api/entries/daily/:date` - Get daily summary

### Users
- `GET /api/users/profile` - Get user profile
- `GET /api/users/stats` - Get detailed statistics
- `GET /api/users/timeline` - Get activity timeline
- `GET /api/users/achievements` - Get user achievements

## 🎯 Usage Guide

### Getting Started
1. **Register an account** with your email and password
2. **Log in** to access your dashboard
3. **Set your preferences** in the Profile section
4. **Start logging activities** in the Log Entry section

### Tracking Activities
- Select the activity type (coding, learning, project work, etc.)
- Enter the time spent (hours and minutes)
- Add optional details like notes, mood, productivity rating
- Include project name and location if relevant
- Add tags for better organization

### Viewing Progress
- **Dashboard**: Overview of your statistics and recent activity
- **History**: Detailed view of all your entries with filtering options
- **Analytics**: Charts and insights about your productivity patterns
- **Achievements**: Unlock badges as you reach milestones
- **Calendar**: Visual representation of your activity over time

## 🔒 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Configured for secure cross-origin requests
- **Helmet Security**: Additional security headers

## 📊 Database Schema

### User Model
- Basic info (username, email, password)
- Profile data (firstName, lastName, bio, timezone)
- Preferences (defaultActivity, goalHoursPerDay, notifications)
- Statistics (totalDays, totalHours, currentStreak, longestStreak)

### Entry Model
- Activity details (date, activity type, hours, minutes)
- Additional info (notes, tags, mood, productivity)
- Metadata (project, location, isCompleted)
- Virtual fields for formatted time and display names

## 🚀 Deployment

### Local Development
```bash
yarn dev
```

### Production Deployment
1. Set `NODE_ENV=production` in config.env
2. Use a strong JWT_SECRET
3. Configure MongoDB Atlas or production database
4. Set up environment variables on your hosting platform
5. Deploy to your preferred hosting service (Heroku, Vercel, etc.)

### Environment Variables for Production
```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/consistency-tracker
JWT_SECRET=your-very-long-and-secure-jwt-secret-key
NODE_ENV=production
```

## Contributing

Feel free to open issues or submit PRs if you have ideas for improvements!

## License

MIT License - feel free to use this code for your own projects.

## About

I built this to track my daily activities and build better habits. Hope it helps you too!

## 📞 Support

If you encounter any issues or have questions:
1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Contact the maintainers

---

**Happy Tracking! 🎯** 