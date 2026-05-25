const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/users");

module.exports = function(passport) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                let user = await User.findOne({ email });

                if (user) {
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        await user.save();
                    }
                } else {
                    user = await User.create({
                        googleId: profile.id,
                        name: profile.displayName,
                        email
                    });
                }

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    ));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
