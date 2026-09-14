import { asyncHandler } from "../utils/asyncHandler.js";
import { getHomeSummary } from "../services/page.service.js";
import { getFollowFeed } from "../services/user.service.js";

const renderHome = asyncHandler(async (req, res) => {
    const summary = await getHomeSummary();

    const viewer = res.locals.user;
    const followFeed = viewer?._id ? await getFollowFeed(viewer._id) : [];

    res.render('static/home', {
        title: 'Code-Blog — Where developers share',
        ...summary,
        followFeed,
    });
});

const renderAbout = (req, res) => {
    res.render('static/about', { title: 'About us' });
};

const renderContact = (req, res) => {
    res.render('static/contact', { title: 'Contact' });
};

export { renderHome, renderAbout, renderContact };