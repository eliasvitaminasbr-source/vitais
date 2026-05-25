import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerPushToken() {
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return

  try {
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID!,
      })
    ).data

    await supabase.rpc('fn_vitais_upsert_push_token', {
      p_token: token,
      p_plataforma: Platform.OS,
    })
  } catch (e) {
    console.warn('Push token registration failed:', e)
  }
}
