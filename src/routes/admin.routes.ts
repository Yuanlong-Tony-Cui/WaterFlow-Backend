import express from "express";
import { Course } from "../models/course.model";

const router = express.Router();

// Helper function to validate course data
export function validateCourseData(data: any, isUpdate = false) {
    const { startDate, endDate, capacity, schedule } = data;

    // For Course creation, check required fields
    if (!isUpdate) {
        if (!data.code || !data.name || !data.capacity || !data.schedule) {
            return { error: "Missing required fields: code, name, capacity, or schedule" };
        }
    }

    // Validate capacity (if provided)
    if (capacity !== undefined && (typeof capacity !== "number" || capacity <= 0)) {
        return { error: "Capacity must be a positive number" };
    }

    // Validate schedule (if provided)
    if (schedule !== undefined) {
        if (!Array.isArray(schedule) || schedule.length === 0) {
            return { error: "Schedule must be a non-empty array" };
        }

        const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        for (const session of schedule) {
            if (!validDays.includes(session.day)) {
                return { error: `Invalid day in schedule: ${session.day}` };
            }
        }
    }

    // Convert date (if provided)
    const updatedData = { ...data };
    if (startDate !== undefined) updatedData.startDate = new Date(startDate);
    if (endDate !== undefined) updatedData.endDate = new Date(endDate);

    return { data: updatedData };
}


// Create a course
router.post("/courses", async (req, res) => {
    try {
        const { error, data } = validateCourseData(req.body, false); // `false` for creating a course
        if (error) return res.status(400).json({ error });

        const course = new Course(data);
        await course.save();

        res.status(201).json(course);
    } catch (err) {
        res.status(400).json({ error: (err as Error).message });
    }
});

// Edit a course (partially)
router.patch("/courses/:id", async (req, res) => {
    try {
        const { error, data } = validateCourseData(req.body, true); // `true` for (partially) updating a course
        if (error) return res.status(400).json({ error });

        const course = await Course.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });

        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        res.json(course);
    } catch (err) {
        res.status(400).json({ error: (err as Error).message });
    }
});

// Delete a course
router.delete("/courses/:id", async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: "Course deleted" });
    } catch (err) {
        res.status(400).json({ error: (err as Error).message });
    }
});

export default router;
