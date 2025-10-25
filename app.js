const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// allow Vite dev server origin and credentials
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// mount other routers
app.use('/users', require('./routes/user.routes'));
app.use('/captains', require('./routes/captain.routes'));
app.use('/rides', require('./routes/ride.routes'));

// mount maps and payment routers
const mapRoutes = require('./routes/maps.routes');
const paymentRoutes = require('./routes/payment.route');
app.use('/maps', mapRoutes);
app.use('/payment', paymentRoutes);

app.use(express.static(path.join(__dirname, "../frontend/dist")));

// NOTE: MongoDB connect is handled from server.js (single centralized connection).
// Removed duplicate mongoose.connect call to prevent "openUri on an active connection" errors.

// Add this at the end (after all routes)
app.use((err, req, res, next) => {
  // log error server-side for debugging (do not expose stack in response)
  console.error(err && (err.stack || err.message || err));
  const status = err && err.status ? err.status : 500;
  res.status(status).json({ message: err && err.message ? err.message : 'Internal Server Error' });
});

module.exports = app;
