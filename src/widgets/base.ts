import { Notification } from '@jupyterlab/apputils';

export function showErrorOnNotification(error: any) {
  const errorMessage = error.message || error;
  console.error(errorMessage, error);
  Notification.error(`Error on Sidestickies: ${errorMessage}`, {
    autoClose: false
  });
}
