const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const rolesEnum = require('../utils/rolesEnum');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'name field is required'],
  },
  email: {
    type: String,
    required: [true, 'email field is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'email is invalid'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: Object.values(rolesEnum),
    default: rolesEnum.user,
  },
  password: {
    type: String,
    required: [true, 'password field is required'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    //   this only works on CREATE or SAVE!!!
    type: String,
    required: [true, 'confirm password field is required'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        console.log('ll', el, this.password, el === this.password);
        return el === this.password;
      },
      message: 'password not matched with confirm password',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // only run this function if password is modified
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  // only run this function if password is modified
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  // Date.now() - 1000 is just a heck to work token properly, because sometimes document save takes time and Date.now is not workinf properly
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this point to current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); // getTime() gives time in milliseconds so divide by 1000 gives in seconds with base 10

    return JWTTimestamp < changedTimeStamp; // ex: 100 < 200
  }

  // false means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log('resetToken', resetToken, 'this', this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
