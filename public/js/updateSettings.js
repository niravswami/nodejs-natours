import axios from 'axios';
import { showAlert } from './alert';

export const updateUserData = async (data, type) => {
  // type is either 'password' or 'data'
  if (!type) return;

  try {
    let uri;
    let updateData;
    if (type === 'password') {
      uri = 'update-password';
      updateData = {
        currentPassword: data.passwordCurrent,
        newPassword: data.password,
        confirmNewPassword: data.passwordConfirm,
      };
    } else {
      uri = 'update-me';
      updateData = data;
    }
    const res = await axios({
      method: 'PATCH',
      url: `http://localhost:3000/api/v1/users/${uri}`,
      data: updateData,
      headers: {
        'content-Type': 'application/json',
      },
    });

    // console.log('res', res, res.data.status);
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
