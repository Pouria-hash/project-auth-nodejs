const express = require('express');
const router = express.Router();
const wrapAsync = require('../utily/wrapAsync');
const { isLoggedIn, isAuth } = require('../utily/middleware');
const passport = require('passport');
const user = require('../control/userControl');

router.get('/register', isAuth, user.registerForm);

router.post('/register', wrapAsync(user.registr));

router.get('/login', isAuth, user.loginForm);
router.post('/login', user.loginUser);

router.get('/confirm_message', user.confirmMessage);
router.get('/confirmEmail/:id', wrapAsync(user.confirmEmail));

router.get('/dashboard', isLoggedIn, user.dashboardPage);
router.put('/dashboard', isLoggedIn, wrapAsync(user.updateProfile));

router.get('/logout', user.logoutUser);

module.exports = router;
