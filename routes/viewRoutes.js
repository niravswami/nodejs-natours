const express = require('express');

const router = express.Router();

const { isLoggedIn, protect } = require('../controllers/authController');
const { createBookingCheckout } = require('../controllers/bookingController');

const {
  getTourOverview,
  getTourDetails,
  getLoginForm,
  getAccount,
  updateUserData,
  getMyTours,
} = require('../controllers/viewsController');

router.get('/', isLoggedIn, createBookingCheckout, getTourOverview);

router.get('/login', isLoggedIn, getLoginForm);

router.get('/tour/:slug', isLoggedIn, getTourDetails);

router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours);

router.post('/submit-user-data', protect, updateUserData);

module.exports = router;
