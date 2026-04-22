#!/bin/bash

# SHiESTY🔻RAiDERS Local Startup Script
# This script will install dependencies and start the server on your MacBook.

echo "🚀 Initializing SHiESTY🔻RAiDERS Local Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install it from https://nodejs.org/"
    exit
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️ .env file not found. Creating a template..."
    echo "ARCTRACKER_APP_KEY=your_app_key" > .env
    echo "ARCTRACKER_USER_KEY=your_user_key" >> .env
    echo "DISCORD_BOT_TOKEN=your_bot_token" >> .env
    echo "DISCORD_CHANNEL_ID=your_channel_id" >> .env
    echo "SESSION_SECRET=secret" >> .env
    echo "Please edit the .env file with your actual keys before running again."
    exit
fi

# Start the server
echo "⚡ Starting SHiESTY🔻RAiDERS..."
npm run dev
