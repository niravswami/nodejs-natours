/* eslint-disable node/no-missing-require */
/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');
const fs = require('fs');

const dotenv = require('dotenv');

dotenv.config({ path: `${__dirname}/../../config.env` });

const Tour = require('../../models/tourModel');
const User = require('../../models/userModal');
const Review = require('../../models/reviewModel');

const DB = process.env.MONGODB_ATLAS_DATABASE.replace(
  '<PASSWORD>',
  process.env.MONGODB_ATLAS_PASSWORD
);

mongoose
  // connect ot local mongodb
  // .connect(process.env.MONGODB_LOCAL, {

  // connect ot mongodb Atlas
  .connect(DB, {
    // used for remove some deprecation warnings
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connections successfull'));

//   Read json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// import data into DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('DATA created');
  } catch (err) {
    console.log('eeee', err);
  }
  process.exit();
};

// Delete all data from tour
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('data deleted ');
  } catch (error) {
    console.log('delete err', error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

console.log(process.argv);
