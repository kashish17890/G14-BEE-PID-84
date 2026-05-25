const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const userController = require("../controllers/userController");

const router = express.Router();

router.get("/dashboard/:userId", authMiddleware, userController.renderDashboard);
router.get("/subjects/:userId", authMiddleware, userController.renderSubjects);
router.get("/results/:userId", authMiddleware, userController.renderResults);
router.get("/announcements/:userId", authMiddleware, userController.renderAnnouncements);
router.get("/profile/:userId", authMiddleware, userController.renderProfile);
router.get("/edit-profile/:userId", authMiddleware, userController.renderEditProfile);
router.post("/edit-profile", authMiddleware, userController.editProfile);
router.post("/upload-profile", authMiddleware, upload.single("profilePic"), userController.uploadProfile);

module.exports = router;
