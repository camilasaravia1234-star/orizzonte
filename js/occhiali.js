// occhiali.js – la sezione aggiuntiva con il modello occhiali.glb
//   SINISTRA: il "video" con le stanghette che si chiudono e si riaprono
//   CENTRO:   l'occhiale normale, da girare col mouse
//   DESTRA:   le quattro prospettive (alto, basso, sinistra, destra)
// Si carica come modulo (type="module"), quindi parte solo quando l'HTML è pronto.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// ===== 1. la scelta dei colori =====

// la scelta attuale: gli occhiali la leggono a ogni fotogramma
let coloreAste = '#1C1C1C';
let coloreLente = '#7A7A78';

// rende "attivo" il bottone scelto e spegne gli altri del suo gruppo
function seleziona(bottoni, bottoneScelto) {
    bottoni.forEach(function(bottone) {
        bottone.classList.remove('attivo');
        bottone.setAttribute('aria-pressed', 'false');
    });
    bottoneScelto.classList.add('attivo');
    bottoneScelto.setAttribute('aria-pressed', 'true');
}

const campioniAste = document.querySelectorAll('.campione-aste');
const valoreAste = document.getElementById('valore-aste');
campioniAste.forEach(function(campione) {
    campione.addEventListener('click', function() {
        seleziona(campioniAste, campione);
        valoreAste.textContent = campione.dataset.nome;
        coloreAste = campione.dataset.color;
        fotografaProspettive();     // le miniature prendono i nuovi colori
    });
});

const campioniLente = document.querySelectorAll('.campione-lente');
const valoreLente = document.getElementById('valore-lente');
campioniLente.forEach(function(campione) {
    campione.addEventListener('click', function() {
        seleziona(campioniLente, campione);
        valoreLente.textContent = campione.dataset.nome;
        coloreLente = campione.dataset.color;
        fotografaProspettive();
    });
});


// ===== 2. preparare una copia del modello =====

// ogni visore ha la sua copia degli occhiali, con i suoi materiali
// (così il video, il centro e le miniature possono avere colori diversi)
function preparaOcchiali(originale) {
    const modello = originale.clone(true);

    // trova le parti e dà a ognuna una copia del materiale:
    //   materiale "aste"  → stanghette, bordo inferiore e cerniere (la montatura)
    //   materiale "lente" → la visiera
    let materialeAste = null;
    let materialeLente = null;
    modello.traverse(function(parte) {
        if (!parte.isMesh) return;
        parte.castShadow = true;
        if (parte.material.name === 'aste') {
            if (!materialeAste) {
                materialeAste = parte.material.clone();
                materialeAste.roughness = 0.2;     // acetato lucido
                materialeAste.metalness = 0;
            }
            parte.material = materialeAste;
        }
        if (parte.material.name === 'lente') {
            if (!materialeLente) {
                // vetro colorato semitrasparente (la "transmission" di Rhino
                // con lo sfondo trasparente non farebbe vedere il colore)
                materialeLente = parte.material.clone();
                materialeLente.transmission = 0;
                materialeLente.transparent = true;
                materialeLente.opacity = 0.7;
                materialeLente.depthWrite = false;  // evita che le facce trasparenti si "taglino" a vicenda
                materialeLente.roughness = 0.05;
                materialeLente.metalness = 0;
            }
            parte.material = materialeLente;
        }
    });

    // le cerniere delle stanghette (prima di scalare)
    const perni = {
        sinistra: creaPerno(modello.getObjectByName('asta_sinistra'), 'sinistra'),
        destra: creaPerno(modello.getObjectByName('asta_destra'), 'destra')
    };

    // il modello è in millimetri: lo portiamo a circa 1.3 unità, centrato e appoggiato a terra
    const scatola = new THREE.Box3().setFromObject(modello);
    const misura = scatola.getSize(new THREE.Vector3());
    modello.scale.setScalar(1.3 / Math.max(misura.x, misura.y, misura.z));

    scatola.setFromObject(modello);
    const centro = scatola.getCenter(new THREE.Vector3());
    modello.position.x -= centro.x;
    modello.position.z -= centro.z;
    modello.position.y -= scatola.min.y;

    const altezza = new THREE.Box3().setFromObject(modello).getSize(new THREE.Vector3()).y;

    // un contenitore con l'origine al centro degli occhiali:
    // se lo ruotiamo, gli occhiali girano su se stessi e restano inquadrati
    const contenitore = new THREE.Group();
    contenitore.add(modello);

    return { modello: contenitore, materialeAste, materialeLente, perni, altezza };
}

