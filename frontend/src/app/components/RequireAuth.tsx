import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { logout } from '../api/auth';
import { getToken, getUser } from '../api/storage';
import { isNativeApp } from '../platform';

export function RequireAuth() {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  // Admins are not intended to use the Capacitor app; clear session if somehow present.
  if (isNativeApp() && getUser()?.role === 'admin') {
    void logout();
    return <Navigate to="/login" replace state={{ adminMobileBlocked: true }} />;
  }
  return <Outlet />;
}
