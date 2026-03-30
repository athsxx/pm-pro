import { Capacitor } from '@capacitor/core';

/** True when running inside the Capacitor Android/iOS shell (not the browser). */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}
