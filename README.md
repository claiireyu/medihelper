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

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Google OAuth 2.0 credentials
- Google Generative AI API key

## 🚀 Installation

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

Edit `.env` with your configuration:
```env
# Database Configuration
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=medihelper
DB_PASSWORD=your_db_password
DB_PORT=5432

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google AI
GOOGLE_AI_API_KEY=your_google_ai_key

# Session Secret
SESSION_SECRET=your_session_secret
```

### 3. Database Setup
```sql
CREATE DATABASE medihelper;
-- Run your database schema (contact maintainer for schema details)
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

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

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

## 📁 Project Structure

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

## 🔧 API Endpoints

### Authentication
- `POST /auth/google` - Google OAuth authentication
- `GET /auth/logout` - User logout

### Medications
- `GET /api/medications` - List user medications
- `POST /api/medications` - Add new medication
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Remove medication

### Refills
- `GET /api/refills/status` - Get refill status summary
- `GET /api/refills/reminders` - Get refill reminders
- `POST /api/refills/calculate` - Calculate refill dates

### Schedules
- `POST /api/schedules/parse` - Parse medication schedule
- `GET /api/schedules/:id` - Get schedule details

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


