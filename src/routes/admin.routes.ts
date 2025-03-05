import express from "express";
import { Course } from "../models/course.model";

const router = express.Router();

// Create a course
router.post("/courses", async (req, res) => {
    try {
        const course = new Course(req.body);
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