// il perno della cerniera di una stanghetta.
// Nel file di Rhino l'asta corre lungo Y (dal frontale verso le orecchie)
// e la cerniera ruota attorno a Z (l'asse verticale di Rhino).
function creaPerno(asta, lato) {
    if (!asta) return null;

    asta.geometry.computeBoundingBox();
    const box = asta.geometry.boundingBox;
    const x = (lato === 'sinistra') ? box.min.x : box.max.x;   // lato esterno
    const y = box.min.y;                                         // estremità davanti
    const z = (box.min.z + box.max.z) / 2;

    const perno = new THREE.Group();
    perno.position.set(x, y, z);
    asta.parent.add(perno);
    perno.add(asta);
    asta.position.set(-x, -y, -z);   // l'asta resta dov'era, ma ora gira attorno al perno
    return perno;
}

// chiude le stanghette: 0 = aperte, 1 = chiuse
// (la sinistra ruota un po' di più, così da chiuse si sovrappongono)
const CHIUSURA_SINISTRA = -THREE.MathUtils.degToRad(88);
const CHIUSURA_DESTRA = THREE.MathUtils.degToRad(82);

function chiudiStanghette(occhiali, quanto) {
    if (occhiali.perni.sinistra) occhiali.perni.sinistra.rotation.z = quanto * CHIUSURA_SINISTRA;
    if (occhiali.perni.destra) occhiali.perni.destra.rotation.z = quanto * CHIUSURA_DESTRA;
}


// ===== 3. un visore: scena, camera, luci, pavimento con l'ombra =====

function creaScena() {
    const scena = new THREE.Scene();

    const luce = new THREE.DirectionalLight(0xffffff, 2.2);
    luce.position.set(-2, 5, 3);
    luce.castShadow = true;
    luce.shadow.mapSize.set(2048, 2048);
    luce.shadow.radius = 4;
    scena.add(luce);

    // pavimento invisibile che mostra solo l'ombra
    const pavimento = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.ShadowMaterial({ opacity: 0.18 })
    );
    pavimento.rotation.x = -Math.PI / 2;
    pavimento.receiveShadow = true;
    scena.add(pavimento);

    return scena;
}

function creaRenderer() {
    // alpha: true = sfondo trasparente, si vede il beige del CSS
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
}

// la "stanza" che si riflette su lenti e acetato
function creaAmbiente(renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    return pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
}

// collega un renderer a un visore dell'HTML e lo tiene della sua misura
function montaNelVisore(renderer, camera, visore) {
    visore.appendChild(renderer.domElement);
    function adattaMisura() {
        if (!visore.clientWidth || !visore.clientHeight) return;   // visore non ancora visibile
        renderer.setSize(visore.clientWidth, visore.clientHeight, false);
        camera.aspect = visore.clientWidth / visore.clientHeight;
        camera.updateProjectionMatrix();
    }
    new ResizeObserver(adattaMisura).observe(visore);
}


// ===== 4. SINISTRA: il video =====

const visoreVideo = document.getElementById('visore-video');
const rendererVideo = creaRenderer();
const scenaVideo = creaScena();
scenaVideo.environment = creaAmbiente(rendererVideo);
scenaVideo.environmentIntensity = 0.8;
const cameraVideo = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
// inquadratura fissa di tre quarti, dall'alto: si vedono bene le stanghette che si piegano
cameraVideo.position.set(1.5, 1.4, 1.9);
montaNelVisore(rendererVideo, cameraVideo, visoreVideo);

// la sequenza in secondi: aperte → si chiudono → chiuse → si riaprono
const FERMO_APERTE = 1.6;
const CHIUSURA = 1.2;
const FERMO_CHIUSE = 1.2;
const APERTURA = 1.2;
const DURATA = FERMO_APERTE + CHIUSURA + FERMO_CHIUSE + APERTURA;

// movimento morbido: parte piano, accelera, rallenta alla fine
function morbido(t) {
    return t * t * (3 - 2 * t);
}

