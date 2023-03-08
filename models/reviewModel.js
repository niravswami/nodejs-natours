const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index(
  { tour: 1, user: 1 },
  {
    unique: true,
  }
);

reviewSchema.pre(/^find/, async function (next) {
  //   this.populate(['tour', 'user']);
  this.populate([
    // { path: 'tour', select: '-__v' },
    { path: 'user', select: '-__v' },
  ]);
  next();
});

reviewSchema.statics.calcAvarageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats?.length > 0 ? stats[0].nRating : 0,
    ratingsAverage: stats?.length > 0 ? stats[0].avgRating : 4.5,
  });
};

reviewSchema.post('save', async function () {
  this.constructor.calcAvarageRatings(this.tour);
});

reviewSchema.pre(/^findOne/, async function (next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOne/, async function (next) {
  // await this.findOne() does NOT work here, query has already excecuted
  await this.r.constructor.calcAvarageRatings(this.r.tour);
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
