import express, { Router, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Course } from "../models/course.model";
import { ParamsDictionary } from 'express-serve-static-core';

// Define specific types for request parameters and body
interface CourseParams extends ParamsDictionary {
    courseId: string;
}

interface RegisterStudentBody {
    studentId: string;
}

const router: Router = Router();

// Get available courses
router.get("/courses", async (req, res) => {
    const courses = await Course.find();
    res.json(courses);
});

// Register for a course
// Register for a course
router.post("/register/:courseId", async (
    req: ExpressRequest<CourseParams, any, RegisterStudentBody>, 
    res: ExpressResponse
) => {
    try {
        const { courseId } = req.params;
        const { studentId } = req.body;

        // Validate input
        if (!courseId || !studentId) {
            return res.status(400).json({ error: "Missing courseId or studentId" });
        }

        // Use Course model directly instead of a non-existent service
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Check if course is full (assuming you have a max capacity field)
        if (course.registeredStudents.length >= course.seats) {
            return res.status(400).json({ error: "Course is full" });
        }

        // Add student to registered students
        course.registeredStudents.push(studentId);
        await course.save();

        // Successful registration
        return res.status(201).json(course);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Withdraw from a course
router.post("/withdraw/:courseId", async (req, res) => {
    const { courseId } = req.params;
    const { studentId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    course.registeredStudents = course.registeredStudents.filter(id => id !== studentId);
    await course.save();
    res.json(course);
});

export default router;
