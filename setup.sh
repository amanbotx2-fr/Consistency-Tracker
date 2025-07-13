#!/bin/bash

echo "🚀 Consistency Tracker - Setup Script"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "You can install it from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available. Please install npm."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies. Please check your internet connection and try again."
    exit 1
fi

# Check if MongoDB is running (optional)
echo "🔍 Checking MongoDB connection..."
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. You may need to start it manually:"
        echo "   sudo systemctl start mongod"
        echo "   or"
        echo "   mongod"
    fi
else
    echo "⚠️  MongoDB is not installed. You can:"
    echo "   1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/"
    echo "   2. Use MongoDB Atlas (cloud): https://www.mongodb.com/atlas"
    echo "   3. Update the MONGODB_URI in config.env"
fi

echo ""
echo "🎉 Setup complete! To start the application:"
echo "   npm run dev"
echo ""
echo "📖 For more information, see README.md" 