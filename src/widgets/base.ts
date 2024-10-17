import { Notification } from '@jupyterlab/apputils';

export function showErrorOnNotification(error: any) {
  const errorMessage = error.message || error;
  if (
    errorMessage &&
    /^No such file or directory:/.test(errorMessage.toString())
  ) {
    // Ignore the error because it's not a critical error
    console.warn(errorMessage, error);
    return;
  }
  console.error(errorMessage, error);
  Notification.error(`Error on Sidestickies: ${errorMessage}`, {
    autoClose: false
  });
}
