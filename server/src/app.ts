import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import farmerRoutes from './routes/farmerRoutes';
import customerRoutes from './routes/customerRoutes';
import deliveryRoutes from './routes/deliveryRoutes';
import trackingRoutes from './routes/trackingRoutes';

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/tracking', trackingRoutes);

app.get('/', (req, res) => {
    res.send('Farm2Home API is running');
});

export default app;
