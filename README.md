# Consistency Tracker

## 🚧 Project Status: Under Development
This project is currently under active development and is not yet live for public use.

**🧪 If you want to test this project, please use the demo server only!**

A habit and productivity tracker web app, built with Node.js, Express, and MongoDB. Track your activities, see your progress, and build better habits.

---

## Features
- User registration and login (JWT-based)
- Add, edit, delete daily entries
- View dashboard, stats, and timeline
- Express.js backend with MongoDB
- Static frontend (public directory)

---

## Project Structure
```
/ (root)
  /routes          # Express API routes (auth, entries, users)
  /models          # Mongoose models (User.js, Entry.js)
  /middleware      # Custom middleware (auth.js)
  /public          # Static frontend files (index.html, script.js, style.css)
  server.js        # Main Express server
  demo-server.js   # Local development/demo server (use this to test!)
  README.md
  package.json
```

---

## Getting Started (Test Locally with Demo Server)

> **Important:** Always use `demo-server.js` to run and test the project locally. Do not run `server.js` directly.

1. **Clone the repo:**
   ```bash
   git clone <repo-url>
   cd Consistency-tracker
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Create a `.env` file:**
   ```env
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   ```
4. **Run the demo server:**
   ```bash
   node demo-server.js
   ```
   Or:
   ```bash
   npm start
   ```
5. **Visit:** `http://localhost:3000`

---

## MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free cluster.
2. Add a database user and password.
3. Whitelist your IP (or use `0.0.0.0/0` for development).
4. Copy your connection string and use it as `MONGODB_URI`.

---

## API Endpoints
- `POST   /api/auth/register`   - Register a new user
- `POST   /api/auth/login`      - Login
- `GET    /api/auth/me`         - Get current user profile
- `GET    /api/entries`         - List entries
- `POST   /api/entries`         - Create entry
- `PUT    /api/entries/:id`     - Update entry
- `DELETE /api/entries/:id`     - Delete entry
- `GET    /api/users/profile`   - Get user profile
- `GET    /api/users/stats`     - Get user stats
- `GET    /api/users/timeline`  - Get user timeline

---

## Development Notes
- This project is actively being developed and improved
- Features may be added, modified, or removed during development
- The codebase is being optimized for both local development and future deployment

---

## Troubleshooting
- **500 Error / Registration fails:** Check your MongoDB URI and JWT secret in `.env`
- **Cannot connect to MongoDB:** Check your Atlas cluster, user, password, and IP whitelist
- **Port already in use:** Change the port in `demo-server.js`

---

## License
MIT 