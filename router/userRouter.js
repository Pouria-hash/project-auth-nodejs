const express = require('express');
const router = express.Router();
const wrapAsync = require('../utily/wrapAsync');
const { isLoggedIn, isAuth } = require('../utily/middleware');
const user = require('../control/userControl');

//----------محافظت شده در صورتی که کاربر احراز هویت شده باشد این مسیر نمایش داده نمیشود -------- //
router.get('/register', isAuth, user.registerForm);
router.post('/register', isAuth, wrapAsync(user.registr));

//----------محافظت شده در صورتی که کاربر احراز هویت شده باشد این مسیر نمایش داده نمیشود -------- //
router.get('/login', isAuth, user.loginForm);
router.post('/login', isAuth, user.loginUser);

router.get('/confirm_message', user.confirmMessage);
router.get('/confirmEmail/:id', wrapAsync(user.confirmEmail));

// --------- محافظت شده در صورت احراز هویت کاربر این مسیر برای کاربر نمایش داده میشود
router.get('/dashboard', isLoggedIn, user.dashboardPage);
router.put('/dashboard', isLoggedIn, wrapAsync(user.updateProfile));

// ------ مسیر های مربوط به فراموشی رمز عبور -------- //
router.get('/forget_password', isAuth, user.forgetPasswordPage);
router.post('/forget_password', isAuth, user.forgetPasswordSendEmail);

router.get('/reset_password/:token', isAuth, user.resetPasswordCheck);
router.put('/reset_password/:id', isAuth, user.resetPassword);

router.get('/logout', user.logoutUser);

module.exports = router;
