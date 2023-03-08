// const { LOGIN_API_URL } = require('../../utils/urls');

import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      //   url: LOGIN_API_URL,
      url: `/api/v1/users/login`,
      data: { email, password },
      headers: {
        'content-Type': 'application/json',
      },
    });

    // console.log('res', res, res.data.status);
    if (res.data.status === 'success') {
      showAlert('success', 'you are logged in');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: `/api/v1/users/logout`,
      headers: {
        'content-Type': 'application/json',
      },
    });

    // console.log('res', res, res.data.status);
    if (res.data.status === 'success') {
      showAlert('success', 'you are logged out');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert(
      'error',
      error.response.data.message || 'Error! logging out, try again.'
    );
  }
};
