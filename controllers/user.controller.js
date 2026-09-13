import { asyncHandler } from "../utils/asyncHandler.js";
import { getProfile } from "../services/user.service.js";

const showProfile = asyncHandler(async (req, res) => {
    const { userprofile, posts, postCount, commentCount } = await getProfile(req.user?._id);
    res.render('users/profile', {
        title: `${userprofile.name} — Profile`,
        userprofile,
        posts,
        postCount,
        commentCount,
    });
});

export { showProfile };