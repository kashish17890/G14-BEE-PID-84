const mongoose = require("mongoose");

const dashboardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    year: Number,
    credits: Number,
    cgpa: Number,
    cg: Number,
    semAvg: Number,
    nextExam: {
        subject: String,
        date: String,
        time: String
    },

    // 🔥 ADD THIS (IMPORTANT)
    subjects: [
        {
            code: String,
            name: String,
            credits: Number
        }
    ],

    results: [
        {
            sem: Number,
            subject: String,
            marks: Number,
            grade: String
        }
    ],

    announcements: [
        {
            title: String,
            text: String,
            time: String
        }
    ],

    attendance: [
        {
            subject: String,
            percent: Number
        }
    ],

    nextClass: {
        subject: String,
        professor: String,
        room: String,
        time: String
    },

    events: [
        {
            date: String,
            event: String,
            club: String,
            venue: String
        }
    ],

    chartData: Object
});

const gradePoints = {
    O: 10,
    "A+": 10,
    A: 9,
    "B+": 8,
    B: 7,
    C: 6,
    P: 5,
    F: 0
};

function buildDashboard(dashboard = {}) {
    const source = dashboard || {};

    const result = {
        ...source,
        attendance: Array.isArray(source.attendance) ? source.attendance : [],
        events: Array.isArray(source.events) ? source.events : [],
        subjects: Array.isArray(source.subjects) ? source.subjects : [],
        results: Array.isArray(source.results) ? source.results : [],
        nextExam: source.nextExam || { subject: "N/A", date: "None", time: "None" },
        chartData: source.chartData || {}
    };

    if (result.results.length > 0) {
        const totalPoints = result.results.reduce((sum, record) => {
            const grade = (record.grade || "").toUpperCase();
            return sum + (gradePoints[grade] || 0);
        }, 0);

        result.cg = (totalPoints / result.results.length).toFixed(2);

        const latestSem = Math.max(...result.results.map(r => Number(r.sem) || 0));
        const latestResults = result.results.filter(r => Number(r.sem) === latestSem);
        const semSum = latestResults.reduce((sum, record) => sum + Number(record.marks || 0), 0);
        result.semAvg = latestResults.length > 0 ? (semSum / latestResults.length).toFixed(0) : "N/A";

        const chartData = {};
        result.results.forEach(r => {
            const sem = r.sem || "0";
            if (!chartData[sem]) {
                chartData[sem] = { subjects: [], marks: [] };
            }
            chartData[sem].subjects.push(r.subject);
            chartData[sem].marks.push(r.marks);
        });
        result.chartData = chartData;
    } else {
        result.cg = result.cg || "N/A";
        result.semAvg = result.semAvg || "N/A";
        result.chartData = result.chartData || {};
    }

    return result;
}

module.exports = mongoose.model("Dashboard", dashboardSchema);
module.exports.buildDashboard = buildDashboard;