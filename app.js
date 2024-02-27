import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';

import indexRouter from './routes/index.js';
import usersRouter from './routes/user.js';
import booksRouter from './routes/book.js';
import passportConfig from './util/auth.js';

const app = express();

//cors
app.use(cors(
    {
        origin: "http://localhost:3000",
        credentials: true,
        sameSite: "None",
    }
));

// view engine setup
app.set('views', path.join(import.meta.dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(import.meta.dirname, 'public')));

//TypeError: Do not know how to serialize a BigInt用
BigInt.prototype.toJSON = function () {
    return this.toString()
}

//session
app.use(session({
    secret: "4+KcU1MoHCJaiXvHpHhJUrXk1TZZ7Nyy/9lvGt0SybBABLgP",
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 60 * 60 * 1000}
}))

//passport
app.use(passport.authenticate("session"));
app.use(passportConfig(passport));


app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/book', booksRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

export default app;