// da 0 (aperte) a 1 (chiuse) in base al tempo della sequenza
function chiusuraAlTempo(t) {
    t = t % DURATA;
    if (t < FERMO_APERTE) return 0;
    t -= FERMO_APERTE;
    if (t < CHIUSURA) return morbido(t / CHIUSURA);
    t -= CHIUSURA;
    if (t < FERMO_CHIUSE) return 1;
    t -= FERMO_CHIUSE;
    return 1 - morbido(t / APERTURA);
}

// play / pausa
let inRiproduzione = true;
let tempoSequenza = 0;
const bottoneVideo = document.getElementById('bottone-video');
bottoneVideo.addEventListener('click', function() {
    inRiproduzione = !inRiproduzione;
    bottoneVideo.textContent = inRiproduzione ? 'Pausa' : 'Play';
    bottoneVideo.setAttribute('aria-pressed', inRiproduzione ? 'false' : 'true');
});


// ===== 5. CENTRO: l'occhiale normale =====

const visoreCentro = document.getElementById('visore-occhiali');
const rendererCentro = creaRenderer();
const scenaCentro = creaScena();
scenaCentro.environment = creaAmbiente(rendererCentro);
scenaCentro.environmentIntensity = 0.8;
const cameraCentro = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
cameraCentro.position.set(0, 0.6, 3);
montaNelVisore(rendererCentro, cameraCentro, visoreCentro);

// la pedana girevole su cui appoggiamo l'occhiale
const pedana = new THREE.Group();
scenaCentro.add(pedana);

// rotella = zoom; trascinare = gira l'occhiale (non la camera)
const controlli = new OrbitControls(cameraCentro, rendererCentro.domElement);
controlli.enableRotate = false;
controlli.enablePan = false;
controlli.minDistance = 1.2;
controlli.maxDistance = 6;

const canvasCentro = rendererCentro.domElement;
let staTrascinando = false;
let xPrecedente = 0;
canvasCentro.addEventListener('pointerdown', function(evento) {
    staTrascinando = true;
    xPrecedente = evento.clientX;
    canvasCentro.setPointerCapture(evento.pointerId);
});
canvasCentro.addEventListener('pointermove', function(evento) {
    if (!staTrascinando) return;
    const dx = evento.clientX - xPrecedente;
    xPrecedente = evento.clientX;
    pedana.rotation.y += dx * 0.01;
});
canvasCentro.addEventListener('pointerup', function() { staTrascinando = false; });
canvasCentro.addEventListener('pointercancel', function() { staTrascinando = false; });


// ===== 6. DESTRA: le quattro prospettive =====

// un renderer piccolo e nascosto "fotografa" gli occhiali da quattro punti di vista
// e mette ogni foto come sfondo della sua miniatura.
// Le foto sono a colori: è il CSS a mostrarle in grigio finché non ci passi sopra.
const rendererFoto = creaRenderer();
rendererFoto.setPixelRatio(1);
rendererFoto.setSize(400, 400, false);
const scenaFoto = creaScena();
scenaFoto.environment = creaAmbiente(rendererFoto);
scenaFoto.environmentIntensity = 0.9;
const cameraFoto = new THREE.PerspectiveCamera(35, 1, 0.01, 100);

let occhialiFoto = null;

// dove si mette la camera per ogni vista (rispetto al centro degli occhiali)
// "su" dice quale direzione è in alto nella foto
const DISTANZA_FOTO = 2.3;
const PROSPETTIVE = {
    alto:     { posizione: [0,  DISTANZA_FOTO, 0], su: [0, 0, -1] },
    basso:    { posizione: [0, -DISTANZA_FOTO, 0], su: [0, 0, -1] },
    sinistra: { posizione: [-DISTANZA_FOTO, 0, 0], su: [0, 1, 0] },
    destra:   { posizione: [ DISTANZA_FOTO, 0, 0], su: [0, 1, 0] }
};

const miniature = document.querySelectorAll('.miniatura');

// i colori delle due palette, letti dai campioni dell'HTML
const paletteAste = Array.from(campioniAste).map(function(c) { return c.dataset.color; });
const paletteLente = Array.from(campioniLente).map(function(c) { return c.dataset.color; });

