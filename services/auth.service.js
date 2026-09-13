import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadFile } from "../utils/upload.js";
import { config } from "../config/index.js";

const issueTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};

const registerUser = async ({ name, email, username, password, avatarPath }) => {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        throw new ApiError(400, existingUser.email === email ? 'Email already registered' : 'Username already taken');
    }

    const imgPath = await uploadFile(avatarPath);
    if (!imgPath || !imgPath.url) {
        throw new ApiError(400, 'A profile photo is required');
    }

    const user = new User({ name, email, password, username, coverImg: imgPath.url });
    await user.save();

    const tokens = await issueTokens(user._id);
    return { user, ...tokens };
};

const loginUser = async ({ identifier, password }) => {
    const loginId = typeof identifier === 'string' ? identifier.trim() : '';

    if (!loginId) throw new ApiError(400, "Email or username is required");
    if (!password || (typeof password === 'string' && password.trim().length === 0)) {
        throw new ApiError(400, "Password is required");
    }

    const query = loginId.includes('@')
        ? { email: loginId.toLowerCase() }
        : { username: loginId };

    const user = await User.findOne(query);
    if (!user) throw new ApiError(404, "User does not exist");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

    const tokens = await issueTokens(user._id);
    return { user, ...tokens };
};

const logoutUser = async (userId) => {
    if (userId) {
        await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    }
};

const refreshTokens = async (incomingRefreshToken) => {
    if (!incomingRefreshToken) throw new ApiError(401, "unauthorized request");

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, config.refreshTokenSecret);
        const user = await User.findById(decodedToken?._id);

        if (!user) throw new ApiError(401, "Invalid refresh token");
        if (incomingRefreshToken !== user?.refreshToken) throw new ApiError(401, "Refresh token is expired or used");

        const tokens = await issueTokens(user._id);
        return { user, ...tokens };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(401, "Invalid refresh token");
    }
};

const changePassword = async ({ userId, oldPassword, newPassword }) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) throw new ApiError(400, "Invalid old password");

    if (oldPassword === newPassword) throw new ApiError(400, "New password must be different from the old password");

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return user;
};

export { registerUser, loginUser, logoutUser, refreshTokens, changePassword };