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
import { readingMinutes } from './utils/reading-time.js';
import { apiV1Router } from './routes/index.routes.js';

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
    res.locals.readingMinutes = readingMinutes;
    next();
});

app.use(authenticateUser);
app.use(flash);

app.get('/', renderHome);
app.get('/home', renderHome);
app.get('/about', renderAbout);
app.get('/contact', renderContact);

app.use('/api/v1', apiV1Router);

app.use(notFound);
app.use(errorMiddleware);

export { app };