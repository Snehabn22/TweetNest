import express from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "./db/connect.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/posts.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import cors from "cors";
import path from "path";

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: "783375918234471", // It's not recommended to keep API keys hardcoded. Consider using environment variables.
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

const __dirname = path.resolve();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notification", notificationRoutes);

if (process.env.NODE_ENV === "production") {
  // Serve static files from frontend/dist for production
  app.use(express.static(path.join(__dirname, "frontend", "dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

const port = process.env.PORT || 10000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  connectDB();
});

// Increase timeouts to prevent server timeouts
server.keepAliveTimeout = 120000; // 120 seconds
server.headersTimeout = 120000;  // 120 seconds

// Optional: Set connection timeout (for better control over the server's behavior)
server.setTimeout(120000); // 120 seconds

