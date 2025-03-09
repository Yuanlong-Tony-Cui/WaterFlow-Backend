import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    role: { type: String, enum: ["admin", "student"], required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    registeredCourses: { type: [mongoose.Schema.Types.ObjectId], ref: "Course", default: [] },
});

export const User = mongoose.model("User", userSchema);
