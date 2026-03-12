const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

function readUsers() {
    const data = fs.readFileSync("users.json", "utf-8");
    return JSON.parse(data);
}
function writeUsers(users) {
    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}
app.get("/", (req, res) => {
    res.render("login");
});
app.get("/login", (req, res) => {
    res.render("login");
});
app.get("/signin", (req, res) => {
    res.render("signin");
});
app.post("/signup", (req, res) => {
    const { email, password, name, roll, year ,role} = req.body;
    const users = readUsers();
    const exists = users.find(u => u.email === email);
    if (exists) {
        return res.status(400).json({ message: "Account already exists" });
    }
    users.push({ email, password, name, roll, year,role });
    writeUsers(users);
    res.json({ message: "Sign up successful" });
});
app.post("/login", (req, res) => {

const { email, password } = req.body;
const users = readUsers();

const user = users.find(
u => u.email === email && u.password === password
);

if(!user){
return res.json({ message: "Invalid email or password" });
}

if(user.role === "teacher"){
return res.json({ redirect: "/admin.html",user });
}

return res.json({ redirect: "/dashboard.html",user});

});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});