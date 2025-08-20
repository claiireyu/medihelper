# MediHelper - Intelligent Medication Management System

A full-stack web application designed to help users, especially seniors, manage their medications with intelligent refill scheduling, AI-powered schedule parsing, and comprehensive medication tracking.

## Features

### Core Functionality
- **Medication Inventory Management** - Track medications with photos, dosages, and schedules
- **Intelligent Refill Scheduling** - AI-powered calculations considering medication schedules and consumption patterns
- **Multi-tier Alert System** - 14, 7, 3, and 1-day refill reminders with priority levels
- **Photo Upload & Storage** - Secure medication photo management with Multer
- **Schedule-Aware Calculations** - Determines actual consumption rates vs. pharmacy estimates

### Advanced Features
- **OAuth Authentication** - Google OAuth integration for secure user access
- **AI-Powered Text Extraction** - Google Generative AI for parsing medication labels
- **Pill Verification** - Image analysis for medication identification
- **Push Notifications** - Real-time refill and medication reminders
- **Internationalization** - Multi-language support for accessibility
- **Responsive Design** - Mobile-first approach with Tailwind CSS

## Tech Stack

### Backend
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **Database**: PostgreSQL with connection pooling
- **Authentication**: Passport.js with Google OAuth 2.0
- **File Handling**: Multer for secure file uploads
- **AI Integration**: Google Generative AI API
- **Testing**: Jest with comprehensive test suites
- **Caching**: Custom schedule caching layer

### Frontend
- **Framework**: React 19 with modern hooks
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Internationalization**: Custom i18n implementation

## Prerequisites

- Node.js 20.x (use `nvm use` to switch to the correct version)
- PostgreSQL 12+
- Google OAuth 2.0 credentials (optional for local development)
- Google Generative AI API key (optional for local development)

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/medihelper.git
cd medihelper
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.template .env
```

Edit `.env` with your configuration (the template includes all required fields):
```env
# Database Configuration
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=medihelper
DB_PASSWORD=your_db_password
DB_PORT=5432

# Session Secret (required)
SESSION_SECRET=your_session_secret

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5174

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback

# Google AI (Gemini)
GEMINI_API_KEY=your_gemini_api_key
```

**Note:** Google OAuth and Gemini AI keys are optional for local development. Without them:
- **Gemini AI**: Photo extraction will use fallback values ("Unknown Medication", etc.) and require manual entry

### 3. Database Setup
```sql
CREATE DATABASE medihelper;
```

**For testing:** If you plan to run integration tests, also create a test database:
```sql
CREATE DATABASE medihelper_tests;
```
Then add to your `.env`:
```env
TEST_DB_NAME=medihelper_tests
TEST_DB_USER=your_db_user
TEST_DB_PASSWORD=your_db_password
TEST_DB_HOST=localhost
TEST_DB_PORT=3000
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

### 5. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Backend will start on http://localhost:8000

# Terminal 2 - Frontend  
cd frontend
npm run dev
# Frontend will start on http://localhost:5174
```

**Note:** The backend CORS is configured for frontend port 5174. If you use a different port, update the `FRONTEND_URL` in your `.env` file.

## Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm run lint
```

## Project Structure

```
medihelper/
├── backend/
│   ├── services/           # Core business logic
│   │   ├── deterministicScheduleParser.js    # AI schedule parsing
│   │   ├── refillCalculationService.js       # Refill algorithms
│   │   └── persistentScheduleService.js      # Caching layer
│   ├── cache/              # Caching mechanisms
│   ├── config/             # Configuration files
│   ├── test/               # Comprehensive test suites
│   └── server.js           # Express server
├── frontend/
│   ├── add-medication.html # Medication management
│   ├── schedule.html       # Schedule viewing
│   ├── refill-dashboard.html # Refill tracking
│   └── history.html        # Medication history
└── README.md
```

## API Endpoints

### Authentication
- `GET /api/auth/user` — Get current authenticated user
- `POST /api/auth/logout` — Log out the current user

### Medications
- `GET /api/medications` — List user medications
- `POST /api/medications` — Add new medication (supports photo upload)
- `PUT /api/medications/:id` — Update medication
- `DELETE /api/medications/:id` — Remove medication
- `GET /api/medications/:id/history` — Medication history
- `GET /api/medications/:id/refills` — List refills for a medication

### Refills
- `GET /api/medications/:id/refill-status` — Refill status for a medication
- `GET /api/medications/:id/refill-calculation` — Calculation details for a medication
- `POST /api/medications/:id/refill-reminders` — Generate refill reminders for a medication
- `GET /api/refill-reminders` — List refill reminders (supports filtering by medication_id)
- `PUT /api/refill-reminders/:id/status` — Update a reminder status
- `GET /api/dashboard/refills` — Dashboard view of upcoming refills

### Schedules
- `GET /api/medications/schedule` — Schedule for a given date
- `POST /api/schedule/warm-cache` — Warm schedule cache for a date range

### Dose Logging
- `POST /api/record-dose-with-photo` — Record a dose with photo evidence
- `GET /api/dose-log/history` — Dose log history

### Other
- `GET /api/dashboard/stats` — Dashboard statistics
- `GET /api/next-dose` — Next upcoming dose for the user
- `GET /api/medication-eligibility` — Check if a medication is eligible to verify now
- `POST /api/preview-medication` — Parse/preview medication details before saving

## Core Algorithms

### Deterministic Schedule Parser
The `DeterministicScheduleParser` service converts natural language medication schedules into mathematical models:

```javascript
// Example: "Take twice daily with meals"
// Converts to: consumption rate = 2 doses/day
// Enables accurate refill date calculations
```

### Refill Calculation Service
Intelligent refill scheduling considering:
- Medication schedules vs. pharmacy estimates
- Consumption rate variations
- Multi-tier reminder system
- Supply forecasting


## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.


