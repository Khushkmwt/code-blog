import mongoose from "mongoose";
import { Schema } from "mongoose";
const videoSchema = new Schema({
    post:{
        type:Schema.Types.ObjectId,
        ref:"Post"
    },
    description:{
        type:String,
        required:true
    },
    url:{
        type:String,
        required:true
    }
},{timestamps:true});

export const Video = mongoose.model("Video", videoSchema);