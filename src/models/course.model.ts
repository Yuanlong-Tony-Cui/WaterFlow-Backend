import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    schedule: [
        {
            day: String,  // e.g., "Monday"
            startTime: String, // "10:00 AM"
            endTime: String  // "12:00 PM"
        }
    ],
    seats: { type: Number, required: true },
    registeredStudents: { type: [String], default: [] } // Array of student IDs
});

export const Course = mongoose.model("Course", courseSchema);
