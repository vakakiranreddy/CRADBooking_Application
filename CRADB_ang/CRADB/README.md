# Conference Room Booking System - Angular Frontend

This is the Angular frontend for the Conference Room Booking System (CRADB) that integrates with the .NET Core backend API.

## Features

- **Authentication**: Login, logout, forgot password with OTP verification
- **Room Management**: Browse rooms, filter by amenities, view availability
- **Booking System**: Create bookings, view my bookings, cancel bookings
- **Dashboard**: Overview of active and upcoming bookings
- **Admin Panel**: Admin-only features for managing bookings and analytics
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js (v18 or higher)
- Angular CLI (v20 or higher)
- Backend API running on http://localhost:7144

## Installation

1. Navigate to the project directory:
```bash
cd CRADB_ang/CRADB
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:4200`

## Project Structure

```
src/
├── app/
│   ├── components/          # UI components
│   │   ├── auth/           # Login, forgot password
│   │   ├── dashboard/      # Main dashboard
│   │   ├── rooms/          # Room browsing
│   │   ├── bookings/       # Booking management
│   │   └── admin/          # Admin features
│   ├── services/           # API services
│   ├── models/             # TypeScript interfaces
│   ├── guards/             # Route guards
│   ├── interceptors/       # HTTP interceptors
│   └── environments/       # Environment configuration
```

## Key Components

### Authentication
- Login with email/password
- Forgot password with OTP verification
- JWT token management
- Route protection with guards

### Room Management
- Browse all available rooms
- Filter by capacity, location, amenities
- View room details and availability

### Booking System
- Create new bookings with validation
- View personal booking history
- Cancel bookings with reason
- Status tracking (Reserved, CheckedIn, Completed, Cancelled)

### Admin Features
- View all bookings across the system
- Booking analytics and statistics
- Admin-only route protection

## API Integration

The frontend integrates with the backend API endpoints:

- **Auth**: `/api/auth/*` - Authentication and password management
- **Rooms**: `/api/room/*` - Room data and availability
- **Bookings**: `/api/booking/*` - Booking CRUD operations
- **Admin**: Admin-specific endpoints with role-based access

## Configuration

Update `src/environments/environment.ts` to match your backend API URL:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:7144'
};
```

## Authentication Flow

1. User logs in with email/password
2. Backend returns JWT token and user info
3. Token stored in localStorage
4. HTTP interceptor adds token to all requests
5. Route guards protect authenticated routes
6. Admin guard restricts admin-only features

## Error Handling

- HTTP interceptor handles 401/403 errors
- Automatic redirect to login on authentication failure
- User-friendly error messages
- Form validation with real-time feedback

## Build

For production build:
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Development Notes

- Uses Angular Reactive Forms for all form handling
- RxJS observables for HTTP operations
- Standalone components (no NgModules)
- TypeScript strict mode enabled
- Minimal styling for functionality focus