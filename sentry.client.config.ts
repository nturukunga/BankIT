import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  
  // Session Replay - removed as it's not supported in this version
  replaysSessionSampleRate: 0.1, 
  replaysOnErrorSampleRate: 1.0, 
  
  // Enable automatic instrumentation for Next.js routing
  integrations: [
    // Removed Replay integration as it's not available in current version
  ],
}); 