# MediHelper Backend API

## Overview

MediHelper is a medication management API that uses AI to extract medication information from photos and track dose intake. The system uses Google Gemini for both image analysis and intelligent text parsing.

## Features

- **AI-powered medication extraction** from photos using OCR + LLM
- **Pill verification** to ensure users actually take their medication
- **User-specific medication tracking** with dose history
- **Automatic dose logging** when pills are detected in photos

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Google Gemini API Setup
- Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Add it to your `.env` file

### 3. Environment Variables
Create a `.env` file in the backend directory:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Database Setup
Run the simplified database schema:
```bash
psql -U postgres -d medihelper -f backend/simplified-database.sql
```

## API Endpoints

### Medication Management

#### `POST /api/preview-medication`
**Purpose:** Preview medication extraction without saving to database

**Request:**
- `photo` (file): Image of medication label

**Response:**
```json
{
  "success": true,
  "message": "Medication information extracted successfully",
  "extractedInfo": {
    "medicationName": "Aspirin",
    "dosage": "500 mg",
    "schedule": "once daily"
  },
  "rawText": "Take Aspirin 500mg once daily..."
}
```

#### `POST /api/medications`
**Purpose:** Add medication to database with AI extraction

**Request:**
- `photo` (file): Image of medication label (required)
- `extractedInfo` (string): JSON from preview endpoint (optional)
- `name` (string): Override extracted name (optional)
- `dosage` (string): Override extracted dosage (optional)
- `schedule` (string): Override extracted schedule (optional)

**Response:**
```json
{
  "success": true,
  "message": "Medication added successfully",
  "medication": { /* database record */ },
  "finalInfo": { /* final medication info */ },
  "usedPreviewData": true
}
```

#### `GET /api/medications`
**Purpose:** List all medications

**Response:**
```json
{
  "success": true,
  "medications": [
    {
      "id": 1,
      "name": "Aspirin",
      "dosage": "500 mg",
      "schedule": "once daily",
      "photo_path": "/uploads/photo.jpg",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Dose Logging

#### `POST /api/dose-log`
**Purpose:** Take photo of pill and automatically log dose if pill detected

**Request:**
- `photo` (file): Image of pill being taken (required)
- `medicationId` (number): ID of the medication (required)
- `userId` (number): ID of the user taking the medication (required)
- `notes` (string): Optional notes about the dose

**Response (Success):**
```json
{
  "success": true,
  "message": "Dose logged successfully - pill verified!",
  "doseLog": { /* database record */ },
  "verification": {
    "pillVisible": true,
    "confidence": "high",
    "description": "white pill on palm"
  }
}
```

**Response (No Pill Detected):**
```json
{
  "success": false,
  "message": "No medication detected in the image. Please take a photo showing the pill/medication.",
  "verification": {
    "pillVisible": false,
    "confidence": "high",
    "description": "empty hand"
  }
}
```

#### `GET /api/dose-log/history`
**Purpose:** Get dose history for a specific user

**Query Parameters:**
- `userId` (number): User ID (required)
- `days` (number): Number of days to look back (default: 7)

**Response:**
```json
{
  "takenDoses": [
    {
      "medicationName": "Aspirin",
      "takenAt": "2024-01-15T10:30:00Z",
      "schedule": "once daily"
    }
  ],
  "missedDoses": [
    {
      "medicationName": "Ibuprofen",
      "schedule": "twice daily"
    }
  ],
  "totalTaken": 5,
  "totalMissed": 2
}
```

### Health Check

#### `GET /api/health`
**Purpose:** Check if the API is running

**Response:**
```json
{
  "status": "OK",
  "message": "MediHelper API is running"
}
```

## How It Works

### Medication Addition Flow
1. **Preview:** User uploads medication photo → `/api/preview-medication`
2. **Review:** User sees extracted info and can make corrections
3. **Save:** User uploads to `/api/medications` with corrections → saves to database

### Dose Logging Flow
1. **Photo:** User takes photo of pill → `/api/dose-log`
2. **Verification:** AI checks if pill is visible in image
3. **Decision:** 
   - If pill detected → automatically logs dose to database
   - If no pill detected → rejects and asks user to retake photo

### AI Processing
- **Google Gemini Vision:** Analyzes medication images to extract text and medication information
- **Text Parsing:** Intelligently parses extracted text to find medication name, dosage, and schedule
- **Pill Verification:** Uses Gemini Vision to detect if pills are visible in dose photos

## Database Schema

### Users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Medications
```sql
CREATE TABLE medications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  schedule VARCHAR(100),
  photo_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Dose Logs
```sql
CREATE TABLE dose_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  medication_id INTEGER NOT NULL REFERENCES medications(id),
  taken_at TIMESTAMP NOT NULL,
  photo_path VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Cost Information
- **Google Gemini:** ~$0.0005 per 1K characters (very cheap)
- **Free tier available** - generous usage limits
- **No billing setup required** for basic usage

## Error Handling
All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Technical error details"
}
``` 