import { cookieOptions } from "../config/constants.js";

const setFlash = (res, type, message) => {
    res.cookie('flash', encodeURIComponent(JSON.stringify({ type, message })), {
        ...cookieOptions(),
        maxAge: 10 * 1000
    });
};

const redirectWithFlash = (res, path, type, message) => {
    setFlash(res, type, message);
    res.redirect(path);
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
        res.clearCookie('flash', cookieOptions());
    }
    next();
};

export { setFlash, redirectWithFlash, flash }