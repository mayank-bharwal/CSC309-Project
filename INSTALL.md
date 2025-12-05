# Loyalty Program - Installation Guide

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js**: Version 18.x or higher (LTS recommended)
- **npm**: Version 9.x or higher (comes with Node.js)
- **SQLite3**: For the database

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

## Project Setup

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

Create a `.env` file in the backend directory:

```bash
echo "JWT_SECRET=your-secret-key-here" > .env
```

Replace `your-secret-key-here` with a secure random string.

#### Initialize the Database

Run Prisma migrations to set up the database:

```bash
npx prisma migrate deploy
```

#### Seed the Database (Optional)

To populate the database with test data:

```bash
npx prisma db seed
```

#### Create a Superuser

To create an initial superuser account:

```bash
node prisma/createsu.js
```

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

### 4. Running the Application

#### Development Mode

**Start the Backend Server:**

```bash
cd backend
node index.js 3000
```

The backend will run on `http://localhost:3000`

**Start the Frontend Development Server:**

Open a new terminal:

```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3001` (or another port if 3001 is busy)

#### Production Mode

**Build the Frontend:**

```bash
cd frontend
npm run build
```

This creates an optimized production build in the `frontend/build` directory.

## Deployment

### Environment Requirements

- A machine running Ubuntu 20.04 (or similar Linux distribution)
- Node.js 18.x or higher
- nginx (recommended for serving the frontend)

### Deployment Steps

#### 1. Set Up the Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install nginx (optional, for serving frontend)
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Deploy the Backend

```bash
# Navigate to backend directory
cd /path/to/CSC309-Project/backend

# Install dependencies
npm install --production

# Set up environment variables
export JWT_SECRET=your-production-secret

# Run database migrations
npx prisma migrate deploy

# Start the backend with PM2
pm2 start index.js --name "loyalty-backend" -- 3000

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 3. Deploy the Frontend

**Option A: Using nginx (Recommended)**

```bash
# Build the frontend
cd /path/to/CSC309-Project/frontend
npm install
npm run build

# Copy build files to nginx directory
sudo cp -r build/* /var/www/html/

# Configure nginx
sudo nano /etc/nginx/sites-available/default
```

Add the following nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/html;
    index index.html;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        rewrite ^/api(.*)$ $1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy all API routes
    location ~ ^/(auth|users|transactions|events|promotions|uploads) {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Restart nginx:

```bash
sudo systemctl restart nginx
```

**Option B: Serving frontend and backend from the same server**

You can configure the backend to serve the static frontend files:

```javascript
// Add to backend/index.js before the 404 handler
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});
```

### 4. SSL/HTTPS (Production)

For production, use Let's Encrypt for free SSL certificates:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## Manager Login Credentials

After running the seed script or creating a superuser, use these credentials:

- **UTORid**: (as created during setup)
- **Password**: (as set during setup)

## Troubleshooting

### Common Issues

1. **Port already in use**: Kill the process using the port or use a different port
   ```bash
   lsof -i :3000  # Find process using port 3000
   kill -9 <PID>  # Kill the process
   ```

2. **Database errors**: Reset the database
   ```bash
   npx prisma migrate reset
   ```

3. **Node modules issues**: Clear and reinstall
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Permission issues on Linux**:
   ```bash
   sudo chown -R $USER:$USER /path/to/project
   ```

## API Documentation

The backend exposes the following main endpoints:

- `POST /auth/tokens` - Login
- `POST /auth/resets` - Request password reset
- `GET /users` - List all users (Manager+)
- `GET /users/:id` - Get user details (Cashier+)
- `PATCH /users/:id` - Update user (Manager+)
- `GET /transactions` - List all transactions (Manager+)
- `POST /transactions` - Create transaction (Cashier+)
- `GET /promotions` - List promotions
- `POST /promotions` - Create promotion (Manager+)
- `GET /events` - List events
- `POST /events` - Create event (Manager+)

Refer to the backend source code for complete API documentation.

