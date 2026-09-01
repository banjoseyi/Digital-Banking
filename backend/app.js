import express from "express";
import dotenv from "dotenv";
import DataBase from "./config/DataBase.js";

// Routes
import UserRoutes from "./routes/UserRoutes.js";

dotenv.config();

const PORT = process.env.PORT || 4000;

const app = express();
app.use(express.json());

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


// user
app.use("/api/user", UserRoutes);

server();