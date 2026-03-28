import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES modules mein __dirname ka alternative
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// Views setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://saurabh231018:Saurabh231018@cluster0.hlm0uix.mongodb.net/Daba', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log('MongoDB connection error:', err));

// Routes
import indexRouter from './src/routes/index.js';
import menuRouter from './src/routes/menu.js';
import ordersRouter from './src/routes/orders.js';
import customersRouter from './src/routes/customers.js';

app.use('/', indexRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/customers', customersRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});