const express = require('express');
const rolesEnum = require('../utils/rolesEnum');

const router = express.Router({ mergeParams: true });

const { protect, restrictTo } = require('../controllers/authController');

const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourAndUserIds,
  getReviewDetail,
} = require('../controllers/reviewController');

router.use(protect);

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo(rolesEnum.user), setTourAndUserIds, createReview);

router
  .route('/:id')
  .get(getReviewDetail)
  .patch(restrictTo(rolesEnum.user, rolesEnum.admin), updateReview)
  .delete(restrictTo(rolesEnum.user, rolesEnum.admin), deleteReview);

module.exports = router;
