const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccount.json')),
});
const db = admin.firestore();

(async () => {
  const snap = await db.collection('reactions').get();
  const out = [];
  snap.forEach(doc => {
    const d = doc.data() || {};
    out.push({
      slug: doc.id,
      toco: d.toco || 0,
      sumergirme: d.sumergirme || 0,
      personajes: d.personajes || 0,
      mundo: d.mundo || 0,
      lugares: d.lugares || 0,
      updated_at: new Date().toISOString()
    });
  });
  fs.writeFileSync('reactions.json', JSON.stringify(out, null, 2));
  console.log(`Exportados ${out.length} documentos a reactions.json`);
  process.exit(0);
})();
