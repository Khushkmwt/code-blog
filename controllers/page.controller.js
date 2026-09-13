import { asyncHandler } from "../utils/asyncHandler.js";
import { getHomeSummary } from "../services/page.service.js";

const renderHome = asyncHandler(async (req, res) => {
    const summary = await getHomeSummary();
    res.render('static/home', {
        title: 'Code-Blog — Where developers share',
        ...summary,
    });
});

const renderAbout = (req, res) => {
    res.render('static/about', { title: 'About us' });
};

const renderContact = (req, res) => {
    res.render('static/contact', { title: 'Contact' });
};

export { renderHome, renderAbout, renderContact };