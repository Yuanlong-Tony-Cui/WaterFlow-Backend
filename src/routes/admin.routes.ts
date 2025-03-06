import express from "express";
import { Course } from "../models/course.model";

const router = express.Router();

// Create a course
router.post("/courses", async (req, res) => {
    try {
        const { code, name, capacity, schedule } = req.body;

        // Check for missing required fields
        if (!code || !name || !capacity || !schedule) {
            return res.status(400).json({ error: "Missing required fields: code, name, capacity, or schedule" });
        }

        // Validate capacity
        if (typeof capacity !== "number" || capacity <= 0) {
            return res.status(400).json({ error: "Capacity must be a positive number" });
        }

        // Validate schedule
        if (!Array.isArray(schedule) || schedule.length === 0) {
            return res.status(400).json({ error: "Schedule must be a non-empty array" });
        }
        const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        for (const session of schedule) {
            if (!validDays.includes(session.day)) {
                return res.status(400).json({ error: `Invalid day in schedule: ${session.day}` });
            }
        }

        const course = new Course({
            code, name,
            description: req.body.description,
            capacity, schedule
        });
        await course.save();

        res.status(201).json(course);
    } catch (err) {
        res.status(400).json({ error: (err as Error).message });
    }
});

// Edit a course
router.put("/courses/:id", async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
