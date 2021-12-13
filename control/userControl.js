const User = require('../models/user');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utily/email');
const generateToken = require('../utily/generateToken');
const passport = require('passport');

//GET Request
//---------- کنترلر مربوط به صفحه رجیستر ---------- //
module.exports.registerForm = (req, res) => {
	res.render('user/register');
};

//POST Request
//------- کنترلر مربوط به رجیستر کاربر ---------- //
module.exports.registr = async (req, res) => {
	try {
		const { username, email, password, name, confirmPassword } = req.body;
		// ------ چک کردن پسورد و تکرار پسورد ------- //
		if (password !== confirmPassword) {
			req.flash('error', 'password and confirm password do not match');
			return res.redirect('/register');
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

module.exports.loginUser = (req, res, next) => {
	passport.authenticate('local', function(err, user, info) {
		if (err) {
			return next(err);
		}
		if (!user) {
			req.flash('error', 'username or password incorrect');
			return res.redirect('/login');
		}
		if (!user.active) {
			req.flash('error', 'account is not active');
			return res.redirect('/login');
		}
		req.logIn(user, function(err) {
			if (err) {
				return next(err);
			}
			req.flash('success', `wellcome ${user.name}`);
			return res.redirect('/dashboard');
		});
	})(req, res, next);
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

//GET Request
//-------- کنترلر مربوط به نمایش صفحه forget password --------- //
module.exports.forgetPasswordPage = (req, res) => {
	res.render('user/forgetPassword');
};

//POST Request
// -------- کنترلر مربوط به فراموشی رمز عبور ---------- //
module.exports.forgetPasswordSendEmail = async (req, res) => {
	try {
		const { email } = req.body;
		const existUser = await User.findOne({ email });
		if (!existUser) {
			req.flash('error', "user don't exist!");
			return res.redirect('/forget_password');
		}

		const emailToken = generateToken(existUser._id);
		const url = `${process.env.WEB_URL}/reset_password/${emailToken}`;
		await sendEmail({
			email,
			subject: 'Reset Password Email',
			html: `Please click link to reset your password: <a href=${url}>Reset Password</a>`
		});

		req.flash('success', 'Email successfully sent, please check your email address');
		res.redirect('/confirm_message');
	} catch (err) {
		req.flash('error', err.message);
		res.redirect('/forget_password');
	}
};
//GET Request

module.exports.resetPasswordCheck = async (req, res) => {
	try {
		//استخراج ای دی ذخیره شده در توکن کاربر
		const { id } = jwt.verify(req.params.token, process.env.JWT_SECRET);
		const user = await User.findById(id);

		if (!user) {
			req.flash('error', 'user not found');
			return res.redirect('/forget_password');
		}
		req.flash('success', 'you can reset your password');
		res.render('user/resetPassword', { id: user._id });
	} catch (err) {
		req.flash('error', err.message);
		res.redirect('/forget_password');
	}
};

module.exports.resetPassword = async (req, res) => {
	try {
		const { password } = req.body;
		const { id } = req.params;

		const user = await User.findById(id);
		console.log(password);
		await user.setPassword(password);
		await user.save();

		req.flash('success', 'password successfully reset');
		res.redirect('/login');
	} catch (err) {
		req.flash('error', err.message);
		res.redirect('/forget_password');
	}
};

module.exports.logoutUser = (req, res) => {
	req.logOut();
	req.flash('success', 'GoodBye');
	res.redirect('/');
};
