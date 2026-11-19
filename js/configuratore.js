// configuratore.js – la sezione "In mostra": scelta di colore, finitura e larghezza + visore 3D
// Si carica come modulo (type="module"), quindi parte solo quando l'HTML è pronto.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';


// ===== scelta del colore, della finitura e della larghezza =====

// la scelta attuale (il modello 3D la legge a ogni fotogramma)
let coloreScelto = '#4B0082';      // colore dei cuscini
let finituraScelta = 'lucido';     // 'lucido', 'opaco' oppure 'confronto'
let scalaScelta = 1;

// roughness (ruvidezza) dei cuscini: basso = pelle lucida, alto = pelle opaca
const RUVIDEZZA_LUCIDO = 0.25;
const RUVIDEZZA_OPACO = 0.9;

// rende "attivo" il bottone cliccato e spegne gli altri del suo gruppo
function seleziona(bottoni, bottoneCliccato) {
    bottoni.forEach(function(bottone) {
        bottone.classList.remove('attivo');
        bottone.setAttribute('aria-pressed', 'false');
    });
    bottoneCliccato.classList.add('attivo');
    bottoneCliccato.setAttribute('aria-pressed', 'true');
}

// i campioni di colore (cambiano il colore dei cuscini)
const campioni = document.querySelectorAll('.campione');
const valoreColore = document.getElementById('valore-colore');

campioni.forEach(function(campione) {
    campione.addEventListener('click', function() {
        seleziona(campioni, campione);
        valoreColore.textContent = campione.dataset.nome;
        coloreScelto = campione.dataset.color;
    });
});

// i bottoni della finitura dei cuscini (lucido / opaco / confronto)
const finiture = document.querySelectorAll('.finitura');
const valoreFinitura = document.getElementById('valore-finitura');
const etichetteConfronto = document.getElementById('etichette-confronto');
const etichettaLucido = document.getElementById('etichetta-lucido');
const etichettaOpaco = document.getElementById('etichetta-opaco');

finiture.forEach(function(finitura) {
    finitura.addEventListener('click', function() {
        seleziona(finiture, finitura);
        valoreFinitura.textContent = finitura.dataset.nome;
        finituraScelta = finitura.dataset.finitura;
        // le scritte "Lucido" e "Opaco" si vedono solo nel confronto
        etichetteConfronto.hidden = (finituraScelta !== 'confronto');
    });
});

// lo slider della larghezza: va da 65 a 85 cm, a scatti di 5 cm
// 75 cm è la misura "normale" (scala 1)
const sliderMisura = document.getElementById('slider-misura');
const valoreMisura = document.getElementById('valore-misura');

sliderMisura.addEventListener('input', function() {
    const larghezza = Number(sliderMisura.value);
    valoreMisura.textContent = larghezza + ' cm';
    scalaScelta = larghezza / 75;
});


// ===== il visore 3D con Three.js =====

const visore = document.getElementById('visore');

// 1. la scena: il "mondo" dove mettiamo gli oggetti
const scena = new THREE.Scene();

// 2. la camera: il nostro punto di vista (resta ferma, è la seduta che gira)
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 2.2, 4.6);

// 3. il renderer: disegna la scena in un <canvas>
//    alpha: true = sfondo trasparente, così si vede il beige del CSS
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;                  // accende le ombre
renderer.shadowMap.type = THREE.PCFSoftShadowMap;   // ombre con i bordi morbidi

// al posto della scritta "Qui arriverà il modello 3D" mettiamo il canvas
visore.querySelector('.visore-segnaposto').remove();
visore.appendChild(renderer.domElement);

// 4. le luci
// una "stanza" virtuale che si riflette sugli oggetti: serve soprattutto
// al metallo cromato, che senza qualcosa da riflettere sembrerebbe grigio e piatto
const pmrem = new THREE.PMREMGenerator(renderer);
scena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scena.environmentIntensity = 0.7;

// una luce che arriva da una direzione, ferma nella stanza (come una lampada vera):
// quando la seduta gira cambiano le parti illuminate e la forma dell'ombra sul pavimento
const luce = new THREE.DirectionalLight(0xffffff, 2.5);
luce.position.set(-2, 6, 3);
luce.castShadow = true;                    // questa luce proietta ombre
luce.shadow.mapSize.set(2048, 2048);       // più alto = ombra più definita (il telaio è sottile)
luce.shadow.radius = 4;                    // sfumatura del bordo
scena.add(luce);

// il pavimento: invisibile, mostra solo l'ombra (così resta il beige del CSS)
const pavimento = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.ShadowMaterial({ opacity: 0.2 })
);
pavimento.rotation.x = -Math.PI / 2;       // lo stendiamo in orizzontale
pavimento.receiveShadow = true;            // il pavimento riceve l'ombra
scena.add(pavimento);


// 5. la seduta, ispirata alla Barcelona chair:
//    un telaio in acciaio cromato con le gambe a X viste di lato
//    e due cuscini (seduta e schienale) che cambiano colore

