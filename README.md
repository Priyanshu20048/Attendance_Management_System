# Attendance App

A full-stack attendance management system built with Node.js, Express, MongoDB, Socket.IO, and EJS. It supports both admin and teacher roles, allowing staff to manage students, teachers, attendance records, and reports in a simple web dashboard.

## Features

- Admin dashboard with student and teacher management
- Teacher dashboard for marking attendance
- Attendance tracking by date and class
- Student and class-wise report generation
- Subject-based teacher assignments
- User authentication and role-based access control
- Profile management with image upload support
- Real-time online teacher status using Socket.IO
- Secure sessions and rate-limited login

## Latest Updates - September 13, 2026

- Disabled public admin and teacher signup from the public authentication flow.
- Kept teacher account creation under the admin dashboard.
- Updated the welcome page with Attendify branding, responsive SaaS-style sections, feature highlights, and a login-only call to action.
- Updated the login page to match the welcome page's branding, colors, responsive layout, and authorized-access messaging.
- Clearly labeled the landing-page dashboard numbers and charts as sample demo data rather than live attendance statistics.

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Redis (optional cache support)
- EJS templates
- Socket.IO
- bcrypt for password hashing
- dotenv for environment configuration

## Project Structure

```bash
attendance-app/
├── config/              # MongoDB and Redis configuration
├── controllers/         # Request handlers for admin and teacher actions
├── middleware/          # Authentication and authorization logic
├── models/              # Mongoose schemas
├── public/              # Static assets and uploaded images
├── routes/              # Route definitions
├── utils/               # Helper utilities
├── views/               # EJS templates
├── .env.example         # Environment sample
├── server.js            # App entry point
├── package.json         # Project config and scripts
├── docker-compose.yml   # Optional Docker setup
├── Dockerfile           # Container configuration
└── README.md            # Project documentation
```

## Prerequisites

Before running the app, make sure you have:

- Node.js 18 or later
- MongoDB running locally or a MongoDB Atlas connection
- Redis (optional but recommended)
- npm

## Installation

1. Clone the repository:

```bash
git clone <your-repository-url>
cd attendance-app
```

2. Install dependencies:

```bash
npm install
```

3. Create your environment file:

```bash
copy .env.example .env
```

Then update the values in `.env` with your own settings.

## Environment Variables

Example configuration:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/attendanceDB?retryWrites=true&w=majority
REDIS_URL=redis://127.0.0.1:6379
REDIS_ENABLED=true
SESSION_SECRET=your-long-random-session-secret
ADMIN_PASSWORD=your-admin-password
TEACHER_PASSWORD=your-teacher-password
PORT=3000
```

> Important: Replace the default secrets before deploying the app in production.

## Running the Project

Start the app in development mode:

```bash
npm run dev
```

Or run the production-style start command:

```bash
npm start
```

The app will run on:

```bash
http://localhost:3000
```

## Default Roles

This project supports role-based access:

- Admin
- Teacher

Administrators can create teacher accounts from the protected admin dashboard. Public signup is disabled.

## Docker Support

You can also run the project using Docker Compose:

```bash
docker-compose up --build
```

## Usage

1. Open the app in the browser.
2. Log in with an existing admin or teacher account.
3. Administrators can create teacher accounts from the protected admin dashboard.
4. Manage students, teachers, attendance, and reports from the relevant interface.

## Notes

- The app includes upload support for profile photos.
- Redis is optional and will fall back gracefully if it is unavailable.
- MongoDB is required for persistent attendance and user data.

## License

This project is licensed under the ISC License.

## Author

Created for attendance management and classroom monitoring workflows.
