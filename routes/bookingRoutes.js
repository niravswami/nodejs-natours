const express = require('express');

const router = express.Router();

const { protect, restrictTo } = require('../controllers/authController');

const {
  getCheckoutSession,
  getAllBooking,
  createBooking,
  getBooking,
  updateBooking,
  deleteBooking,
} = require('../controllers/bookingController');
const rolesEnum = require('../utils/rolesEnum');

router.use(protect);

router.get('/checkout-session/:tourId', protect, getCheckoutSession);

router.use(restrictTo(rolesEnum.admin, rolesEnum.leadGuide))

router.route('/').get(getAllBooking).post(createBooking);
router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking);

module.exports = router;
