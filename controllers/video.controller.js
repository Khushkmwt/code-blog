import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.js";
import { Post } from "../models/post.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadvideo = asyncHandler(async (req, res) => {
    const { description } = req.body;
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
        throw new ApiError(400, "Post not found");
    }

    const postId = post._id;
    const VideoLocalPath = req.files?.videoFile[0]?.path;

    if (!VideoLocalPath) {
        throw new ApiError(400, "Video is required");
    }

    const video = await uploadOnCloudinary(VideoLocalPath);
    const videoUrl = video.url;

    if (!videoUrl) {
        throw new ApiError(500, "Video upload failed");
    }

    const newVideo = await Video.create({
        post: postId,
        description,
        url: videoUrl
    });

    if (!newVideo) {
        throw new ApiError(500, "Video upload failed");
    }

    res.status(201).json({ success: true, data: newVideo });
});

export { uploadvideo };
