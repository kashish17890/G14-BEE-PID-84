const mongoose = require("mongoose");
const User = require("../models/users");
const Dashboard = require("../models/dashboard");
const Subject = require("../models/subject");
const Announcement = require("../models/announcement");

function ensureTeacher(req, res) {
    if (req.user.role !== "teacher") {
        res.status(403).send("Access Denied: Teachers only");
        return false;
    }
    return true;
}

exports.renderAdmin = async (req, res) => {
    try {
        if (!ensureTeacher(req, res)) return;

        const user = await User.findById(req.user.id).lean();
        const subjects = await Subject.find({}).lean();
        const dashboards = await Dashboard.find({}).populate("userId").lean();
        const announcements = await Announcement.find({}).sort({ _id: -1 }).lean();

        // Calculate dynamic stats
        const totalStudents = await User.countDocuments({ role: "student" });
        
        let totalPercent = 0;
        let count = 0;
        const subjectTotals = {};
        const subjectCounts = {};

        dashboards.forEach(db => {
            if (db.attendance && db.attendance.length > 0) {
                db.attendance.forEach(att => {
                    totalPercent += att.percent;
                    count++;

                    const subName = att.subject;
                    if (!subjectTotals[subName]) {
                        subjectTotals[subName] = 0;
                        subjectCounts[subName] = 0;
                    }
                    subjectTotals[subName] += Number(att.percent) || 0;
                    subjectCounts[subName]++;
                });
            }
        });
        const avgAttendance = count > 0 ? Math.round(totalPercent / count) : 0;

        // Calculate average attendance per subject
        const subjectAverages = {};
        subjects.forEach(sub => {
            const name = sub.name;
            if (subjectCounts[name] && subjectCounts[name] > 0) {
                subjectAverages[name] = Math.round(subjectTotals[name] / subjectCounts[name]);
            } else {
                subjectAverages[name] = 0; // default fallback average
            }
        });


        const clamp = (val) => Math.min(100, Math.max(0, val));
        const attendanceStats = {
            avgAttendance,
            subjects: {
                labels: Object.keys(subjectAverages),
                data: Object.values(subjectAverages)
            },
            weekly: {
                labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                data: [
                    clamp(Math.round(avgAttendance - 3)),
                    clamp(Math.round(avgAttendance + 1)),
                    clamp(Math.round(avgAttendance - 1)),
                    clamp(Math.round(avgAttendance + 4)),
                    clamp(Math.round(avgAttendance - 2))
                ]
            },
            monthly: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                data: [
                    clamp(Math.round(avgAttendance - 2)),
                    clamp(Math.round(avgAttendance + 2)),
                    clamp(Math.round(avgAttendance - 1)),
                    clamp(Math.round(avgAttendance + 1))
                ]
            }
        };

        const allResults = [];
        dashboards.forEach(dashboard => {
            if (dashboard.userId && Array.isArray(dashboard.results)) {
                dashboard.results.forEach(result => {
                    allResults.push({
                        _id: result._id,
                        dashId: dashboard._id,
                        roll: dashboard.userId.roll,
                        name: dashboard.userId.name,
                        sem: result.sem,
                        subject: result.subject,
                        marks: result.marks,
                        grade: result.grade
                    });
                });
            }
        });

        res.render("admin", { user, subjects, allResults, announcements, totalStudents, avgAttendance, attendanceStats });
    } catch (err) {
        console.error(err);
        res.send("Error loading admin dashboard");
    }
};

exports.updateAttendance = async (req, res) => {
    try {
        if (!ensureTeacher(req, res)) return;

        const { roll, subject, percent } = req.body;
        const user = await User.findOne({ roll });
        if (!user) {
            return res.status(404).send("User not found with that Roll No.");
        }

        const subjectData = await Subject.findOne({ name: subject });
        let dashboard = await Dashboard.findOne({ userId: user._id });

        if (!dashboard) {
            dashboard = await Dashboard.create({
                userId: user._id,
                subjects: subjectData ? [{ code: subjectData.code, name: subjectData.name, credits: subjectData.credits }] : [],
                attendance: [{ subject, percent }]
            });
        } else {
            dashboard.subjects = dashboard.subjects || [];
            dashboard.attendance = dashboard.attendance || [];

            const hasSubject = dashboard.subjects.some(s => s.name === subject);
            if (!hasSubject && subjectData) {
                dashboard.subjects.push({ code: subjectData.code, name: subjectData.name, credits: subjectData.credits });
            }

            const attIndex = dashboard.attendance.findIndex(a => a.subject === subject);
            if (attIndex >= 0) {
                dashboard.attendance[attIndex].percent = percent;
            } else {
                dashboard.attendance.push({ subject, percent });
            }
            await dashboard.save();
        }

        res.send("Attendance updated successfully!");
    } catch (err) {
        console.error(err);
        res.send("Error updating attendance");
    }
};

