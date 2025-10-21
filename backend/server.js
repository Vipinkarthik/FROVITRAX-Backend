import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import procurementRoutes from './routes/procurementRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import ordersRoutes from './routes/ordersRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import deviceRoutes from "./routes/deviceRoutes.js";

// Import AI CSV routes
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

console.log('🔧 Starting Food Supply Chain Server...');
console.log('📦 All modules loaded successfully');

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173' ,''],
  credentials: true
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Food Supply Chain Server is running',
    timestamp: new Date().toISOString(),
    routes: [
      '/api/auth',
      '/api/vendor',
      '/api/pm',
      '/api/email',
      '/api/inventory',
      '/api/orders',
      '/api/payments',
      '/api/procurement',
      '/api/procurement/settings',
      '/api/procurement/account',
      '/api/auth/change-password'
    ]
  });
});

// Test endpoint for settings
app.get('/api/procurement/test', (req, res) => {
  res.status(200).json({
    message: 'Procurement settings endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// Mount existing routes
console.log('🔗 Mounting API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/pm', procurementRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/procurement/settings', settingsRoutes);
app.use('/api/procurement/account', settingsRoutes);
app.use('/api/auth/change-password', settingsRoutes);
app.use("/api", deviceRoutes);

// Mount AI CSV analysis route
app.use("/api", aiRoutes);

console.log('✅ All routes mounted successfully');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected successfully');
  app.listen(process.env.PORT || 5000, () =>
    console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
  );
}).catch(err => console.error('❌ MongoDB connection error:', err));
