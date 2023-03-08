/* eslint-disable prettier/prettier */
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRoutes = require('./routes/viewRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) Global Middleware
// serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// security http headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limit request from same API
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter);

// body parser, reading data from body in req.body
app.use(
  express.json({
    limit: '10kb',
  })
);

// middleware for form data
app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  })
);

app.use(cookieParser());

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

// data sanitization against XSS
app.use(xssClean());

// prevent paramenter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// use to compress text to client
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// app.use(function (req, res, next) {
//   res.header({
//     'Content-Type': 'application/json',
//     'Access-Control-Allow-Origin': '*',
//   });
//   res.header(
//     'Access-Control-Allow-Headers',
//     'Origin, X-Requested-With, Content-Type, Accept'
//   );
//   next();
// });

const resourceUrl = '/api';
const apiVersion = 'v1';
const urlV1 = `${resourceUrl}/${apiVersion}`;
const generateV1Url = (uri) => `${urlV1}${uri}`;

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`, 'utf-8')
// );

// app.get(generateV1Url('/tours'), getAllTours);
// app.post(generateV1Url('/tours'), createNewTour);
// app.get(generateV1Url('/tours/:id'), getTour);
// app.patch(generateV1Url('/tours/:id'), updateTour);
// app.delete(generateV1Url('/tours/:id'), deleteTour);

app.use('/', viewRoutes);
app.use(generateV1Url('/tours'), tourRouter);
app.use(generateV1Url('/users'), userRouter);
app.use(generateV1Url('/reviews'), reviewRouter);
app.use(generateV1Url('/reviews'), reviewRouter);
app.use(generateV1Url('/bookings'), bookingRoutes);

app.all('*', (req, res, next) => {
  // req.statusCode = 404;
  // res.send({
  //   success: false,
  //   data: { message: `can't find '${req.originalUrl}' on this server` },
  // });
  // -------
  // const err = new Error(`can't find '${req.originalUrl}' on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);
  // -------
  next(new AppError(`can't find '${req.originalUrl}' on this server`, 404));
});

// By this express autometically know that this is a error halding middleware
app.use(globalErrorHandler);

module.exports = app;
