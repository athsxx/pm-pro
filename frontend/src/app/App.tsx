import { RouterProvider } from 'react-router';
import { router } from './routes';
import React from 'react';
import { getToken } from './api/storage';
import { registerPushNotifications } from './push/registerPush';

export default function App() {
  React.useEffect(() => {
    if (getToken()) {
      void registerPushNotifications();
    }
  }, []);
  return <RouterProvider router={router} />;
}
