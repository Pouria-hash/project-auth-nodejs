const User = require('../models/user');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utily/email');
const generateToken = require('../utily/generateToken');
const passport = require('passport');

module.exports.registerForm = (req, res) => {
	res.render('user/register');
};

module.exports.registr = async (req, res) => {
	try {
		const { username, email, password, name, confirmPassword } = req.body;
		if (password !== confirmPassword) {
			req.flash('error', 'password and confirm password do not match');
			res.redirect('/register');
		}

		const u = new User({ username, email, name });
		const registerUser = await User.register(u, password);

		//ایجاد یک توکن که ایدی کابر را در ان ذخیره میکنیم و ارسال ان به ایمیل کاربر
		// برای پیدا کردن یوزر ذخیره شده در دیتا بیس و اکتیو کردن اکانت ان
		const emailToken = generateToken(registerUser._id);
		const url = `${process.env.WEB_URL}/confirmEmail/${emailToken}`;
		await sendEmail({
			email,
			subject: 'Confirm Email',
			html: `Please click link to confirm your email: <a href=${url}>Confirm Email</a>`
		});

		req.flash('success', 'Email successfully sent, please check your email address');
		res.redirect('/confirm_message');
	} catch (err) {
		req.flash('error', err.message);
		res.redirect('/register');
	}
};

//---------- مسیر مربوط به فعال سازی اکانت کاربر------------//
module.exports.confirmEmail = async (req, res, next) => {
	try {
		//استخراج ای دی ذخیره شده در توکن کاربر
		const { id } = jwt.verify(req.params.id, process.env.JWT_SECRET);
		const user = await User.findByIdAndUpdate(id, { active: true });
		// بعد از پیدا کردن کاربر و فعال سازی اکانت کاربر لاگین میشود
		req.logIn(user, (err) => {
			if (err) return next(err);
			req.flash('success', 'Wellcome');
			res.redirect('/dashboard');
		});
	} catch (err) {
		req.flash('error', err.message);
		res.redirect('/register');
	}
};

module.exports.loginForm = (req, res) => {
	res.render('user/login');
};

module.exports.loginUser = (req, res) => {
	const foundPath = req.session.returnTo || '/';
	delete req.session.returnTo;
	req.flash('success', 'Wellcome Back');
	res.redirect(foundPath);
};

//GET Request
// مسیر مربوط به صفحه داشبورد
module.exports.dashboardPage = (req, res) => {
	res.render('user/dashboard');
};

//PUT Request
// مسیر مربوط به اپدیت کردن اطلاعات کاربر
module.exports.updateProfile = async (req, res) => {
	const { email, name, password, newPassword } = req.body;
	const username = req.user.username;

	const user = await User.findOne({ username });
	if (!password) {
		user.email = email;
		user.name = name;
		await user.save();
		req.flash('success', 'email / name updated!');
		res.status(200).redirect('/dashboard');
	} else {
		user.email = email;
		user.name = name;
		user.changePassword(password, newPassword, (err) => {
			if (err) {
				if (err.name === 'IncorrectPasswordError') {
					req.flash('error', 'Incorrect Password');
					res.redirect('/dashboard');
				} else {
					req.flash('error', 'Something went wrong!! Please try again after sometimes.');
					res.redirect('/dashboard');
				}
			} else {
				req.flash('success', 'Profile has been successfully updated');
				res.redirect('/dashboard');
			}
		});
	}
};

// GET Request
// مسیر مربوط به صفحه موفقیت امیز بودن ارسال ایمیل فعال سازی
module.exports.confirmMessage = (req, res) => {
	res.render('user/confirmMessage');
};

module.exports.logoutUser = (req, res) => {
	req.logOut();
	req.flash('success', 'GoodBye');
	res.redirect('/');
};
