// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.20.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.20.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
const firebaseConfig = {
    apiKey: "AIzaSyARhusBHckz8MdgR7hpJKdQHh1pQ5G2jl8",
    authDomain: "lailoji-admin.firebaseapp.com",
    projectId: "lailoji-admin",
    storageBucket: "lailoji-admin.firebasestorage.app",
    messagingSenderId: "3252375213",
    appId: "1:3252375213:web:6f18b3c05a37144ec38024",
    measurementId: "G-E7QQQZZ5F7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Listen to background messages
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message ', payload);

    // Extract notification details from the payload
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/default-icon.png', // Use default icon if none is provided
        image: payload.data.imageUrl || '', // Custom image URL from payload
        click_action: payload.data.click_action || '/', // URL to open when notification is clicked (optional)
        badge: payload.notification.badge || '/default-badge.png', // Badge icon (optional)
        sound: payload.notification.sound || 'default', // Sound for the notification (optional)
    };

    // Display the notification
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// // Optional: Listen for notification click events
// self.addEventListener('notificationclick', (event) => {
//     const { notification, action } = event;
    
//     // Close the notification
//     event.notification.close();

//     // Handle click action (open a URL)
//     if (action === 'open') {
//         clients.openWindow(notification.data.click_action || '/');
//     }
// }, false);
