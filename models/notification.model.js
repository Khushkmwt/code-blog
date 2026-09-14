import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ["comment", "reply", "like"],
        required: true,
    },
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
    },
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);