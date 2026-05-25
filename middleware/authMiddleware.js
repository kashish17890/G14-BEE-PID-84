const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config/jwt");

module.exports = function authMiddleware(req, res, next) {
    const token = req.headers.authorization || req.query.token;

    if (!token) {
        return res.send("Access Denied");
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        req.token = token;
        next();
    } catch (err) {
        res.send("Invalid Token");
    }
};
