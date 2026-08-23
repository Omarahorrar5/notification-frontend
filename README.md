# ERP Notification Frontend

Next.js frontend for the ERP Notification Microservice.

## Stack

- Next.js 14 · TypeScript · Tailwind CSS

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Make sure the backend is running on `http://localhost:8000` before signing in.

## How to use

1. Click **"Use mock token"** on the login screen
2. Click **Sign in**
3. Use **"Simulate ERP event"** to create a notification
4. Click the 🔔 bell to see the unread count update

## Structure

```
app/
├── lib/
│   └── api.ts      # All backend API calls
├── page.tsx        # Full UI (login + dashboard)
├── layout.tsx
└── globals.css
```

## Backend

The notification service repository:
`https://github.com/[your-username]/notification-service`