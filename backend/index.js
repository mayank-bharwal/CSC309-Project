#!/usr/bin/env node
"use strict";

require("dotenv").config(); 

const port = (() => {
  const args = process.argv;

  if (args.length !== 3) {
    console.error("usage: node index.js port");
    process.exit(1);
  }

  const num = parseInt(args[2], 10);
  if (isNaN(num)) {
    console.error("error: argument must be an integer.");
    process.exit(1);
  }

  return num;
})();

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { expressjwt: ejwt } = require("express-jwt");
const { v4: uuidv4 } = require("uuid");
const { z } = require("zod");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const app = express();
const prisma = new PrismaClient();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const uploadsDir = path.join(__dirname, "uploads", "avatars");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || req.auth?.id;
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("Error: JWT_SECRET environment variable is not set");
  process.exit(1);
}

const jwtMiddleware = ejwt({
  secret: JWT_SECRET,
  algorithms: ["HS256"],
  requestProperty: "auth",
});

const roleHierarchy = {
  regular: 0,
  cashier: 1,
  manager: 2,
  superuser: 3,
};

const requireRole = (minRole) => {
  return (req, res, next) => {
    const userRole = req.auth?.role || req.user?.role;

    if (!userRole) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userLevel = roleHierarchy[userRole];
    const requiredLevel = roleHierarchy[minRole];

    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (req.auth && !req.user) {
      req.user = req.auth;
    }

    next();
  };
};

const createUserSchema = z
  .object({
    utorid: z
      .string()
      .min(1, "UTORid is required")
      .max(8, "UTORid must be at most 8 characters")
      .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "Invalid utorid"),
    name: z.string().min(1, "Name is required").max(50),
    email: z
      .string()
      .email("Invalid email format")
      .refine(
        (email) => email.endsWith("@mail.utoronto.ca"),
        "Email must be a valid UofT email"
      ),
  })
  .strict();

const resetRateLimiter = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamp] of resetRateLimiter.entries()) {
    if (now - timestamp > 60000) {
      resetRateLimiter.delete(ip);
    }
  }
}, 300000);

// Chat rate limiting
const chatRateLimiter = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of chatRateLimiter.entries()) {
    if (now > data.resetAt) {
      chatRateLimiter.delete(userId);
    }
  }
}, 60000);

function checkChatRateLimit(userId) {
  const now = Date.now();
  const limit = parseInt(process.env.CHATBOT_RATE_LIMIT_PER_MINUTE || '10');
  const userLimit = chatRateLimiter.get(userId) || { count: 0, resetAt: now + 60000 };

  if (now > userLimit.resetAt) {
    chatRateLimiter.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (userLimit.count >= limit) {
    return false;
  }

  userLimit.count++;
  chatRateLimiter.set(userId, userLimit);
  return true;
}

// Enable CORS for frontend
const allowedOrigins = [
  'http://localhost:3001', // Local development
  process.env.FRONTEND_URL // Production (Vercel)
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// app.use((req, res, next) => {
//   const requestId = Math.random().toString(36).substr(2, 9);
//   const timestamp = new Date().toISOString();

//   console.log("\n" + "=".repeat(80));
//   console.log(`[${timestamp}] [${requestId}] INCOMING REQUEST`);
//   console.log("=".repeat(80));
//   console.log(`Method: ${req.method}`);
//   console.log(`Path: ${req.path}`);
//   console.log(`Full URL: ${req.originalUrl}`);

//   if (Object.keys(req.params).length > 0) {
//     console.log(`Params:`, JSON.stringify(req.params, null, 2));
//   }

//   if (Object.keys(req.query).length > 0) {
//     console.log(`Query:`, JSON.stringify(req.query, null, 2));
//   }

//   if (req.body && Object.keys(req.body).length > 0) {
//     const sanitizedBody = { ...req.body };
//     if (sanitizedBody.password) sanitizedBody.password = "[REDACTED]";
//     if (sanitizedBody.old) sanitizedBody.old = "[REDACTED]";
//     if (sanitizedBody.new) sanitizedBody.new = "[REDACTED]";
//     console.log(`Body:`, JSON.stringify(sanitizedBody, null, 2));
//   }

//   if (req.headers.authorization) {
//     console.log(
//       `Authorization: ${req.headers.authorization.substring(0, 20)}...`
//     );
//   }

//   const originalSend = res.send;
//   const originalJson = res.json;

//   res.send = function (data) {
//     console.log("\n" + "-".repeat(80));
//     console.log(`[${timestamp}] [${requestId}] RESPONSE`);
//     console.log("-".repeat(80));
//     console.log(`Status: ${res.statusCode}`);
//     if (data) {
//       try {
//         const parsed = typeof data === "string" ? JSON.parse(data) : data;
//         const stringified = JSON.stringify(parsed, null, 2);
//         if (stringified.length > 2000) {
//           console.log(
//             `Response (truncated):`,
//             stringified.substring(0, 2000) + "..."
//           );
//         } else {
//           console.log(`Response:`, stringified);
//         }
//       } catch (e) {
//         console.log(`Response (raw):`, String(data).substring(0, 500));
//       }
//     }
//     console.log("=".repeat(80) + "\n");
//     return originalSend.call(this, data);
//   };

//   res.json = function (data) {
//     console.log("\n" + "-".repeat(80));
//     console.log(`[${timestamp}] [${requestId}] RESPONSE`);
//     console.log("-".repeat(80));
//     console.log(`Status: ${res.statusCode}`);
//     if (data) {
//       const stringified = JSON.stringify(data, null, 2);
//       if (stringified.length > 2000) {
//         console.log(
//           `Response (truncated):`,
//           stringified.substring(0, 2000) + "..."
//         );
//       } else {
//         console.log(`Response:`, stringified);
//       }
//     }
//     console.log("=".repeat(80) + "\n");
//     return originalJson.call(this, data);
//   };

//   next();
// });

// Chatbot helper functions
async function gatherUserContext(userId, userMessage) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      utorid: true,
      name: true,
      email: true,
      role: true,
      points: true,
      verified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const context = { user };
  const messageLower = userMessage.toLowerCase();

  // Conditionally fetch based on message content
  if (messageLower.includes('transaction') || messageLower.includes('purchase') ||
      messageLower.includes('spent') || messageLower.includes('history')) {
    context.transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        amount: true,
        spent: true,
        remark: true,
        createdAt: true,
      },
    });
  }

  if (messageLower.includes('event')) {
    const now = new Date();
    const [upcomingEvents, userRegistrations] = await Promise.all([
      prisma.event.findMany({
        where: {
          startTime: { gte: now },
          published: true,
        },
        take: 5,
        orderBy: { startTime: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          location: true,
          startTime: true,
          endTime: true,
          capacity: true,
          points: true,
        },
      }),
      prisma.eventGuest.findMany({
        where: { userId },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startTime: true,
              points: true,
            },
          },
        },
      }),
    ]);
    context.upcomingEvents = upcomingEvents;
    context.userRegistrations = userRegistrations;
  }

  if (messageLower.includes('promotion') || messageLower.includes('deal') ||
      messageLower.includes('offer') || messageLower.includes('discount')) {
    const now = new Date();
    const [activePromotions, userPromotions] = await Promise.all([
      prisma.promotion.findMany({
        where: {
          startTime: { lte: now },
          endTime: { gte: now },
        },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          minSpending: true,
          rate: true,
          points: true,
          startTime: true,
          endTime: true,
        },
      }),
      prisma.userPromotion.findMany({
        where: { userId },
        include: {
          promotion: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      }),
    ]);
    context.activePromotions = activePromotions;
    context.userPromotions = userPromotions;
  }

  return context;
}

function buildSystemPrompt(userContext) {
  const { user, transactions, upcomingEvents, userRegistrations, activePromotions, userPromotions } = userContext;

  const roleInstructions = {
    regular: "You can help this user view their points, transactions, and register for events.",
    cashier: "This user can create transactions and view user information. You can help them with these tasks.",
    manager: "This user has full access to manage users, transactions, promotions, and events. You can guide them through any administrative task.",
    superuser: "This user has complete system access including user role management.",
  };

  let prompt = `You are an AI assistant for a university loyalty rewards program. Your role is to help users with their points balance, transactions, events, and promotions.

IMPORTANT RULES:
1. Only answer questions about the loyalty program (points, transactions, events, promotions, account info)
2. If asked about unrelated topics, politely redirect to the loyalty program scope
3. Never make up information - only use the provided user context
4. Keep responses concise (under 100 words)
5. Be friendly and professional
6. If you don't have enough information to answer, ask the user to clarify or suggest they contact support

USER CONTEXT:
- Name: ${user.name}
- UTorid: ${user.utorid}
- Role: ${user.role}
- Points Balance: ${user.points}
- Account Status: ${user.verified ? "Verified" : "Unverified"}
- Member Since: ${new Date(user.createdAt).toLocaleDateString()}
`;

  if (transactions && transactions.length > 0) {
    prompt += `\n\nRECENT TRANSACTIONS (Last 10):`;
    transactions.forEach(t => {
      prompt += `\n- ${t.type}: ${t.amount >= 0 ? '+' : ''}${t.amount} points on ${new Date(t.createdAt).toLocaleDateString()}`;
      if (t.spent) prompt += ` (spent $${t.spent})`;
      if (t.remark) prompt += ` - ${t.remark}`;
    });
  }

  if (upcomingEvents && upcomingEvents.length > 0) {
    prompt += `\n\nUPCOMING EVENTS:`;
    upcomingEvents.forEach(e => {
      prompt += `\n- ${e.name} at ${e.location} on ${new Date(e.startTime).toLocaleString()} (${e.points} points reward)`;
    });
  }

  if (userRegistrations && userRegistrations.length > 0) {
    prompt += `\n\nUSER'S EVENT REGISTRATIONS:`;
    userRegistrations.forEach(r => {
      prompt += `\n- Registered for: ${r.event.name} on ${new Date(r.event.startTime).toLocaleDateString()}`;
    });
  }

  if (activePromotions && activePromotions.length > 0) {
    prompt += `\n\nACTIVE PROMOTIONS:`;
    activePromotions.forEach(p => {
      prompt += `\n- ${p.name}: ${p.description}`;
      if (p.type === 'automatic' && p.minSpending) {
        prompt += ` (${p.rate}x points on purchases $${p.minSpending}+)`;
      } else if (p.type === 'one_time' && p.points) {
        prompt += ` (${p.points} bonus points)`;
      }
    });
  }

  if (userPromotions && userPromotions.length > 0) {
    prompt += `\n\nUSER'S REDEEMED PROMOTIONS:`;
    userPromotions.forEach(up => {
      prompt += `\n- Already redeemed: ${up.promotion.name}`;
    });
  }

  prompt += `\n\nROLE-SPECIFIC CAPABILITIES:\n${roleInstructions[user.role]}`;
  prompt += `\n\nAnswer the user's question based on this context. Do not reference "the context" in your response - speak naturally as if you have this information.`;

  return prompt;
}

