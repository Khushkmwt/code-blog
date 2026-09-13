const errorMiddleware = (err, req, res, next) => {
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
    } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        status = 401;
        message = 'Unauthorized request';
    } else if (err.name === 'CastError') {
        status = 404;
        message = 'Requested resource was not found';
    }

    if (status >= 500) {
        console.error(err.stack);
    }

    res.status(status);
    res.render('shared/errors/error', { title: message, status, isLoggedIn: res.locals.isLoggedIn });
};

export { errorMiddleware };