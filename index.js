const express = require('express');
const passport = require('passport');
const app = express();
const low = require('lowdb');

const FileSync = require('lowdb/adapters/FileSync');
const Strategy = require('passport-local').Strategy;

const adapter = new FileSync('db.json');
const db = low(adapter);
const port = 3000;

app.use(express.urlencoded({extended: true}));
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('express-session')({ secret: '2s1-vs2-kwe-ay6', resave: false, saveUninitialized: false }));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + '/public'));

//Authentication strategy using lowdb
passport.use(new Strategy((username, password, cb) => {
    const user = db.get('users')
        .filter({username: username})
        .first()
        .value();
    if (user === undefined) {
        return cb('Error: wrong username and/or password');
    }
    if (user.length == 0) {
        return cb(null, false);
    }
    if (user.password != password) {
        return cb(null, false);
    }
    return cb(null, user);
}));

passport.serializeUser((user, cb) => {
    cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
    const users = db.get('users').filter({id: id}).value();
    if (users === undefined) {
        return cb('Error');
    }
    if (users.length == 0) {
        return cb(null, false);
    }
    return cb(null, users[0]);
});

//get profile dashboard

app.get('/dashboard', require('connect-ensure-login').ensureLoggedIn('/sign-in'), (req, res) => {
	res.sendFile(__dirname + '/dashboard.html');
});

//log out of profile dashboard

app.post('/dashboard', require('connect-ensure-login').ensureLoggedIn('/sign-in'), (req, res) => {
	req.logout();
    res.redirect('/');
});

//get sign in page

app.get('/sign-in', (req, res) => {
	res.sendFile(__dirname + '/sign-in.html');
});

//process sign in request

app.post('/sign-in', passport.authenticate('local', {
    successReturnToOrRedirect: '/dashboard',
    failureRedirect: '/sign-in#failure'
}))

//get sign up page

app.get('/sign-up', require('connect-ensure-login').ensureLoggedOut('/dashboard'), (req, res) => {
	res.sendFile(__dirname + '/sign-up.html');
})

//process sign up request

app.post('/sign-up', (req, res) => {
    //validate username and password
    if (req.body.username && req.body.password &&
        /^[a-z0-9]{3,}$/i.test(req.body.username) && /^[a-z0-9]{3,}$/i.test(req.body.password)) {
        //get number of users to use as the new id
        count = db.get('usercount').value();
        //add new user
        db.get('users')
            .push({id: count, username: req.body.username, password: req.body.password})
            .write();
        //increase user count
        db.set('usercount', count + 1)
            .write();
        //redirect to sign in page
        res.redirect('/sign-in');
    } else {
        //using hash to tell the user if something went wrong
        res.redirect('/sign-up#failure');
    }
})

//process booking request

app.post('/booking', (req, res) => {
    //getting necessary stuff to make a new record
    const date = new Date(+req.body.date);
    const hours = +req.body.time.split(':')[0];
    const minutes = +req.body.time.split(':')[1];
    const service = req.body.service;
    const name = req.body.name;
    const phone = req.body.tel;
    const email = req.body.email;
    //creating new record
    const timeslot = {isBooked: true, service: service, name: name, phone: phone, email: email}
    //putting new record up
    db.get('timetables')
        .filter({date: {year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate()}})
        .first().get('timeslots')
        .filter({hours: hours, minutes: minutes})
        .first().get('booking')
        .assign(timeslot)
        .write();
    //using hash to tell the user that we booked a slot
    res.redirect('/booking#success');
})

//processing async booking API

app.post('/booking-query', (req, res) => {
    //request for drawing calendar
    if (req.body.queryType === 'calendar') {
        let date = new Date();
        let currentDate = date.valueOf();
        
        //date = -1 as a shortcut for current date
        if (+(req.body.data.date) !== -1) {
            date = new Date(+(req.body.data.date));
        }
        
        //forming some data about the requested month
        const thisYear = date.getFullYear();
        const thisMonth = date.getMonth();
        //first day of week this month, making it zero-based, starting monday
        let firstDayOfWeek = new Date(date.getFullYear(), date.getMonth(), 1).getDay() - 1;
        //making sunday 6 instead of -1
        if (firstDayOfWeek === -1) {firstDayOfWeek = 6}
        //number of days this month
        const daysNumber = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        
        //finding out what days have booking available (without actually checking for time slots)
        const daysWithBooking = [];
        const query = db.get('timetables')
            .filter({date: {year: date.getFullYear(), month: date.getMonth() + 1}})
            .value();
        
        query.forEach((e) => {
            daysWithBooking.push(e.date.day);
        })
        
        //processing response
        res.send(JSON.stringify({year: thisYear, currentDate: currentDate, month: thisMonth, firstDay: firstDayOfWeek, days: daysNumber, availableDays: daysWithBooking}));
    }
    
    //processing requests for available time slots for a specified date
    
    if (req.body.queryType === 'time') {
        const date = new Date(+(req.body.data.date));
        
        //getting all unbooked time slots
        const query = db.get('timetables')
            .filter({date: {year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate()}})
            .first().get('timeslots')
            .filter({booking: {isBooked: false}})
            .value();
        
        const timeslots = [];
        
        //if the date is today we only push the time slot if it's after the current time
        query.forEach((e) => {
            if ((Math.ceil(new Date().valueOf()/86400000) !== Math.ceil(date.valueOf()/86400000))
                || e.hours > now.getHours())
            timeslots.push({hours: e.hours, minutes: e.minutes})
        });
        
        //processing response
        res.send(JSON.stringify({timeslots: timeslots}));
    }
});

app.listen(port, () => console.log(`listening on port ${port}!`));