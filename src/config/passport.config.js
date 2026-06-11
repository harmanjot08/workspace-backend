import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import * as authService from '../services/authService.js';

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const user = await authService.loginWithGoogle(profile, null);
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.user.id);
});

passport.deserializeUser((id, done) => {
    done(null, { id });
});

export default passport;