const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    time: {
        type: String,
        default: () => new Date().toLocaleDateString()
    },
    teacherName: String
});

module.exports = mongoose.model("Announcement", announcementSchema);
