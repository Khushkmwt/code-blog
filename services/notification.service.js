import { Notification } from "../models/notification.model.js";

const createNotification = async ({ user, actor, type, post = null, comment = null }) => {
    if (!user || !actor || user.toString() === actor.toString()) return null;

    if (type === 'like') {
        // Reuse an already-unread like from the same actor on the same post
        await Notification.findOneAndUpdate(
            { user, actor, type: 'like', post, read: false },
            { $setOnInsert: { comment: null } },
            { upsert: true }
        );
        return null;
    }

    return Notification.create({ user, actor, type, post, comment });
};

const getNotifications = async (userId, limit = 50) => {
    return Notification.find({ user: userId })
        .populate('actor', 'name username')
        .populate('post', 'title')
        .sort({ createdAt: -1 })
        .limit(limit);
};

const markAllRead = async (userId) => {
    return Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
};

const countUnread = async (userId) => {
    return Notification.countDocuments({ user: userId, read: false });
};

export { createNotification, getNotifications, markAllRead, countUnread };