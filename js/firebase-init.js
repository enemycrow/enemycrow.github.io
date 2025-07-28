(function(window) {
  // Configuración de Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyCQh92caITNc5Rld8bfDs_RhDYD39RJDBY",
    authDomain: "lapluma-elfaro-lallama.firebaseapp.com",
    projectId: "lapluma-elfaro-lallama",
    storageBucket: "lapluma-elfaro-lallama.firebasestorage.app",
    messagingSenderId: "251148273163",
    appId: "1:251148273163:web:a8cf595d3270ed1bd4a90e"
  };

  // Inicializar Firebase
  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore(app);

  // Exponer las instancias globalmente
  window.firebaseApp = app;
  window.db = db;
})(window);
