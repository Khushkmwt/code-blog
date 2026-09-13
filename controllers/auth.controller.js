import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cookieOptions } from "../config/constants.js";
import { redirectWithFlash, setFlash } from "../middlewares/flash.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema, changePasswordSchema } from "../schemas/auth.schema.js";
import {
    registerUser as registerUserService,
    loginUser as loginUserService,
    logoutUser as logoutUserService,
    refreshTokens,
    changePassword as changePasswordService,
} from "../services/auth.service.js";

const registerUser = [
    validate(registerSchema),
    asyncHandler(async (req, res) => {
        const result = await registerUserService({
            name: req.body.name,
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
            avatarPath: req.file?.path,
        });

        const options = cookieOptions();
        res.cookie("accessToken", result.accessToken, options);
        res.cookie("refreshToken", result.refreshToken, options);

        redirectWithFlash(res, "/home", 'success', `Welcome aboard, ${result.user.name}! Your account is ready.`);
    }),
];

const loginUser = [
    validate(loginSchema),
    asyncHandler(async (req, res) => {
        const identifier = req.body.identifier || req.body.email || req.body.username;
        const result = await loginUserService({ identifier, password: req.body.password });

        const options = cookieOptions();
        res.cookie("accessToken", result.accessToken, options);
        res.cookie("refreshToken", result.refreshToken, options);

        redirectWithFlash(res, "/home", 'success', `Welcome back, ${result.user.name}!`);
    }),
];

const logoutUser = asyncHandler(async (req, res) => {
    await logoutUserService(req?.user?._id);

    const options = cookieOptions();
    setFlash(res, 'info', 'You have been logged out.');

    res
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .redirect("/home");
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const result = await refreshTokens(incomingRefreshToken);

    const options = cookieOptions();
    return res
        .status(200)
        .cookie("accessToken", result.accessToken, options)
        .cookie("refreshToken", result.refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken: result.accessToken, refreshToken: result.refreshToken },
                "Access token refreshed"
            )
        );
});

const changeCurrentPassword = [
    validate(changePasswordSchema),
    asyncHandler(async (req, res) => {
        await changePasswordService({
            userId: req.user?._id,
            oldPassword: req.body.oldPassword,
            newPassword: req.body.newPassword,
        });

        redirectWithFlash(res, "/home", 'success', 'Password updated successfully.');
    }),
];

const renderSignupPage = (req, res) => {
    res.render('auth/signup', { title: 'Create an account' });
};

const renderLoginPage = (req, res) => {
    res.render('auth/login', { title: 'Log in' });
};

const renderChangePasswordPage = (req, res) => {
    if (!res.locals.isLoggedIn) {
        return res.redirect("/api/v1/users/login");
    }
    res.render('auth/changepass', { title: 'Change password' });
};

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    renderSignupPage,
    renderLoginPage,
    renderChangePasswordPage,
};