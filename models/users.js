const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    roll: String,
    year: String,
    role: String,

    // ✅ ADD THIS
    photo: String,

    // ✅ PERSONAL INFO
    personalInfo: {
        dob: String,
        gender: String,
        programme: String,
        section: String,
        phone: String,
        address: String,
        guardian: String
    },

    // ✅ SKILLS
    skills: [
        {
            name: String,
            level: String,
            category: String
        }
    ]
});

module.exports = mongoose.model("User", userSchema);