// Root route - Health check
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CSSU Rewards API</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          background: white;
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          text-align: center;
          max-width: 500px;
        }
        h1 {
          color: #667eea;
          margin: 0 0 1rem 0;
          font-size: 2.5rem;
        }
        .status {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 2rem;
          font-weight: 600;
          margin: 1rem 0;
        }
        .info {
          color: #6b7280;
          margin: 1.5rem 0;
          line-height: 1.6;
        }
        .timestamp {
          color: #9ca3af;
          font-size: 0.875rem;
          margin-top: 2rem;
        }
        .api-info {
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-top: 1.5rem;
          text-align: left;
        }
        .api-info h3 {
          margin: 0 0 0.5rem 0;
          color: #374151;
          font-size: 1rem;
        }
        .api-info p {
          margin: 0.25rem 0;
          color: #6b7280;
          font-size: 0.875rem;
        }
        code {
          background: #e5e7eb;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎉 CSSU Rewards API</h1>
        <div class="status">✓ Backend is Running</div>
        <div class="info">
          <p>The CSSU Rewards backend server is up and operational.</p>
          <p>All systems are functioning normally.</p>
        </div>
        <div class="api-info">
          <h3>API Information</h3>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          <p><strong>Database:</strong> PostgreSQL (Railway)</p>
          <p><strong>Port:</strong> ${port}</p>
        </div>
        <div class="timestamp">
          Server Time: ${new Date().toISOString()}
        </div>
      </div>
    </body>
    </html>
  `);
});

app.post("/auth/tokens", async (req, res) => {
  try {
    const { utorid, password } = req.body;

    if (!utorid || !password) {
      return res.status(400).json({
        error: "Both utorid and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { utorid },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    if (!user.password) {
      // Check if user has valid reset token for first-time setup
      if (user.resetToken && user.expiresAt && new Date() < user.expiresAt) {
        return res.status(403).json({
          needsPasswordSetup: true,
          resetToken: user.resetToken,
          expiresAt: user.expiresAt,
          message: "Please set your password to activate your account",
        });
      } else {
        return res.status(410).json({
          error: "Account setup link expired. Please contact support.",
        });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = jwt.sign(
      {
        id: user.id,
        utorid: user.utorid,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      token,
      expiresAt,
    });
  } catch (error) {
    console.error("Error authenticating user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// OAuth Callback Handler
app.post("/auth/oauth/callback", async (req, res) => {
  try {
    const { code } = req.body;

    // Validate authorization code: must be a string, reasonable length, and safe characters
    if (
      typeof code !== "string" ||
      code.length < 10 ||
      code.length > 256 ||
      !/^[A-Za-z0-9\-\_\.\~]+$/.test(code)
    ) {
      return res.status(400).json({ error: "Invalid authorization code format" });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        grant_type: "authorization_code",
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.AUTH0_CALLBACK_URL,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const { access_token } = tokenResponse.data;

    // Get user info from Auth0
    const userInfoResponse = await axios.get(
      `https://${process.env.AUTH0_DOMAIN}/userinfo`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const auth0User = userInfoResponse.data;

    // Extract Auth0 user details
    const auth0UserId = auth0User.sub;
    const email = auth0User.email;
    const emailVerified = auth0User.email_verified;

    // Determine provider from sub claim
    const providerMatch = auth0UserId.split("|")[0];
    const provider = providerMatch.replace("-oauth2", "").replace("auth0", "email");

    if (!email) {
      return res.status(400).json({
        error: "Email not provided by OAuth provider"
      });
    }

    // Check if user exists by auth0UserId (already linked)
    let user = await prisma.user.findUnique({
      where: { auth0UserId },
    });

    // If not found by auth0UserId, check by email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({
          error: "Account not found. Please contact a cashier to create your account first.",
        });
      }

      // Link Auth0 account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          auth0UserId,
          oauthProvider: provider,
          oauthLinkedAt: new Date(),
          verified: emailVerified || user.verified,
          lastLogin: new Date(),
        },
      });
    } else {
      // User already linked, just update last login
      user = await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    }

    // Generate JWT token (same as password login)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = jwt.sign(
      {
        id: user.id,
        utorid: user.utorid,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      token,
      expiresAt,
      user: {
        id: user.id,
        utorid: user.utorid,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error("OAuth callback error:", error.response?.data || error.message);

    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(401).json({
        error: "OAuth authentication failed. Please try again."
      });
    }

    return res.status(500).json({
      error: "OAuth authentication failed",
      details: error.message,
    });
  }
});

