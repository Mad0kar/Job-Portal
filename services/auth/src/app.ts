import express from "express";
import authRoutes from "./routes/auth.js";
import { connectKafka } from "./producer.js";
import cors from "cors";


const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

connectKafka();

export default app;