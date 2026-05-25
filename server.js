const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();
const session = require("express-session");
const passport = require("passport");
const passportConfig = require("./config/passport");
const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "your_secret_key",
        resave: false,
        saveUninitialized: true
    })
);
app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport);

app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", adminRoutes);

connectDB();

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});