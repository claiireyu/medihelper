# MediHelper - React Medication Management App

A modern React-based medication management application that helps users track, schedule, and manage their medications effectively.

## Features

- **Dashboard**: Overview of next dose, today's schedule, and quick stats
- **Add Medication**: Upload photos and add new medications with scheduling
- **Manage Medications**: Edit, delete, and organize existing medications
- **Schedule View**: Daily medication schedule with time slots
- **Verification**: Mark doses as taken and verify medication adherence
- **History**: Track medication history and adherence over time
- **Refill Dashboard**: Monitor medication supply and request refills
- **Responsive Design**: Mobile-first design with bottom navigation

## Tech Stack

- **Frontend**: React 19 with Hooks
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom service layer

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.jsx           # Main dashboard
│   ├── AddMedication.jsx       # Add new medication
│   ├── ManageMedications.jsx   # Manage existing medications
│   ├── Schedule.jsx            # Daily schedule view
│   ├── Verify.jsx              # Dose verification
│   ├── History.jsx             # Medication history
│   ├── RefillDashboard.jsx     # Refill management
│   ├── Layout.jsx              # App layout with navigation
│   └── Login.jsx               # Authentication
├── context/            # React Context providers
│   └── AuthContext.jsx         # Authentication state
├── services/           # API services
│   └── api.js                  # API client and utilities
├── App.jsx            # Main app component with routing
├── main.jsx           # App entry point
└── index.css          # Global styles and Tailwind
```

## API Integration

The app is designed to work with a backend API. Update the `API_BASE` constant in `src/services/api.js` to point to your backend server.

### Backend Requirements

The backend should provide these endpoints:

- `POST /api/auth/login` - User authentication
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/next-dose` - Next scheduled dose
- `GET /api/medications/schedule` - Daily medication schedule
- `POST /api/medications` - Add new medication
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Delete medication
- `POST /api/dose-log` - Log medication doses
- `GET /api/dose-log/history` - Dose history

## Authentication

The app uses a simple authentication system with localStorage. In production, consider implementing:

- JWT tokens with refresh mechanisms
- Secure HTTP-only cookies
- OAuth integration
- Two-factor authentication

## Styling

The app uses Tailwind CSS with custom components and utilities:

- **Custom Colors**: Primary, success, warning, and danger color schemes
- **Component Classes**: Pre-built button, card, and input styles
- **Animations**: Fade-in, slide-up, and gentle bounce effects
- **Responsive Design**: Mobile-first approach with breakpoint utilities

## State Management

The app uses React Context for global state management:

- **AuthContext**: User authentication and session management
- **Local State**: Component-specific state with useState hooks
- **API State**: Server data management with loading states

## Routing

The app uses React Router v7 with protected routes:

- `/login` - Authentication page
- `/` - Dashboard (protected)
- `/add-medication` - Add new medication (protected)
- `/manage-medications` - Manage medications (protected)
- `/schedule` - Daily schedule (protected)
- `/verify` - Dose verification (protected)
- `/history` - Medication history (protected)
- `/refill-dashboard` - Refill management (protected)

## Development

### Code Style

- Use functional components with hooks
- Follow React best practices
- Use descriptive component and variable names
- Implement proper error handling
- Add loading states for better UX

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

## Deployment

### Vercel

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy

### Netlify

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.

## Roadmap

- [ ] Push notifications for medication reminders
- [ ] Offline support with service workers
- [ ] Data export and backup
- [ ] Family member management
- [ ] Integration with pharmacy systems
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Dark mode theme
