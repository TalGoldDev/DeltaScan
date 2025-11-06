import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cron from 'node-cron';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { scannerService } from './controllers/marketController';
import { WS_EVENTS } from '@deltascan/shared';

// Create Express app
const app = express();
const httpServer = createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });

  // Handle market subscription
  socket.on(WS_EVENTS.SUBSCRIBE_MARKETS, () => {
    logger.debug('Client subscribed to market updates', { socketId: socket.id });
    socket.join('markets');
  });

  socket.on(WS_EVENTS.UNSUBSCRIBE_MARKETS, () => {
    logger.debug('Client unsubscribed from market updates', { socketId: socket.id });
    socket.leave('markets');
  });
});

// Scheduled market scanning
if (config.scanning.enableAutoScan) {
  const cronExpression = `*/${config.scanning.intervalMinutes} * * * *`;

  cron.schedule(cronExpression, async () => {
    logger.info('Running scheduled market scan');
    try {
      await scannerService.scanAllPlatforms();

      // Emit updates to connected clients
      const opportunities = scannerService.getArbitrageOpportunities();
      io.to('markets').emit(WS_EVENTS.ARBITRAGE_OPPORTUNITY, opportunities);
    } catch (error) {
      logger.error('Error in scheduled scan:', error);
    }
  });

  logger.info(`Scheduled market scanning enabled (every ${config.scanning.intervalMinutes} minutes)`);
}

// Start server
httpServer.listen(config.port, config.host, () => {
  logger.info(`Server running on http://${config.host}:${config.port}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`CORS enabled for: ${config.corsOrigin}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
