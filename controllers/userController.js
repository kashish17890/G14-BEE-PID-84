const mongoose = require("mongoose");
const User = require("../models/users");
const Dashboard = require("../models/dashboard");
const Subject = require("../models/subject");
const Announcement = require("../models/announcement");
const { buildDashboard } = require("../models/dashboard");

exports.renderDashboard = async (req, res) => {
    try {
        if (req.user.id !== req.params.userId) {
            return res.send("Unauthorized access");
        }

        const userId = req.params.userId;
        const user = await User.findById(userId).lean();
        const dashboardDoc = await Dashboard.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
        const announcements = await Announcement.find({}).sort({ _id: -1 }).lean();

        res.render("dashboard", {
            dashboard: buildDashboard(dashboardDoc),
            user: user || {},
            userId,
            token: req.token,
            announcements: announcements || []
        });
    } catch (err) {
        console.error(err);
        res.send("Error loading dashboard");
    }
};

exports.renderSubjects = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId).lean();
        const dashboard = await Dashboard.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
        const subjects = await Subject.find({}).lean();

        res.render("subjects", {
            user,
            dashboard: dashboard || {},
            subjects,
            userId,
            token: req.token
        });
    } catch (err) {
        console.error(err);
        res.send("Error loading subjects");
    }
};

exports.renderResults = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId).lean();
        const dashboard = await Dashboard.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
        const subjects = await Subject.find({}).lean();

        res.render("results", {
            user,
            dashboard: dashboard || {},
            subjects,
            userId,
            token: req.token
        });
    } catch (err) {
        console.error(err);
        res.send("Error loading results");
    }
};

exports.renderAnnouncements = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId).lean();
        const dashboard = await Dashboard.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
        const announcements = await Announcement.find({}).sort({ _id: -1 }).lean();

        res.render("announcements", {
            user,
            dashboard: dashboard || {},
            userId,
            token: req.token,
            announcements: announcements || []
        });
    } catch (err) {
        console.error(err);
        res.send("Error loading announcements");
    }
};

exports.renderProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId).lean();
        const dashboard = await Dashboard.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();

        res.render("profile", {
            user: user || {},
            dashboard: dashboard || {},
            token: req.token
        });
    } catch (err) {
        console.error(err);
        res.send("Error loading profile");
    }
};

exports.renderEditProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).lean();
        res.render("editProfile", { user, token: req.token });
    } catch (err) {
        console.error(err);
        res.send("Error loading edit profile");
    }
};

exports.editProfile = async (req, res) => {
    try {
        const { dob, gender, programme, section, phone, address, guardian, skills } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).send("User not found");
        }

        user.personalInfo = { dob, gender, programme, section, phone, address, guardian };
        user.skills = skills
            ? skills.split(",").map(s => ({ name: s.trim(), level: "Intermediate", category: "General" }))
            : [];

        await user.save();
        res.redirect(`/profile/${req.user.id}?token=${req.token}`);
    } catch (err) {
        console.error(err);
        res.send("Error saving profile");
    }
};

exports.uploadProfile = async (req, res) => {
    try {
        if (!req.file) {
            return res.send("No file uploaded");
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).send("User not found");
        }

        user.photo = "/uploads/" + req.file.filename;
        await user.save();
        res.redirect(`/profile/${req.user.id}?token=${req.token}`);
    } catch (err) {
        console.error(err);
        res.send("Error uploading profile picture");
    }
};
