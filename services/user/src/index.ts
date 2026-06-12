import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/user.js"; // do not forget js here 
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/user", userRoutes); // setting route for user service 



app.listen(process.env.PORT, () => {
  console.log(
    `User service is running on http://localhost:${process.env.PORT}`
  );
});
