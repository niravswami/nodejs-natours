const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/userModal');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// OLD WAY
// const sendEmail = require('../utils/email');
// NEW WAY
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (res, user = null, statusCode = 200) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  };

  res.cookie('token', token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req?.body?.name,
    email: req?.body?.email,
    password: req?.body?.password,
    passwordConfirm: req?.body?.passwordConfirm,
    role: req?.body?.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createAndSendToken(res, newUser, 201);

  //   const token = signToken(newUser._id);
  //   res.status(201).json({
  //     status: 'success',
  //     token,
  //     data: {
  //       user: newUser,
  //     },
  //   });
});

exports.login = catchAsync(async (req, res, next) => {
  // return res.status(200).json({
  //   status: 'success',
  // });
  const { email, password } = req.body;

  // 1) check if email and password exist
  if (!email || !password) {
    return next(new AppError('please provide email and password!', 400));
  }

  // 2) check if user exist & password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 401));
  }

  // 3) if everything is ok, send token to client
  createAndSendToken(res, user, 200);
  //   const token = signToken(user._id);

  //   res.status(200).json({
  //     status: 'success',
  //     token,
  //   });
});

// Only for rendered pages, no errors
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.token) {
    let token = req.cookies.token;

    // verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next();
    }

    // check if user changed password after the token was issued
    // here "iat" means issued at
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }
    // THERE IS A LOGGED IN USER
    res.locals.user = currentUser;
  }
  next();
});

exports.logout = catchAsync(async (req, res, next) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 1 * 1000),
    httpOnly: true,
  };

  res.cookie('token', 'loggedout', cookieOptions);
  res.status(200).json({
    status: 'success',
    message: 'logged out',
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) getting token and check of it's true
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith('Bearer')) {
    token = authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    next(new AppError('you are not logged in! please login to access', 401));
  }

  // 2) verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    next(new AppError('The user belonging to this token does not exist', 401));
  }

  // 4) check if user changed password after the token was issued
  // here "iat" means issued at
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('user recently changed password! please login again', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  res.locals.user = currentUser;
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin, 'leadGuide]
    if (!roles.includes(req?.user?.role)) {
      return next(
        new AppError(
          'you do not have the permission to perform this action',
          403
        )
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on POSTed email
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('user not found!', 404));
  }

  // 2) generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send it to user's email
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  // const message = `Forgot your password? submit a new password to: ${resetUrl}\n If you didn't forgot your password, please this email.`;

  try {
    // await sendEmail({
    //   email,
    //   subject: 'Password rest link (valid for only 10 min)',
    //   message,
    // });
    await new Email(user, resetUrl).sendPasswordReset();
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email. Try again later', 500)
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Link sent to you ragistered email address',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on token
  const resetToken = req.params.token;
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) if token has not expired and there is user, set the ne password
  if (!user) {
    return next(new AppError('invalid link or  has expired', 400));
  }

  // 3) update changedPasswordAt property for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4) log the user in, send JWT token
  createAndSendToken(res, user, 200);
  //   const token = signToken(user._id);

  //   res.status(200).json({
  //     status: 'success',
  //     token,
  //   });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const user = await User.findById(req.user.id)
    // we declare in schema that don't show the password so we have to explicity ask for that field
    .select('+password');

  if (!user) {
    return next(new AppError('user not found!', 404));
  }

  const { newPassword, currentPassword, confirmNewPassword } = req.body;

  // 2) check if posted current password is correct
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('incorrect password', 401));
  }

  // 3) if so, update password
  user.password = newPassword;
  user.passwordConfirm = confirmNewPassword;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended so we have to use save
  // 4) log user in, send token
  createAndSendToken(res, user, 200);
  //   const token = signToken(user._id);

  //   res.status(200).json({
  //     status: 'success',
  //     token,
  //   });
});
