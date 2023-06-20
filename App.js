import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Button } from "react-native";
import notifee, { AndroidVisibility } from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";
import firestore from "@react-native-firebase/firestore";
import { useEffect } from "react";

async function saveTokenToDatabase(token) {
  const userId = "testUser";

  try {
    await firestore()
      .collection("usersTokens")
      .doc(userId)
      .set({ token: token });

    console.log("New token added to the database: " + token);
  } catch (error) {
    console.log("Error adding token to the database:", error);
  }
}

async function onDisplayNotification(message) {
  const { title, body } = message;
  try {
    // Request permissions (required for iOS)
    await notifee.requestPermission();

    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: "default",
      name: "Default Channel",
      badge: true,
    });

    // Display a notification
    await notifee.displayNotification({
      title: title,
      body: body,
      android: {
        channelId,
        smallIcon: "ic_launcher", // optional, defaults to 'ic_launcher'.
        // pressAction is needed if you want the notification to open the app when pressed
        pressAction: {
          id: "default",
        },
        visibility: AndroidVisibility.PUBLIC,
      },
    });
    console.log("(displayed notification) title: " + title + " body: " + body);
  } catch (e) {
    console.log(e);
  }
}

// Note that an async function or a function that returns a Promise
// is required for both subscribers.
async function onMessageReceived(remoteMessage) {
  const { title, body } = remoteMessage.data;
  try {
    await onDisplayNotification({
      // title: remoteMessage.notification.title + " (foreground)",
      // body: remoteMessage.notification.body,
      title: title + " (foreground)",
      body: body,
    });
    // Do something
    console.log(remoteMessage);
  } catch (e) {
    console.log(e);
  }
}

async function onMessageReceivedBack(remoteMessage) {
  try {
    await onDisplayNotification({
      title: remoteMessage.notification.title + " (background)",
      body: remoteMessage.notification.body,
    });
    // Do something
    console.log(remoteMessage);
  } catch (e) {
    console.log(e);
  }
}

export default function App() {
  useEffect(() => {
    // Get the device token
    messaging()
      .getToken()
      .then((token) => {
        return saveTokenToDatabase(token);
      });

    // If using other push notification providers (ie Amazon SNS, etc)
    // you may need to get the APNs token instead for iOS:
    // if(Platform.OS == 'ios') { messaging().getAPNSToken().then(token => { return saveTokenToDatabase(token); }); }

    // Listen to whether the token changes
    return messaging().onTokenRefresh((token) => {
      saveTokenToDatabase(token);
    });
  }, []);

  messaging().onMessage(onMessageReceived);
  messaging().setBackgroundMessageHandler(onMessageReceivedBack);

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!!</Text>
      <Text> </Text>
      <Button
        title="Display Notification"
        onPress={() =>
          onDisplayNotification({
            title: "Test",
            body: "triggered by button",
          })
        }
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
