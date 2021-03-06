'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const routes = require('./routes/index');

const app = express();
const port = process.env.PORT || 3000;

// mongoose and db connect
mongoose.connect('mongodb://localhost:27017/eventcalendardb');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));

/*----------- middleware ---------------*/

// track user logins using sessions - session can be accessed in any request object
//  - store that session in mongo
app.use(session({
    secret: 'event schedule session',
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
        mongooseConnection: db
    })
}));

// make the userId available to views - control which particular templates are displayed
app.use((req, res, next)=>{
    // if the user is not logged in => currentUser === undefined
    res.locals.currentUser = req.session.userId;
    next();
});

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// serve static files from 'public'
app.use(express.static(path.join(__dirname, '/public')));

// define the view engine
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

// include routes
app.use('/', routes);

// catch 404 errors and forward to the error handler
app.use((req, res, next)=>{
    let err = new Error('Page not found');
    err.status = 404;
    next(err);
});

// error handler
app.use((err, req, res, next)=>{
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.listen(port, ()=>{
    console.log(`Express is listening on port ${port}`);
});