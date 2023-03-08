const express = require('express');
const rolesEnum = require('../utils/rolesEnum');

const reviewRouter = require('../routes/reviewRoutes');

const router = express.Router();

const {
  checkTourExist,
  aliasTopTours,
  resizeTourImages,
  uploadTourImages,
} = require('../controllers/tour/tourController');

router.param('id', checkTourExist);

const {
  getAllTours,
  createNewTour,
  getTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
} = require('../controllers/tour/tourController');

const { protect, restrictTo } = require('../controllers/authController');

// const reviewController = require('../controllers/reviewController');

router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    protect,
    restrictTo(rolesEnum.admin, rolesEnum.leadGuide, rolesEnum.guide),
    getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router
  .route('/')
  .get(getAllTours)
  .post(
    protect,
    restrictTo(rolesEnum.admin, rolesEnum.leadGuide),
    createNewTour
  );
router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo(rolesEnum.admin, rolesEnum.leadGuide),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(
    protect,
    restrictTo(rolesEnum.admin, rolesEnum.leadGuide),
    deleteTour
  );

// router
//   .route('/:tourId/reviews')
//   .post(protect, restrictTo(rolesEnum.user), reviewController.createReview);

module.exports = router;
