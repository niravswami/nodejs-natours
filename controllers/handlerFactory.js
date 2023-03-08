const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAll = (Modal) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Modal.find(filter), req.query)
      .filter()
      .sort()
      .limit()
      .pagination();
    const doc = await features.query;

    // SEND RESPONSE
    res
      .status(200)
      .json({ success: true, result: doc.length, data: { data: doc } });
  });

exports.getOne = (Model, options) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (options?.populateOptions) {
      console.log('options', options);
      query.populate(options?.populateOptions);
    }

    doc = await query;

    if (!doc) {
      return next(new AppError('document not found', 404));
    }
    const obj = {
      success: true,
      data: {
        data: doc,
      },
    };

    res.status(200).json(obj);
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('Document not found', 404));
    }

    res.json({
      status: 'success',
      success: true,
      data: {
        message: 'deleted successfully',
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('data not found', 404));
    }

    res
      .status(200)
      .json({ success: true, message: 'success', data: { data: doc } });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({ success: true, data: doc });
  });
