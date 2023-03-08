// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../../models/tourModel');
const APIFeatures = require('../../utils/apiFeatures');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require('../handlerFactory');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../../dev-data/data/tours-simple.json`, 'utf-8')
// );

const imgDestPath = 'public/img/tours';

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  console.log('req.files', req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  // image cover
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`${imgDestPath}/${req.body.imageCover}`);

  // images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      let fileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`${imgDestPath}/${fileName}`);
      req.body.images.push(fileName);
    })
  );

  next();
});

exports.checkTourExist = (req, res, next, val) => {
  // const tour = tours.find((el) => el.id === +val);
  let statusCode = 404;
  let obj = {
    success: false,
    data: {
      message: 'tour not found',
      tour: {},
    },
  };

  // if (!tour) return res.status(statusCode).json(obj);
  // req.tour = tour;
  next();
};

// exports.checkBody = (req, res, next) => {
//   const { name, price } = req.body;
//   if (!price || !name)
//     return res.status(400).json({
//       success: false,
//       meassage: 'please enter valid input name or price',
//     });
//   next();
// };

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// const catchAsync = (fn) => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(next);
//   };
// };

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limit()
//     .pagination();
//   const tours = await features.query;

//   // SEND RESPONSE
//   res
//     .status(200)
//     .json({ success: true, result: tours.length, data: { tours } });
// });

// exports.createNewTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({ success: true, data: newTour });
// });
// exports.createNewTour = async (req, res) => {
//   try {
//     const newTour = await Tour.create(req.body);
//     res.status(201).json({ success: true, data: newTour });
//   } catch (error) {
//     return res.status(400).json({ success: false, msg: 'Invalid data sent' });
//   }

// ------------- old logic -----------
// const newId = tours[tours.length - 1].id + 1;
// const newTour = { id: newId, ...req.body };
// tours.push(newTour);
// fs.writeFile(
//   `${__dirname}/dev-data/data/tours-simple.json`,
//   // JSON.stringify(tours),
//   (err) => {
//     if (err)
//       return res.status(200).json({ success: false, msg: err.message });
//     console.log('err', err);
//     res.status(201).json({ success: true, data: newTour });
//   }
// );
// };

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   if (!tour) {
//     return next(new AppError('Tour not found', 404));
//   }
//   const obj = {
//     success: true,
//     data: {
//       tour: tour,
//       message: 'success',
//     },
//   };

//   res.status(200).json(obj);
// });

// patch request
// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });
//   if (!tour) {
//     return next(new AppError('Tour not found', 404));
//   }

//   res.status(200).json({ success: true, message: 'success', data: { tour } });
// });

exports.getAllTours = getAll(Tour);
exports.getTour = getOne(Tour, { populateOptions: { path: 'reviews' } });
exports.createNewTour = createOne(Tour);
exports.updateTour = updateOne(Tour);
exports.deleteTour = deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('Tour not found', 404));
//   }

//   res.json({
//     success: true,
//     data: {
//       message: 'tour deleted',
//     },
//   });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: null, // to group all in one
        // _id: '$difficulty', // to group by field
        _id: { $toUpper: '$difficulty' }, // to group by field
        totalTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgprice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgprice: 1,
      },
    },
    // {
    //   $match: {
    //     _id: { $ne: 'EASY' },
    //   },
    // },
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats,
      message: 'success',
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStart: { $sum: 1 },
        tours: {
          $push: '$name',
        },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStart: -1 },
    },
    // {
    //   $limit: 4,
    // },
  ]);

  res.status(200).json({
    success: true,
    data: {
      plan,
      message: 'success',
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return new AppError(
      'please provide latitude and longitude in the format lat,lng',
      400
    );
  }

  let radius = unit === 'mi' ? distance / 3936.2 : distance / 6378.1;

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });
  console.log({ distance, latlng, unit, lat, lng });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return new AppError(
      'please provide latitude and longitude in the format lat,lng',
      400
    );
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  const distances = await Tour.aggregate([
    // geoNear always has to be on first place in
    // aggregate query
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: {
      data: distances,
    },
  });
});
