const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.get("/admin", authMiddleware, adminController.renderAdmin);
router.post("/admin/update-attendance", authMiddleware, adminController.updateAttendance);
router.post("/admin/update-results", authMiddleware, adminController.updateResults);
router.post("/admin/add-subject", authMiddleware, adminController.addSubject);
router.delete("/admin/delete-subject/:id", authMiddleware, adminController.deleteSubject);
router.delete("/admin/delete-result/:dashId/:resultId", authMiddleware, adminController.deleteResult);
router.post("/admin/add-announcement", authMiddleware, adminController.addAnnouncement);
router.delete("/admin/delete-announcement/:id", authMiddleware, adminController.deleteAnnouncement);
router.post("/admin/update-next-exam", authMiddleware, adminController.updateNextExam);
router.post("/admin/update-next-class", authMiddleware, adminController.updateNextClass);
router.post("/admin/add-event", authMiddleware, adminController.addEvent);

module.exports = router;
