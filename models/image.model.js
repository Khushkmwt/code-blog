import mongoose from "mongoose";
import { Schema } from "mongoose";
const imageSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: "Post"
    },
    url:{
        type: String,
        required: true
    },
},{timestamps:true});

export const Image = mongoose.model("Image", imageSchema);