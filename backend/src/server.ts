import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import csvRoutes from './routes/csvRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', csvRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});