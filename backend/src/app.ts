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

// Razorpay webhook needs the RAW body (exact bytes) to verify the HMAC
// signature, so it's mounted BEFORE express.json() and captures rawBody itself.
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
app.use(mongoSanitize()); // strips $ and . from req.body/query/params to block NoSQL injection
app.use(xssClean()); // sanitizes user input to prevent XSS

// Bike photos and profile photos are non-sensitive and safe to serve publicly.
app.use('/uploads/bikes', express.static(path.join(__dirname, '..', 'uploads', 'bikes')));
app.use('/uploads/profiles', express.static(path.join(__dirname, '..', 'uploads', 'profiles')));

// Government ID / driving license / selfie are SENSITIVE. They are
// deliberately NOT served via express.static (which has no auth check).
// Instead they go through /api/documents/file/:filename which verifies the
// requester is either the document's owner or an admin. See documentRoutes.ts.

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'API is healthy' }));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
