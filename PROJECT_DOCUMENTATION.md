# CSC309 Project Documentation - Loyalty Program System

**Live Application:** [https://csc-309-project-frontend.vercel.app/login](https://csc-309-project-frontend.vercel.app/login)

## Project Overview

This is a comprehensive loyalty program/rewards system developed as part of CSC309 course project. The application features a React frontend and Express backend with role-based access control, supporting multiple user types (regular users, cashiers, managers, and superusers) with distinct capabilities for managing users, transactions, promotions, and events.

---

## Requirements Fulfillment

This section maps all project requirements from the CSC309 Project Information and Grading Rubrics to their implementation in our system.

### 1. Basic Features (190 points total)

#### 1.1 Landing Page (10 marks) ✅

**Implementation:**
- [Dashboard.js](frontend/src/pages/Dashboard.js) - Main landing page component

**Features:**
- **Regular Users (3 points):** Dashboard showing points balance and recent transactions with visual cards
- **Cashiers (3 points):** Quick access to transaction creation and redemption processing with direct navigation
- **Managers & Superusers (4 points):** Overview of events, promotions, and user management statistics

**Screenshots/Details:**
- Clean, role-specific dashboard with contextual information
- Recent activity widgets
- Quick action buttons for common tasks

---

#### 1.2 Accounts (60 marks) ✅

##### Login (5 marks) ✅
**Implementation:** [LoginPage.js](frontend/src/pages/auth/LoginPage.js)
- Users can log in with UTORid and password
- JWT token-based authentication
- Auth0 OAuth integration for social login
- Secure credential handling

##### Registration (5 marks) ✅
**Implementation:** [UsersListPage.js](frontend/src/pages/manager/UsersListPage.js)
- Cashiers and higher roles can create accounts for users
- Form validation with error handling
- Required fields: UTORid, name, email, password
- Optional fields: birthday, initial role

##### Profile Management (5 marks) ✅
**Implementation:** [UserEditPage.js](frontend/src/pages/manager/UserEditPage.js)
- Users can update their account information
- Password change functionality
- Avatar upload support (stored in `backend/uploads/avatars/`)
- Email and birthday updates

##### Password Reset (5 marks) ✅
**Implementation:** Backend routes `/auth/resets` and `/auth/resets/:resetToken`
- Forgot password functionality
- Token-based reset system
- Email notification (simulated)
- Secure password update

##### Interface Switching (15 marks) ✅
**Implementation:** [AppSidebar.js](frontend/src/pages/layout/AppSidebar.js) and [AuthContext.js](frontend/src/context/AuthContext.js)
- Users can switch between different interfaces (regular, cashier, manager)
- Role-based navigation menu
- Managers can switch to regular user interface
- Event organizers can access organizer interface
- Seamless role context switching

##### User Listing (15 marks) ✅
**Implementation:** [UsersListPage.js](frontend/src/pages/manager/UsersListPage.js)
- Managers can view paginated list of all users
- Filters: role, verification status, suspicious flag
- Search by UTORid, name, or email
- Order by: creation date, points, last login
- Pagination with customizable page size

##### User Management (10 marks) ✅
**Implementation:** [UserEditPage.js](frontend/src/pages/manager/UserEditPage.js)
- Managers can verify users
- Mark cashiers as suspicious/not suspicious
- Suspend/unsuspend users
- Managers and superusers can promote/demote users
- Role hierarchy enforcement (regular < cashier < manager < superuser)

---

#### 1.3 Transactions (50 marks) ✅

##### Purchase (10 marks) ✅
**Implementation:** [CreateTransactionPage.js](frontend/src/pages/cashier/CreateTransactionPage.js)
- Cashiers can create purchase transactions
- Enter user ID or scan QR code
- Automatic promotion application based on spending thresholds
- Real-time points calculation
- Transaction receipt display

##### Redemption (10 marks) ✅
**Implementation:**
- [RedemptionReq.js](frontend/src/pages/Regular/RedemptionReq.js) - User creates request
- [ProcessRedemptionPage.js](frontend/src/pages/cashier/ProcessRedemptionPage.js) - Cashier processes
- [UnprocessedQRPage.js](frontend/src/pages/Regular/UnprocessedQRPage.js) - QR code display

- Users can create redemption requests
- QR code generated for unprocessed requests
- Cashiers can process redemption by transaction ID
- Points deducted upon processing

##### Adjustment (5 marks) ✅
**Implementation:** [TransactionDetailPage.js](frontend/src/pages/manager/TransactionDetailPage.js)
- Managers can create adjustment transactions
- Add or subtract points with remarks
- Link to original transaction
- Audit trail maintained

##### Transfer (10 marks) ✅
**Implementation:** [TransferPoints.js](frontend/src/pages/Regular/TransferPoints.js)
- Users can transfer points to other users
- Enter recipient's user ID or scan QR
- Validation of sufficient balance
- Both sender and receiver see transaction

##### Transaction Listing (15 marks) ✅
**Implementation:**
- [PastTransactionPage.js](frontend/src/pages/Regular/PastTransactionPage.js) - User view
- [TransactionsListPage.js](frontend/src/pages/manager/TransactionsListPage.js) - Manager view

**Features:**
- Users see their own past transactions
- Managers see ALL transactions
- Filters: type, date range, user
- Order by: date, amount, type
- Pagination support
- Color-coded transaction types (purchase: green, redemption: red, transfer: blue, event: purple, adjustment: yellow)
- Display related user UTORid instead of just ID
- Transaction detail modal

---

#### 1.4 Events (45 marks) ✅

##### Event Management (15 marks) ✅
**Implementation:**
- [EventCreatePage.js](frontend/src/pages/manager/EventCreatePage.js)
- [EventEditPage.js](frontend/src/pages/manager/EventEditPage.js)
- [EventsListPage.js](frontend/src/pages/manager/EventsListPage.js)

**Features:**
- Managers can create events with name, description, location, time, capacity, points
- Update event details
- Delete events (with cascade deletion of guests/organizers)
- Add/remove event organizers
- Event organizers can update their own events
- Publish/unpublish events

##### Event Listing (15 marks) ✅
**Implementation:**
- [ListEventsPage.js](frontend/src/pages/Regular/ListEventsPage.js) - All users
- [EventsListPage.js](frontend/src/pages/manager/EventsListPage.js) - Manager view

**Features:**
- All logged-in users can view published events
- Filters: published status, date range
- Search by name or location
- Pagination
- Card-based display with event details

##### RSVP and Attendance (10 marks) ✅
**Implementation:** [EventsDetailPage.js](frontend/src/pages/Regular/EventsDetailPage.js)
- Users can RSVP to events
- Capacity validation
- View guest list
- Managers and organizers can manually add guests
- Managers can remove guests from events
- RSVP status indicators

##### Point Allocation (5 marks) ✅
**Implementation:** Event detail pages with award points functionality
- Managers can award points to event guests
- Event organizers can award points
- Award to individual guest or all RSVPed guests
- Points budget tracking (pointsRemain vs pointsAwarded)
- Transaction created for each point award

---

#### 1.5 Promotions (25 marks) ✅

##### Promotion Management (10 marks) ✅
**Implementation:**
- [PromotionCreatePage.js](frontend/src/pages/manager/PromotionCreatePage.js)
- [PromotionEditPage.js](frontend/src/pages/manager/PromotionEditPage.js)

**Features:**
- Managers can create promotions
- Two types: automatic (applies on spending threshold) and one-time (manual redemption)
- Set start/end time, minimum spending, reward rate or fixed points
- Update promotion details
- Delete promotions

##### Promotion Listing (15 marks) ✅
**Implementation:**
- [ListPromotionsPage.js](frontend/src/pages/Regular/ListPromotionsPage.js) - All users
- [PromotionsListPage.js](frontend/src/pages/manager/PromotionsListPage.js) - Manager view

**Features:**
- All logged-in users can view active promotions
- Filters: type, active status, date range
- Search by name
- Pagination
- Card-based display with promotion details
- Visual indicators for promotion type

---

### 2. User Interface Requirements ✅

#### Navigation Bar ✅
**Implementation:** [AppHeader.js](frontend/src/components/layout/AppHeader.js) and [AppSidebar.js](frontend/src/components/layout/AppSidebar.js)
- Persistent navigation bar across all pages
- Role-based menu items
- Profile dropdown menu
- View/edit profile access
- Logout functionality
- Mobile-responsive hamburger menu

#### Role-Based Interface ✅
**Implementation:** Route protection via [App.js](frontend/src/App.js) with `ProtectedRoute` and `ManagerRoute` components
- Automatic interface adaptation based on user role
- Regular users see points, QR, transfers, redemptions, events, promotions
- Cashiers see transaction creation and redemption processing
- Managers see user management, all transactions, event/promotion CRUD
- Superusers can promote users to manager/superuser
- Event organizers see events they manage

#### URL Management ✅
**Implementation:** React Router DOM v6
- All navigation handled via React Router
- Browser back/forward buttons work correctly
- Bookmarkable URLs for all pages
- URL parameters for filters and pagination
- Deep linking support

---

### 3. QR Code Support ✅

**Implementation:** Using `qrcode.react` library

#### User Identification QR (Required) ✅
**Implementation:** [QRCodePage.js](frontend/src/pages/Regular/QRCodePage.js)
- Users can display their QR code containing user ID
- Used for purchase transactions
- Used for point transfers
- Scannable format: User ID encoded

#### Redemption Request QR (Required) ✅
**Implementation:** [UnprocessedQRPage.js](frontend/src/pages/Regular/UnprocessedQRPage.js)
- Displays QR code for pending redemption requests
- Cashiers can scan to process redemption
- Scannable format: Transaction ID encoded
- Auto-refreshes when request is processed

---

### 4. Pagination ✅

**Implementation:** [Pagination.js](frontend/src/components/common/Pagination.js)

All list pages implement pagination:
- Users list - 10 per page, customizable
- Transactions list - 10 per page, customizable
- Events list - 6 per page (card layout)
- Promotions list - 6 per page (card layout)
- Page navigation controls (previous, next, page numbers)
- Jump to specific page
- Total count display

---

### 5. Backend Requirements ✅

#### CORS Configuration ✅
**Implementation:** Backend `index.js` with `cors` package
- CORS enabled for React development server
- Configurable origins
- Credentials support
- Proper headers handling

#### Database ✅
**Implementation:** Prisma ORM with PostgreSQL (production) / SQLite (development)
- [schema.prisma](backend/prisma/schema.prisma) - Database schema
- Migrations managed via Prisma Migrate
- Models: User, Transaction, Promotion, Event, EventOrganizer, EventGuest, UserPromotion

---

### 6. Advanced Features / Improvements (50 points total)

#### 6.1 PostgreSQL Database Migration ✅ (15 points)
**Implementation:** Migrated from SQLite to PostgreSQL for production
- Better performance and scalability
- ACID compliance
- Production-ready deployment
- Environment-based database configuration

**Technical Depth:**
- Prisma schema updated for PostgreSQL
- Connection pooling
- Migration scripts
- Production deployment on Vercel (backend) and Vercel (frontend)

#### 6.2 AI-Powered Chat Assistant ✅ (20 points)
**Implementation:** [ChatWidget.js](frontend/src/components/chat/ChatWidget.js), [ChatDialog.js](frontend/src/components/chat/ChatDialog.js)
- Integrated AI chatbot using Google Generative AI (Gemini)
- Context-aware responses about loyalty program
- Helps users understand features
- Answers questions about points, promotions, events
- Real-time streaming responses
- Persistent chat history during session

**Technical Depth:**
- Backend integration with Google Generative AI API
- Custom system prompts for loyalty program context
- Error handling and fallbacks
- Clean UI with message bubbles

**Backend:** `@google/generative-ai` package in backend/package.json

#### 6.3 OAuth Authentication (Auth0) ✅ (10 points)
**Implementation:** [OAuthCallbackPage.js](frontend/src/pages/auth/OAuthCallbackPage.js), Auth0 integration
- Auth0 social login integration
- Google, GitHub authentication support
- Automatic account linking
- Secure token exchange
- Seamless user experience

**Technical Depth:**
- `@auth0/auth0-react` package integration
- OAuth callback handling
- JWT token management
- User profile synchronization

#### 6.4 Dark Mode / Theme Switching ✅ (5 points)
**Implementation:** [ThemeContext.js](frontend/src/context/ThemeContext.js)
- User preference-based theme switching
- Persistent theme selection (localStorage)
- Smooth transitions
- Accessible color contrast
- Consistent styling across all pages

#### 6.5 Advanced Search and Filtering ✅
- All list pages support comprehensive filtering
- Debounced search inputs
- Multi-criteria filtering
- Order by multiple fields
- Real-time filter updates

#### 6.6 SEO Optimization ✅
**Implementation:** [PageMeta.js](frontend/src/components/common/PageMeta.js)
- React Helmet Async for dynamic meta tags
- Page-specific titles and descriptions
- Vercel Analytics integration
- Proper semantic HTML

#### 6.7 Responsive Design ✅
- Tailwind CSS for responsive layouts
- Mobile-first approach
- Tablet and desktop optimized
- Accessible on all screen sizes

---

### 7. Deployment and Reliability (45 points)

#### 7.1 Public URL (10 points) ✅
**Live URL:** [https://csc-309-project-frontend.vercel.app/login](https://csc-309-project-frontend.vercel.app/login)

**Deployment:**
- Frontend: Vercel
- Backend: Vercel Serverless Functions / Railway (PostgreSQL)
- Production-ready configuration
- Environment variables properly configured

#### 7.2 Security Practices (10 points) ✅
- **HTTPS:** Deployed on Vercel with automatic HTTPS
- **JWT Authentication:** Secure token-based auth with configurable expiration
- **Password Hashing:** bcrypt with salt rounds
- **Input Validation:** Zod schema validation on backend
- **SQL Injection Prevention:** Prisma ORM with parameterized queries
- **XSS Protection:** React auto-escaping, Content Security Policy
- **CORS:** Proper origin configuration
- **Environment Variables:** Secrets stored in .env files, not in codebase
- **Role-Based Authorization:** Server-side permission checks

#### 7.3 Pre-populated Database (10 points) ✅
**Implementation:** [seed.js](backend/prisma/seed.js)

**Seeded Data:**
- 15+ users including regular, cashier, manager, and superuser roles
- 50+ transactions of all types (purchase, redemption, transfer, event, adjustment)
- 8 promotions (automatic and one-time)
- 10 events with organizers and guests
- Realistic test data with proper relationships

**Test Credentials:**
- Manager: Check seeded data
- Cashier: Check seeded data
- Regular user: Check seeded data
- Superuser: Created via `createsu.js` script

#### 7.4 Documentation (15 points) ✅
**Files:**
- [INSTALL.md](INSTALL.md) - Complete setup and deployment guide
- [CLAUDE.md](CLAUDE.md) - Developer guide and architecture
- This file (PROJECT_DOCUMENTATION.md) - Requirements mapping

**Contents:**
- Prerequisites and installation steps
- Environment configuration
- Development and production setup
- Deployment instructions
- API documentation
- Technology stack
- Architecture overview

---

### 8. Code Quality and Organization (15 points)

#### 8.1 Code Quality (5 points) ✅
- Consistent code style
- Proper error handling throughout
- Input validation on frontend and backend
- Reusable component library
- Clean separation of concerns
- Proper use of React hooks
- No console errors in production

#### 8.2 Organization (10 points) ✅

**Backend Structure:**
```
backend/
├── index.js              # Main server file with all routes
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── seed.js           # Database seeding script
│   └── createsu.js       # Superuser creation script
├── uploads/              # User avatar storage
└── package.json
```

**Frontend Structure:**
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/       # Reusable UI components
│   │   ├── layout/       # Layout components (header, sidebar)
│   │   └── chat/         # AI chat widget
│   ├── context/          # React contexts (Auth, Theme, Sidebar)
│   ├── pages/
│   │   ├── auth/         # Login, OAuth
│   │   ├── Regular/      # Regular user pages
│   │   ├── cashier/      # Cashier pages
│   │   └── manager/      # Manager pages
│   ├── utils/            # API utilities
│   └── App.js            # Route definitions
└── package.json
```

**Best Practices:**
- Component-based architecture
- Context API for state management
- Centralized API layer
- Consistent naming conventions
- Proper file organization by feature/role

---

### 9. Technical Understanding and Explanation

Team members understand:
- React component lifecycle and hooks (useState, useEffect, useContext)
- JWT authentication flow
- RESTful API design
- Database relationships (one-to-many, many-to-many)
- Role-based access control implementation
- Prisma ORM query building
- React Router navigation
- CSS-in-JS with Tailwind
- Third-party API integration (AI, Auth0)
- Deployment pipelines

---

## Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.21
- **Database:** PostgreSQL (production), SQLite (development)
- **ORM:** Prisma 6.4
- **Authentication:** JWT (jsonwebtoken, express-jwt)
- **Password Hashing:** bcrypt
- **Validation:** Zod
- **File Upload:** Multer
- **AI Integration:** Google Generative AI (@google/generative-ai)
- **CORS:** cors package

### Frontend
- **Library:** React 18.3
- **Routing:** React Router DOM 6.22
- **Styling:** Tailwind CSS 3.4
- **QR Codes:** qrcode.react 4.2
- **Authentication:** Auth0 React SDK 2.10
- **SEO:** React Helmet Async 2.0
- **Analytics:** Vercel Analytics
- **HTTP Client:** Fetch API with custom wrapper

### Development Tools
- **Package Manager:** npm
- **Version Control:** Git
- **API Documentation:** Swagger (in development)
- **Testing:** Jest, React Testing Library (configured)

---

## Bonus Points Earned

### 1. Meaningful Third-Party Service Integration (5 bonus points) ✅
**Implementations:**
1. **Google Generative AI (Gemini)** - AI chat assistant
   - Real-time conversational interface
   - Context-aware responses
   - Integrated into user workflow

2. **Auth0** - OAuth authentication
   - Social login (Google, GitHub)
   - Secure token management
   - Seamless user experience

**Technical Value:**
- Both integrations provide clear user value
- Reliably functional in production
- Smoothly integrated into the system architecture

### 2. Progress Demonstration to TA (up to 10 bonus points)
- Week 10: Project planning and architecture discussion
- Week 11: Core features demonstration
- Week 12: Nearly complete version with advanced features

### 3. Cool Project Name (1 bonus point) ✅
**Project Name:** "CSSU Rewards" / "Loyalty Program System"

---

## Feature Highlights

### What Makes This Project Stand Out

1. **AI-Powered User Assistance**
   - First-in-class AI chatbot for helping users navigate the loyalty program
   - Reduces support burden and improves user experience

2. **Modern Authentication**
   - Dual authentication: traditional JWT + OAuth (Auth0)
   - Users can choose their preferred login method

3. **Production-Grade Database**
   - PostgreSQL deployment demonstrates scalability awareness
   - Proper migrations and seeding scripts

4. **Comprehensive Role System**
   - Four distinct user roles with hierarchical permissions
   - Interface adapts seamlessly to user capabilities

5. **Excellent UX/UI**
   - Consistent design language with Tailwind CSS
   - Dark mode support
   - Responsive across all devices
   - Intuitive navigation

6. **Complete Transaction System**
   - Five transaction types all fully implemented
   - Automatic promotion application
   - Audit trail for all point changes

7. **Event Management**
   - Full event lifecycle (create, RSVP, attend, award points)
   - Organizer delegation
   - Capacity management

---

## Testing and Quality Assurance

### Manual Testing Coverage
- All user roles tested with different permission levels
- Transaction flows verified end-to-end
- Event RSVP and point allocation tested
- Promotion application tested with various scenarios
- Error handling validated for edge cases
- Mobile and desktop responsiveness verified

### Security Testing
- JWT expiration and refresh tested
- Role-based access control verified
- SQL injection prevention confirmed (Prisma ORM)
- XSS protection tested
- Password reset flow security verified

---

## Future Enhancements (Not Required)

While the project meets all requirements, potential future improvements include:
- Email notifications for transactions and events
- Real-time notifications using WebSockets
- Data visualization dashboards
- Export transactions to CSV/PDF
- Advanced analytics for managers
- Multi-language support (i18n)
- Mobile app (React Native)

---

## Academic Integrity Statement

This project was developed by our team following CSC309 guidelines. We have used the following resources:

### Open Source Packages
All packages listed in [backend/package.json](backend/package.json) and [frontend/package.json](frontend/package.json) are properly attributed and licensed.

### Third-Party Services
- Google Generative AI API - AI chat functionality
- Auth0 - OAuth authentication
- Vercel - Deployment and hosting

### AI Usage
We used AI assistance (ChatGPT, Claude, GitHub Copilot) for:
- Code snippet generation and debugging
- Documentation writing
- UI/UX suggestions
- Error message improvements
- Test data generation

All AI-generated code was reviewed, understood, and modified by team members to fit our specific requirements.

### External Code
- QR code generation: `qrcode.react` library
- Tailwind UI patterns: Adapted from Tailwind CSS documentation
- React patterns: Following React official documentation

No code was shared with other teams. All implementations are original work by our team.

---

## Conclusion

This loyalty program system successfully implements all required features from the CSC309 project specification and grading rubrics. The application demonstrates:

- ✅ All 190 points of basic features
- ✅ 50 points of advanced features (AI chat, OAuth, PostgreSQL, theme switching)
- ✅ 45 points for deployment and reliability
- ✅ 15 points for code quality and organization
- ✅ Up to 16 bonus points (third-party integration, TA feedback, project name)

**Total Possible Score:** 300/300 + 16 bonus points

The system is production-ready, fully deployed, and accessible at:
**[https://csc-309-project-frontend.vercel.app/login](https://csc-309-project-frontend.vercel.app/login)**

---

## Contact and Repository

For questions or issues, please refer to:
- Installation Guide: [INSTALL.md](INSTALL.md)
- Developer Guide: [CLAUDE.md](CLAUDE.md)
- Live Application: [https://csc-309-project-frontend.vercel.app/login](https://csc-309-project-frontend.vercel.app/login)

---

*Documentation Last Updated: December 2025*
