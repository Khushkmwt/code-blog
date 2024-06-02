import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { authenticateUser } from './middleware/auth.middleware.js';
import ejsmate from 'ejs-mate';
import cors from 'cors';
import userRouter from './routes/user.route.js';
import postRouter from './routes/post.route.js';

import blogRouter from './routes/blog.route.js';
import commentRouter from './routes/comment.route.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

app.engine('ejs', ejsmate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
    res.locals.isLoggedIn = res.locals.isLoggedIn || false;
    next();
});

app.use(authenticateUser);
app.get('/', (req, res) => {
    res.render('home', { isLoggedIn: res.locals.isLoggedIn });
});

app.get('/home', (req, res) => {
    res.render('home', { isLoggedIn: res.locals.isLoggedIn });
});
app.get('/about', (req, res) => {
    res.render('about', { isLoggedIn: res.locals.isLoggedIn });
});
app.get('/contact',(req,res) =>{
    res.render('contact', { isLoggedIn: res.locals.isLoggedIn });
})

app.use('/api/v1/users', userRouter);
app.use('/api/v1/post', postRouter);
app.use('/api/v1/blog' , blogRouter)
app.use('/api/v1/post/comment',commentRouter)




app.use((req, res, next) => {
    res.status(404);
    res.render('error', { title: 'Page Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
export { app };
