importScripts('https://www.gstatic.com/firebasejs/8.3.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.3.2/firebase-messaging.js');

// Initialize Aplu
const apluPushConfig = {
    apiKey: "AIzaSyDK_R2Kh-TeE2MoIuqpClvqqxuMlFqMdyU",
	authDomain: "aplua30-3ed67.firebaseapp.com",
	projectId: "aplua30-3ed67",
	storageBucket: "aplua30-3ed67.firebasestorage.app",
	messagingSenderId: "831340155767",
	appId: "1:831340155767:web:5fb39515215b6b4d700772"
};

try {
    importScripts('https://push.aplu.io/import-aplu-messaging.js');
} catch (err) {
    console.warn("Couldn't load aplu-script, falling back: ", err);
}