import '@babel/polyfill';
import { login, logout } from './login';
import { bookTour } from './stripe';
import { updateUserData } from './updateSettings';

// VALUES
const loginForm = document.querySelector('.login-form');

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

const logoutBtn = document.querySelector('.nav__el--logout');

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

const updateUserDataForm = document.querySelector('.form-user-data');
// const updateSettingsBtn = document.querySelector('#updateSettingsBtn');

if (updateUserDataForm) {
  updateUserDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    const form = new FormData();
    form.append('name', name);
    form.append('email', email);
    form.append('photo', document.getElementById('photo').files[0]);

    updateUserData(form, 'data');
  });
}

const userPasswordForm = document.querySelector('.user-password-form');

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateUserData(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

const bookBtn = document.getElementById('book-tour');

if (bookBtn)
  bookBtn.addEventListener('click', async (e) => {
    let btnText = e.target.textContent;
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    await bookTour(tourId);
    e.target.textContent = btnText;
  });
