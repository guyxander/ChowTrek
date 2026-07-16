import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

type NotificationPermissionResult = {
  ok: boolean;
  message: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function requestPushNotificationPermission(): Promise<NotificationPermissionResult> {
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
