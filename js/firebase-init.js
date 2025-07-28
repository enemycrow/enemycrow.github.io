(function(window) {
  // Configuración de Firebase
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  // Inicializar Firebase
  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore(app);

  // Exponer las instancias globalmente
  window.firebaseApp = app;
  window.db = db;
})(window);
