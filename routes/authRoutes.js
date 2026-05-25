const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authController.renderLogin);
router.get("/login", authController.renderLogin);
router.get("/signin", authController.renderSignin);
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    authController.googleCallback
);
router.get("/choose-role/:userId", authController.renderChooseRole);
router.post("/set-role", authMiddleware, authController.setRole);
router.get("/signin/:userId", authMiddleware, authController.renderSigninStudent);
router.get("/complete-profile/:userId", authMiddleware, authController.renderCompleteProfile);
router.post("/complete-profile", authMiddleware, authController.completeProfile);

module.exports = router;