// ogni miniatura ha una combinazione diversa:
// la prima è quella scelta, le altre prendono le coppie successive delle due palette
function combinazioneMiniatura(numero) {
    const iAste = paletteAste.indexOf(coloreAste);
    const iLente = paletteLente.indexOf(coloreLente);
    return {
        aste: paletteAste[(iAste + numero) % paletteAste.length],
        lente: paletteLente[(iLente + numero) % paletteLente.length]
    };
}

// cliccando una miniatura, i suoi colori passano al modello e ai campioni
miniature.forEach(function(miniatura) {
    miniatura.addEventListener('click', function() {
        const aste = miniatura.dataset.aste;
        const lente = miniatura.dataset.lente;
        campioniAste.forEach(function(c) { if (c.dataset.color === aste) c.click(); });
        campioniLente.forEach(function(c) { if (c.dataset.color === lente) c.click(); });
    });
});

function fotografaProspettive() {
    if (!occhialiFoto) return;      // il modello non è ancora caricato

    const centro = new THREE.Vector3(0, occhialiFoto.altezza / 2, 0);

    miniature.forEach(function(miniatura, numero) {
        // i colori di questa miniatura
        const colori = combinazioneMiniatura(numero);
        miniatura.dataset.aste = colori.aste;
        miniatura.dataset.lente = colori.lente;
        occhialiFoto.materialeAste.color.set(colori.aste);
        occhialiFoto.materialeLente.color.set(colori.lente);

        const vista = PROSPETTIVE[miniatura.dataset.vista];
        cameraFoto.position.set(vista.posizione[0], vista.posizione[1], vista.posizione[2]).add(centro);
        cameraFoto.up.set(vista.su[0], vista.su[1], vista.su[2]);
        cameraFoto.lookAt(centro);

        rendererFoto.render(scenaFoto, cameraFoto);
        miniatura.style.backgroundImage = 'url(' + rendererFoto.domElement.toDataURL('image/png') + ')';
    });
}


// ===== 7. caricare il modello e far partire tutto =====

let occhialiVideo = null;
let occhialiCentro = null;

new GLTFLoader().load(
    'models copia/occhiali.glb',
    function(gltf) {
        // sinistra
        occhialiVideo = preparaOcchiali(gltf.scene);
        occhialiVideo.modello.rotation.y = -0.6;
        scenaVideo.add(occhialiVideo.modello);
        cameraVideo.lookAt(0, occhialiVideo.altezza / 2, 0);

        // centro
        occhialiCentro = preparaOcchiali(gltf.scene);
        pedana.add(occhialiCentro.modello);
        controlli.target.set(0, occhialiCentro.altezza / 2, 0);

        // destra
        occhialiFoto = preparaOcchiali(gltf.scene);
        scenaFoto.add(occhialiFoto.modello);
        fotografaProspettive();

        document.querySelectorAll('#visore-video .visore-segnaposto, #visore-occhiali .visore-segnaposto')
            .forEach(function(scritta) { scritta.remove(); });
    },
    undefined,
    function(errore) {
        console.error(errore);
        document.querySelectorAll('#visore-video .visore-segnaposto, #visore-occhiali .visore-segnaposto')
            .forEach(function(scritta) { scritta.textContent = 'Non è stato possibile caricare il modello'; });
    }
);


// ===== 8. il ciclo di animazione: disegna sinistra e centro ~60 volte al secondo =====

const orologio = new THREE.Clock();

function anima() {
    const delta = orologio.getDelta();

    // sinistra: le stanghette si chiudono e si riaprono (ferme se premi Pausa)
    if (occhialiVideo) {
        if (inRiproduzione) tempoSequenza += delta;
        occhialiVideo.materialeAste.color.set(coloreAste);
        occhialiVideo.materialeLente.color.set(coloreLente);
        chiudiStanghette(occhialiVideo, chiusuraAlTempo(tempoSequenza));
    }
    rendererVideo.render(scenaVideo, cameraVideo);

    // centro: l'occhiale aperto, gira piano da solo quando non lo trascini
    if (occhialiCentro) {
        occhialiCentro.materialeAste.color.set(coloreAste);
        occhialiCentro.materialeLente.color.set(coloreLente);
    }
    if (!staTrascinando) pedana.rotation.y += 0.004;
    controlli.update();
    rendererCentro.render(scenaCentro, cameraCentro);
}
rendererCentro.setAnimationLoop(anima);
