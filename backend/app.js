import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import errorHandler from "./middleware/errorHandler.js";

// Routes
import DataBase from "./config/DataBase.js";
import UserRoutes from "./routes/UserRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());
app.use(helmet());



// user
app.use("/api/user", UserRoutes);

app.use(errorHandler); // Allways last

const startServer = async () => {
    try {
        await DataBase.connectDB();

        const server = app.listen(PORT, () => {
            console.log(`App listening at http://localhost:${PORT}`);
        });

        server.on("error", (error) => {
            console.error("Server error:", error);
        });
    } catch (err) {
        console.error(err);
    }
};


startServer();