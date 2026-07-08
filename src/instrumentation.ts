const isSentryEnabled =
  process.env.NEXT_PUBLIC_SENTRY_DISABLED !== 'true' && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

export async function register() {
  if (!isSentryEnabled) {
    return;
  }

  const Sentry = await import('@sentry/nextjs');

  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      spotlight: process.env.NODE_ENV === 'development',
      sendDefaultPii: true,
      tracesSampleRate: 1,
      debug: false
    });
  }
}

export async function onRequestError(
  ...args: Parameters<typeof import('@sentry/nextjs').captureRequestError>
) {
  if (!isSentryEnabled) {
    return;
  }

  const Sentry = await import('@sentry/nextjs');
  return Sentry.captureRequestError(...args);
}
