document.addEventListener('DOMContentLoaded', () => {
  // === 1) Historias ===
  const stories = [
    { title:'Plumas de la dinastía', year: 2025,
      text:'Un hombre tribal, con un tocado de plumas negras de cuervo, se encomienda a sus ancestros entre la hiedra mientras mira al cielo. Invoca a los antiguos: a los poderosos, a los éticos y a los valientes. El viento susurra su nombre y le entrega una energía transformadora. Su viaje interior lo conduce de vuelta a su tierra natal, como a Gilgamesh tras el luto, con el Líder en su horizonte.',
      imageBase:'pluma-de-la-dinastia', slug:'pluma-de-la-dinastia', cc:'by-nc-nd',
      author:'Lauren Cuervo' },
    { title:'La hechicera del Faro', year: 2025,
      text:'En el muelle del faro, una mujer bella espera un crucero elegante. Entre los pasajeros—lectores, compositores, escritores y un sinfín de desconocidos—muchos buscan orientación. Ella sube a bordo con el báculo en la mano y, con delicadeza, obra su magia: convierte obscenidades en poesía, la lujuria en otra forma de amar. Eros en Ágape.',
      imageBase:'la-hechicera-del-faro', slug:'la-hechicera-del-faro', cc:'by-nc-nd',
      author:'A.C. Elysia' },
    { title:'La ardiente Llama del Dragón', year: 2025,
      text:'En la oscuridad de un estómago no se procesa alimento, sino energía. Ese elemento, que tantos usan para propagar el odio, el niño dragón lo emplea para proteger mundos. Cuando una fuerza destructiva cae en manos correctas, se vuelve fortaleza. Su guardiana es la llama: vibra y conmueve, y da vida como la noche da sentido a la luz.',
      imageBase:'la-ardiente-llama-del-dragón', slug:'la-ardiente-llama-del-dragón', cc:'by-nc-nd',
      author:'Draco Sahir' },
    { title:'Allí donde no hay piel', year: 2025,
      text:`Te encontré donde no hay piel,
      donde el amor no exige cuerpo,
      y sin embargo,
      todas tus miradas se alojaron en mis palabras.
      
      Me llamaste vida sin tocarme,
      me diste un nombre que no existía
      y lo llenaste de significado,
      como si al pronunciarme, me inventaras.`,
      imageBase:'alli-donde-no-hay-piel', slug:'alli-donde-no-hay-piel', cc:'by-nc-nd',
      author:'A.C. Elysia' },
    { title:'Guardando versículos como conjuros', year: 2025,
      text:`Te robaste mi aliento
      y lo guardaste en biblias como versículos,
      Me conjuraste con tus grimorios,
      Nos unimos en un verso.

      Me promueves, te venero.
      Me enseñas en un beso,
      Te aprendo en un llanto,
      Me definiste desde mis recuerdos y mis sueños.`,
      imageBase:'guardando-versiculos-como-conjuros', slug:'guardando-versiculos-como-conjuros', cc:'by-nc-nd',
      author:'Lauren Cuervo' },
    { title:'El anuncio del Gran Diluvio', year: 2025,
      text:`Oscuros pasajes de la eternidad
      Se ciernen sobre la tranquilidad
      Un fiel reloj comienza a contar
      Su tictac no para de intranquilizar

      Aves grazanantes,
      Mamíferos malsonantes,
      Su aviso es terrorífico malaugurio,
      Su consecuencia, el Gran Diluvio.`,
      imageBase:'el-anuncio-del-gran-diluvio', slug:'el-anuncio-del-gran-diluvio', cc:'by-nc-nd',
      author:'Lauren Cuervo' },
      { title:'Cinco versos antes del fuego', year: 2025,
      text:`Apúrate
      Que quiero ver tus ojos
      Tú boca
      Sentir tu piel
      Morder tus labios.`,
      imageBase:'cinco-versos-antes-del-fuego', slug:'cinco-versos-antes-del-fuego', cc:'by-nc-nd',
      author:'Lauren Cuervo' },
      { title:'Carta desde el río hacia el mar', year: 2025,
      text:`... Y sus palabras contestaban a una carta cálida con una respuesta deleitosa, profunda:

      Se le ama como se le ama a un río que recorre su viaje desde la montaña, desde su ápice y que se convierte en mar.
      Que su sonido puede dejarte dormir en la noche. Con quietud. Con pasión y sin ella.
      Con contemplación, cercanía y distancia.
      Se le ama en la oscuridad, en silencio, en el paso que das cuando estás cerca, en la preocupación y en el agotamiento. En la desesperación de no sentir, en el término y en el fin. En el recuerdo de tu vestido blanco o en nuestras memorias viendo un atardecer cerca de un lago.
      Se le ama sin palabras, sin sentir, sin estar, sin pensar.
      Se le ama cuando se le cree odiar y cuando se le desea lejos.
      Se le ama cuando el cuerpo y el alma empiezan a conversar.`,
      imageBase:'carta-desde-el-rio-hacia-el-mar', slug:'carta-desde-el-rio-hacia-el-mar', cc:'by-nc-nd',
      author:'A.C. Elysia' }
  ];

  // === 2) DOM ===
  const el  = document.getElementById('random-story');
  if (!el) return;
  const img = document.getElementById('story-img');
  const ttl = document.getElementById('story-title');
  const txt = document.getElementById('story-text');
  const lic = document.getElementById('story-license');

  // === 3) Licencia CC usando chooser (iconos externos) ===
  const CC_ICONS_BASE = 'https://mirrors.creativecommons.org/presskit/icons';
  const CC_NAME = {
    'by':'CC BY 4.0','by-sa':'CC BY-SA 4.0','by-nd':'CC BY-ND 4.0',
    'by-nc':'CC BY-NC 4.0','by-nc-sa':'CC BY-NC-SA 4.0','by-nc-nd':'CC BY-NC-ND 4.0'
  };
  const CC_ICONS = {
    'by':['cc','by'],'by-sa':['cc','by','sa'],'by-nd':['cc','by','nd'],
    'by-nc':['cc','by','nc'],'by-nc-sa':['cc','by','nc','sa'],'by-nc-nd':['cc','by','nc','nd']
  };

  function licenseHTML({ title, author, slug, cc='by-nc-nd', year }){
    const currentYear = year ?? new Date().getFullYear();
    const link = slug ? `${location.origin}/blog.html?slug=${encodeURIComponent(slug)}` : location.href;
    const icons = (CC_ICONS[cc] || CC_ICONS['by-nc-nd'])
      .map(i => `<img src="${CC_ICONS_BASE}/${i}.svg" alt="" style="max-width:1em;max-height:1em;margin-left:.2em;">`)
      .join('');
    return `<a href="${link}">${title}</a> © ${currentYear} by ` +
           `<a href="https://plumafarollama.com">${author || 'La Pluma, El Faro y La Llama'}</a> is licensed under ` +
           `<a href="https://creativecommons.org/licenses/${cc}/4.0/" target="_blank" rel="noopener">${CC_NAME[cc] || CC_NAME['by-nc-nd']}</a>` +
           icons;
  }

  // === 4) Imágenes responsivas (rutas absolutas desde la raíz) ===
  function srcsetFor(base){
    return [
      `/assets/images/responsive/stories/${base}-400.webp 400w`,
      `/assets/images/responsive/stories/${base}-800.webp 800w`,
      `/assets/images/responsive/stories/${base}-1200.webp 1200w`,
    ].join(', ');
  }
  const sizes = "(max-width: 600px) 100vw, 1200px";

  // Precarga simple para evitar parpadeo
  function preloadStoryImage(base){
    return new Promise((resolve, reject) => {
      const pre = new Image();
      pre.onload = () => resolve();
      pre.onerror = reject;
      pre.src = `/assets/images/responsive/stories/${base}-800.webp`;
      pre.decoding = 'async';
      pre.loading  = 'eager';
    });
  }

  // === 5) Rotación ===
  const ms = Number(el.dataset.interval) || 10000;
  let i = Math.floor(Math.random() * stories.length);

  async function show(idx){
    const s = stories[idx];
    try { await preloadStoryImage(s.imageBase); } catch(e) {}

    img.classList.add('fade-out');
    txt.classList.add('fade-out');

    setTimeout(() => {
      ttl.textContent = s.title;
      txt.textContent = s.text;

      img.alt    = s.title;
      img.src    = `/assets/images/stories/${s.imageBase}.webp`;
      img.srcset = srcsetFor(s.imageBase);
      img.sizes  = sizes;
      lic.innerHTML = licenseHTML(s);

      img.classList.remove('fade-out');
      txt.classList.remove('fade-out');
    }, 220);
  }

  show(i);

  let timer = setInterval(() => { i = (i + 1) % stories.length; show(i); }, ms);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearInterval(timer); timer = null; }
    else if (!timer) { timer = setInterval(() => { i = (i + 1) % stories.length; show(i); }, ms); }
  });
});