import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 1. Configure behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // ✅ FIX 1: Add these two missing properties to satisfy TypeScript
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// 2. Request Permissions (Returns true/false for your Toggle Logic)
export async function registerForPushNotificationsAsync(): Promise<boolean> {
  let finalStatus;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Return boolean so the UI knows if it worked
  return finalStatus === 'granted';
}

// 3. Schedule a "Re-Scan" Reminder
export async function scheduleRescanReminder(region: string, daysLater: number = 30) {
  // Check permission before scheduling
  const settings = await Notifications.getPermissionsAsync();
  if (!settings.granted && !settings.ios?.status) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time for a check-up!",
      body: `It's been ${daysLater} days since you checked your ${region}. Let's see if anything has changed.`,
      data: { screen: 'History' },
    },
    // ✅ FIX 2: Explicitly define the trigger type
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: daysLater * 24 * 60 * 60, // (Or use seconds: 10 for testing)
      repeats: false,
    },
  });
  
  console.log(`Reminder scheduled for ${region} in ${daysLater} days.`);
}