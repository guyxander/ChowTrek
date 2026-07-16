import type * as ExpoNotifications from "expo-notifications";
import { Platform } from "react-native";

import { supabase } from "../lib/supabase";

declare const require: (moduleName: "expo-notifications") => typeof ExpoNotifications;

type NotificationPermissionResult = {
  ok: boolean;
  message: string;
};

let notificationsModule: typeof ExpoNotifications | undefined;
let hasNotificationHandler = false;

export async function requestPushNotificationPermission(): Promise<NotificationPermissionResult> {
  const Notifications = getNotificationsModule();

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("orders", {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: "Order updates"
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  const finalPermission =
    currentPermission.status === "granted"
      ? currentPermission
      : await Notifications.requestPermissionsAsync();

  if (finalPermission.status !== "granted") {
    return {
      ok: false,
      message: "Push notifications are still off. You can enable them from Android app settings."
    };
  }

  const tokenResult = await saveDevicePushToken(Notifications);

  if (!tokenResult.ok) {
    return tokenResult;
  }

  return {
    ok: true,
    message: "Push notifications are enabled and synced for order and delivery updates."
  };
}

async function saveDevicePushToken(
  Notifications: typeof ExpoNotifications
): Promise<NotificationPermissionResult> {
  if (!supabase) {
    return {
      ok: false,
      message: "Push permission is enabled, but Supabase is not configured for token sync."
    };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    return { ok: false, message: `Push token session lookup failed: ${userError.message}` };
  }

  if (!user) {
    return { ok: false, message: "Sign in with Google before syncing push notifications." };
  }

  const deviceToken = await Notifications.getDevicePushTokenAsync();
  const result = await supabase.from("device_push_tokens").upsert(
    {
      user_id: user.id,
      token: deviceToken.data,
      platform: Platform.OS,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id,token" }
  );

  if (result.error) {
    return {
      ok: false,
      message: `Push permission is enabled, but token sync failed: ${result.error.message}`
    };
  }

  return { ok: true, message: "Push token synced." };
}

function getNotificationsModule(): typeof ExpoNotifications {
  if (!notificationsModule) {
    notificationsModule = require("expo-notifications");
  }

  if (!hasNotificationHandler) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true
      })
    });
    hasNotificationHandler = true;
  }

  return notificationsModule;
}
