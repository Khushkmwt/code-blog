import {User} from '../models/user.model.js';
import { Post } from '../models/post.model.js';
import { Comment } from '../models/comment.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"
import { uploadFile } from '../utils/upload.js';
import { config } from '../utils/config.js';
import { setFlash } from '../middleware/flash.middleware.js';

const cookieOptions = () => ({
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax'
});

const trimOrEmpty = (value) => (typeof value === 'string' ? value.trim() : '');

// Controller function to handle user registration
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, username } = req.body;

    const cleanName = trimOrEmpty(name);
    const cleanEmail = trimOrEmpty(email).toLowerCase();
    const cleanUsername = trimOrEmpty(username);
    const cleanPassword = typeof password === 'string' ? password : '';

    if (!cleanName) throw new ApiError(400, 'Name is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new ApiError(400, 'A valid email is required');
    if (!/^[a-zA-Z0-9_]{2,20}$/.test(cleanUsername)) throw new ApiError(400, 'Username must be 2-20 characters (letters, numbers, underscore)');
    if (cleanPassword.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

    const existingUser = await User.findOne({ $or: [{ username: cleanUsername }, { email: cleanEmail }] });
    if (existingUser) {
       throw new ApiError(400, existingUser.email === cleanEmail ? 'Email already registered' : 'Username already taken');
    }

    const LocalImgpath = req.file?.path;
    const imgPath = await uploadFile(LocalImgpath);
    if (!imgPath || !imgPath.url) {
        throw new ApiError(400, 'A profile photo is required');
    }

    const user = new User({ name: cleanName, email: cleanEmail, password: cleanPassword, username: cleanUsername, coverImg: imgPath.url });
    const newuser = await user.save();

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(newuser._id);
    const options = cookieOptions();
    res.cookie("accessToken", accessToken, options);
    res.cookie("refreshToken", refreshToken, options);

    setFlash(res, 'success', `Welcome aboard, ${cleanName}! Your account is ready.`);
    res.redirect("/home");
})

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const loginUser = asyncHandler(async (req, res) => {
    const { identifier, email, username, password } = req.body;
    const loginId = trimOrEmpty(identifier || email || username);

    if (!loginId) {
        throw new ApiError(400, "Email or username is required");
    }
    if (!password || trimOrEmpty(password).length === 0) {
        throw new ApiError(400, "Password is required");
    }

    const query = loginId.includes('@')
        ? { email: loginId.toLowerCase() }
        : { username: loginId };

    const user = await User.findOne(query);

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    const options = cookieOptions();
    res.cookie("accessToken", accessToken, options);
    res.cookie("refreshToken", refreshToken, options);

    setFlash(res, 'success', `Welcome back, ${user.name}!`);
    res.redirect("/home");
});

const logoutUser = asyncHandler(async(req, res) => {
    if (req?.user?._id) {
        await User.findByIdAndUpdate(
            req.user._id,
            { $unset: { refreshToken: 1 } }
        )
    }

    const options = cookieOptions();

    setFlash(res, 'info', 'You have been logged out.');
    res
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .redirect("/home");
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            config.refreshTokenSecret
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = cookieOptions()

        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefereshTokens(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const newPass = typeof newPassword === 'string' ? newPassword : '';
    if (newPass.length < 6) {
        throw new ApiError(400, "New password must be at least 6 characters")
    }

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    if (oldPassword === newPass) {
        throw new ApiError(400, "New password must be different from the old password")
    }

    user.password = newPass
    await user.save({validateBeforeSave: false})

    setFlash(res, 'success', 'Password updated successfully.');
    res.redirect("/home")
})

const showUser = asyncHandler(async(req,res)=>{

    const user = await User.findById(req.user?._id);
    if(!user){
        throw new ApiError(404,"User not found");
    }

    const userprofile = {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePicture: user.coverImg,
        role: user.role,
        joinedAt: user.createdAt
    };

    const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 });
    const postCount = posts.length;
    const commentCount = await Comment.countDocuments({ owner: user._id });

    res.render('profile', { title: `${user.name} — Profile`, userprofile, posts, postCount, commentCount });
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    showUser,
}