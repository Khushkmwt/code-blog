import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
       
        if (!token) {
            console.log(req.cookies);
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
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

export const authenticateUser = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            res.locals.isLoggedIn = false; // Set isLoggedIn to false if no token is present
            return next();
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
       
        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(401, "User not found");
        }

        res.locals.isLoggedIn = true; // Set isLoggedIn to true if user is found
        res.locals.user = user; // Set the user in res.locals
        next();
    } catch (error) {
        res.locals.isLoggedIn = false; // Set isLoggedIn to false if an error occurs
        next(error);
    }
};