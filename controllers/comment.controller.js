import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { Comment } from "../models/comment.model.js"
const createComment = asyncHandler(async(req,res) =>{
    const {comment} = req.body
    if(!comment){
        throw new ApiError(400,"comment is required")
    }
    const newComment = await Comment.create({
        content:comment,
        post: req.params.id,
        owner: req.user.id
    })
   res.redirect("/home")
})
const renderEditform = asyncHandler(async(req,res) =>{
    const id = req.params.id
    const comment =  await Comment.findById(id)
    if(!comment){
        throw new ApiError(404,"comment not found")
    }
    res.render("commentedit",{comment})
})
const editComment = asyncHandler(async(req,res) =>{
    const {comment} = req.body
    if(!comment){
        throw new ApiError(400,"comment is required")
    }
    const commentToEdit = await Comment.findByIdAndUpdate(req.params.id,{
        content:comment,
    })
    if(!commentToEdit){
        throw new ApiError(404,"comment not found")
    }
    res.redirect("/home")
})
const deleteComment = asyncHandler(async(req,res) =>{
    const id = req.params.id
    const commentToDelete = await Comment.findById(id)
    if(!commentToDelete){
        throw new ApiError(400,"comment not found")
    }
     await Comment.findByIdAndDelete(id)
     res.redirect("/home")

})
export{
    createComment,
    editComment,
    deleteComment,
    renderEditform
}