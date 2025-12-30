const fs = require('fs').promises;
const path = require('path');

async function listDirs(p){
  const items = await fs.readdir(p, { withFileTypes: true });
  return items.filter(i=>i.isDirectory()).map(d=>d.name);
}

async function run(){
  const repo = path.join(__dirname, '..');
  const assetsBooks = path.join(repo, 'assets', 'books');
  const outIndex = path.join(assetsBooks, 'books_index.json');

  if(!await exists(assetsBooks)){
    console.error('No existe assets/books'); process.exit(1);
  }

  const dirs = await listDirs(assetsBooks);
  const books = [];

  for(const dir of dirs){
    const bookDir = path.join(assetsBooks, dir);
    const manifestPath = path.join(bookDir, 'chapters_manifest.json');
    const metadataPath = path.join(bookDir, 'metadata.json');

    let manifest = [];
    if(await exists(manifestPath)){
      try{ manifest = JSON.parse(await fs.readFile(manifestPath,'utf8')); }catch(e){ console.warn('Invalid manifest for', dir); }
    }

    let metadata = { title: dir, slug: dir, description: '', author: '', startDate: null };
    if(await exists(metadataPath)){
      try{ metadata = JSON.parse(await fs.readFile(metadataPath,'utf8')); }catch(e){ console.warn('Invalid metadata for', dir); }
    } else {
      // create a template metadata file for the user to fill
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    }

    books.push({ dir, metadata, chapters: manifest.length });
  }

  await fs.writeFile(outIndex, JSON.stringify(books, null, 2), 'utf8');
  console.log('books_index.json created/updated with', books.length, 'books');
}

async function exists(p){ try{ await fs.access(p); return true }catch(e){ return false }}

run().catch(e=>{ console.error(e); process.exit(1); });
