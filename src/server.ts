import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Import route files
import adminRoutes from "./routes/admin.routes";
import studentRoutes from "./routes/student.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());  // Middleware for parsing JSON

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/courses")
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// Use the imported routes with their respective prefixes
app.use("/admin", adminRoutes);
app.use("/student", studentRoutes);

// Default route
app.get("/", (req, res) => {
    res.send("Course Registration API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
