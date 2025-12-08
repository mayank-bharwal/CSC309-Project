# CSSU Rewards - Installation & Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Demo Accounts](#demo-accounts)
5. [Environment Configuration](#environment-configuration)
6. [API Documentation](#api-documentation)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js**: Version 18.x or higher (LTS recommended)
- **npm**: Version 9.x or higher (comes with Node.js)
- **PostgreSQL**: Version 14.x or higher (for production)
- **Git**: For cloning the repository

### Installing Node.js

#### macOS (using Homebrew)
```bash
brew install node
```

#### Ubuntu/Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Windows
Download and install from [nodejs.org](https://nodejs.org/)

### Installing PostgreSQL

#### macOS (using Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CSC309-Project
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# JWT Secret for token signing
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# PostgreSQL Database URL
DATABASE_URL="postgresql://user:password@localhost:5432/cssu_rewards?schema=public"

# Superuser Credentials (for seed script)
SUPERUSER_UTORID=superadmin
SUPERUSER_NAME=Super Administrator
SUPERUSER_EMAIL=admin@example.com
SUPERUSER_PASSWORD=SuperSecure123!

# Node Environment
NODE_ENV=development
```

**Important**: Replace the database credentials and JWT secret with your own values.

#### Set Up PostgreSQL Database

Create a new PostgreSQL database:

```bash
# Access PostgreSQL
psql postgres

# Create database
CREATE DATABASE cssu_rewards;

# Create user (optional)
CREATE USER cssu_admin WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cssu_rewards TO cssu_admin;

# Exit
\q
```

Update your `DATABASE_URL` in `.env` to match your database configuration.

#### Initialize the Database

Run Prisma migrations to set up the database schema:

```bash
npx prisma migrate deploy
```

#### Seed the Database

Populate the database with test data (includes 14 users, 5+ events, 5+ promotions, 30+ transactions):

```bash
npx prisma db seed
```

This creates:
- 1 Superuser (from env variables)
- 2 Managers
- 3 Cashiers
- 8 Regular users
- 5 Events
- 5 Promotions
- 30+ Sample transactions

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

#### Configure Frontend Environment

Create a `.env` file in the `frontend` directory:

```bash
# Development port
PORT=3001

# Backend API URL (leave empty for local proxy)
REACT_APP_API_URL=

# Auth0 OAuth Configuration (optional)
REACT_APP_AUTH0_DOMAIN=your-auth0-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_CALLBACK_URL=http://localhost:3001/auth/callback
REACT_APP_AUTH0_AUDIENCE=https://your-auth0-domain.auth0.com/api/v2/
```

For local development, leave `REACT_APP_API_URL` empty to use the proxy configured in `package.json`.

### 4. Running the Application Locally

#### Start the Backend Server

```bash
cd backend
node index.js 3000
```

The backend will run on `http://localhost:3000`

You should see:
```
🚀 CSSU Rewards API Server started on port 3000
```

#### Start the Frontend Development Server

Open a new terminal:

```bash
cd frontend
npm start
```

The frontend will open automatically at `http://localhost:3001`

#### Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Backend Health Check**: http://localhost:3000/

---

## Production Deployment

This project is deployed using:
- **Backend**: Railway (https://railway.app/)
- **Frontend**: Vercel (https://vercel.com/)
- **Database**: PostgreSQL on Railway

### Deployment Architecture

```
┌─────────────────────────────────────────────┐
│  User Browser                               │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Frontend (Vercel)                          │
│  - React SPA                                │
│  - Static hosting                           │
│  - https://your-app.vercel.app              │
└─────────────────┬───────────────────────────┘
                  │
                  │ API Calls
                  ▼
┌─────────────────────────────────────────────┐
│  Backend (Railway)                          │
│  - Express.js API                           │
│  - JWT Authentication                       │
│  - https://csc309-project.up.railway.app    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  PostgreSQL Database (Railway)              │
│  - User data, transactions, events, etc.    │
└─────────────────────────────────────────────┘
```

### Backend Deployment (Railway)

#### 1. Create a Railway Account
- Go to https://railway.app/
- Sign up with GitHub

#### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repository
- Set root directory to `/backend`

#### 3. Add PostgreSQL Database
- In your Railway project, click "New"
- Select "Database" → "PostgreSQL"
- Railway will automatically create a `DATABASE_URL` environment variable

#### 4. Configure Environment Variables

In Railway dashboard, add these environment variables:

```
DATABASE_URL=<automatically set by Railway>
JWT_SECRET=your-production-jwt-secret-change-this
NODE_ENV=production
SUPERUSER_UTORID=admin
SUPERUSER_NAME=Administrator
SUPERUSER_EMAIL=admin@cssu.com
SUPERUSER_PASSWORD=ChangeThisPassword123!
```

#### 5. Deploy

Railway automatically deploys when you push to your GitHub repository.

The start command in `package.json` will:
1. Run database migrations (`npx prisma migrate deploy`)
2. Seed the database (`npx prisma db seed`)
3. Start the server (`node index.js 3000`)

#### 6. Note Your Backend URL

Railway provides a URL like: `https://csc309-project.up.railway.app`

### Frontend Deployment (Vercel)

#### 1. Create a Vercel Account
- Go to https://vercel.com/
- Sign up with GitHub

#### 2. Import Project
- Click "Add New" → "Project"
- Import your GitHub repository
- Set root directory to `/frontend`

#### 3. Configure Environment Variables

In Vercel dashboard, add these environment variables:

```
REACT_APP_API_URL=https://csc309-project.up.railway.app
REACT_APP_AUTH0_DOMAIN=your-auth0-domain.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_CALLBACK_URL=https://your-app.vercel.app/auth/callback
REACT_APP_AUTH0_AUDIENCE=https://your-auth0-domain.auth0.com/api/v2/
```

**Important**: Update `REACT_APP_API_URL` with your Railway backend URL.

#### 4. Deploy

Vercel automatically builds and deploys your frontend.

#### 5. Configure Auth0 (Optional)

If using OAuth:
1. Go to Auth0 dashboard
2. Update "Allowed Callback URLs" to include your Vercel URL
3. Update "Allowed Logout URLs"
4. Update "Allowed Web Origins"

---

## Demo Accounts

After running the seed script, the following demo accounts are available:

### Superuser
- **UTORid**: `superadmin` (or as configured in env)
- **Password**: `SuperSecure123!` (or as configured in env)
- **Capabilities**: Full system access, can promote users to manager/superuser

### Managers
- **UTORid**: `manager1`
- **Password**: `password123`
- **Capabilities**: Manage users, transactions, events, promotions

- **UTORid**: `manager2`
- **Password**: `password123`
- **Capabilities**: Same as manager1

### Cashiers
- **UTORid**: `cashier1`
- **Password**: `password123`
- **Capabilities**: Create transactions, process redemptions

- **UTORid**: `cashier2`
- **Password**: `password123`

- **UTORid**: `cashier3` (marked as suspicious)
- **Password**: `password123`

### Regular Users
- **UTORid**: `user1` (verified)
- **Password**: `password123`

- **UTORid**: `user2` (verified)
- **Password**: `password123`

- **UTORid**: `user3` (unverified)
- **Password**: `password123`

- **UTORid**: `user4` (suspicious)
- **Password**: `password123`

- **UTORid**: `user5` (suspended)
- **Password**: `password123`

Additional regular users: `user6`, `user7`, `user8` with various properties.

---

## Environment Configuration

### Backend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT signing | Yes | - |
| `NODE_ENV` | Environment (development/production) | No | development |
| `SUPERUSER_UTORID` | Initial superuser UTORid | No | superuser |
| `SUPERUSER_NAME` | Initial superuser name | No | Super User |
| `SUPERUSER_EMAIL` | Initial superuser email | No | superuser@example.com |
| `SUPERUSER_PASSWORD` | Initial superuser password | No | superuser123 |

### Frontend Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Development server port | No | 3000 |
| `REACT_APP_API_URL` | Backend API URL | Yes | - |
| `REACT_APP_AUTH0_DOMAIN` | Auth0 domain | No (if using OAuth) | - |
| `REACT_APP_AUTH0_CLIENT_ID` | Auth0 client ID | No (if using OAuth) | - |
| `REACT_APP_AUTH0_CALLBACK_URL` | OAuth callback URL | No (if using OAuth) | - |
| `REACT_APP_AUTH0_AUDIENCE` | Auth0 API audience | No (if using OAuth) | - |

---

## API Documentation

### Authentication Endpoints

- `POST /auth/tokens` - Login with UTORid and password
  ```json
  {
    "utorid": "user1",
    "password": "password123"
  }
  ```

- `POST /auth/resets` - Request password reset
  ```json
  {
    "email": "user@example.com"
  }
  ```

- `POST /auth/resets/:resetToken` - Complete password reset

### User Endpoints

- `GET /users/me` - Get current user profile
- `GET /users` - List all users (Manager+)
- `GET /users/:id` - Get user details (Cashier+)
- `POST /users` - Create new user (Cashier+)
- `PATCH /users/:id` - Update user (Manager+)
- `PATCH /users/:id/suspend` - Suspend/unsuspend user (Manager+)
- `PATCH /users/me/avatar` - Upload avatar image

### Transaction Endpoints

- `GET /transactions` - List all transactions (Manager+) or user's own transactions
- `GET /transactions/:id` - Get transaction details
- `POST /transactions` - Create transaction (Cashier+)
- `PATCH /transactions/:id` - Update transaction (Manager+)
- `PATCH /transactions/:id/process` - Process redemption (Cashier+)

### Event Endpoints

- `GET /events` - List all events
- `GET /events/:id` - Get event details
- `POST /events` - Create event (Manager+)
- `PATCH /events/:id` - Update event (Manager+)
- `DELETE /events/:id` - Delete event (Manager+)
- `POST /events/:id/organizers` - Add event organizer (Manager+)
- `DELETE /events/:id/organizers/:userId` - Remove organizer (Manager+)
- `POST /events/:id/guests` - RSVP to event
- `DELETE /events/:id/guests/:userId` - Cancel RSVP
- `POST /events/:id/award` - Award points to attendees (Organizer/Manager)

### Promotion Endpoints

- `GET /promotions` - List all promotions
- `GET /promotions/:id` - Get promotion details
- `POST /promotions` - Create promotion (Manager+)
- `PATCH /promotions/:id` - Update promotion (Manager+)
- `DELETE /promotions/:id` - Delete promotion (Manager+)

---

## Technology Stack

### Frontend
- **React** 18.x - UI framework
- **React Router** 6.x - Client-side routing
- **Tailwind CSS** 3.x - Styling
- **Axios** - HTTP client
- **Auth0** - OAuth authentication (optional)
- **Vercel Analytics** - Performance monitoring

### Backend
- **Node.js** 18.x - Runtime
- **Express.js** 4.x - Web framework
- **Prisma** 6.x - ORM
- **PostgreSQL** 14.x - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File uploads
- **Zod** - Schema validation

### Deployment
- **Railway** - Backend hosting + PostgreSQL
- **Vercel** - Frontend hosting (static)

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
node index.js 3001
```

#### 2. Database Connection Errors

**Error**: `Can't reach database server`

**Solutions**:
- Verify PostgreSQL is running: `brew services list` (macOS) or `systemctl status postgresql` (Linux)
- Check `DATABASE_URL` in `.env` is correct
- Ensure database exists: `psql -l`
- Check database credentials

#### 3. Prisma Migration Errors

**Error**: `Migration failed`

**Solutions**:
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually apply migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

#### 4. Frontend Can't Connect to Backend

**Error**: `Network Error` or `CORS error`

**Solutions**:
- Verify backend is running on port 3000
- Check `REACT_APP_API_URL` in frontend `.env`
- For local development, leave `REACT_APP_API_URL` empty to use proxy
- Ensure CORS is configured in backend (already done in `index.js`)

#### 5. JWT Token Errors

**Error**: `Invalid token` or `401 Unauthorized`

**Solutions**:
- Clear localStorage: `localStorage.clear()` in browser console
- Verify `JWT_SECRET` is set in backend `.env`
- Ensure `JWT_SECRET` is the same across restarts
- Check token expiration (default 7 days)

#### 6. Seed Script Fails

**Error**: `Table does not exist`

**Solution**:
```bash
# Run migrations first
npx prisma migrate deploy

# Then seed
npx prisma db seed
```

#### 7. Node Modules Issues

**Solution**:
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 8. Permission Issues (Linux/macOS)

**Solution**:
```bash
# Fix ownership
sudo chown -R $USER:$USER /path/to/project

# Fix file permissions
chmod -R 755 /path/to/project
```

---

## Additional Resources

- **Prisma Documentation**: https://www.prisma.io/docs/
- **Express.js Guide**: https://expressjs.com/
- **React Documentation**: https://react.dev/
- **Railway Documentation**: https://docs.railway.app/
- **Vercel Documentation**: https://vercel.com/docs

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the project's REQUIREMENTS_CHECKLIST.md
3. Consult the course TAs during tutorial sessions

---

**Last Updated**: December 2025
**Course**: CSC309 - Programming on the Web
**Project**: Loyalty Program System
