import express from 'express';
import { Course, ICourse } from "../models/course.model";
import { User } from "../models/user.model";
import mongoose from "mongoose";

const router = express.Router();

// Get available courses
router.get("/courses", async (req, res) => {
    const courses = await Course.find();
    res.json(courses);
});

// Register for a course
router.post("/register/:courseId", async (req, res) => {
    try {
        const { courseId } = req.params;
        const { studentId } = req.body;

        // Validate input
        if (!courseId || !studentId) {
            return res.status(400).json({ error: "Missing courseId or studentId" });
        }

        const course = await Course.findById(courseId);
        const student = await User.findById(studentId).populate<{ registeredCourses: ICourse[] }>("registeredCourses");

        // Validate course and student existence
        if (!course) return res.status(404).json({ error: "Course not found" });
        if (!student || student.role !== "student") return res.status(404).json({ error: "Student not found" });

        // Check if the course is full
        if (course.registeredStudents.length >= course.capacity) {
            return res.status(400).json({ error: "Course is full" });
        }

        // Check if the student is already registered
        if (
            course.registeredStudents.includes(studentId as any) ||
            student.registeredCourses.some((c: ICourse) => c._id.toString() === courseId)
        ) {
            return res.status(400).json({ error: "Student is already registered for this course" });
        }

        // Check for schedule conflicts
        const conflictingCourses = getScheduleConflicts(student.registeredCourses, course);

        if (conflictingCourses.length > 0) {
            return res.status(200).json({ 
                warning: "Schedule conflict detected. Proceed anyway?", 
                conflictingCourses 
            });
        }

        // Add student to the course & add course to the student
        student.registeredCourses.push(courseId as any);
        course.registeredStudents.push(studentId as any);
        
        await course.save();
        await student.save();

        return res.status(201).json({ message: "Registration successful", course, student });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * Helper function that finds all conflicting courses based on schedule
 * @param registeredCourses The courses the student is already registered for
 * @param newCourse The new course the student wants to register for
 * @returns An array of conflicting courses
 */
export function getScheduleConflicts(registeredCourses: ICourse[], newCourse: ICourse): ICourse[] {
    return registeredCourses.filter((registeredCourse) =>
        registeredCourse.schedule.some((registeredSession) =>
            newCourse.schedule.some(
                (newSession) =>
                    registeredSession.day === newSession.day &&
                    timesOverlap(registeredSession.startTime, registeredSession.endTime, newSession.startTime, newSession.endTime)
            )
        )
    );
}

/**
 * Helper function to check if two time ranges overlap
 * @param start1 Start time of first session
 * @param end1 End time of first session
 * @param start2 Start time of second session
 * @param end2 End time of second session
 * @returns boolean - `true` if the time slots overlap, `false` otherwise
 */
export function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const toMinutes = (time: string): number | null => {
        const match = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)?$/);
        if (!match) return null;

        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3];

        if (period) {
            if (period === "PM" && hours !== 12) hours += 12;
            if (period === "AM" && hours === 12) hours = 0;
        }

        return hours * 60 + minutes;
    };

    const startA = toMinutes(start1);
    const endA = toMinutes(end1);
    const startB = toMinutes(start2);
    const endB = toMinutes(end2);

    if (startA === null || endA === null || startB === null || endB === null) {
        return false; // invalid input
    }

    return startA < endB && startB < endA; // overlapping condition
}

// Withdraw from a course
router.post("/withdraw/:courseId", async (req, res) => {
    try {
        const { courseId } = req.params;
        const { studentId } = req.body;

        const course = await Course.findById(courseId);
        const student = await User.findById(studentId);

        // Validate course and student existence
        if (!course) return res.status(404).json({ error: "Course not found" });
        if (!student || student.role !== "student") return res.status(404).json({ error: "Student not found" });

        // Check if student is actually registered
        if (!course.registeredStudents.includes(new mongoose.Types.ObjectId(studentId)) || !student.registeredCourses.includes(new mongoose.Types.ObjectId(courseId))) {
            return res.status(400).json({ error: "Student is not registered for this course" });
        }

        // Remove student from the course & remove course from the student
        course.registeredStudents = course.registeredStudents.filter(id => id.toString() !== studentId);
        student.registeredCourses = student.registeredCourses.filter(id => id.toString() !== courseId);

        await course.save();
        await student.save();

        return res.json({ message: "Successfully withdrawn", course, student });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Get all courses a student is registered for
router.get("/:studentId/courses", async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await User.findById(studentId).populate("registeredCourses");
        if (!student || student.role !== "student") {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json(student.registeredCourses);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
