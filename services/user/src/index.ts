import express from "express";
import dotenv from "dotenv";
<<<<<<< HEAD
import userRoutes from "./routes/user.js";
import cors from "cors";
=======
import userRoutes from "./routes/user.js"; // do not forget js here 
import cors from 'cors';

>>>>>>> feat/backend-updates
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

<<<<<<< HEAD

app.use("/api/user", userRoutes);
=======
app.use("/api/user", userRoutes); // setting route for user service 
>>>>>>> feat/backend-updates



app.listen(process.env.PORT, () => {
  console.log(
    `User service is running on http://localhost:${process.env.PORT}`
  );
});
