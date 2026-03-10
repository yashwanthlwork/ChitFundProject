/* global console */
// Load env vars from backend/.env and project root .env (common)
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const app = require('./app');
const sequelize = require('./db/sequelize');

const PORT = process.env.PORT || 4000;

const http = require('http');
const { Server } = require('socket.io');

sequelize.authenticate()
  .then(() => {
    if (typeof console !== 'undefined' && console.warn) console.warn('Sequelize DB connection: SUCCESS');
    return sequelize.sync();
  })
  .then(() => {
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Socket.io event handlers for live auction
    io.on('connection', (socket) => {
      // Join auction room
      socket.on('joinAuction', ({ sessionId }) => {
        if (sessionId) socket.join(`auction_${sessionId}`);
      });
      // Leave auction room
      socket.on('leaveAuction', ({ sessionId }) => {
        if (sessionId) socket.leave(`auction_${sessionId}`);
      });
      // (Bid and update events will be handled in controller logic)
    });

    // Make io accessible to controllers (attach to app)
    app.set('io', io);

    server.listen(PORT, '0.0.0.0', () => {
      if (typeof console !== 'undefined' && console.warn) console.warn(`Server running with Socket.io on port ${PORT}`);
    });
  })
  .catch((err) => {
    if (typeof console !== 'undefined' && console.error) console.error('Sequelize DB connection: FAILED');
    if (typeof console !== 'undefined' && console.error) console.error(err);
    process.exit(1);
  });