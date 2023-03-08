/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');

const dotenv = require('dotenv');

// handle uncaught exception
process.on('uncaughtException', (err) => {
  console.log('UNHANDLED EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

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

// const testTour = new Tour({
//   name: 'test schema',
//   price: 20,
//   rating: 3,
// });

// testTour
//   .save()
//   .then((doc) => console.log(doc))
//   .catch((err) => console.log('ERROR', err));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`server start at ${port}`));

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  // give server some time before its shutting down
  // IN PRODUCTION, USE SOME KIND OF TOOLS TO BRING BACK SERVER ALIVE....
  server.close(() => {
    process.exit(1);
  });
});
