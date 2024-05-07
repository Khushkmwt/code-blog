
import mongoose, { Schema } from "mongoose";
const postSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        unique:true
    },
    desc: {
        type:String,
        required:true,
    },
    detail:{
        type:String,
        required:true,
    },
   author: {
    type:Schema.Types.ObjectId,
    ref:"User",
    required:true
   },
  
},{timestamps:true})

export const Post = mongoose.model("Post", postSchema);