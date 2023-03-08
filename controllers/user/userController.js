const User = require('../../models/userModal');
const AppError = require('../../utils/appError');
const multer = require('multer');
const sharp = require('sharp');

const catchAsync = require('../../utils/catchAsync');
const { deleteOne, updateOne, getOne, getAll } = require('../handlerFactory');

const imgDestPath = 'public/img/users';
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, imgDestPath);
//   },
//   fileName: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  console.log('file', file);
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  console.log('resizeUserPhoto', req.file);
  if (req.file) {
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`${imgDestPath}/${req.file.filename}`);
  }
  next();
});

const filterObj = (obj, ...allowedFiltered) => {
  return Object.keys(obj).reduce((acc, curr) => {
    if (allowedFiltered.includes(curr)) {
      return { ...acc, [curr]: obj[curr] };
    } else {
      return { ...acc };
    }
  }, {});
};

exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;
  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file, 'req body', req.body);
  const { password, confirmPassword } = req.body;
  // 1) throw error if user try ro update password here
  if (password || confirmPassword) {
    return next(new AppError("you can't update password here.", 400));
  }

  // 2) update user document
  const filteredBody = filterObj(req.body, 'name', 'email');

  if (req.file) filteredBody.photo = req.file.filename;

  console.log('filteredBody', filteredBody);

  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
  // next();
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(200).json({
    status: 'success',
    data: {
      user: null,
      message: 'your account has been deleted successfully',
    },
  });
});

// *************************************************

exports.createNewUser = (req, res) => {
  res.status(500).json({
    success: false,
    message: 'route not implemented',
  });
};

exports.getAllUsers = getAll(User);
exports.getUser = getOne(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);
