import express from "express";
import authRoutes from "./routes/auth.js";
import { connectKafka } from "./producer.js";
<<<<<<< HEAD
import cors from "cors";
=======
import cors from 'cors'
>>>>>>> feat/backend-updates


const app = express();
app.use(cors());
app.use(express.json());
<<<<<<< HEAD

=======
app.use(cors());
>>>>>>> feat/backend-updates
app.use("/api/auth", authRoutes);

connectKafka();

export default app;