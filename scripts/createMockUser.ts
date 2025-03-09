import mongoose from "mongoose";
import { User } from "../src/models/user.model";
import dotenv from "dotenv";

dotenv.config();

async function createMockUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/courses");
        console.log("Connected to MongoDB");

        const mockUser = new User({
            role: "student",
            name: "Test Student",
            email: "test.student@example.com",
            password: "hashedpassword123",
            registeredCourses: []
        });

        await mockUser.save();
        console.log("Mock user created:", mockUser);
    } catch (error) {
        console.error("Error creating user:", error);
    } finally {
        mongoose.disconnect();
    }
}

createMockUser();
