import axios from 'axios';
// import Stripe from 'stripe';
import { showAlert } from './alert';

const stripe = window.Stripe(
  'pk_test_51MjILdSECaZXmtIbW467bgOVlDrgthFkhvOvkW0j9Felc1xDnLX4nm6ERfSJaA3j3OXDTB17NqrnCotBNMwNwBwg00yCcqLoPg'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
