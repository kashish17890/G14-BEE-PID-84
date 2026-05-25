const jwt = require("jsonwebtoken");
const User = require("../models/users");
const JWT_SECRET = require("../config/jwt");

exports.renderLogin = (req, res) => res.render("login");
exports.renderSignin = (req, res) => res.render("signin");

exports.signup = async (req, res) => {
    try {
        const { email, password, name, roll, year, role } = req.body;
        const exists = await User.findOne({ email });

        if (exists) {
            return res.send("User already exists");
        }

        const newUser = new User({ email, password, name, roll, year, role });
        await newUser.save();

        res.json({ message: "Signup successful" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });

        if (!user) {
            return res.json({ message: "Invalid login" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
        res.json({ token, role: user.role, userId: user._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.googleCallback = (req, res) => {
    const token = jwt.sign({ id: req.user._id, role: req.user.role }, JWT_SECRET, { expiresIn: "1d" });

    if (!req.user.role) {
        return res.redirect(`/choose-role/${req.user._id}?token=${token}`);
    }

    if (req.user.role === "teacher") {
        return res.redirect(`/admin?token=${token}`);
    }

    return res.redirect(`/dashboard/${req.user._id}?token=${token}`);
};

exports.renderChooseRole = (req, res) => {
    res.render("chooseRole", { userId: req.params.userId });
};

exports.setRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const user = await User.findByIdAndUpdate(userId, { role }, { returnDocument: "after" });

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

        if (role === "teacher") {
            return res.json({ redirect: "/admin", token });
        }

        return res.json({ redirect: `/complete-profile/${userId}`, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to set role" });
    }
};

exports.renderSigninStudent = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        res.render("signin", { user, userId: req.params.userId, token: req.token });
    } catch (err) {
        console.error(err);
        res.send("Error loading signin page");
    }
};

exports.renderCompleteProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        res.render("completeProfile", { user, token: req.token });
    } catch (err) {
        console.error(err);
        res.send("Error loading complete profile page");
    }
};

exports.completeProfile = async (req, res) => {
    try {
        const { roll, year } = req.body;
        const user = await User.findByIdAndUpdate(req.user.id, { roll, year }, { new: true });
        res.json({ userId: user._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to complete profile" });
    }
};
