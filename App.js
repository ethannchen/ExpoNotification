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

    // try {
    //   await firestore()
    //     .collection("usersTokens")
    //     .doc(userId)
    //     .update({ token: token });

    //   console.log("Token updated in the database: " + token);
    // } catch (updateError) {
    //   console.log("Error updating token in the database:", updateError);
    // }
  }
}

// async function saveTokenToDatabase(token) {
//   // Assume user is already signed in
//   // const userId = auth().currentUser.uid;
//   // const usersTokens = firestore().collection("usersTokens");
//   const userId = "testUser";

//   await firestore()
//     .collection("usersTokens")
//     .doc("testUser")
//     .set({ token: token })
//     .then(() => {
//       console.log("new token added to database: " + token);
//     })
//     .catch(() => {
//       console.log(e);
//       firestore()
//         .collection("usersTokens")
//         .doc("testUser")
//         .update({ token: token });
//     });
//   // if (!usersTokens.doc(userId).exists) {
//   //   await usersTokens.doc(userId).set({ token: token });
//   // }

//   // // Add the token to the users datastore
//   // await usersTokens.doc({ userId: userId }).update({
//   //   token: firestore.FieldValue.arrayUnion(token),
//   // });
//   // console.log("new token added to database: " + token);
// }

async function onDisplayNotification(message) {
  const { title, body } = message;
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
}

// Note that an async function or a function that returns a Promise
// is required for both subscribers.
async function onMessageReceived(remoteMessage) {
  onDisplayNotification({
    title: remoteMessage.notification.title,
    body: remoteMessage.notification.body,
  });
  // Do something
  console.log(message);
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
  messaging().setBackgroundMessageHandler(onMessageReceived);

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
