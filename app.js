import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import ejsmate from 'ejs-mate';
import cors from 'cors';
import { authenticateUser } from './middlewares/auth.middleware.js';
import { flash } from './middlewares/flash.middleware.js';
import { notFound } from './middlewares/not-found.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { config } from './config/index.js';
import { renderHome, renderAbout, renderContact } from './controllers/page.controller.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import postRouter from './routes/post.routes.js';
import blogRouter from './routes/blog.routes.js';
import commentRouter from './routes/comment.routes.js';

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

app.get('/', renderHome);
app.get('/home', renderHome);
app.get('/about', renderAbout);
app.get('/contact', renderContact);

app.use('/api/v1/users', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/blog', blogRouter);
app.use('/api/v1/post', postRouter);
app.use('/api/v1/post/comment', commentRouter);

app.use(notFound);
app.use(errorMiddleware);

export { app };