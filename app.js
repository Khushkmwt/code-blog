import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { authenticateUser } from './middleware/auth.middleware.js';
import { flash } from './middleware/flash.middleware.js';
import ejsmate from 'ejs-mate';
import cors from 'cors';
import userRouter from './routes/user.route.js';
import postRouter from './routes/post.route.js';

import blogRouter from './routes/blog.route.js';
import commentRouter from './routes/comment.route.js'
import { config } from './utils/config.js';
import { Post } from './models/post.model.js';
import { User } from './models/user.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({
    origin: config.corsOrigin,
    credentials: true
}));

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(express.static('public'));
app.use(cookieParser());

app.engine('ejs', ejsmate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
    res.locals.isLoggedIn = res.locals.isLoggedIn || false;
    res.locals.user = res.locals.user || null;
    res.locals.currentPath = req.path;
    res.locals.flash = res.locals.flash || null;
    next();
});

app.use(authenticateUser);
app.use(flash);

const getHome = async (req, res) => {
    const [latestPosts, postsCount, usersCount] = await Promise.all([
        Post.find({}).populate('author', 'name').sort({ createdAt: -1 }).limit(3),
        Post.countDocuments(),
        User.countDocuments(),
    ]);
    res.render('home', { title: 'Code-Blog — Where developers share', latestPosts, postsCount, usersCount });
};

app.get('/', getHome);
app.get('/home', getHome);
app.get('/about', (req, res) => {
    res.render('about', { title: 'About us', isLoggedIn: res.locals.isLoggedIn });
});
app.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact', isLoggedIn: res.locals.isLoggedIn });
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/post', postRouter);
app.use('/api/v1/blog', blogRouter);
app.use('/api/v1/post/comment', commentRouter);

app.use((req, res) => {
    res.status(404);
    res.render('error', { title: 'Page Not Found', status: 404, isLoggedIn: res.locals.isLoggedIn });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    let status = err.statusCode || 500;
    let message = err.message || 'Something went wrong';

    if (err.name === 'MulterError') {
        status = 400;
        message = err.message;
    } else if (err.name === 'ValidationError') {
        status = 400;
        const first = Object.values(err.errors || {})[0];
        message = first?.message || 'Invalid input';
    } else if (err.code === 11000) {
        status = 409;
        message = 'A resource with that value already exists';
    }

    res.status(status).render('error', { title: message, status, isLoggedIn: res.locals.isLoggedIn });
});

export { app };