import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import mongoose from "mongoose";
import { config } from "../config/index.js";
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        default:"reader",
        enum:["reader","author","admin"]
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    refreshToken: {
        type: String
    },
    coverImg:{
        type:String
    },
    bio:{
        type:String,
        default:"",
        maxlength:160
    },
    following:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"User",
        default:[]
    },
    bookmarks:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"Post",
        default:[]
    }
},{timestamps:true})
userSchema.pre("save", async function () {
    if(!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
        },
        config.accessTokenSecret,
        {
            expiresIn: config.accessTokenExpiry
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        config.refreshTokenSecret,
        {
            expiresIn: config.refreshTokenExpiry
        }
    )
}
// userSchema.methods.isLoggedIn = function(){
//     return this.refreshToken ? true : false
// }
 export const User = mongoose.model("User",userSchema)

