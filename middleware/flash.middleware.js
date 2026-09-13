import { config } from "../utils/config.js";

const COOKIE_OPTS = {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: config.isProduction
};

const setFlash = (res, type, message) => {
    res.cookie('flash', encodeURIComponent(JSON.stringify({ type, message })), {
        ...COOKIE_OPTS,
        maxAge: 10 * 1000
    });
};

const flash = (req, res, next) => {
    res.locals.flash = null;
    const raw = req.cookies?.flash;
    if (raw) {
        try {
            res.locals.flash = JSON.parse(decodeURIComponent(raw));
        } catch {
            res.locals.flash = null;
        }
        res.clearCookie('flash', COOKIE_OPTS);
    }
    next();
};

export { setFlash, flash, COOKIE_OPTS }