exports.updateResults = async (req, res) => {
    try {
        if (!ensureTeacher(req, res)) return;

        const { roll, sem, subject, marks, grade } = req.body;
        const user = await User.findOne({ roll });
        if (!user) {
            return res.status(404).send("User not found with that Roll No.");
        }

        const subjectData = await Subject.findOne({ name: subject });
        let dashboard = await Dashboard.findOne({ userId: user._id });

        if (!dashboard) {
            dashboard = await Dashboard.create({
                userId: user._id,
                subjects: subjectData ? [{ code: subjectData.code, name: subjectData.name, credits: subjectData.credits }] : [],
                results: [{ sem, subject, marks, grade }]
            });
        } else {
            dashboard.subjects = dashboard.subjects || [];
            dashboard.results = dashboard.results || [];

            const hasSubject = dashboard.subjects.some(s => s.name === subject);
            if (!hasSubject && subjectData) {
                dashboard.subjects.push({ code: subjectData.code, name: subjectData.name, credits: subjectData.credits });
            }

            const resultIndex = dashboard.results.findIndex(r => r.subject === subject && String(r.sem) === String(sem));
            if (resultIndex >= 0) {
                dashboard.results[resultIndex].marks = marks;
                dashboard.results[resultIndex].grade = grade;
            } else {
                dashboard.results.push({ sem, subject, marks, grade });
            }
            await dashboard.save();
        }

        res.send("Result updated successfully!");
    } catch (err) {
        console.error(err);
        res.send("Error updating results");
    }
};

exports.addSubject = async (req, res) => {
    try {
        if (!ensureTeacher(req, res)) return;

        const { code, name, credits } = req.body;
        const newSubject = await Subject.create({ code, name, credits });
        res.json({ success: true, subject: newSubject });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add subject" });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        if (!ensureTeacher(req, res)) return;

        await Subject.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete subject" });
    }
};

exports.deleteResult = async (req, res) => {
    try {
        if (!ensureTeacher(req, res)) return;

        const dashboard = await Dashboard.findById(req.params.dashId);
        if (dashboard) {
            dashboard.results = dashboard.results.filter(r => r._id.toString() !== req.params.resultId);
            await dashboard.save();
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete result" });
    }
};

exports.addAnnouncement = async (req, res) => {
    try {
        if (!ensureTeacher(req, res)) return;

        const { title, text, time } = req.body;
        const teacher = await User.findById(req.user.id);
        const newAnnouncement = await Announcement.create({
            title,
            text,
            time: time || undefined,
            teacherName: teacher ? teacher.name : "Admin"
        });

        res.json({ success: true, announcement: newAnnouncement });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add announcement" });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        if (!ensureTeacher(req, res)) return;

        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete announcement" });
    }
};

exports.updateNextExam = async (req, res) => {
    try {
        if (!ensureTeacher(req, res)) return;

        const { roll, subject, date, time } = req.body;
        const user = await User.findOne({ roll });
        if (!user) return res.status(404).json({ error: "Student not found" });

        await Dashboard.findOneAndUpdate(
            { userId: user._id },
            { nextExam: { subject, date, time } },
            { upsert: true, new: true }
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

exports.updateNextClass = async (req, res) => {
    try {
        if (!ensureTeacher(req, res)) return;

        const { roll, subject, professor, room, date, time } = req.body;
        const user = await User.findOne({ roll });
        if (!user) return res.status(404).json({ error: "Student not found" });

        await Dashboard.findOneAndUpdate(
            { userId: user._id },
            { nextClass: { subject, professor, room, time: `${date} ${time}` } },
            { upsert: true, new: true }
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

exports.addEvent = async (req, res) => {
    try {
        if (!ensureTeacher(req, res)) return;

        const { roll, date, event, club, venue } = req.body;
        const user = await User.findOne({ roll });
        if (!user) return res.status(404).json({ error: "Student not found" });

        await Dashboard.findOneAndUpdate(
            { userId: user._id },
            { $push: { events: { date, event, club, venue } } },
            { upsert: true, new: true }
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};