// il metallo: metalness 1 = metallo, roughness bassa = lucido come l'acciaio cromato
const materialeMetallo = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    metalness: 1,
    roughness: 0.15
});

// i cuscini: ne servono due materiali (uno lucido, uno opaco) per il Confronto
const materialeCuscino = new THREE.MeshStandardMaterial({
    color: coloreScelto,
    roughness: RUVIDEZZA_LUCIDO,
    metalness: 0
});
const materialeCuscinoOpaco = new THREE.MeshStandardMaterial({
    color: coloreScelto,
    roughness: RUVIDEZZA_OPACO,
    metalness: 0
});

// misure della seduta (1 unità ≈ 50 cm)
const LARGHEZZA = 1.5;
const MEZZA = LARGHEZZA / 2;
const RAGGIO_TUBO = 0.035;

// le due barre curve del telaio, viste di lato (z = avanti/indietro, y = altezza).
// Si incrociano formando la X tipica di questa seduta.
// Barra dello schienale: parte dal piede davanti e sale fino in alto dietro
const curvaSchienale = [
    [ 0.70, 0.00],
    [ 0.35, 0.28],
    [ 0.00, 0.55],
    [-0.32, 0.82],
    [-0.52, 1.15],
    [-0.60, 1.50]
];
// Barra della seduta: parte dal piede dietro e corre in avanti sotto il cuscino
const curvaSeduta = [
    [-0.70, 0.00],
    [-0.52, 0.35],
    [-0.25, 0.56],
    [ 0.20, 0.63],
    [ 0.70, 0.70]
];

// trasforma una lista di punti [z, y] in un tubo di metallo sul fianco x
function creaBarra(punti, x) {
    const curva = new THREE.CatmullRomCurve3(
        punti.map(function(p) { return new THREE.Vector3(x, p[1], p[0]); })
    );
    return new THREE.Mesh(new THREE.TubeGeometry(curva, 64, RAGGIO_TUBO, 16), materialeMetallo);
}

// una traversa dritta da un fianco all'altro, all'altezza (z, y)
function creaTraversa(z, y) {
    const traversa = new THREE.Mesh(
        new THREE.CylinderGeometry(RAGGIO_TUBO * 0.8, RAGGIO_TUBO * 0.8, LARGHEZZA, 16),
        materialeMetallo
    );
    traversa.rotation.z = Math.PI / 2;     // il cilindro nasce in verticale: lo giriamo
    traversa.position.set(0, y, z);
    return traversa;
}

// un cuscino: un parallelepipedo con gli spigoli arrotondati
// più una griglia di bottoni (le "trapuntature" del cuscino)
function creaCuscino(larghezza, altezza, spessore, materiale) {
    const cuscino = new THREE.Group();

    const imbottitura = new THREE.Mesh(
        new RoundedBoxGeometry(larghezza, altezza, spessore, 4, 0.06),
        materiale
    );
    cuscino.add(imbottitura);

    // i bottoni sul lato davanti del cuscino
    const geometriaBottone = new THREE.SphereGeometry(0.022, 12, 8);
    const colonne = 4;
    const righe = 3;
    for (let c = 1; c <= colonne; c++) {
        for (let r = 1; r <= righe; r++) {
            const bottone = new THREE.Mesh(geometriaBottone, materiale);
            bottone.position.set(
                -larghezza / 2 + c * larghezza / (colonne + 1),
                -altezza / 2 + r * altezza / (righe + 1),
                spessore / 2
            );
            bottone.scale.z = 0.5;         // schiacciati, quasi affondati nella pelle
            cuscino.add(bottone);
        }
    }
    return cuscino;
}

// costruisce una seduta completa con il materiale dei cuscini indicato
function creaSeduta(materialeCuscini) {
    const seduta = new THREE.Group();

    // telaio: le due X sui fianchi destro e sinistro
    [-MEZZA - 0.03, MEZZA + 0.03].forEach(function(x) {
        seduta.add(creaBarra(curvaSchienale, x));
        seduta.add(creaBarra(curvaSeduta, x));
    });

    // traverse che uniscono i due fianchi
    seduta.add(creaTraversa(0.70, 0.70));      // davanti, sotto il bordo della seduta
    seduta.add(creaTraversa(-0.25, 0.56));     // dietro, sotto la seduta
    seduta.add(creaTraversa(-0.60, 1.50));     // in cima allo schienale

    // cuscino della seduta: quasi orizzontale, un po' più basso dietro
    const cuscinoSeduta = creaCuscino(LARGHEZZA, 1.25, 0.16, materialeCuscini);
    cuscinoSeduta.rotation.x = -Math.PI / 2 - 0.07;   // lo stendiamo e lo inclinamo appena
    cuscinoSeduta.position.set(0, 0.74, 0.05);
    seduta.add(cuscinoSeduta);

    // cuscino dello schienale: inclinato all'indietro, appoggiato alla barra
    const cuscinoSchienale = creaCuscino(LARGHEZZA, 0.85, 0.15, materialeCuscini);
    cuscinoSchienale.rotation.x = -0.42;
    cuscinoSchienale.position.set(0, 1.18, -0.4);
    seduta.add(cuscinoSchienale);

    // tutte le parti fanno ombra
    seduta.traverse(function(parte) {
        if (parte.isMesh) parte.castShadow = true;
    });

    return seduta;
}

