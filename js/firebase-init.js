const firebaseConfig = {
  apiKey: "AIzaSyCQh92caITNc5Rld8bfDs_RhDYD39RJDBY",
  authDomain: "lapluma-elfaro-lallama.firebaseapp.com",
  projectId: "lapluma-elfaro-lallama",
  storageBucket: "lapluma-elfaro-lallama.firebasestorage.app",
  messagingSenderId: "251148273163",
  appId: "1:251148273163:web:a8cf595d3270ed1bd4a90e"
};

let firebaseInitPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[data-firebase-loader="${src}"]`);

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.dataset.firebaseLoader = src;

    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });

    script.addEventListener('error', () => {
      script.remove();
      reject(new Error(`No se pudo cargar ${src}`));
    }, { once: true });

    document.head.appendChild(script);
  });
}

export function initializeFirebase() {
  if (firebaseInitPromise) {
    return firebaseInitPromise;
  }

  firebaseInitPromise = (async () => {
    await loadScript('https://www.gstatic.com/firebasejs/10.5.2/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore-compat.js');

    const firebaseGlobal = window.firebase;

    if (!firebaseGlobal) {
      throw new Error('Firebase SDK no está disponible');
    }

    const app = firebaseGlobal.apps && firebaseGlobal.apps.length
      ? firebaseGlobal.app()
      : firebaseGlobal.initializeApp(firebaseConfig);

    const db = firebaseGlobal.firestore(app);

    return { firebase: firebaseGlobal, app, db };
  })();

  return firebaseInitPromise.catch(error => {
    firebaseInitPromise = null;
    throw error;
  });
}

export default initializeFirebase;
