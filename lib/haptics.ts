import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export async function tapLight() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
}

export async function tapMedium() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {}
}

export async function tapHeavy() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {}
}

export async function notifySuccess() {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {}
}

export async function notifyError() {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch {}
}