app.post("/auth/resets", async (req, res) => {
  try {
    const { utorid } = req.body;

    if (!utorid) {
      return res.status(400).json({
        error: "UTORid is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { utorid },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const lastRequestTime = resetRateLimiter.get(utorid);
    const now = Date.now();

    if (lastRequestTime && now - lastRequestTime < 60000) {
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
    }

    resetRateLimiter.set(utorid, now);

    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        expiresAt,
      },
    });

    return res.status(202).json({
      expiresAt,
      resetToken,
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/auth/resets/:resetToken", async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { utorid, password } = req.body;

    if (!utorid || !password) {
      return res.status(400).json({
        error: "Both utorid and password are required",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password must be 8-20 characters with at least one uppercase, one lowercase, one number, and one special character",
      });
    }

    const user = await prisma.user.findUnique({
      where: { resetToken },
    });

    if (!user) {
      return res.status(404).json({
        error: "Reset token not found",
      });
    }

    if (user.utorid !== utorid) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!user.expiresAt || new Date() > user.expiresAt) {
      return res.status(410).json({
        error: "Reset token has expired",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        expiresAt: null,
        activated: true,
      },
    });

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/users", jwtMiddleware, requireRole("cashier"), async (req, res) => {
  try {
    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: validation.error.errors[0].message });
    }

    const { utorid, name, email } = validation.data;

    const existingUtorid = await prisma.user.findUnique({
      where: { utorid },
    });

    if (existingUtorid) {
      return res
        .status(409)
        .json({ error: "User with this utorid already exists" });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const user = await prisma.user.create({
      data: {
        utorid,
        name,
        email,
        resetToken,
        expiresAt,
        verified: false,
        activated: false,
        role: "regular",
      },
    });

    // Try to send activation email (fire-and-forget, don't block response)
    const { sendActivationEmail } = require('./utils/emailSender');
    sendActivationEmail(user, resetToken).catch(err => {
      console.error('Background email send failed:', err);
    });

    return res.status(201).json({
      id: user.id,
      utorid: user.utorid,
      name: user.name,
      email: user.email,
      verified: user.verified,
      expiresAt: user.expiresAt,
      emailSent: false,  // Always false since we don't wait for email
      message: "User created. User can activate by visiting the login page with their UTORid.",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/users", jwtMiddleware, requireRole("manager"), async (req, res) => {
  try {
    const { name, role, verified, activated, page = 1, limit = 10 } = req.query;

    const where = {};

    if (name) {
      where.OR = [{ utorid: { contains: name } }, { name: { contains: name } }];
    }

    if (role) {
      where.role = role;
    }

    if (verified !== undefined) {
      where.verified = verified === "true" || verified === true;
    }

    if (activated !== undefined) {
      where.activated = activated === "true" || activated === true;
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: "Invalid page parameter" });
    }
    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: "Invalid limit parameter" });
    }

    const skip = (pageNum - 1) * limitNum;

    const count = await prisma.user.count({ where });

    const results = await prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      select: {
        id: true,
        utorid: true,
        name: true,
        email: true,
        birthday: true,
        role: true,
        points: true,
        createdAt: true,
        lastLogin: true,
        verified: true,
        avatarUrl: true,
      },
    });

    return res.status(200).json({
      count,
      results,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get(
  "/users/me",
  jwtMiddleware,
  requireRole("regular"),
  async (req, res) => {
    try {
      const userId = req.user?.id || req.auth?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          utorid: true,
          name: true,
          email: true,
          birthday: true,
          role: true,
          points: true,
          createdAt: true,
          lastLogin: true,
          verified: true,
          avatarUrl: true,
        },
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const availablePromotions = await prisma.promotion.findMany({
        where: {
          AND: [
            { minSpending: null },
            { rate: null },
            { points: { not: null } },
            { NOT: { userPromotions: { some: { userId: userId } } } },
          ],
        },
        select: {
          id: true,
          name: true,
          minSpending: true,
          rate: true,
          points: true,
        },
      });
      return res.status(200).json({ ...user, promotions: availablePromotions });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.patch(
  "/users/me",
  jwtMiddleware,
  requireRole("regular"),
  upload.single("avatar"),
  async (req, res) => {
    try {
      const userId = req.user?.id || req.auth?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { name, email, birthday } = req.body;

      const allowedFields = ["name", "email", "birthday", "avatar"];
      const bodyKeys = Object.keys(req.body);
      const invalidFields = bodyKeys.filter(
        (key) => !allowedFields.includes(key)
      );
      if (invalidFields.length > 0) {
        return res.status(400).json({
          error: `Invalid field(s): ${invalidFields.join(", ")}`,
        });
      }

      const updateData = {};
      if (name !== undefined && name !== null) {
        if (typeof name !== "string" || name.length < 1 || name.length > 50) {
          return res
            .status(400)
            .json({ error: "Name must be between 1 and 50 characters" });
        }
        updateData.name = name;
      }
      if (email !== undefined && email !== null) {
        if (typeof email !== "string" || !email.endsWith("@mail.utoronto.ca")) {
          return res
            .status(400)
            .json({ error: "Email must be a valid UofT email" });
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({ error: "Email is already in use" });
        }
        updateData.email = email;
      }
      if (birthday !== undefined && birthday !== null) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(birthday)) {
          return res
            .status(400)
            .json({ error: "Birthday must be in YYYY-MM-DD format" });
        }
        const birthdayDate = new Date(birthday);
        if (isNaN(birthdayDate.getTime())) {
          return res.status(400).json({ error: "Invalid birthday date" });
        }

        const [year, month, day] = birthday.split("-").map(Number);
        if (
          birthdayDate.getUTCFullYear() !== year ||
          birthdayDate.getUTCMonth() !== month - 1 ||
          birthdayDate.getUTCDate() !== day
        ) {
          return res.status(400).json({ error: "Invalid birthday date" });
        }

        updateData.birthday = birthdayDate;
      }
      if (req.file) {
        const existingUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { avatarUrl: true },
        });
        if (existingUser?.avatarUrl) {
          const oldAvatarPath = path.join(__dirname, existingUser.avatarUrl);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        }
        updateData.avatarUrl = `/uploads/avatars/${req.file.filename}`;
      }

      if (Object.keys(updateData).length === 0 && !req.file) {
        return res
          .status(400)
          .json({ error: "At least one field must be provided" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
      return res.status(200).json({
        id: updatedUser.id,
        utorid: updatedUser.utorid,
        name: updatedUser.name,
        email: updatedUser.email,
        birthday: updatedUser.birthday,
        role: updatedUser.role,
        points: updatedUser.points,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin,
        verified: updatedUser.verified,
        avatarUrl: updatedUser.avatarUrl,
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      if (req.file) {
        const filePath = path.join(uploadsDir, req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.patch(
  "/users/me/password",
  jwtMiddleware,
  requireRole("regular"),
  async (req, res) => {
    try {
      const userId = req.user?.id || req.auth?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { old, new: newPassword } = req.body;
      if (!old || !newPassword) {
        return res
          .status(400)
          .json({ error: "Both old and new passwords are required" });
      }
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          error:
            "New password must be 8-20 characters with at least one uppercase, one lowercase, one number, and one special character",
        });
      }
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!user.password) {
        return res
          .status(400)
          .json({ error: "No password set for this account" });
      }
      const isPasswordValid = await bcrypt.compare(old, user.password);
      if (!isPasswordValid) {
        return res.status(403).json({ error: "Current password is incorrect" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
      return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get(
  "/users/:userId",
  jwtMiddleware,
  requireRole("cashier"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const userIdNum = parseInt(userId, 10);

      if (isNaN(userIdNum)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userIdNum },
        include: {
          userPromotions: {
            include: {
              promotion: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const availablePromotions = await prisma.promotion.findMany({
        where: {
          AND: [
            { minSpending: null },
            { rate: null },
            { points: { not: null } },
            {
              NOT: {
                userPromotions: {
                  some: {
                    userId: userIdNum,
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          minSpending: true,
          rate: true,
          points: true,
        },
      });

      const isManager = ["manager", "superuser"].includes(req.user.role);

      if (isManager) {
        return res.status(200).json({
          id: user.id,
          utorid: user.utorid,
          name: user.name,
          email: user.email,
          birthday: user.birthday,
          role: user.role,
          points: user.points,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          verified: user.verified,
          activated: user.activated,
          avatarUrl: user.avatarUrl,
          promotions: availablePromotions,
        });
      } else {
        return res.status(200).json({
          id: user.id,
          utorid: user.utorid,
          name: user.name,
          points: user.points,
          verified: user.verified,
          promotions: availablePromotions,
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.patch(
  "/users/:userId",
  jwtMiddleware,
  requireRole("manager"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const userIdNum = parseInt(userId, 10);

      if (isNaN(userIdNum)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const { email, verified, suspicious, role, activated } = req.body;

      const allowedFields = ["email", "verified", "suspicious", "role", "activated"];
      const bodyKeys = Object.keys(req.body);
      const invalidFields = bodyKeys.filter(
        (key) => !allowedFields.includes(key)
      );
      if (invalidFields.length > 0) {
        return res.status(400).json({
          error: `Invalid field(s): ${invalidFields.join(", ")}`,
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: userIdNum },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const updateData = {};

      if (email !== undefined && email !== null) {
        if (typeof email !== "string" || !email.endsWith("@mail.utoronto.ca")) {
          return res
            .status(400)
            .json({ error: "Email must be a valid UofT email" });
        }
        const emailExists = await prisma.user.findUnique({ where: { email } });
        if (emailExists && emailExists.id !== userIdNum) {
          return res.status(409).json({ error: "Email is already in use" });
        }
        updateData.email = email;
      }

      if (verified !== undefined && verified !== null) {
        if (typeof verified !== "boolean") {
          return res.status(400).json({ error: "Verified must be a boolean" });
        }
        updateData.verified = verified;
      }

      if (suspicious !== undefined && suspicious !== null) {
        if (typeof suspicious !== "boolean") {
          return res
            .status(400)
            .json({ error: "Suspicious must be a boolean" });
        }
        updateData.suspicious = suspicious;
      }

      if (role !== undefined && role !== null) {
        const allowedRoles =
          req.user.role === "superuser"
            ? ["regular", "cashier", "manager", "superuser"]
            : ["regular", "cashier"];

        if (!allowedRoles.includes(role)) {
          return res.status(403).json({
            error: "You do not have permission to assign this role",
          });
        }

        if (role === "cashier") {
          const isSuspicious =
            suspicious !== undefined ? suspicious : existingUser.suspicious;
          if (isSuspicious) {
            return res.status(400).json({
              error: "Cannot promote suspicious user to cashier",
            });
          }
          updateData.suspicious = false;
        }

        updateData.role = role;
      }

      if (activated !== undefined && activated !== null) {
        if (typeof activated !== "boolean") {
          return res.status(400).json({ error: "Activated must be a boolean" });
        }

        // Check role hierarchy: users can only activate users with lower roles
        const currentUserRole = req.user.role;
        const targetUserRole = role !== undefined ? role : existingUser.role;

        const roleHierarchy = {
          regular: 0,
          cashier: 1,
          manager: 2,
          superuser: 3,
        };

        if (roleHierarchy[targetUserRole] >= roleHierarchy[currentUserRole]) {
          return res.status(403).json({
            error: "You can only activate users with lower roles than yours",
          });
        }

        updateData.activated = activated;
      }

      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ error: "At least one field must be provided" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userIdNum },
        data: updateData,
      });

      const response = {
        id: updatedUser.id,
        utorid: updatedUser.utorid,
        name: updatedUser.name,
      };

      if (email !== undefined && email !== null)
        response.email = updatedUser.email;
      if (verified !== undefined && verified !== null)
        response.verified = updatedUser.verified;
      if (
        (suspicious !== undefined && suspicious !== null) ||
        role === "cashier"
      )
        response.suspicious = updatedUser.suspicious;
      if (role !== undefined && role !== null) response.role = updatedUser.role;

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/transactions",
  jwtMiddleware,
  requireRole("cashier"),
  async (req, res) => {
    try {
      const { utorid, type, spent, amount, relatedId, promotionIds, remark } =
        req.body;
      const createdByUtorid = req.user?.utorid || req.auth?.utorid;
      const createdById = req.user?.id || req.auth?.id;

      if (!utorid || !type) {
        return res.status(400).json({
          error: "utorid and type are required",
        });
      }

      const user = await prisma.user.findUnique({
        where: { utorid },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const creator = await prisma.user.findUnique({
        where: { id: createdById },
        select: { suspicious: true, role: true },
      });

      if (type === "purchase") {
        if (spent === undefined || spent === null) {
          return res.status(400).json({
            error: "spent is required for purchase transactions",
          });
        }

        if (typeof spent !== "number" || spent <= 0) {
          return res.status(400).json({
            error: "spent must be a positive number",
          });
        }

        let earnedPoints = Math.round(spent * 4);

        const appliedPromotionIds = [];
        if (
          promotionIds &&
          Array.isArray(promotionIds) &&
          promotionIds.length > 0
        ) {
          for (const promotionId of promotionIds) {
            const promotion = await prisma.promotion.findUnique({
              where: { id: promotionId },
            });

            if (!promotion) {
              return res.status(400).json({
                error: `Promotion with ID ${promotionId} does not exist`,
              });
            }

            const now = new Date();
            if (promotion.startTime > now) {
              return res.status(400).json({
                error: `Promotion ${promotionId} has not started yet`,
              });
            }
            if (promotion.endTime < now) {
              return res.status(400).json({
                error: `Promotion ${promotionId} has expired`,
              });
            }

            if (promotion.type === "one_time") {
              const alreadyUsed = await prisma.userPromotion.findUnique({
                where: {
                  userId_promotionId: {
                    userId: user.id,
                    promotionId: promotionId,
                  },
                },
              });

              if (alreadyUsed) {
                return res.status(400).json({
                  error: `Promotion ${promotionId} has already been used`,
                });
              }

              if (promotion.points !== null) {
                earnedPoints += promotion.points;
              }
              appliedPromotionIds.push(promotionId);

              await prisma.userPromotion.create({
                data: {
                  userId: user.id,
                  promotionId: promotionId,
                },
              });
            } else if (promotion.type === "automatic") {
              if (
                promotion.minSpending !== null &&
                spent < promotion.minSpending
              ) {
                return res.status(400).json({
                  error: `Minimum spending of ${promotion.minSpending} not met for promotion ${promotionId}`,
                });
              }

              if (promotion.rate !== null) {
                earnedPoints += Math.round(spent * promotion.rate);
              }
              if (promotion.points !== null) {
                earnedPoints += promotion.points;
              }
              appliedPromotionIds.push(promotionId);
            }
          }
        }

        const transaction = await prisma.transaction.create({
          data: {
            userId: user.id,
            utorid: user.utorid,
            type: "purchase",
            amount: earnedPoints,
            spent: spent,
            promotionIds:
              appliedPromotionIds.length > 0
                ? JSON.stringify(appliedPromotionIds)
                : null,
            suspicious: creator?.suspicious || false,
            remark: remark || "",
            createdBy: createdByUtorid,
          },
        });

        if (!creator?.suspicious) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              points: {
                increment: earnedPoints,
              },
            },
          });
        }

        return res.status(201).json({
          id: transaction.id,
          utorid: transaction.utorid,
          type: transaction.type,
          spent: transaction.spent,
          earned: transaction.amount,
          remark: transaction.remark,
          promotionIds: appliedPromotionIds,
          createdBy: transaction.createdBy,
        });
      } else if (type === "adjustment") {
        if (!["manager", "superuser"].includes(creator?.role || "")) {
          return res.status(403).json({
            error: "Manager or higher clearance required for adjustments",
          });
        }

        if (amount === undefined || amount === null) {
          return res.status(400).json({
            error: "amount is required for adjustment transactions",
          });
        }

        if (typeof amount !== "number") {
          return res.status(400).json({
            error: "amount must be a number",
          });
        }

        if (!relatedId) {
          return res.status(400).json({
            error: "relatedId is required for adjustment transactions",
          });
        }

        const relatedTransaction = await prisma.transaction.findUnique({
          where: { id: relatedId },
        });

        if (!relatedTransaction) {
          return res.status(404).json({
            error: "Related transaction does not exist",
          });
        }

        const transaction = await prisma.transaction.create({
          data: {
            userId: user.id,
            utorid: user.utorid,
            type: "adjustment",
            amount: amount,
            relatedId: relatedId,
            promotionIds:
              promotionIds && promotionIds.length > 0
                ? JSON.stringify(promotionIds)
                : null,
            remark: remark || "",
            createdBy: createdByUtorid,
          },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: {
            points: {
              increment: amount,
            },
          },
        });

        return res.status(201).json({
          id: transaction.id,
          utorid: transaction.utorid,
          amount: transaction.amount,
          type: transaction.type,
          relatedId: transaction.relatedId,
          remark: transaction.remark,
          promotionIds: promotionIds || [],
          createdBy: transaction.createdBy,
        });
      } else {
        return res.status(400).json({
          error: "Invalid transaction type",
        });
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get(
  "/transactions",
  jwtMiddleware,
  requireRole("manager"),
  async (req, res) => {
    try {
      const {
        name,
        createdBy,
        suspicious,
        promotionId,
        type,
        relatedId,
        amount,
        operator,
        page = 1,
        limit = 10,
      } = req.query;

      const where = {};

      if (name) {
        const users = await prisma.user.findMany({
          where: {
            OR: [{ utorid: { contains: name } }, { name: { contains: name } }],
          },
          select: { utorid: true },
        });

        if (users.length > 0) {
          where.utorid = { in: users.map((u) => u.utorid) };
        } else {
          return res.status(200).json({ count: 0, results: [] });
        }
      }

      if (createdBy) {
        where.createdBy = { contains: createdBy };
      }

      if (suspicious !== undefined) {
        where.suspicious = suspicious === "true" || suspicious === true;
      }

      if (promotionId) {
        const promotionIdNum = parseInt(promotionId, 10);
        if (!isNaN(promotionIdNum)) {
          where.promotionIds = { contains: promotionIdNum.toString() };
        }
      }

      if (type) {
        where.type = type;
      }

      if (relatedId !== undefined) {
        const relatedIdNum = parseInt(relatedId, 10);
        if (!isNaN(relatedIdNum)) {
          where.relatedId = relatedIdNum;
        }
      }

      if (amount !== undefined && operator) {
        const amountNum = parseInt(amount, 10);
        if (!isNaN(amountNum)) {
          if (operator === "gte") {
            where.amount = { gte: amountNum };
          } else if (operator === "lte") {
            where.amount = { lte: amountNum };
          }
        }
      }

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;

      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({ error: "Invalid page parameter" });
      }
      if (isNaN(limitNum) || limitNum < 1) {
        return res.status(400).json({ error: "Invalid limit parameter" });
      }

      const skip = (pageNum - 1) * limitNum;

      const count = await prisma.transaction.count({ where });
      const transactions = await prisma.transaction.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { id: "desc" },
      });

      const results = transactions.map((tx) => {
        const result = {
          id: tx.id,
          utorid: tx.utorid,
          amount: tx.amount,
          type: tx.type,
          promotionIds: tx.promotionIds ? JSON.parse(tx.promotionIds) : [],
          remark: tx.remark || "",
          createdBy: tx.createdBy,
        };

        if (tx.spent !== null) result.spent = tx.spent;
        if (tx.redeemed !== null) result.redeemed = tx.redeemed;
        if (tx.relatedId !== null) result.relatedId = tx.relatedId;
        if (tx.type === "purchase" || tx.type === "adjustment") {
          result.suspicious = tx.suspicious;
        }

        return result;
      });

      return res.status(200).json({ count, results });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get(
  "/transactions/:transactionId",
  jwtMiddleware,
  requireRole("manager"),
  async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transactionIdNum = parseInt(transactionId, 10);

      if (isNaN(transactionIdNum)) {
        return res.status(400).json({ error: "Invalid transaction ID" });
      }

      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionIdNum },
      });

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      const result = {
        id: transaction.id,
        utorid: transaction.utorid,
        type: transaction.type,
        amount: transaction.amount,
        promotionIds: transaction.promotionIds
          ? JSON.parse(transaction.promotionIds)
          : [],
        remark: transaction.remark || "",
        createdBy: transaction.createdBy,
      };

      if (transaction.spent !== null) result.spent = transaction.spent;
      if (transaction.redeemed !== null) result.redeemed = transaction.redeemed;
      if (transaction.relatedId !== null)
        result.relatedId = transaction.relatedId;
      if (
        transaction.type === "purchase" ||
        transaction.type === "adjustment"
      ) {
        result.suspicious = transaction.suspicious;
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.patch(
  "/transactions/:transactionId/suspicious",
  jwtMiddleware,
  requireRole("manager"),
  async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { suspicious } = req.body;
      const transactionIdNum = parseInt(transactionId, 10);

      if (isNaN(transactionIdNum)) {
        return res.status(400).json({ error: "Invalid transaction ID" });
      }

      if (suspicious === undefined || typeof suspicious !== "boolean") {
        return res.status(400).json({
          error: "suspicious field is required and must be a boolean",
        });
      }

      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionIdNum },
      });

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.suspicious === suspicious) {
        const result = {
          id: transaction.id,
          utorid: transaction.utorid,
          type: transaction.type,
          amount: transaction.amount,
          promotionIds: transaction.promotionIds
            ? JSON.parse(transaction.promotionIds)
            : [],
          suspicious: transaction.suspicious,
          remark: transaction.remark || "",
          createdBy: transaction.createdBy,
        };

        if (transaction.spent !== null) result.spent = transaction.spent;
        if (transaction.redeemed !== null)
          result.redeemed = transaction.redeemed;
        if (transaction.relatedId !== null)
          result.relatedId = transaction.relatedId;

        return res.status(200).json(result);
      }

      let pointsAdjustment = 0;

      if (suspicious && !transaction.suspicious) {
        pointsAdjustment = -transaction.amount;
      } else if (!suspicious && transaction.suspicious) {
        pointsAdjustment = transaction.amount;
      }

      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionIdNum },
        data: { suspicious },
      });

      if (pointsAdjustment !== 0) {
        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            points: {
              increment: pointsAdjustment,
            },
          },
        });
      }

      const result = {
        id: updatedTransaction.id,
        utorid: updatedTransaction.utorid,
        type: updatedTransaction.type,
        amount: updatedTransaction.amount,
        promotionIds: updatedTransaction.promotionIds
          ? JSON.parse(updatedTransaction.promotionIds)
          : [],
        suspicious: updatedTransaction.suspicious,
        remark: updatedTransaction.remark || "",
        createdBy: updatedTransaction.createdBy,
      };

      if (updatedTransaction.spent !== null)
        result.spent = updatedTransaction.spent;
      if (updatedTransaction.redeemed !== null)
        result.redeemed = updatedTransaction.redeemed;
      if (updatedTransaction.relatedId !== null)
        result.relatedId = updatedTransaction.relatedId;

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error updating transaction suspicious flag:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.patch(
  "/transactions/:transactionId/processed",
  jwtMiddleware,
  requireRole("cashier"),
  async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { processed } = req.body;
      const transactionIdNum = parseInt(transactionId, 10);
      const cashierUtorid = req.user?.utorid || req.auth?.utorid;
      const cashierId = req.user?.id || req.auth?.id;

      if (isNaN(transactionIdNum)) {
        return res.status(400).json({ error: "Invalid transaction ID" });
      }

      if (processed !== true) {
        return res.status(400).json({
          error: "processed field must be true",
        });
      }

      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionIdNum },
      });

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.type !== "redemption") {
        return res.status(400).json({
          error: "Transaction is not a redemption",
        });
      }

      if (transaction.relatedId !== null) {
        return res.status(400).json({
          error: "Transaction has already been processed",
        });
      }

      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionIdNum },
        data: {
          relatedId: cashierId,
          redeemed: Math.abs(transaction.amount),
        },
      });

      await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          points: {
            decrement: Math.abs(transaction.amount),
          },
        },
      });

      return res.status(200).json({
        id: updatedTransaction.id,
        utorid: updatedTransaction.utorid,
        type: updatedTransaction.type,
        processedBy: cashierUtorid,
        redeemed: updatedTransaction.redeemed,
        remark: updatedTransaction.remark || "",
        createdBy: updatedTransaction.createdBy,
      });
    } catch (error) {
      console.error("Error processing redemption:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/users/me/transactions",
  jwtMiddleware,
  requireRole("regular"),
  async (req, res) => {
    try {
      const { type, amount, remark } = req.body;
      const userUtorid = req.user?.utorid || req.auth?.utorid;
      const userId = req.user?.id || req.auth?.id;
      if (type !== "redemption") {
        return res.status(400).json({ error: "type must be 'redemption'" });
      }
      if (
        amount === undefined ||
        typeof amount !== "number" ||
        amount <= 0 ||
        !Number.isInteger(amount)
      ) {
        return res
          .status(400)
          .json({ error: "amount must be a positive integer" });
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!user.verified) {
        return res.status(403).json({ error: "User must be verified" });
      }
      if (user.points < amount) {
        return res.status(400).json({ error: "Insufficient points" });
      }
      const transaction = await prisma.transaction.create({
        data: {
          userId: userId,
          utorid: user.utorid,
          type: "redemption",
          amount: -amount,
          relatedId: null,
          remark: remark || "",
          createdBy: userUtorid,
        },
      });
      return res.status(201).json({
        id: transaction.id,
        utorid: transaction.utorid,
        type: transaction.type,
        processedBy: null,
        amount: Math.abs(transaction.amount),
        remark: transaction.remark,
        createdBy: transaction.createdBy,
      });
    } catch (error) {
      console.error("Error creating redemption transaction:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get(
  "/users/me/transactions",
  jwtMiddleware,
  requireRole("regular"),
  async (req, res) => {
    try {
      const userId = req.user?.id || req.auth?.id;
      const {
        type,
        relatedId,
        promotionId,
        amount,
        operator,
        page = 1,
        limit = 10,
      } = req.query;
      const where = { userId: userId };
      if (type) where.type = type;
      if (relatedId !== undefined) {
        const relatedIdNum = parseInt(relatedId, 10);
        if (!isNaN(relatedIdNum)) where.relatedId = relatedIdNum;
      }
      if (promotionId) {
        const promotionIdNum = parseInt(promotionId, 10);
        if (!isNaN(promotionIdNum))
          where.promotionIds = { contains: promotionIdNum.toString() };
      }
      if (amount !== undefined && operator) {
        const amountNum = parseInt(amount, 10);
        if (!isNaN(amountNum)) {
          if (operator === "gte") where.amount = { gte: amountNum };
          else if (operator === "lte") where.amount = { lte: amountNum };
        }
      }
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;

      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({ error: "Invalid page parameter" });
      }
      if (isNaN(limitNum) || limitNum < 1) {
        return res.status(400).json({ error: "Invalid limit parameter" });
      }

      const skip = (pageNum - 1) * limitNum;
      const count = await prisma.transaction.count({ where });
      const transactions = await prisma.transaction.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { id: "desc" },
      });
      const results = transactions.map((tx) => {
        const result = {
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          promotionIds: tx.promotionIds ? JSON.parse(tx.promotionIds) : [],
          remark: tx.remark || "",
          createdBy: tx.createdBy,
        };
        if (tx.spent !== null) result.spent = tx.spent;
        if (tx.redeemed !== null) result.redeemed = tx.redeemed;
        if (tx.relatedId !== null) result.relatedId = tx.relatedId;
        return result;
      });
      return res.status(200).json({ count, results });
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/users/:userId/transactions",
  jwtMiddleware,
  requireRole("regular"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { type, amount, remark } = req.body;
      const senderUtorid = req.user?.utorid || req.auth?.utorid;
      const senderId = req.user?.id || req.auth?.id;
      const recipientId = parseInt(userId, 10);

      if (isNaN(recipientId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      if (type !== "transfer") {
        return res.status(400).json({
          error: "type must be 'transfer'",
        });
      }

      if (
        amount === undefined ||
        typeof amount !== "number" ||
        amount <= 0 ||
        !Number.isInteger(amount)
      ) {
        return res.status(400).json({
          error: "amount must be a positive integer",
        });
      }

      const sender = await prisma.user.findUnique({
        where: { id: senderId },
      });

      if (!sender) {
        return res.status(404).json({ error: "Sender not found" });
      }

      if (!sender.verified) {
        return res.status(403).json({
          error: "Sender must be verified",
        });
      }

      if (sender.points < amount) {
        return res.status(400).json({
          error: "Insufficient points",
        });
      }

      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });

      if (!recipient) {
        return res.status(404).json({ error: "Recipient not found" });
      }

      const senderTransaction = await prisma.transaction.create({
        data: {
          userId: senderId,
          utorid: sender.utorid,
          type: "transfer",
          amount: -amount,
          relatedId: recipientId,
          remark: remark || "",
          createdBy: senderUtorid,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: recipientId,
          utorid: recipient.utorid,
          type: "transfer",
          amount: amount,
          relatedId: senderId,
          remark: remark || "",
          createdBy: senderUtorid,
        },
      });

      await prisma.user.update({
        where: { id: senderId },
        data: {
          points: {
            decrement: amount,
          },
        },
      });

      await prisma.user.update({
        where: { id: recipientId },
        data: {
          points: {
            increment: amount,
          },
        },
      });

      return res.status(201).json({
        id: senderTransaction.id,
        sender: sender.utorid,
        recipient: recipient.utorid,
        type: senderTransaction.type,
        sent: amount,
        remark: senderTransaction.remark,
        createdBy: senderTransaction.createdBy,
      });
    } catch (error) {
      console.error("Error creating transfer transaction:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Chatbot endpoint
app.post("/chat", jwtMiddleware, requireRole("regular"), async (req, res) => {
  try {
    // Validate input
    const chatSchema = z.object({
      message: z.string()
        .min(1, "Message cannot be empty")
        .max(500, "Message too long (max 500 characters)")
        .trim(),
      conversationId: z.string().nullable().optional(),
    });

    const validation = chatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: validation.error.errors[0].message,
      });
    }

    const { message } = validation.data;
    const userId = req.auth?.id || req.user?.id;

    // Rate limiting check
    if (!checkChatRateLimit(userId)) {
      return res.status(429).json({
        error: "Too many requests. Please wait before sending another message.",
      });
    }

    // Gather user context based on message content
    const userContext = await gatherUserContext(userId, message);

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(userContext);

    // Call Gemini API
    const model = genAI.getGenerativeModel({
      model: process.env.CHATBOT_MODEL || "gemini-1.5-pro"
    });

    const result = await model.generateContent([
      systemPrompt,
      `User: ${message}`
    ]);

    const response = result.response.text();

    return res.status(200).json({
      response,
      timestamp: new Date().toISOString(),
      conversationId: null, // Reserved for future persistence
    });

  } catch (error) {
    console.error("Chat error:", error);

    // Handle Gemini API specific errors
    if (error.message && error.message.includes("API key")) {
      console.error("Gemini API key invalid or missing");
      return res.status(500).json({
        error: "Chat service configuration error. Please contact support.",
      });
    }

    if (error.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }

    // Generic error
    return res.status(500).json({
      error: "Chat service temporarily unavailable. Please try again later.",
    });
  }
});

app.post("/events", jwtMiddleware, requireRole("manager"), async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      startTime,
      endTime,
      capacity,
      points,
    } = req.body;

    if (
      !name ||
      !description ||
      !location ||
      !startTime ||
      !endTime ||
      points === undefined
    ) {
      return res.status(400).json({
        error:
          "name, description, location, startTime, endTime, and points are required",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
      });
    }

    if (start < now) {
      return res.status(400).json({
        error: "Start time cannot be in the past",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        error: "End time must be after start time",
      });
    }

    if (capacity !== null && capacity !== undefined) {
      if (typeof capacity !== "number" || capacity <= 0) {
        return res.status(400).json({
          error: "Capacity must be a positive number or null",
        });
      }
    }

    if (
      typeof points !== "number" ||
      points <= 0 ||
      !Number.isInteger(points)
    ) {
      return res.status(400).json({
        error: "Points must be a positive integer",
      });
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        location,
        startTime: start,
        endTime: end,
        capacity: capacity === null ? null : capacity,
        points,
        pointsRemain: points,
        pointsAwarded: 0,
        published: false,
      },
      include: {
        organizers: true,
        guests: true,
      },
    });

    return res.status(201).json({
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      startTime: event.startTime,
      endTime: event.endTime,
      capacity: event.capacity,
      pointsRemain: event.pointsRemain,
      pointsAwarded: event.pointsAwarded,
      published: event.published,
      organizers: [],
      guests: [],
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/events", jwtMiddleware, requireRole("regular"), async (req, res) => {
  try {
    const {
      name,
      location,
      started,
      ended,
      showFull,
      published,
      page = 1,
      limit = 10,
    } = req.query;

    const userRole = req.user?.role || req.auth?.role;
    const isManager = ["manager", "superuser"].includes(userRole);

    if (started !== undefined && ended !== undefined) {
      return res.status(400).json({
        error: "Cannot specify both started and ended",
      });
    }

    const where = {};
    const now = new Date();

    if (!isManager) {
      where.published = true;
    } else if (published !== undefined) {
      where.published = published === "true" || published === true;
    }

    if (name) {
      where.name = { contains: name };
    }

    if (location) {
      where.location = { contains: location };
    }

    if (started !== undefined) {
      const hasStarted = started === "true" || started === true;
      if (hasStarted) {
        where.startTime = { lte: now };
      } else {
        where.startTime = { gt: now };
      }
    }

    if (ended !== undefined) {
      const hasEnded = ended === "true" || ended === true;
      if (hasEnded) {
        where.endTime = { lte: now };
      } else {
        where.endTime = { gt: now };
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: "Invalid page parameter" });
    }
    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: "Invalid limit parameter" });
    }

    const skip = (pageNum - 1) * limitNum;

    let events = await prisma.event.findMany({
      where,
      include: {
        guests: true,
      },
      orderBy: { id: "desc" },
    });

    const shouldShowFull = showFull === "true" || showFull === true;
    if (!shouldShowFull) {
      events = events.filter(
        (event) =>
          event.capacity === null || event.guests.length < event.capacity
      );
    }

    const count = events.length;
    const paginatedEvents = events.slice(skip, skip + limitNum);

    const results = paginatedEvents.map((event) => {
      const result = {
        id: event.id,
        name: event.name,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        capacity: event.capacity,
        numGuests: event.guests.length,
      };

      if (isManager) {
        result.pointsRemain = event.pointsRemain;
        result.pointsAwarded = event.pointsAwarded;
        result.published = event.published;
      }

      return result;
    });

    return res.status(200).json({ count, results });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get(
  "/events/:eventId",
  jwtMiddleware,
  requireRole("regular"),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const eventIdNum = parseInt(eventId, 10);
      const userId = req.user?.id || req.auth?.id;
      const userRole = req.user?.role || req.auth?.role;

      if (isNaN(eventIdNum)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }

      const event = await prisma.event.findUnique({
        where: { id: eventIdNum },
        include: {
          organizers: true,
          guests: true,
        },
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const isOrganizer = event.organizers.some((org) => org.userId === userId);
      const isManager = ["manager", "superuser"].includes(userRole);
      const hasFullAccess = isManager || isOrganizer;

      if (!hasFullAccess && !event.published) {
        return res.status(404).json({ error: "Event not found" });
      }

      const organizerDetails = await prisma.user.findMany({
        where: {
          id: { in: event.organizers.map((org) => org.userId) },
        },
        select: {
          id: true,
          utorid: true,
          name: true,
        },
      });

      if (hasFullAccess) {
        return res.status(200).json({
          id: event.id,
          name: event.name,
          description: event.description,
          location: event.location,
          startTime: event.startTime,
          endTime: event.endTime,
          capacity: event.capacity,
          pointsRemain: event.pointsRemain,
          pointsAwarded: event.pointsAwarded,
          published: event.published,
          organizers: organizerDetails,
          guests: event.guests.map((g) => g.userId),
        });
      } else {
        return res.status(200).json({
          id: event.id,
          name: event.name,
          description: event.description,
          location: event.location,
          startTime: event.startTime,
          endTime: event.endTime,
          capacity: event.capacity,
          organizers: organizerDetails,
          numGuests: event.guests.length,
        });
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.patch(
  "/events/:eventId",
  jwtMiddleware,
  requireRole("regular"),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const eventIdNum = parseInt(eventId, 10);
      const userId = req.user?.id || req.auth?.id;
      const userRole = req.user?.role || req.auth?.role;

      if (isNaN(eventIdNum)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }

      const {
        name,
        description,
        location,
        startTime,
        endTime,
        capacity,
        points,
        published,
      } = req.body;

      const event = await prisma.event.findUnique({
        where: { id: eventIdNum },
        include: {
          organizers: true,
          guests: true,
        },
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const isOrganizer = event.organizers.some((org) => org.userId === userId);
      const isManager = ["manager", "superuser"].includes(userRole);

      if (!isManager && !isOrganizer) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (
        ((points !== undefined && points !== null) ||
          (published !== undefined && published !== null)) &&
        !isManager
      ) {
        return res.status(403).json({
          error: "Only managers can set points or published status",
        });
      }

      const updateData = {};
      const now = new Date();

      if (name !== undefined && name !== null) {
        if (event.startTime < now) {
          return res.status(400).json({
            error: "Cannot update name after event has started",
          });
        }
        updateData.name = name;
      }

      if (description !== undefined && description !== null) {
        if (event.startTime < now) {
          return res.status(400).json({
            error: "Cannot update description after event has started",
          });
        }
        updateData.description = description;
      }

      if (location !== undefined && location !== null) {
        if (event.startTime < now) {
          return res.status(400).json({
            error: "Cannot update location after event has started",
          });
        }
        updateData.location = location;
      }

      if (startTime !== undefined && startTime !== null) {
        if (event.startTime < now) {
          return res.status(400).json({
            error: "Cannot update start time after event has started",
          });
        }

        const newStartTime = new Date(startTime);
        if (isNaN(newStartTime.getTime())) {
          return res.status(400).json({ error: "Invalid start time format" });
        }

        if (newStartTime < now) {
          return res.status(400).json({
            error: "Start time cannot be in the past",
          });
        }

        const newEndTime = endTime ? new Date(endTime) : event.endTime;
        if (newEndTime <= newStartTime) {
          return res.status(400).json({
            error: "End time must be after start time",
          });
        }

        updateData.startTime = newStartTime;
      }

      if (endTime !== undefined && endTime !== null) {
        if (event.endTime < now) {
          return res.status(400).json({
            error: "Cannot update end time after event has ended",
          });
        }

        const newEndTime = new Date(endTime);
        if (isNaN(newEndTime.getTime())) {
          return res.status(400).json({ error: "Invalid end time format" });
        }

        const newStartTime = startTime ? new Date(startTime) : event.startTime;
        if (newEndTime <= newStartTime) {
          return res.status(400).json({
            error: "End time must be after start time",
          });
        }

        updateData.endTime = newEndTime;
      }

      if (capacity !== undefined) {
        if (event.startTime < now) {
          return res.status(400).json({
            error: "Cannot update capacity after event has started",
          });
        }

        if (capacity !== null) {
          if (typeof capacity !== "number" || capacity <= 0) {
            return res.status(400).json({
              error: "Capacity must be a positive number or null",
            });
          }

          if (event.guests.length > capacity) {
            return res.status(400).json({
              error: "New capacity is less than current number of guests",
            });
          }
        }

        updateData.capacity = capacity;
      }

      if (points !== undefined && points !== null) {
        if (
          typeof points !== "number" ||
          points <= 0 ||
          !Number.isInteger(points)
        ) {
          return res.status(400).json({
            error: "Points must be a positive integer",
          });
        }

        const pointsDiff = points - event.points;
        const newPointsRemain = event.pointsRemain + pointsDiff;

        if (newPointsRemain < 0) {
          return res.status(400).json({
            error: "Cannot reduce points below already awarded amount",
          });
        }

        updateData.points = points;
        updateData.pointsRemain = newPointsRemain;
      }

      if (published !== undefined && published !== null) {
        if (published !== true) {
          return res.status(400).json({
            error: "Published can only be set to true",
          });
        }
        updateData.published = true;
      }

      const updatedEvent = await prisma.event.update({
        where: { id: eventIdNum },
        data: updateData,
      });

      const response = {
        id: updatedEvent.id,
        name: updatedEvent.name,
        location: updatedEvent.location,
      };

      if (description !== undefined)
        response.description = updatedEvent.description;
      if (startTime !== undefined) response.startTime = updatedEvent.startTime;
      if (endTime !== undefined) response.endTime = updatedEvent.endTime;
      if (capacity !== undefined) response.capacity = updatedEvent.capacity;
      if (points !== undefined) {
        response.points = updatedEvent.points;
        response.pointsRemain = updatedEvent.pointsRemain;
      }
      if (published !== undefined) response.published = updatedEvent.published;

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error updating event:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.delete(
  "/events/:eventId",
  jwtMiddleware,
  requireRole("manager"),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const eventIdNum = parseInt(eventId, 10);

      if (isNaN(eventIdNum)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }

      const event = await prisma.event.findUnique({
        where: { id: eventIdNum },
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (event.published) {
        return res.status(400).json({
          error: "Cannot delete published event",
        });
      }

      await prisma.event.delete({
        where: { id: eventIdNum },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/events/:eventId/organizers",
  jwtMiddleware,
  requireRole("manager"),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { utorid } = req.body;
      const eventIdNum = parseInt(eventId, 10);

      if (isNaN(eventIdNum)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }

      if (!utorid) {
        return res.status(400).json({ error: "utorid is required" });
      }

      const event = await prisma.event.findUnique({
        where: { id: eventIdNum },
        include: {
          organizers: true,
          guests: true,
        },
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (new Date() > event.endTime) {
        return res.status(410).json({ error: "Event has ended" });
      }

      const user = await prisma.user.findUnique({
        where: { utorid },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isGuest = event.guests.some((g) => g.userId === user.id);
      if (isGuest) {
        return res.status(400).json({
          error: "User is registered as a guest",
        });
      }

      const isOrganizer = event.organizers.some((o) => o.userId === user.id);
      if (isOrganizer) {
        return res.status(400).json({
          error: "User is already an organizer",
        });
      }

      await prisma.eventOrganizer.create({
        data: {
          eventId: eventIdNum,
          userId: user.id,
        },
      });

      const organizers = await prisma.user.findMany({
        where: {
          id: {
            in: [...event.organizers.map((o) => o.userId), user.id],
          },
        },
        select: {
          id: true,
          utorid: true,
          name: true,
        },
      });

      return res.status(201).json({
        id: event.id,
        name: event.name,
        location: event.location,
        organizers,
      });
    } catch (error) {
      console.error("Error adding organizer:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.delete(
  "/events/:eventId/organizers/:userId",
  jwtMiddleware,
  requireRole("manager"),
  async (req, res) => {
    try {
      const { eventId, userId } = req.params;
      const eventIdNum = parseInt(eventId, 10);
      const userIdNum = parseInt(userId, 10);

      if (isNaN(eventIdNum) || isNaN(userIdNum)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const organizer = await prisma.eventOrganizer.findUnique({
        where: {
          eventId_userId: {
            eventId: eventIdNum,
            userId: userIdNum,
          },
        },
      });

      if (!organizer) {
        return res.status(404).json({ error: "Organizer not found" });
      }

      await prisma.eventOrganizer.delete({
        where: {
          eventId_userId: {
            eventId: eventIdNum,
            userId: userIdNum,
          },
        },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("Error removing organizer:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/events/:eventId/guests",
  jwtMiddleware,
  requireRole("regular"),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { utorid } = req.body;
      const eventIdNum = parseInt(eventId, 10);
      const currentUserId = req.user?.id || req.auth?.id;
      const userRole = req.user?.role || req.auth?.role;

      if (isNaN(eventIdNum)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }

      if (!utorid) {
        return res.status(400).json({ error: "utorid is required" });
      }

      const event = await prisma.event.findUnique({
        where: { id: eventIdNum },
        include: {
          organizers: true,
          guests: true,
        },
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const isOrganizer = event.organizers.some(
        (org) => org.userId === currentUserId
      );
      const isManager = ["manager", "superuser"].includes(userRole);

      if (!isManager && !isOrganizer) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (!isManager && !isOrganizer && !event.published) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (new Date() > event.endTime) {
        return res.status(410).json({ error: "Event has ended" });
      }

      if (event.capacity !== null && event.guests.length >= event.capacity) {
        return res.status(410).json({ error: "Event is full" });
      }

      const user = await prisma.user.findUnique({
        where: { utorid },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isUserOrganizer = event.organizers.some(
        (o) => o.userId === user.id
      );
      if (isUserOrganizer) {
        return res.status(400).json({
          error: "User is registered as an organizer",
        });
      }

      const isGuest = event.guests.some((g) => g.userId === user.id);
      if (isGuest) {
        return res.status(400).json({
          error: "User is already a guest",
        });
      }

      await prisma.eventGuest.create({
        data: {
          eventId: eventIdNum,
          userId: user.id,
        },
      });

      return res.status(201).json({
        id: event.id,
        name: event.name,
        location: event.location,
        guestAdded: {
          id: user.id,
          utorid: user.utorid,
          name: user.name,
        },
        numGuests: event.guests.length + 1,
      });
    } catch (error) {
      console.error("Error adding guest:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.delete(
  "/events/:eventId/guests/:userId",
  jwtMiddleware,
  requireRole("manager"),
  async (req, res) => {
    try {
      const { eventId, userId } = req.params;
      const eventIdNum = parseInt(eventId, 10);
      const userIdNum = parseInt(userId, 10);

      if (isNaN(eventIdNum) || isNaN(userIdNum)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const guest = await prisma.eventGuest.findUnique({
        where: {
          eventId_userId: {
            eventId: eventIdNum,
            userId: userIdNum,
          },
        },
      });

      if (!guest) {
        return res.status(404).json({ error: "Guest not found" });
      }

      await prisma.eventGuest.delete({
        where: {
          eventId_userId: {
            eventId: eventIdNum,
            userId: userIdNum,
          },
        },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("Error removing guest:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/events/:eventId/guests/me",
  jwtMiddleware,
  requireRole("regular"),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const eventIdNum = parseInt(eventId, 10);
      const userId = req.user?.id || req.auth?.id;
      const userUtorid = req.user?.utorid || req.auth?.utorid;

      if (isNaN(eventIdNum)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }

      const event = await prisma.event.findUnique({
        where: { id: eventIdNum },
        include: {
          organizers: true,
          guests: true,
        },
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (!event.published) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (new Date() > event.endTime) {
        return res.status(410).json({ error: "Event has ended" });
      }

      if (event.capacity !== null && event.guests.length >= event.capacity) {
        return res.status(410).json({ error: "Event is full" });
      }

      const isGuest = event.guests.some((g) => g.userId === userId);
      if (isGuest) {
        return res.status(400).json({
          error: "User is already on the guest list",
        });
      }

      await prisma.eventGuest.create({
        data: {
          eventId: eventIdNum,
          userId: userId,
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          utorid: true,
          name: true,
        },
      });

      return res.status(201).json({
        id: event.id,
        name: event.name,
        location: event.location,
        guestAdded: user,
        numGuests: event.guests.length + 1,
      });
    } catch (error) {
      console.error("Error adding self as guest:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.delete(
  "/events/:eventId/guests/me",
  jwtMiddleware,
  requireRole("regular"),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const eventIdNum = parseInt(eventId, 10);
      const userId = req.user?.id || req.auth?.id;

      if (isNaN(eventIdNum)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }

      const event = await prisma.event.findUnique({
        where: { id: eventIdNum },
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (new Date() > event.endTime) {
        return res.status(410).json({ error: "Event has ended" });
      }

      const guest = await prisma.eventGuest.findUnique({
        where: {
          eventId_userId: {
            eventId: eventIdNum,
            userId: userId,
          },
        },
      });

      if (!guest) {
        return res
          .status(404)
          .json({ error: "User did not RSVP to this event" });
      }

      await prisma.eventGuest.delete({
        where: {
          eventId_userId: {
            eventId: eventIdNum,
            userId: userId,
          },
        },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("Error removing self as guest:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/events/:eventId/transactions",
  jwtMiddleware,
  requireRole("regular"),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { type, utorid, amount, remark } = req.body;
      const eventIdNum = parseInt(eventId, 10);
      const currentUserId = req.user?.id || req.auth?.id;
      const currentUserUtorid = req.user?.utorid || req.auth?.utorid;
      const userRole = req.user?.role || req.auth?.role;

      if (isNaN(eventIdNum)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }

      if (type !== "event") {
        return res.status(400).json({ error: "type must be 'event'" });
      }

      if (
        amount === undefined ||
        typeof amount !== "number" ||
        amount <= 0 ||
        !Number.isInteger(amount)
      ) {
        return res.status(400).json({
          error: "amount must be a positive integer",
        });
      }

      const event = await prisma.event.findUnique({
        where: { id: eventIdNum },
        include: {
          organizers: true,
          guests: true,
        },
      });

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const isOrganizer = event.organizers.some(
        (org) => org.userId === currentUserId
      );
      const isManager = ["manager", "superuser"].includes(userRole);

      if (!isManager && !isOrganizer) {
        return res.status(403).json({ error: "Forbidden" });
      }

      if (utorid) {
        const user = await prisma.user.findUnique({
          where: { utorid },
        });

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const isGuest = event.guests.some((g) => g.userId === user.id);
        if (!isGuest) {
          return res.status(400).json({
            error: "User is not on the guest list",
          });
        }

        if (event.pointsRemain < amount) {
          return res.status(400).json({
            error: "Insufficient points remaining",
          });
        }

        const transaction = await prisma.transaction.create({
          data: {
            userId: user.id,
            utorid: user.utorid,
            type: "event",
            amount: amount,
            relatedId: eventIdNum,
            remark: remark || "",
            createdBy: currentUserUtorid,
          },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: {
            points: {
              increment: amount,
            },
          },
        });

        await prisma.event.update({
          where: { id: eventIdNum },
          data: {
            pointsRemain: {
              decrement: amount,
            },
            pointsAwarded: {
              increment: amount,
            },
          },
        });

        return res.status(201).json({
          id: transaction.id,
          recipient: user.utorid,
          awarded: amount,
          type: transaction.type,
          relatedId: transaction.relatedId,
          remark: transaction.remark,
          createdBy: transaction.createdBy,
        });
      } else {
        const totalAmount = amount * event.guests.length;

        if (event.pointsRemain < totalAmount) {
          return res.status(400).json({
            error: "Insufficient points remaining",
          });
        }

        const guestUsers = await prisma.user.findMany({
          where: {
            id: { in: event.guests.map((g) => g.userId) },
          },
        });

        const transactions = [];
        for (const user of guestUsers) {
          const transaction = await prisma.transaction.create({
            data: {
              userId: user.id,
              utorid: user.utorid,
              type: "event",
              amount: amount,
              relatedId: eventIdNum,
              remark: remark || "",
              createdBy: currentUserUtorid,
            },
          });

          await prisma.user.update({
            where: { id: user.id },
            data: {
              points: {
                increment: amount,
              },
            },
          });

          transactions.push({
            id: transaction.id,
            recipient: user.utorid,
            awarded: amount,
            type: transaction.type,
            relatedId: transaction.relatedId,
            remark: transaction.remark,
            createdBy: transaction.createdBy,
          });
        }

        await prisma.event.update({
          where: { id: eventIdNum },
          data: {
            pointsRemain: {
              decrement: totalAmount,
            },
            pointsAwarded: {
              increment: totalAmount,
            },
          },
        });

        return res.status(201).json(transactions);
      }
    } catch (error) {
      console.error("Error creating event transaction:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/promotions",
  jwtMiddleware,
  requireRole("manager"),
  async (req, res) => {
    try {
      const {
        name,
        description,
        type,
        startTime,
        endTime,
        minSpending,
        rate,
        points,
      } = req.body;

      if (!name || !description || !type || !startTime || !endTime) {
        return res.status(400).json({
          error: "name, description, type, startTime, and endTime are required",
        });
      }

      if (type !== "automatic" && type !== "one-time") {
        return res.status(400).json({
          error: "type must be 'automatic' or 'one-time'",
        });
      }

      const prismaType = type === "one-time" ? "one_time" : type;

      const start = new Date(startTime);
      const end = new Date(endTime);
      const now = new Date();

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          error: "Invalid date format",
        });
      }

      if (start < now) {
        return res.status(400).json({
          error: "Start time cannot be in the past",
        });
      }

      if (end <= start) {
        return res.status(400).json({
          error: "End time must be after start time",
        });
      }

      if (minSpending !== undefined && minSpending !== null) {
        if (typeof minSpending !== "number" || minSpending <= 0) {
          return res.status(400).json({
            error: "minSpending must be a positive number",
          });
        }
      }

      if (rate !== undefined && rate !== null) {
        if (typeof rate !== "number" || rate <= 0) {
          return res.status(400).json({
            error: "rate must be a positive number",
          });
        }
      }

      if (points !== undefined && points !== null) {
        if (
          typeof points !== "number" ||
          points < 0 ||
          !Number.isInteger(points)
        ) {
          return res.status(400).json({
            error: "points must be a non-negative integer",
          });
        }
      }

      const promotion = await prisma.promotion.create({
        data: {
          name,
          description,
          type: prismaType,
          startTime: start,
          endTime: end,
          minSpending: minSpending ?? null,
          rate: rate ?? null,
          points: points ?? null,
        },
      });

      const apiType =
        promotion.type === "one_time" ? "one-time" : promotion.type;

      return res.status(201).json({
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: apiType,
        startTime: promotion.startTime,
        endTime: promotion.endTime,
        minSpending: promotion.minSpending,
        rate: promotion.rate,
        points: promotion.points,
      });
    } catch (error) {
      console.error("Error creating promotion:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get(
  "/promotions",
  jwtMiddleware,
  requireRole("regular"),
  async (req, res) => {
    try {
      const { name, type, started, ended, page = 1, limit = 10 } = req.query;

      const userId = req.user?.id || req.auth?.id;
      const userRole = req.user?.role || req.auth?.role;
      const isManager = ["manager", "superuser"].includes(userRole);

      if (started !== undefined && ended !== undefined) {
        return res.status(400).json({
          error: "Cannot specify both started and ended",
        });
      }

      const where = {};
      const now = new Date();

      if (!isManager) {
        where.startTime = { lte: now };
        where.endTime = { gt: now };

        const usedPromotions = await prisma.userPromotion.findMany({
          where: { userId },
          select: { promotionId: true },
        });

        if (usedPromotions.length > 0) {
          where.NOT = {
            id: { in: usedPromotions.map((up) => up.promotionId) },
          };
        }
      } else {
        if (started !== undefined) {
          const hasStarted = started === "true" || started === true;
          if (hasStarted) {
            where.startTime = { lte: now };
          } else {
            where.startTime = { gt: now };
          }
        }

        if (ended !== undefined) {
          const hasEnded = ended === "true" || ended === true;
          if (hasEnded) {
            where.endTime = { lte: now };
          } else {
            where.endTime = { gt: now };
          }
        }
      }

      if (name) {
        where.name = { contains: name };
      }

      if (type) {
        const prismaType = type === "one-time" ? "one_time" : type;
        where.type = prismaType;
      }

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;

      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({ error: "Invalid page parameter" });
      }
      if (isNaN(limitNum) || limitNum < 1) {
        return res.status(400).json({ error: "Invalid limit parameter" });
      }

      const skip = (pageNum - 1) * limitNum;

      const count = await prisma.promotion.count({ where });
      const promotions = await prisma.promotion.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { id: "desc" },
      });
      const results = promotions.map((promo) => {
        const apiType = promo.type === "one_time" ? "one-time" : promo.type;

        const result = {
          id: promo.id,
          name: promo.name,
          type: apiType,
          endTime: promo.endTime,
          minSpending: promo.minSpending,
          rate: promo.rate,
          points: promo.points,
        };

        if (isManager) {
          result.startTime = promo.startTime;
        }

        return result;
      });

      return res.status(200).json({ count, results });
    } catch (error) {
      console.error("Error fetching promotions:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get(
  "/promotions/:promotionId",
  jwtMiddleware,
  requireRole("regular"),
  async (req, res) => {
    try {
      const { promotionId } = req.params;
      const promotionIdNum = parseInt(promotionId, 10);
      const userRole = req.user?.role || req.auth?.role;
      const isManager = ["manager", "superuser"].includes(userRole);

      if (isNaN(promotionIdNum)) {
        return res.status(400).json({ error: "Invalid promotion ID" });
      }

      const promotion = await prisma.promotion.findUnique({
        where: { id: promotionIdNum },
      });

      if (!promotion) {
        return res.status(404).json({ error: "Promotion not found" });
      }

      const now = new Date();
      if (!isManager) {
        if (promotion.startTime > now || promotion.endTime <= now) {
          return res.status(404).json({ error: "Promotion not found" });
        }
      }

      const apiType =
        promotion.type === "one_time" ? "one-time" : promotion.type;

      const response = {
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: apiType,
        endTime: promotion.endTime,
        minSpending: promotion.minSpending,
        rate: promotion.rate,
        points: promotion.points,
      };

      if (isManager) {
        response.startTime = promotion.startTime;
      }

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching promotion:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.patch(
  "/promotions/:promotionId",
  jwtMiddleware,
  requireRole("manager"),
  async (req, res) => {
    try {
      const { promotionId } = req.params;
      const promotionIdNum = parseInt(promotionId, 10);

      if (isNaN(promotionIdNum)) {
        return res.status(400).json({ error: "Invalid promotion ID" });
      }

      const {
        name,
        description,
        type,
        startTime,
        endTime,
        minSpending,
        rate,
        points,
      } = req.body;

      const promotion = await prisma.promotion.findUnique({
        where: { id: promotionIdNum },
      });

      if (!promotion) {
        return res.status(404).json({ error: "Promotion not found" });
      }

      const updateData = {};
      const now = new Date();

      const hasStarted = promotion.startTime <= now;
      const hasEnded = promotion.endTime <= now;

      if (name !== undefined) {
        if (hasStarted) {
          return res.status(400).json({
            error: "Cannot update name after promotion has started",
          });
        }
        updateData.name = name;
      }

      if (description !== undefined) {
        if (hasStarted) {
          return res.status(400).json({
            error: "Cannot update description after promotion has started",
          });
        }
        updateData.description = description;
      }

      if (type !== undefined) {
        if (hasStarted) {
          return res.status(400).json({
            error: "Cannot update type after promotion has started",
          });
        }
        if (type !== "automatic" && type !== "one-time") {
          return res.status(400).json({
            error: "type must be 'automatic' or 'one-time'",
          });
        }
        const prismaType = type === "one-time" ? "one_time" : type;
        updateData.type = prismaType;
      }

      if (startTime !== undefined) {
        if (hasStarted) {
          return res.status(400).json({
            error: "Cannot update start time after promotion has started",
          });
        }

        const newStartTime = new Date(startTime);
        if (isNaN(newStartTime.getTime())) {
          return res.status(400).json({ error: "Invalid start time format" });
        }

        if (newStartTime < now) {
          return res.status(400).json({
            error: "Start time cannot be in the past",
          });
        }

        const newEndTime = endTime ? new Date(endTime) : promotion.endTime;
        if (newEndTime <= newStartTime) {
          return res.status(400).json({
            error: "End time must be after start time",
          });
        }

        updateData.startTime = newStartTime;
      }

      if (endTime !== undefined) {
        if (hasEnded) {
          return res.status(400).json({
            error: "Cannot update end time after promotion has ended",
          });
        }

        const newEndTime = new Date(endTime);
        if (isNaN(newEndTime.getTime())) {
          return res.status(400).json({ error: "Invalid end time format" });
        }

        if (newEndTime < now) {
          return res.status(400).json({
            error: "End time cannot be in the past",
          });
        }

        const newStartTime = startTime
          ? new Date(startTime)
          : promotion.startTime;
        if (newEndTime <= newStartTime) {
          return res.status(400).json({
            error: "End time must be after start time",
          });
        }

        updateData.endTime = newEndTime;
      }

      if (minSpending !== undefined) {
        if (hasStarted) {
          return res.status(400).json({
            error: "Cannot update minSpending after promotion has started",
          });
        }
        if (minSpending !== null) {
          if (typeof minSpending !== "number" || minSpending <= 0) {
            return res.status(400).json({
              error: "minSpending must be a positive number",
            });
          }
        }
        updateData.minSpending = minSpending;
      }

      if (rate !== undefined) {
        if (hasStarted) {
          return res.status(400).json({
            error: "Cannot update rate after promotion has started",
          });
        }
        if (rate !== null) {
          if (typeof rate !== "number" || rate <= 0) {
            return res.status(400).json({
              error: "rate must be a positive number",
            });
          }
        }
        updateData.rate = rate;
      }

      if (points !== undefined) {
        if (hasStarted) {
          return res.status(400).json({
            error: "Cannot update points after promotion has started",
          });
        }
        if (points !== null) {
          if (
            typeof points !== "number" ||
            points < 0 ||
            !Number.isInteger(points)
          ) {
            return res.status(400).json({
              error: "points must be a non-negative integer",
            });
          }
        }
        updateData.points = points;
      }

      const updatedPromotion = await prisma.promotion.update({
        where: { id: promotionIdNum },
        data: updateData,
      });

      const apiType =
        updatedPromotion.type === "one_time"
          ? "one-time"
          : updatedPromotion.type;

      const response = {
        id: updatedPromotion.id,
        name: updatedPromotion.name,
        type: apiType,
      };

      if (description !== undefined)
        response.description = updatedPromotion.description;
      if (startTime !== undefined)
        response.startTime = updatedPromotion.startTime;
      if (endTime !== undefined) response.endTime = updatedPromotion.endTime;
      if (minSpending !== undefined)
        response.minSpending = updatedPromotion.minSpending;
      if (rate !== undefined) response.rate = updatedPromotion.rate;
      if (points !== undefined) response.points = updatedPromotion.points;

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error updating promotion:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.delete(
  "/promotions/:promotionId",
  jwtMiddleware,
  requireRole("manager"),
  async (req, res) => {
    try {
      const { promotionId } = req.params;
      const promotionIdNum = parseInt(promotionId, 10);

      if (isNaN(promotionIdNum)) {
        return res.status(400).json({ error: "Invalid promotion ID" });
      }

      const promotion = await prisma.promotion.findUnique({
        where: { id: promotionIdNum },
      });

      if (!promotion) {
        return res.status(404).json({ error: "Promotion not found" });
      }

      const now = new Date();
      if (promotion.startTime <= now) {
        return res.status(403).json({
          error: "Cannot delete promotion that has already started",
        });
      }

      await prisma.promotion.delete({
        where: { id: promotionIdNum },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting promotion:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next(err);
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on("error", (err) => {
  console.error(`cannot start server: ${err.message}`);
  process.exit(1);
});
