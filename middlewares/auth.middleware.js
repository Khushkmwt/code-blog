import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
import { config } from "../config/index.js";
import { countUnread } from "../services/notification.service.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
       
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, config.accessTokenSecret)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})

export const requireRole = (...roles) => (req, _res, next) => {
    if (!req.user) throw new ApiError(401, "Unauthorized request");
    if (!roles.includes(req.user.role)) {
        throw new ApiError(403, "You need the author role to do that");
    }
    next();
};

export const authenticateUser = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            res.locals.isLoggedIn = false;
            return next();
        }

        const decodedToken = jwt.verify(token, config.accessTokenSecret);
       
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");

        if (!user) {
            res.locals.isLoggedIn = false;
            return next();
        }

        res.locals.isLoggedIn = true;
        res.locals.user = user;
        res.locals.unreadNotifications = await countUnread(user._id);
        next();
    } catch (error) {
        res.locals.isLoggedIn = false;
        next();
    }
};