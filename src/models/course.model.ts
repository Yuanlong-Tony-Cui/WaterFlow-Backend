import mongoose from "mongoose";

// Define Schedule (subdocument):
const scheduleSchema = new mongoose.Schema({
    day: { 
        type: String, 
        required: true, 
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] 
    }, // e.g., "Monday"
    startTime: { 
        type: String, 
        required: true,
        validate: {
            validator: timeValidator,
            message: "Invalid time format. Use 'HH:MM AM/PM' or 'HH:MM' (24-hour format)."
        }
    }, // e.g., "10:00 AM"
    endTime: { 
        type: String, 
        required: true,
        validate: {
            validator: timeValidator,
            message: "Invalid time format. Use 'HH:MM AM/PM' or 'HH:MM' (24-hour format)."
        }
    }, // e.g., "12:00 PM"
});

function timeValidator(value: string) {
    return /^([0-9]{1,2}):([0-9]{2})\s?(AM|PM)?$/.test(value); // matches "2:30 PM" or "14:30"
}

function dateValidator(value: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value); // matches "2025-04-10"
}

// Pre-save validation to ensure startTime is before endTime
scheduleSchema.pre("validate", function(next) {
    const schedule = this as any;
    
    const parseTime = (time: string) => {
        const match = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)?$/);
        if (!match) return null;
        
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3];

        // Convert 12-hour to 24-hour format
        if (period) {
            if (period === "PM" && hours !== 12) hours += 12;
            if (period === "AM" && hours === 12) hours = 0;
        }
        
        return hours * 60 + minutes; // return in minutes
    };

    const startMinutes = parseTime(schedule.startTime);
    const endMinutes = parseTime(schedule.endTime);

    if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
        return next(new Error("Invalid time range: `startTime` must be before `endTime`."));
    }

    next();
});

// Define schema for make-up lectures (for extra sessions)
const makeupLectureSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        validate: {
            validator: dateValidator,
            message: "Invalid date format. Use 'YYYY-MM-DD'."
        }
    }, // e.g., "2025-04-10"
    startTime: {
        type: String, 
        required: true,
        validate: {
            validator: timeValidator,
            message: "Invalid time format. Use 'HH:MM AM/PM' or 'HH:MM' (24-hour format)."
        }
    }, // e.g., "10:00 AM"
    endTime: {
        type: String, 
        required: true,
        validate: {
            validator: timeValidator,
            message: "Invalid time format. Use 'HH:MM AM/PM' or 'HH:MM' (24-hour format)."
        }
    }, // e.g., "12:00 PM"
});

const courseSchema = new mongoose.Schema({
    code: { type: String, required: true },              // e.g., "ECE 1786"
    name: { type: String, required: true },              // e.g., "Introduction to NLP"
    description: { type: String },
    startDate: { type: Date, required: true },           // Course start date
    endDate: { type: Date, required: true },             // Course end date
    schedule: { type: [scheduleSchema], require: true }, // List of class hours
    makeupLectures: { type: [makeupLectureSchema], default: [] },
    exceptionDates: { type: [Date], default: [] },       // Dates with no classes
    capacity: { type: Number, required: true },          // Max number of students allowed
    registeredStudents: { type: [String], default: [] }, // Array of student IDs
});

// Use a virtual field to calculate available spots
courseSchema.virtual("availableSpots").get(function () {
    return this.capacity - this.registeredStudents.length;
});

export const Course = mongoose.model("Course", courseSchema);
