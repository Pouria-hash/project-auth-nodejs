if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const engine = require('ejs-mate');
const ExpressError = require('./utily/ExpressError');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const passport = require('passport');
const localStrategy = require('passport-local');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

const User = require('./models/user');

const userRouter = require('./router/userRouter');

const secret = process.env.SECRET;
const dbUse = process.env.DB_USE;

mongoose
	.connect(dbUse, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false })
	.then(() => {
		console.log('mongosoe connection open');
	})
	.catch((e) => {
		console.log('mongoose connection error', e);
	});

//----------  تعریف ejs به عنوان تمپلیت انجین استفاده شده در برنامه -------- //
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//-------urlencoded وظیفه انکد کردن داده های فرم های ارسال شده برای سرور ---------//

app.use(express.urlencoded({ extended: true }));

// -------------- method override برای اجرا متد های مختلف در فرم ها --------- //

app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// ------------ جلو گیری از ارسال کد های مخرب به دیتا بیس میکند -------- //
app.use(
	mongoSanitize({
		replaceWith: '_'
	})
);
// ---------- استفاده از helmet برای امنیت برنامه  ---------- //
app.use(helmet({ contentSecurityPolicy: false }));

//------------ تعریف یک sotre ذخیره اطلاعات session --------- //

const store = new MongoStore({
	url: dbUse,
	secret: secret,
	touchAfter: 24 * 60 * 60
});

store.on('error', function(e) {
	console.log('session store error', e);
});

// -------------  کانفیگ مربوط به session -------------//

const sessionConfig = {
	store,
	name: 'session',
	secret: secret,
	resave: false,
	saveUninitialized: false,
	cookie: {
		httponly: true,
		// secure:process.env === 'production' ? true : false,
		expires: Date.now() + 1000 * 60 * 60 * 24,
		maxAge: 1000 * 60 * 60 * 24
	}
};
// -----------  استفاده از session برای ذخبره اطلاعات کاربر --------- //
app.use(session(sessionConfig));
app.use(flash());

// -----------  نمایش پیغام ها و اطلاعات کاربر به صورت لوکالی در تمام صفحات -------- //
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ------------ نمایش پیغام ها و اطلاعات کاربر به صورت لوکالی در تمام صفحات ---------- //
app.use((req, res, next) => {
	res.locals.success = req.flash('success');
	res.locals.error = req.flash('error');
	res.locals.currentUser = req.user;
	next();
});

//--------- مسیر های مربوط به احراز هویت کاربر ---------- //
app.use('/', userRouter);

//----------- مسیر مربوط هوم اسکرین ---------- //
app.get('/', (req, res) => {
	res.render('home');
});

//--------- مسیر مربوط به نمایش صفحه about ---------- //
app.get('/about', (req, res) => {
	res.render('about');
});

// ------- مسیر مبروط به نمایش صفحه contact ------- //
app.get('/contact', (req, res) => {
	res.render('contact');
});

// ---------  ایجاد ارور برای صفحه هایی که موجود نیستند ----------//
app.use('*', (req, res, next) => {
	next(new ExpressError('Page not found', 404));
});

//-------- ارور هندلینگ برای گرفتن ارور های برنامه و نمایش انها ----------//
app.use((err, req, res, next) => {
	const { status = 505 } = err;
	if (!err.message) err.message = 'inavalid data';
	res.status(status).render('error', { err });
});

//--------- ایجاد سرور در پورت 5000 ------------//
const port = process.env.PORT || 5000;
app.listen(port, () => {
	console.log(`serving in port ${port}`);
});
