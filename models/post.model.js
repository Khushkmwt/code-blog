
import mongoose, { Schema } from "mongoose";
const postSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        unique:true
    },
    desc: {
        type:String,
        required: function () { return this.status !== 'draft'; },
    },
    detail:{
        type:String,
        required: function () { return this.status !== 'draft'; },
    },
author: {
    type:Schema.Types.ObjectId,
    ref:"User",
    required:true
   },
    tags: {
        type: [String],
        default: [],
    },
    status: {
        type: String,
        enum: ["draft", "published"],
        default: "published",
    },
    likes: {
        type: [Schema.Types.ObjectId],
        ref: "User",
        default: [],
    },
    views: {
        type: Number,
        default: 0,
    },
  },{timestamps:true})

export const Post = mongoose.model("Post", postSchema);