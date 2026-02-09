# StayIV Frontend

Next.js dashboard for AI-powered property management automation platform.

## 🚀 Tech Stack

- **Next.js 16** - React framework with Turbopack
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Shadcn UI** - Beautiful component library
- **Socket.io Client** - Real-time WebSocket communication
- **Axios** - HTTP client with JWT authentication

## 📋 Features

- 🔐 User authentication (login/register)
- 💬 Real-time conversation management
- 😊 AI-powered mood analysis display
- 🏠 Property management with comprehensive sheets
- 🧹 Cleaning schedule management
- 📊 Review management dashboard
- 🔍 Lost & found tracking
- 💰 Pending payment management
- 📝 Form collection system
- 🔔 Real-time notifications via WebSockets
- 📱 Fully responsive design

## 🛠️ Environment Variables

Create a `.env.local` file in the root directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app

# WebSocket URL (same as backend)
NEXT_PUBLIC_WS_URL=https://your-backend-url.railway.app
```

For local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_WS_URL=http://localhost:5001
```

## 🚀 Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see backend README)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

## 📦 Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🚢 Deployment

This frontend is designed to be deployed on **Vercel**.

### Vercel Deployment Steps:

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Connect GitHub repository
4. Set environment variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_WS_URL`
5. Deploy!

Vercel will auto-detect Next.js and configure build settings.

### Build Configuration:

- **Framework**: Next.js (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm ci`

## 📱 Pages & Routes

### Authentication
- `/login` - User login
- `/register` - User registration

### Dashboard
- `/dashboard` - Main dashboard overview
- `/chats` - Conversation management
- `/chats/all` - All conversations with filters
- `/chats/conversation/[id]` - Individual conversation view
- `/claimed-chats` - Claimed conversations
- `/cleaning` - Cleaning schedules
- `/properties` - Property list
- `/property-sheet/[id]` - Property details form
- `/reviews` - Review management
- `/lost-found` - Lost & found items
- `/issues` - Open issues tracking
- `/pending-payments` - Payment management
- `/form-collection` - Collected forms
- `/settings` - User settings

## 🎨 UI Components

Built with Shadcn UI components:
- Cards, Buttons, Badges
- Forms with validation
- Dialogs & Modals
- Tabs & Navigation
- Date Pickers
- Avatars & Icons

## 🔌 API Integration

All API calls are centralized in `lib/` directory:
- `api-client.ts` - Base HTTP client with JWT auth
- `conversations-api.ts` - Conversation endpoints
- `properties-api.ts` - Property endpoints
- `cleaning-api.ts` - Cleaning endpoints
- `issues-api.ts` - Issues endpoints
- `pending-payments-api.ts` - Payment endpoints
- `form-collection-api.ts` - Form endpoints

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

## 📝 Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── layout/           # Layout components (Sidebar, Header)
│   └── *.tsx             # Feature components
├── lib/                   # Utilities & API clients
│   ├── api-client.ts     # Base HTTP client
│   ├── *-api.ts          # API endpoint modules
│   └── utils.ts          # Helper functions
├── hooks/                 # Custom React hooks
├── public/               # Static assets
└── styles/               # Global styles
```

## 🔒 Authentication

JWT-based authentication with automatic token refresh:
- Tokens stored in localStorage
- Automatic inclusion in API requests
- Protected routes with auth guards
- Automatic redirect to login on 401

## 🌐 Real-Time Features

WebSocket connection for:
- Live conversation updates
- New message notifications
- Booking status changes
- Real-time dashboard updates

## 📝 License

Private - All rights reserved

## 👥 Authors

StayIV Team
