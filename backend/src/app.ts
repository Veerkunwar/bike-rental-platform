
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import path from 'path';

import { env } from './config/env';
import routes from './routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { razorpayWebhook } from './controllers/paymentController';

const app: Express = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);

app.use(compression());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
app.use(generalLimiter);

// Razorpay webhook
app.post(
  '/api/payments/webhook',
  express.raw({ type: '*/*' }),
  (req, _res, next) => {
    (req as any).rawBody = req.body?.toString('utf8') || '';
    try {
      req.body = JSON.parse((req as any).rawBody || '{}');
    } catch {
      req.body = {};
    }
    next();
  },
  razorpayWebhook,
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(xssClean());

// Public uploads
app.use(
  '/uploads/bikes',
  express.static(path.join(__dirname, '..', 'uploads', 'bikes')),
);

app.use(
  '/uploads/profiles',
  express.static(path.join(__dirname, '..', 'uploads', 'profiles')),
);

// Root route
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'RideIt API is running successfully 🚀',
  });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
  });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;