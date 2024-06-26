import mongoose from "mongoose";
import { Schema } from "mongoose";
const commentSchema = new mongoose.Schema({
    content:{
        type:String,
        required:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    post: {
        type:Schema.Types.ObjectId,
        ref:"Post",
        required:true
    },
    
},{timestamps:true})

export const Comment = mongoose.model("Comment", commentSchema);