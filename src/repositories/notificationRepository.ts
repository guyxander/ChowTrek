import type * as ExpoNotifications from "expo-notifications";
import { Platform } from "react-native";

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

  return {
    ok: true,
    message: "Push notifications are enabled for order and delivery updates."
  };
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