// la seduta principale (cuscini lucidi oppure opachi)
const oggetto = creaSeduta(materialeCuscino);
oggetto.rotation.y = -0.8;                 // parte girata di tre quarti: si vede la X del telaio
scena.add(oggetto);

// la copia con i cuscini OPACHI, usata solo nel Confronto: compare a destra
const oggettoOpaco = creaSeduta(materialeCuscinoOpaco);
oggettoOpaco.visible = false;              // nascosta finché non scegli Confronto
scena.add(oggettoOpaco);


// 6. i controlli
// rotella = avvicinarsi/allontanarsi (OrbitControls muove solo la distanza della camera)
const controlli = new OrbitControls(camera, renderer.domElement);
controlli.target.set(0, 0.7, 0);           // la camera guarda il centro della seduta
controlli.enableRotate = false;            // la rotazione la gestiamo noi, qui sotto
controlli.enablePan = false;
controlli.minDistance = 2.5;
controlli.maxDistance = 9;

// trascinare col mouse a destra/sinistra fa girare la SEDUTA (non la camera),
// come su una pedana girevole: la luce resta ferma e l'ombra sul pavimento cambia
const canvas = renderer.domElement;
let staTrascinando = false;
let xPrecedente = 0;

canvas.addEventListener('pointerdown', function(evento) {
    staTrascinando = true;
    xPrecedente = evento.clientX;
    canvas.setPointerCapture(evento.pointerId);   // continua a seguire il mouse anche fuori dal visore
});

canvas.addEventListener('pointermove', function(evento) {
    if (!staTrascinando) return;
    const dx = evento.clientX - xPrecedente;
    xPrecedente = evento.clientX;
    oggetto.rotation.y += dx * 0.01;
});

canvas.addEventListener('pointerup', function() {
    staTrascinando = false;
});
canvas.addEventListener('pointercancel', function() {
    staTrascinando = false;
});

// il canvas prende sempre la misura del visore
function adattaMisura() {
    const larghezza = visore.clientWidth;
    const altezza = visore.clientHeight;
    renderer.setSize(larghezza, altezza, false);
    camera.aspect = larghezza / altezza;
    camera.updateProjectionMatrix();
}
new ResizeObserver(adattaMisura).observe(visore);

// zoom della camera: 1 = normale, valori più bassi = inquadratura più larga
function impostaZoom(valore) {
    if (camera.zoom !== valore) {
        camera.zoom = valore;
        camera.updateProjectionMatrix();
    }
}

// dove si trova un oggetto sullo schermo, in % da sinistra (0 = bordo sinistro, 100 = destro)
function posizioneSulloSchermo(oggetto3d) {
    const punto = oggetto3d.position.clone().project(camera);   // da -1 a 1
    return (punto.x + 1) / 2 * 100;
}

// 7. il ciclo di animazione: ridisegna la scena circa 60 volte al secondo
function anima() {
    // la seduta segue i bottoni di colore, finitura e larghezza
    materialeCuscino.color.set(coloreScelto);
    oggetto.scale.setScalar(scalaScelta);

    // rotazione di default: quando non la stai trascinando, gira piano da sola
    // (riparte dalla posizione in cui l'hai lasciata)
    if (!staTrascinando) {
        oggetto.rotation.y += 0.004;       // più alto = più veloce
    }

    if (finituraScelta === 'confronto') {
        // CONFRONTO: cuscini lucidi a sinistra, cuscini opachi a destra
        // la distanza cresce con la larghezza, così le due sedute non si toccano mai
        const distanza = 1.2 * scalaScelta + 0.1;

        materialeCuscino.roughness = RUVIDEZZA_LUCIDO;
        oggetto.position.x = -distanza;

        oggettoOpaco.visible = true;
        materialeCuscinoOpaco.color.set(coloreScelto);
        oggettoOpaco.scale.copy(oggetto.scale);
        oggettoOpaco.rotation.copy(oggetto.rotation);   // gira insieme all'altra
        oggettoOpaco.position.x = distanza;

        // inquadratura più larga, perché ora le sedute sono due
        impostaZoom(0.6);

        // i nomi seguono le sedute sullo schermo
        etichettaLucido.style.left = posizioneSulloSchermo(oggetto) + '%';
        etichettaOpaco.style.left = posizioneSulloSchermo(oggettoOpaco) + '%';
    } else {
        // una sola seduta al centro, con i cuscini lucidi oppure opachi
        materialeCuscino.roughness = (finituraScelta === 'opaco') ? RUVIDEZZA_OPACO : RUVIDEZZA_LUCIDO;
        oggetto.position.x = 0;
        oggettoOpaco.visible = false;
        impostaZoom(1);
    }

    controlli.update();
    renderer.render(scena, camera);
}
renderer.setAnimationLoop(anima);
