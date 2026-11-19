// galleria.js – la galleria dei modelli di occhiali della classe
// (i file sono nella cartella modelli_occhiali_glbxweb)
//   sulla pagina: solo l'elenco dei nomi (leggero, niente 3D)
//   al clic su un nome: una finestra dedicata con l'occhiale da girare e una piccola descrizione
//   nella finestra, "Prova": la fotocamera con l'occhiale sul viso, lo scatto e la condivisione
//
// Per consumare il meno possibile:
//   - il 3D si prepara solo al primo clic (aprendo la pagina non parte nulla)
//   - un solo renderer, riusato per tutti i modelli
//   - si disegna solo quando muovi il modello (niente animazione continua a 60 fotogrammi al secondo)
//   - in memoria c'è un solo modello alla volta: quando ne apri un altro, il precedente viene liberato
// Si carica come modulo (type="module"), quindi parte solo quando l'HTML è pronto.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// ===== 1. i modelli della cartella =====

// il browser non può "leggere" una cartella da solo: per questo i file sono elencati qui.
// Se aggiungi un modello nella cartella, aggiungi anche una riga qui sotto.
//   capovolto: true      = il file è stato esportato sottosopra: la galleria lo raddrizza
//   descrizione: '...'   = il testo della finestra (se manca, si usa quello generico qui sotto)
const CARTELLA = 'modelli_occhiali_glbxweb/';
const DESCRIZIONE_GENERICA = 'Modello 3D progettato in Rhino ed esportato in formato GLB per il web.';
// le descrizioni ripetute: chi ha lavorato in gruppo ha lo stesso modello
const FASCIA      = 'Occhiale a fascia: un unico frontale largo e squadrato che copre gli occhi come una benda, con stanghette ampie e sagomate.';
const SPORT_ARANCIO = 'Occhiale sportivo con lente unica avvolgente e montatura chiara, con inserti arancioni sulle stanghette per una presa sicura.';
const MASCHERA_SCI = 'Maschera da sci con lente rosa specchiata, cornice morbida verde menta e fascia elastica per tenerla ferma sul viso.';
const PROTETTIVO  = 'Occhiale protettivo da laboratorio: la lente unica ripara anche di lato, con protezioni laterali forate per far circolare l\'aria.';
const SPORT_ROSSO = 'Occhiale sportivo avvolgente con lente rossa a goccia, stanghette verdi e piccole cerniere blu.';
const DA_LAVORO   = 'Occhiale da lavoro con lente trasparente a scudo e stanghette nere regolabili in lunghezza.';
const VISIERA     = 'Visiera avvolgente in un unico pezzo, con incavo per il naso e stanghette sottili traforate.';
const SCHERMO_ORO = 'Occhiale sportivo a schermo con lente azzurra specchiata e montatura dorata leggera, con stanghette traforate.';

// il "tipo" che compare accanto al nome nell'indice, ricavato dalla descrizione
const TIPI = new Map([
    [FASCIA, 'A fascia'], [SPORT_ARANCIO, 'Sportivo'], [MASCHERA_SCI, 'Maschera da sci'],
    [PROTETTIVO, 'Protettivo'], [SPORT_ROSSO, 'Sportivo'], [DA_LAVORO, 'Da lavoro'],
    [VISIERA, 'Visiera'], [SCHERMO_ORO, 'Sportivo']
]);

const MODELLI = [
    { file: 'camilasaraviaruiz.glb',     nome: 'Camila Saravia Ruiz',  tipo: 'Maschera',
      descrizione: 'Occhiale a maschera con una sola lente avvolgente e trasparente, da una tempia all\'altra, e stanghette sottili in azzurro cobalto.' },
    { file: '3d_occhiali_giuli.glb',     nome: 'Giuli',                descrizione: FASCIA },
    { file: 'AnnaPorcellini.glb',        nome: 'Anna Porcellini',      descrizione: SPORT_ARANCIO },
    { file: 'Eleonora_Nobili.glb',       nome: 'Eleonora Nobili',      descrizione: MASCHERA_SCI },
    { file: 'Jacopo_Del_Bianco.glb',     nome: 'Jacopo Del Bianco',    descrizione: PROTETTIVO },
    { file: 'SofiaBezzicheri.glb',       nome: 'Sofia Bezzicheri',     descrizione: MASCHERA_SCI },
    { file: 'alessandromorri.glb',       nome: 'Alessandro Morri',     descrizione: SPORT_ROSSO },
    { file: 'davidesebastianelli.glb',   nome: 'Davide Sebastianelli', descrizione: DA_LAVORO },
    { file: 'demariniadele.glb',         nome: 'Adele De Marini',      descrizione: FASCIA },
    { file: 'fabbri_Edoardo.glb',        nome: 'Edoardo Fabbri',       descrizione: VISIERA, capovolto: true },
    { file: 'federicacancello.glb',      nome: 'Federica Cancello',    tipo: 'Visiera',
      descrizione: 'Visiera curva azzurra che avvolge gli occhi, mostrata indossata su una testa per vederne le proporzioni sul volto.' },
    { file: 'francescagalli.glb',        nome: 'Francesca Galli',      descrizione: FASCIA },
    { file: 'giacomocerioni.glb',        nome: 'Giacomo Cerioni',      descrizione: PROTETTIVO },
    { file: 'gianmarcotito.glb',         nome: 'Gianmarco Tito',       descrizione: PROTETTIVO },
    { file: 'giuliacamasso.glb',         nome: 'Giulia Camasso',       descrizione: FASCIA },
    { file: 'lindagarnaroli.glb',        nome: 'Linda Garnaroli',      descrizione: SPORT_ROSSO },
    { file: 'lucagiorgetti.glb',         nome: 'Luca Giorgetti',       descrizione: SCHERMO_ORO },
    { file: 'luigiboccarossa.glb',       nome: 'Luigi Boccarossa',     descrizione: DA_LAVORO },
    { file: 'martinacarnevali.glb',      nome: 'Martina Carnevali',    descrizione: VISIERA, capovolto: true },
    { file: 'mongiustiviola.glb',        nome: 'Viola Mongiusti',      descrizione: SCHERMO_ORO },
    { file: 'niccolocasanova.glb',       nome: 'Niccolò Casanova',     tipo: 'Sportivo',
      descrizione: 'Occhiale sportivo a schermo con lente azzurra sfumata, frontale blu scuro e stanghette sottili e curve.' },
    { file: 'takwaguezguez.glb',         nome: 'Takwa Guezguez',       descrizione: SPORT_ARANCIO },
    { file: 'valentinavicinanza.glb',    nome: 'Valentina Vicinanza',  descrizione: SPORT_ROSSO }
    // nota: "niccolòcasanova.glb" (con l'accento) è un file di Rhino rinominato e non si apre;
    // il modello vero di Niccolò è "niccolocasanova.glb" (senza accento)
];


// ===== 2. la finestra (un <dialog> dell'HTML) =====

const finestra = document.getElementById('finestra-occhiale');
const visore = document.getElementById('visore-finestra');
const scritta = document.getElementById('finestra-stato');
const titolo = document.getElementById('finestra-titolo');
const testo = document.getElementById('finestra-descrizione');
const etichetta = document.getElementById('finestra-etichetta');
const suggerimento = document.getElementById('suggerimento');
const lampo = document.getElementById('lampo');
const testoBottoneProva = document.getElementById('bottone-prova-testo');

// chi ha chiesto al computer di ridurre il movimento non vede il giro di presentazione
const menoMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

function tipoDi(voce) {
    return voce.tipo || TIPI.get(voce.descrizione) || 'Occhiale';
}

// "05" invece di "5"
function numeroDi(voce) {
    return String(MODELLI.indexOf(voce) + 1).padStart(2, '0');
}

document.getElementById('finestra-chiudi').addEventListener('click', function() { finestra.close(); });

// clic sullo sfondo scuro fuori dalla finestra = chiudi
finestra.addEventListener('click', function(evento) {
    if (evento.target === finestra) finestra.close();
});


// ===== 3. il 3D: si prepara una volta sola, al primo clic =====

let renderer, scena, camera, controlli;

function prepara3D() {
    if (renderer) return;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));   // oltre 2 non si vede la differenza, ma si consuma di più
    renderer.shadowMap.enabled = true;
    visore.appendChild(renderer.domElement);

    scena = new THREE.Scene();
    scena.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
    scena.environmentIntensity = 0.8;

    const luce = new THREE.DirectionalLight(0xffffff, 2);
    luce.position.set(-2, 5, 3);
    luce.castShadow = true;
    luce.shadow.mapSize.set(1024, 1024);
    scena.add(luce);

    // pavimento invisibile che mostra solo l'ombra
    const pavimento = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.18 }));
    pavimento.rotation.x = -Math.PI / 2;
    pavimento.receiveShadow = true;
    scena.add(pavimento);

    camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);

    controlli = new OrbitControls(camera, renderer.domElement);
    controlli.enablePan = false;
    controlli.minDistance = 0.8;
    controlli.maxDistance = 6;
    // si disegna SOLO quando il modello si muove: da fermo la scheda video riposa
    controlli.addEventListener('change', disegna);
    // al primo tocco il suggerimento "Trascina per girare" sparisce, e il giro di presentazione si ferma
    controlli.addEventListener('start', function() {
        suggerimento.classList.add('nascosto');
        cancelAnimationFrame(giroPresentazione);
    });

    // se la finestra cambia misura (es. ruoti il telefono), il disegno si adatta
    new ResizeObserver(adattaMisura).observe(visore);
}

function disegna() {
    if (inProva) return;     // durante la prova disegna il ciclo della fotocamera
    renderer.render(scena, camera);
}

function adattaMisura() {
    if (!finestra.open || !visore.clientWidth || !visore.clientHeight) return;
    renderer.setSize(visore.clientWidth, visore.clientHeight, false);
    camera.aspect = visore.clientWidth / visore.clientHeight;
    camera.updateProjectionMatrix();
    disegna();
}


// ===== 4. caricare un modello (uno solo alla volta in memoria) =====

const loader = new GLTFLoader();
let modelloInScena = null;
let voceInScena = null;     // quale occhiale si vede adesso
let voceRichiesta = null;   // se clicchi un altro nome durante il caricamento, vince l'ultimo

// porta qualsiasi modello alla stessa misura (circa 1.3), centrato e appoggiato a terra
function sistemaModello(originale, capovolto) {
    // via le linee e i punti: sono curve di costruzione di Rhino esportate per sbaglio
    // (non hanno volume, ma allargano la misura e rimpiccioliscono l'occhiale)
    const daTogliere = [];
    originale.traverse(function(parte) {
        if (parte.isLine || parte.isPoints) daTogliere.push(parte);
    });
    daTogliere.forEach(function(parte) {
        parte.removeFromParent();
        parte.geometry.dispose();
    });

    originale.traverse(function(parte) {
        if (!parte.isMesh) return;
        parte.castShadow = true;
        // le parti trasparenti (le lenti) non devono "tagliarsi" a vicenda
        [].concat(parte.material).forEach(function(materiale) {
            if (materiale.transparent) materiale.depthWrite = false;
        });
    });

    // mezzo giro attorno all'asse che punta verso di noi: il naso torna in basso
    if (capovolto) originale.rotation.z += Math.PI;

    const scatola = new THREE.Box3().setFromObject(originale);
    const misura = scatola.getSize(new THREE.Vector3());
    originale.scale.multiplyScalar(1.3 / Math.max(misura.x, misura.y, misura.z));

    scatola.setFromObject(originale);
    const centro = scatola.getCenter(new THREE.Vector3());
    originale.position.x -= centro.x;
    originale.position.z -= centro.z;
    originale.position.y -= scatola.min.y;

    const contenitore = new THREE.Group();
    contenitore.add(originale);
    contenitore.userData.altezza = new THREE.Box3().setFromObject(contenitore).getSize(new THREE.Vector3()).y;
    return contenitore;
}

// libera la memoria (della scheda video) occupata da un modello che non serve più
function libera(modello) {
    modello.traverse(function(parte) {
        if (!parte.isMesh) return;
        parte.geometry.dispose();
        [].concat(parte.material).forEach(function(materiale) {
            for (const chiave in materiale) {
                if (materiale[chiave] && materiale[chiave].isTexture) materiale[chiave].dispose();
            }
            materiale.dispose();
        });
    });
}

function mostra(modello, voce) {
    if (modelloInScena) {
        scena.remove(modelloInScena);
        libera(modelloInScena);
    }
    modelloInScena = modello;
    voceInScena = voce;
    scena.add(modello);

    // inquadratura di tre quarti, uguale per tutti
    const centro = new THREE.Vector3(0, modello.userData.altezza / 2, 0);
    controlli.target.copy(centro);
    presenta(centro);

    scritta.textContent = '';
    bottoneProva.disabled = false;      // ora l'occhiale si può provare
}

// il giro di presentazione: l'occhiale arriva ruotando da un lato fino alla vista di tre quarti.
// Dura poco più di un secondo, poi si ferma (non consuma più nulla).
let giroPresentazione = 0;
const ARRIVO = new THREE.Vector3(1.6, 1.1, 2.4);

function presenta(centro) {
    cancelAnimationFrame(giroPresentazione);
    const raggio = Math.hypot(ARRIVO.x, ARRIVO.z);
    const angoloFinale = Math.atan2(ARRIVO.x, ARRIVO.z);

    if (menoMovimento.matches) {
        camera.position.copy(ARRIVO).add(centro);
        controlli.update();
        return;
    }

    const durata = 1300;
    const inizio = performance.now();
    function passo(adesso) {
        const t = Math.min((adesso - inizio) / durata, 1);
        const morbido = 1 - Math.pow(1 - t, 3);                   // parte veloce, arriva piano
        const angolo = angoloFinale - (1 - morbido) * 2.2;         // gira di circa 125°
        const distanza = raggio * (1 + (1 - morbido) * 0.6);       // e intanto si avvicina
        camera.position.set(Math.sin(angolo) * distanza, ARRIVO.y + (1 - morbido) * 0.4, Math.cos(angolo) * distanza).add(centro);
        controlli.update();                                        // disegna
        if (t < 1) giroPresentazione = requestAnimationFrame(passo);
    }
    giroPresentazione = requestAnimationFrame(passo);
}

function carica(voce) {
    voceRichiesta = voce;
    scritta.textContent = 'Caricamento…';
    bottoneProva.disabled = true;

    loader.load(
        // encodeURI serve per i nomi con spazi, accenti o parentesi
        encodeURI(CARTELLA + voce.file),
        function(gltf) {
            const modello = sistemaModello(gltf.scene, voce.capovolto);
            if (voce === voceRichiesta && finestra.open) mostra(modello, voce);
            else libera(modello);      // nel frattempo hai scelto un altro occhiale o chiuso la finestra
        },
        function(avanzamento) {
            if (!avanzamento.total) return;
            if (voce === voceRichiesta) {
                scritta.textContent = 'Caricamento… ' + Math.round(avanzamento.loaded / avanzamento.total * 100) + '%';
            }
        },
        function(errore) {
            console.error(errore);
            if (voce === voceRichiesta) scritta.textContent = 'Non è stato possibile caricare questo modello';
        }
    );
}

function apri(voce) {
    titolo.textContent = voce.nome;
    etichetta.textContent = 'N. ' + numeroDi(voce) + ' / ' + MODELLI.length + ' · ' + tipoDi(voce);
    suggerimento.classList.remove('nascosto');
    testo.textContent = voce.descrizione || DESCRIZIONE_GENERICA;
    finestra.showModal();
    prepara3D();
    adattaMisura();

    // se è lo stesso occhiale di prima, è già pronto: non si riscarica
    if (voceInScena === voce) {
        voceRichiesta = voce;
        scritta.textContent = '';
        bottoneProva.disabled = false;
        return;
    }
    carica(voce);
}

// chiudendo la finestra (×, Esc o clic fuori) si spegne anche la fotocamera
finestra.addEventListener('close', fermaProva);


// ===== 5. l'elenco dei nomi =====

const elenco = document.getElementById('galleria-elenco');
document.getElementById('galleria-numero').textContent = MODELLI.length + ' modelli';

// ogni riga dell'indice: numero · nome · tipo · freccia
MODELLI.forEach(function(voce, i) {
    const riga = document.createElement('li');
    riga.style.setProperty('--i', i);       // per l'entrata a cascata

    const bottone = document.createElement('button');
    bottone.type = 'button';
    bottone.className = 'voce-galleria';
    bottone.innerHTML =
        '<span class="voce-numero"></span>' +
        '<span class="voce-nome"></span>' +
        '<span class="voce-tipo"></span>' +
        '<span class="voce-freccia" aria-hidden="true">→</span>';
    bottone.querySelector('.voce-numero').textContent = numeroDi(voce);
    bottone.querySelector('.voce-nome').textContent = voce.nome;
    bottone.querySelector('.voce-tipo').textContent = tipoDi(voce);
    bottone.addEventListener('click', function() { apri(voce); });

    riga.appendChild(bottone);
    elenco.appendChild(riga);
});

// l'entrata a cascata: parte quando l'indice arriva sullo schermo, una volta sola
if ('IntersectionObserver' in window && !menoMovimento.matches) {
    elenco.classList.add('da-animare');
    const osservatore = new IntersectionObserver(function(voci) {
        if (!voci[0].isIntersecting) return;
        elenco.classList.add('entrata');
        osservatore.disconnect();
    }, { threshold: 0.15 });
    osservatore.observe(elenco);
}


// ===== 6. PROVA: la fotocamera con l'occhiale sul viso =====
//
// Come funziona:
//   1. "Prova" accende la fotocamera frontale
//   2. MediaPipe (di Google) trova i visi (fino a 4 persone insieme): per ognuno la posizione degli occhi,
//      le misure del viso e l'inclinazione della testa
//   3. a ogni nuovo fotogramma della fotocamera, ogni persona ha il suo occhiale 3D,
//      che si sposta, si ingrandisce e ruota come il suo viso
// Il riconoscimento gira tutto nel browser: l'immagine della fotocamera non viene inviata a nessuno.
// Per non consumare: MediaPipe si scarica solo al primo "Prova", e la fotocamera si spegne appena esci.

const MEDIAPIPE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODELLO_VOLTO = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// come l'occhiale si adatta al viso (sono proporzioni, valgono per ogni viso e ogni modello):
const FRONTALE_SU_VISO = 1.0;      // larghezza del frontale = larghezza del viso tra le tempie
const STANGHETTE_SU_VISO = 0.8;    // le stanghette arrivano alle orecchie: circa l'80% della larghezza del viso
const STANGHETTE_MIN = 0.7;        // ma non si accorciano o allungano più di così
const STANGHETTE_MAX = 1.4;

// i punti del volto di MediaPipe che usiamo (sono sempre gli stessi numeri)
const PUNTO = {
    occhioA: 33, occhioB: 263,     // angoli esterni degli occhi
    tempiaA: 127, tempiaB: 356,    // tempie: la larghezza del viso
    fronte: 10, mento: 152         // l'altezza del viso
};

const video = document.getElementById('prova-video');
const fotoScattata = document.getElementById('prova-foto');
const bottoneProva = document.getElementById('bottone-prova');
const bottoneScatta = document.getElementById('bottone-scatta');
const avviso = document.getElementById('prova-avviso');

// quante persone al massimo possono provare l'occhiale insieme
const MAX_PERSONE = 4;

let rilevatore = null;      // MediaPipe, pronto dopo il primo "Prova"
let flusso = null;          // la fotocamera accesa
let inProva = false;
let fotoMostrata = false;
let fotoBlob = null;
let datiProva = null;       // misure dell'occhiale in prova (centro, larghezza, parti nascoste)
let cicloProva = 0;
let ultimoTempoVideo = -1;
let personeViste = -1;      // quante persone c'erano nel fotogramma prima (per aggiornare il contatore)
let personeNelloScatto = 1;
let scenaProva, cameraProva, formaTesta, materialeTesta;
let indossatori = [];       // un occhiale per ogni persona davanti alla fotocamera

const contatore = document.getElementById('contatore-persone');

// scarica MediaPipe e il suo modello del volto (una volta sola)
async function preparaRilevatore() {
    if (rilevatore) return;
    const { FaceLandmarker, FilesetResolver } = await import(MEDIAPIPE + '/vision_bundle.mjs');
    const file = await FilesetResolver.forVisionTasks(MEDIAPIPE + '/wasm');
    rilevatore = await FaceLandmarker.createFromOptions(file, {
        baseOptions: { modelAssetPath: MODELLO_VOLTO, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numFaces: MAX_PERSONE,                      // riconosce fino a 4 visi insieme
        outputFacialTransformationMatrixes: true    // serve per sapere come è girata ogni testa
    });
}

// la scena della prova: misure in pixel, come lo schermo
function preparaScenaProva() {
    if (scenaProva) return;
    scenaProva = new THREE.Scene();
    scenaProva.environment = scena.environment;
    scenaProva.environmentIntensity = 0.9;
    const luce = new THREE.DirectionalLight(0xffffff, 1.5);
    luce.position.set(0, 1, 2);      // luce da davanti, un po' dall'alto
    scenaProva.add(luce);

    // camera "piatta" (ortografica): un pixel dello schermo = un'unità della scena
    cameraProva = new THREE.OrthographicCamera(0, 1, 0, -1, 0.1, 10000);
    cameraProva.position.z = 5000;

    // la forma della "testa invisibile": una sola, condivisa da tutte le persone
    formaTesta = new THREE.SphereGeometry(0.5, 32, 16);
    materialeTesta = new THREE.MeshBasicMaterial({ colorWrite: false });
}

// un "indossatore": l'occhiale per una persona.
//   perno = il punto tra gli occhi
//   adattamento = allunga o accorcia le stanghette (solo in profondità)
//   spostamento = l'occhiale centrato su quel punto
//   occlusore = una testa invisibile: non si vede, ma nasconde le stanghette che passano dietro il viso
function creaIndossatore(modello) {
    const perno = new THREE.Group();
    const adattamento = new THREE.Group();
    const spostamento = new THREE.Group();
    perno.add(adattamento);
    adattamento.add(spostamento);
    spostamento.add(modello);
    spostamento.position.copy(datiProva.centro).negate();

    const occlusore = new THREE.Mesh(formaTesta, materialeTesta);
    occlusore.renderOrder = -1;      // si disegna per primo
    perno.add(occlusore);

    perno.visible = false;
    scenaProva.add(perno);
    return { perno: perno, adattamento: adattamento, occlusore: occlusore };
}

// trova il frontale dell'occhiale (la parte davanti agli occhi): il suo centro e la sua larghezza
function misuraFronte(modello) {
    // un modello con una testa inclusa: la testa si nasconde, sul viso c'è già la tua
    const nascosti = [];
    modello.traverse(function(parte) {
        if (!parte.isMesh) return;
        const eTesta = [].concat(parte.material).some(function(m) { return /testa|head|volto|viso|face/i.test(m.name || ''); });
        if (eTesta) { parte.visible = false; nascosti.push(parte); }
    });

    // raccoglie i punti delle parti visibili (al massimo ~4000 per parte, basta per misurare)
    modello.updateMatrixWorld(true);
    const inversa = modello.matrixWorld.clone().invert();
    const tutto = new THREE.Box3();
    const punto = new THREE.Vector3();
    const punti = [];
    modello.traverse(function(parte) {
        if (!parte.isMesh || !parte.visible) return;
        const posizioni = parte.geometry.attributes.position;
        const matrice = new THREE.Matrix4().multiplyMatrices(inversa, parte.matrixWorld);
        const passo = Math.max(1, Math.floor(posizioni.count / 4000));
        for (let i = 0; i < posizioni.count; i += passo) {
            punto.fromBufferAttribute(posizioni, i).applyMatrix4(matrice);
            tutto.expandByPoint(punto);
            punti.push(punto.x, punto.y, punto.z);
        }
    });

    // il frontale è il 30% più avanti (la lente guarda verso +Z), senza le stanghette
    const soglia = tutto.max.z - (tutto.max.z - tutto.min.z) * 0.3;
    const fronte = new THREE.Box3();
    for (let i = 0; i < punti.length; i += 3) {
        if (punti[i + 2] >= soglia) fronte.expandByPoint(punto.set(punti[i], punti[i + 1], punti[i + 2]));
    }
    return {
        nascosti: nascosti,
        centro: fronte.getCenter(new THREE.Vector3()),
        larghezza: fronte.max.x - fronte.min.x,
        // quanto vanno indietro le stanghette, dal centro del frontale
        stanghette: Math.max(fronte.getCenter(new THREE.Vector3()).z - tutto.min.z, 0.0001)
    };
}

// da un punto di MediaPipe (0…1 sull'immagine della fotocamera) ai pixel del visore.
// Il video riempie il visore tagliando i bordi (come "object-fit: cover") ed è a specchio, come un selfie.
// Restituisce anche la profondità (z), nella stessa misura: così le distanze si misurano in 3D
// e non cambiano quando giri la testa.
function aSchermo(p, L, A) {
    const k = Math.max(L / video.videoWidth, A / video.videoHeight);
    const ox = (L - video.videoWidth * k) / 2;
    const oy = (A - video.videoHeight * k) / 2;
    return new THREE.Vector3(ox + (1 - p.x) * video.videoWidth * k, oy + p.y * video.videoHeight * k, p.z * video.videoWidth * k);
}

// da un viso trovato da MediaPipe: dove va l'occhiale, quanto grande, come girato
function misuraViso(punti, matrice, L, A) {
    const p = {};
    for (const nome in PUNTO) p[nome] = aSchermo(punti[PUNTO[nome]], L, A);

    // le misure di QUESTO viso (in pixel, in 3D)
    const larghezzaViso = p.tempiaA.distanceTo(p.tempiaB);
    const altezzaViso = p.fronte.distanceTo(p.mento);
    const centroOcchi = p.occhioA.clone().add(p.occhioB).multiplyScalar(0.5);
    const centroViso = p.fronte.clone().add(p.mento).multiplyScalar(0.5);

    // l'inclinazione della testa; a specchio cambiano verso la rotazione destra-sinistra e quella laterale
    const rotazione = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().fromArray(matrice));
    rotazione.set(rotazione.x, -rotazione.y, -rotazione.z, rotazione.w);

    return {
        posizione: new THREE.Vector3(centroOcchi.x, -centroOcchi.y, 0),   // nella scena la y va verso l'alto
        larghezzaViso: larghezzaViso,
        altezzaViso: altezzaViso,
        // quanto il centro del viso sta sotto (o sopra) gli occhi
        discesa: Math.hypot(centroViso.x - centroOcchi.x, centroViso.y - centroOcchi.y) * (centroViso.y > centroOcchi.y ? -1 : 1),
        rotazione: rotazione
    };
}

// mette l'occhiale di un indossatore su un viso
function appoggia(indossatore, viso) {
    // 1. larghezza: il frontale di QUESTO modello diventa largo quanto il viso
    const scala = viso.larghezzaViso * FRONTALE_SU_VISO / datiProva.larghezza;

    // misure del viso nelle unità dell'occhiale (dentro il perno)
    const larghezzaLocale = viso.larghezzaViso / scala;
    const altezzaLocale = viso.altezzaViso / scala;

    // 2. stanghette: lunghe fino alle orecchie di questa testa (entro un minimo e un massimo)
    const allungamento = THREE.MathUtils.clamp(larghezzaLocale * STANGHETTE_SU_VISO / datiProva.stanghette, STANGHETTE_MIN, STANGHETTE_MAX);
    indossatore.adattamento.scale.z += (allungamento - indossatore.adattamento.scale.z) * 0.3;

    // 3. la testa invisibile prende la forma di questo viso
    indossatore.occlusore.scale.set(larghezzaLocale * 0.95, altezzaLocale * 1.05, larghezzaLocale * 1.15);
    indossatore.occlusore.position.set(0, viso.discesa / scala, -larghezzaLocale * 0.6);

    // si avvicina a metà strada verso la nuova posizione: l'occhiale non trema
    // (se la persona è appena entrata nell'inquadratura, l'occhiale ci va subito)
    const perno = indossatore.perno;
    const fattore = perno.visible ? 0.5 : 1;
    perno.position.lerp(viso.posizione, fattore);
    perno.scale.lerp(new THREE.Vector3(scala, scala, scala), fattore);
    perno.quaternion.slerp(viso.rotazione, fattore);
    perno.visible = true;
}

// abbina ogni viso all'occhiale che era più vicino nel fotogramma prima:
// così, se due persone si muovono, ognuna tiene il suo occhiale e niente "salta"
function abbina(visi) {
    const coppie = [];
    visi.forEach(function(viso, v) {
        indossatori.forEach(function(indossatore, i) {
            if (indossatore.perno.visible) coppie.push({ v: v, i: i, d: indossatore.perno.position.distanceTo(viso.posizione) });
        });
    });
    coppie.sort(function(a, b) { return a.d - b.d; });

    const visoDi = new Array(indossatori.length).fill(-1);
    const visoUsato = new Array(visi.length).fill(false);
    coppie.forEach(function(c) {
        if (visoDi[c.i] !== -1 || visoUsato[c.v]) return;
        visoDi[c.i] = c.v;
        visoUsato[c.v] = true;
    });
    // i visi nuovi prendono un occhiale libero
    visi.forEach(function(viso, v) {
        if (visoUsato[v]) return;
        const libero = visoDi.findIndex(function(x, i) { return x === -1 && !indossatori[i].perno.visible; });
        const qualunque = libero !== -1 ? libero : visoDi.indexOf(-1);
        if (qualunque !== -1) { visoDi[qualunque] = v; visoUsato[v] = true; }
    });
    return visoDi;
}

// "1 persona", "3 persone"…
function aggiornaContatore(n) {
    if (n === personeViste) return;
    personeViste = n;
    contatore.textContent = n === 1 ? '1 persona' : n + ' persone';
    contatore.classList.toggle('nascosto', n === 0);
}

function cicloDellaProva() {
    if (!inProva) return;
    cicloProva = requestAnimationFrame(cicloDellaProva);

    // lavora solo quando la fotocamera ha un fotogramma nuovo (e non mentre guardi la foto)
    if (fotoMostrata || video.readyState < 2 || video.currentTime === ultimoTempoVideo) return;
    ultimoTempoVideo = video.currentTime;

    const L = visore.clientWidth;
    const A = visore.clientHeight;
    cameraProva.right = L;
    cameraProva.bottom = -A;
    cameraProva.updateProjectionMatrix();

    const risultato = rilevatore.detectForVideo(video, performance.now());
    const visi = risultato.faceLandmarks.map(function(punti, n) {
        return misuraViso(punti, risultato.facialTransformationMatrixes[n].data, L, A);
    });

    const visoDi = abbina(visi);
    indossatori.forEach(function(indossatore, i) {
        if (visoDi[i] === -1) indossatore.perno.visible = false;
        else appoggia(indossatore, visi[visoDi[i]]);
    });

    aggiornaContatore(visi.length);
    scritta.textContent = visi.length ? '' : 'Guarda verso la fotocamera';
    bottoneScatta.disabled = !visi.length;
    renderer.render(scenaProva, cameraProva);
}

async function avviaProva() {
    if (!modelloInScena || inProva) return;
    bottoneProva.disabled = true;
    avviso.textContent = '';

    try {
        scritta.textContent = 'Avvio fotocamera…';
        flusso = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        video.srcObject = flusso;
        await video.play();
        scritta.textContent = 'Preparo la prova…';
        await preparaRilevatore();
    } catch (errore) {
        console.error(errore);
        fermaProva();
        scritta.textContent = (errore && errore.name === 'NotAllowedError')
            ? 'Per provare l\'occhiale serve il permesso per la fotocamera'
            : 'Fotocamera non disponibile';
        return;
    }
    if (!finestra.open) { fermaProva(); return; }    // nel frattempo hai chiuso la finestra

    preparaScenaProva();
    datiProva = misuraFronte(modelloInScena);

    // un occhiale per ogni persona possibile: il primo è l'originale, gli altri sono copie leggere
    // (le copie condividono forme e materiali con l'originale: quasi non occupano memoria in più)
    indossatori = [];
    for (let i = 0; i < MAX_PERSONE; i++) {
        indossatori.push(creaIndossatore(i === 0 ? modelloInScena : modelloInScena.clone(true)));
    }

    personeViste = -1;
    aggiornaContatore(0);
    inProva = true;
    finestra.classList.add('in-prova');
    testoBottoneProva.textContent = 'Chiudi la prova';
    bottoneProva.disabled = false;
    bottoneScatta.disabled = true;
    scritta.textContent = 'Guarda verso la fotocamera';
    cicloDellaProva();
}

function fermaProva() {
    inProva = false;
    fotoMostrata = false;
    cancelAnimationFrame(cicloProva);
    ultimoTempoVideo = -1;

    // spegne davvero la fotocamera (si spegne anche la lucina)
    if (flusso) flusso.getTracks().forEach(function(traccia) { traccia.stop(); });
    flusso = null;
    video.srcObject = null;

    // via gli occhiali della prova (le copie non si "liberano": le forme sono quelle dell'originale)
    indossatori.forEach(function(indossatore) { scenaProva.remove(indossatore.perno); });
    indossatori = [];

    // l'occhiale originale torna nella scena normale, com'era
    if (datiProva) {
        datiProva.nascosti.forEach(function(parte) { parte.visible = true; });
        datiProva = null;
    }
    if (modelloInScena && scena && modelloInScena.parent !== scena) scena.add(modelloInScena);

    chiudiInstagram();     // chiude anche l'eventuale collegamento col telefono
    finestra.classList.remove('in-prova', 'con-foto');
    testoBottoneProva.textContent = 'Prova';
    bottoneProva.disabled = !modelloInScena;
    avviso.textContent = '';
    if (scritta.textContent === 'Guarda verso la fotocamera') scritta.textContent = '';
    if (renderer) disegna();
}

bottoneProva.addEventListener('click', function() {
    if (inProva) fermaProva();
    else avviaProva();
});


// ===== 7. lo scatto =====

function scatta() {
    // il lampo bianco (si toglie e si rimette la classe per farlo ripartire a ogni scatto)
    lampo.classList.remove('scattato');
    void lampo.offsetWidth;
    lampo.classList.add('scattato');

    const tela = renderer.domElement;
    renderer.render(scenaProva, cameraProva);     // ridisegna subito prima di copiarlo

    const foto = document.createElement('canvas');
    foto.width = tela.width;
    foto.height = tela.height;
    const ctx = foto.getContext('2d');

    // sotto: la fotocamera, a specchio e tagliata come nel visore
    const k = Math.max(foto.width / video.videoWidth, foto.height / video.videoHeight);
    const larghezzaVideo = video.videoWidth * k;
    const altezzaVideo = video.videoHeight * k;
    ctx.save();
    ctx.translate(foto.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, (foto.width - larghezzaVideo) / 2, (foto.height - altezzaVideo) / 2, larghezzaVideo, altezzaVideo);
    ctx.restore();

    // sopra: l'occhiale
    ctx.drawImage(tela, 0, 0);

    foto.toBlob(function(blob) {
        fotoBlob = blob;
        if (fotoScattata.src) URL.revokeObjectURL(fotoScattata.src);   // libera la foto precedente
        fotoScattata.src = URL.createObjectURL(blob);
        fotoMostrata = true;
        chiudiInstagram();     // Storia/Post e QR ripartono chiusi a ogni foto
        personeNelloScatto = Math.max(personeViste, 1);
        finestra.classList.add('con-foto');
    }, 'image/jpeg', 0.92);
}

bottoneScatta.addEventListener('click', scatta);

document.getElementById('bottone-rifai').addEventListener('click', function() {
    chiudiInstagram();
    fotoMostrata = false;
    avviso.textContent = '';
    finestra.classList.remove('con-foto');
});


// ===== 8. condividere: Instagram, WhatsApp, Telegram =====

function nomeFile() {
    return 'prova-occhiali-' + (voceInScena ? voceInScena.file.replace(/\.glb$/i, '') : 'foto') + '.jpg';
}

function scarica() {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(fotoBlob);
    link.download = nomeFile();
    link.click();
    setTimeout(function() { URL.revokeObjectURL(link.href); }, 1000);
}

async function condividi(canale) {
    if (!fotoBlob) return;

    // Instagram: prima si sceglie Storia o Post (vedi sezione 9)
    if (canale === 'instagram') {
        sceltaInstagram.hidden = !sceltaInstagram.hidden;
        return;
    }

    const file = new File([fotoBlob], nomeFile(), { type: 'image/jpeg' });
    const messaggio = (personeNelloScatto > 1 ? 'Guarda come ci stanno gli occhiali di ' : 'Guarda come mi stanno gli occhiali di ') + voceInScena.nome + '!';

    // su telefono (e su alcuni computer): si apre il menu di condivisione con la foto già allegata,
    // dove scegli l'app (Instagram, WhatsApp o Telegram)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ files: [file], text: messaggio });
            return;
        } catch (errore) {
            if (errore.name === 'AbortError') return;    // hai chiuso il menu: va bene così
        }
    }

    // sul computer un sito non può mandare una foto direttamente a un'app:
    // la foto si salva e si apre il canale, dove la alleghi tu
    scarica();
    const testo = encodeURIComponent(messaggio);
    const indirizzi = {
        whatsapp: 'https://wa.me/?text=' + testo,
        telegram: 'https://t.me/share/url?url=' + encodeURIComponent(location.href) + '&text=' + testo
    };
    window.open(indirizzi[canale], '_blank', 'noopener');
    avviso.textContent = 'La foto è stata salvata nei download: allegala nel messaggio.';
}

document.querySelectorAll('.canale[data-canale]').forEach(function(bottone) {
    bottone.addEventListener('click', function() { condividi(bottone.dataset.canale); });
});
document.getElementById('bottone-scarica').addEventListener('click', function() {
    if (fotoBlob) scarica();
});


// ===== 9. Instagram: Storia o Post =====
//
// Instagram → due bottoni: Storia e Post.
//   - sul TELEFONO: si apre subito il menu di condivisione con la foto, e il sito ricorda la scelta
//   - sul COMPUTER: compare un QR code. Il telefono lo legge, si collega DIRETTAMENTE al computer
//     e riceve la STESSA foto; poi un bottone la condivide su Instagram come Storia o Post.
//
// Il collegamento diretto usa WebRTC (libreria PeerJS): la foto passa dal computer al telefono
// senza essere salvata su nessun server. Il servizio gratuito di PeerJS serve solo a far "trovare"
// i due dispositivi all'inizio. Serve che il sito sia online con https (il telefono deve poterlo aprire).
//
// Nota: nessun sito può aprire Instagram direttamente sulla schermata "Storia": il bottone apre
// il menu di condivisione e lì si sceglie Instagram → Storia (o Post). Il sito lo ricorda all'utente.

const PEERJS = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
const LIBRERIA_QR = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
const NOMI_MODO = { storia: 'Storia', post: 'Post' };

const sceltaInstagram = document.getElementById('scelta-instagram');
const pannelloInstagram = document.getElementById('pannello-instagram');
const qrInstagram = document.getElementById('qr-instagram');
const qrTitolo = document.getElementById('qr-titolo');
const qrAzione = document.getElementById('qr-azione');
const statoInvio = document.getElementById('stato-invio');
const notaQr = document.getElementById('nota-qr');

let collegamento = null;      // il collegamento in attesa del telefono (uno solo alla volta)

// telefono o tablet (schermo touch, senza mouse)
const eTelefono = window.matchMedia('(hover: none) and (pointer: coarse)');

// carica uno script esterno una volta sola, solo quando serve
const scriptCaricati = {};
function caricaScript(indirizzo, nomeGlobale) {
    if (!scriptCaricati[indirizzo]) {
        scriptCaricati[indirizzo] = new Promise(function(risolvi, rifiuta) {
            const script = document.createElement('script');
            script.src = indirizzo;
            script.onload = function() { risolvi(window[nomeGlobale]); };
            script.onerror = function() { delete scriptCaricati[indirizzo]; rifiuta(new Error('script non caricato')); };
            document.head.appendChild(script);
        });
    }
    return scriptCaricati[indirizzo];
}

function chiudiCollegamento() {
    if (collegamento) collegamento.destroy();
    collegamento = null;
}

// richiude tutto quello che riguarda Instagram (nuova foto, rifai, fine prova)
function chiudiInstagram() {
    chiudiCollegamento();
    sceltaInstagram.hidden = true;
    pannelloInstagram.hidden = true;
    qrInstagram.innerHTML = '';
    document.querySelectorAll('.modo-instagram').forEach(function(b) { b.classList.remove('attivo'); });
}

document.querySelectorAll('.modo-instagram').forEach(function(bottone) {
    bottone.addEventListener('click', function() {
        document.querySelectorAll('.modo-instagram').forEach(function(b) { b.classList.toggle('attivo', b === bottone); });
        scegliModo(bottone.dataset.modo);
    });
});

async function scegliModo(modo) {
    if (!fotoBlob) return;
    const file = new File([fotoBlob], nomeFile(), { type: 'image/jpeg' });

    // sul telefono la foto è già qui: la schermata "Salva la foto → Apri Instagram" (vedi sezione 10)
    if (eTelefono.matches) {
        mostraFotoInstagram(file, modo, voceInScena ? voceInScena.nome : '');
        return;
    }

    // sul computer: QR code e collegamento diretto col telefono
    inviaAlTelefono(modo);
}

async function inviaAlTelefono(modo) {
    chiudiCollegamento();
    pannelloInstagram.hidden = false;
    qrInstagram.innerHTML = '';
    qrTitolo.textContent = modo === 'storia' ? 'Pubblica la storia dal telefono' : 'Pubblica il post dal telefono';
    qrAzione.textContent = modo === 'storia' ? 'Condividi come storia' : 'Condividi come post';
    statoInvio.textContent = 'Preparo il collegamento…';
    avviso.textContent = '';

    // su "localhost" o "127.0.0.1" (Live Server) il telefono non trova il sito: funziona quando è online
    const inLocale = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === 'file:';
    notaQr.textContent = inLocale
        ? 'Il telefono potrà aprire il codice quando il sito sarà pubblicato online (https): ora è aperto solo su questo computer.'
        : 'Tieni aperta questa pagina finché la foto non arriva sul telefono.';

    // la foto di adesso (se nel frattempo ne scatti un'altra, il collegamento si chiude)
    const blob = fotoBlob;
    const nome = nomeFile();
    const nomeOcchiale = voceInScena.nome;

    try {
        const [Peer, qrcode] = await Promise.all([caricaScript(PEERJS, 'Peer'), caricaScript(LIBRERIA_QR, 'qrcode')]);
        const peer = new Peer();
        collegamento = peer;

        // aspetta che il servizio di PeerJS dia un "numero" a questo computer
        const codice = await new Promise(function(risolvi, rifiuta) {
            peer.on('open', risolvi);
            peer.on('error', rifiuta);
        });
        if (collegamento !== peer) return;      // nel frattempo è stato chiuso

        // il QR contiene l'indirizzo del sito con il "numero" del computer e la scelta (storia o post)
        // il QR apre instagram.html: una pagina leggera, senza 3D (il sito intero bloccherebbe il telefono)
        const cartellaSito = location.origin + location.pathname.replace(/[^/]*$/, '');
        const link = cartellaSito + 'instagram.html?ricevi=' + encodeURIComponent(codice) + '&ig=' + modo;
        const qr = qrcode(0, 'M');
        qr.addData(link);
        qr.make();
        qrInstagram.innerHTML = qr.createSvgTag(4, 2);
        statoInvio.textContent = 'In attesa del telefono…';

        // il telefono si collega: gli mandiamo la foto
        peer.on('connection', function(connessione) {
            connessione.on('open', async function() {
                statoInvio.textContent = 'Telefono collegato: invio la foto…';
                connessione.send({ foto: await blob.arrayBuffer(), tipo: blob.type, nome: nome, modo: modo, occhiale: nomeOcchiale });
            });
            connessione.on('data', function(messaggio) {
                if (messaggio && messaggio.ricevuta) {
                    statoInvio.textContent = 'Foto arrivata sul telefono ✓ Continua da lì.';
                    statoInvio.classList.add('riuscito');
                }
            });
        });
        peer.on('error', function(errore) {
            console.error(errore);
            if (collegamento === peer) statoInvio.textContent = 'Il collegamento si è interrotto: premi di nuovo ' + NOMI_MODO[modo] + '.';
        });
    } catch (errore) {
        console.error(errore);
        statoInvio.textContent = 'Non è stato possibile preparare il collegamento. Controlla la connessione e riprova.';
    }
    statoInvio.classList.remove('riuscito');
}


// ===== 10. aprire il sito da un link =====

const parametri = new URLSearchParams(location.search);

// index.html?occhiale=camilasaraviaruiz.glb apre subito la finestra di quell'occhiale
const voceDaLink = MODELLI.find(function(voce) { return voce.file === parametri.get('occhiale'); });
if (voceDaLink) {
    document.querySelector('.sezione-galleria').scrollIntoView();
    apri(voceDaLink);
}

// ----- sul TELEFONO: la schermata "Instagram" -----
// Si apre in due casi:
//   - dal QR code (index.html?ricevi=...&ig=storia): la foto arriva dal computer
//   - dopo aver scelto Storia/Post sul telefono stesso: la foto è quella appena scattata
// Due passaggi: 1. la foto va nella galleria del telefono  2. si apre l'app di Instagram sulla fotocamera,
// dove si sceglie Storia o Post e si prende la prima foto della galleria.
// (Un sito non può consegnare la foto all'app insieme al link: Instagram lo permette solo alle app.)

const finestraRicevi = document.getElementById('finestra-ricevi');
const riceviFotoImg = document.getElementById('ricevi-foto');
const riceviStato = document.getElementById('ricevi-stato');
const riceviNota = document.getElementById('ricevi-nota');
const passiApp = document.getElementById('passi-app');
const bottoneSalva = document.getElementById('ricevi-salva');
const bottoneApri = document.getElementById('ricevi-apri');
const bottoneAltreApp = document.getElementById('ricevi-condividi');
const spiegazioneSalva = document.getElementById('spiegazione-salva');
const spiegazioneApri = document.getElementById('spiegazione-apri');

// che telefono è (cambia il modo di salvare la foto e di aprire l'app)
const eIPhone = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const eAndroid = /Android/i.test(navigator.userAgent);

let fotoInstagram = null;     // il file della foto da pubblicare
let modoInstagram = 'storia';

document.getElementById('ricevi-chiudi').addEventListener('click', function() { finestraRicevi.close(); });

// il link che apre l'app di Instagram sulla sua fotocamera (lì in basso si sceglie STORIA o POST)
function linkAppInstagram() {
    if (eAndroid) {
        // su Android: se l'app non c'è, si apre il sito di Instagram
        return 'intent://camera#Intent;scheme=instagram;package=com.instagram.android;S.browser_fallback_url=' +
            encodeURIComponent('https://www.instagram.com/') + ';end';
    }
    return 'instagram://camera';
}

// prepara la schermata con una foto (arrivata dal computer o scattata qui)
function mostraFotoInstagram(file, modo, nomeOcchiale) {
    fotoInstagram = file;
    modoInstagram = modo;
    const nome = NOMI_MODO[modo];

    document.getElementById('ricevi-etichetta').textContent = 'Instagram · ' + nome;
    if (nomeOcchiale) document.getElementById('ricevi-titolo').textContent = 'Occhiali di ' + nomeOcchiale;
    if (riceviFotoImg.src) URL.revokeObjectURL(riceviFotoImg.src);
    riceviFotoImg.src = URL.createObjectURL(file);
    riceviFotoImg.hidden = false;
    riceviStato.hidden = true;

    spiegazioneSalva.textContent = eIPhone
        ? 'Nel menu che si apre tocca «Salva immagine».'
        : 'La foto finisce nella galleria del telefono.';
    spiegazioneApri.textContent = 'In Instagram scegli ' + nome.toUpperCase() + ' in basso e prendi la prima foto della galleria.';
    bottoneApri.textContent = 'Apri Instagram';
    document.getElementById('passo-salva').classList.remove('fatto');
    document.getElementById('passo-apri').classList.remove('fatto');
    passiApp.hidden = false;
    bottoneAltreApp.hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
    riceviNota.textContent = '';

    if (!finestraRicevi.open) finestraRicevi.showModal();
}

// salva la foto nella galleria; restituisce false se hai chiuso il menu senza salvare
async function salvaFotoInstagram() {
    // su iPhone un sito non può salvare direttamente in Foto: si passa dal menu ("Salva immagine")
    if (eIPhone && navigator.canShare && navigator.canShare({ files: [fotoInstagram] })) {
        try {
            await navigator.share({ files: [fotoInstagram] });
        } catch (errore) {
            if (errore.name === 'AbortError') return false;
            console.error(errore);
        }
    } else {
        // Android (e gli altri): la foto si scarica e appare nella galleria
        const link = document.createElement('a');
        link.href = riceviFotoImg.src;
        link.download = fotoInstagram.name;
        link.click();
        await new Promise(function(r) { setTimeout(r, 700); });   // un attimo per far partire il salvataggio
    }
    document.getElementById('passo-salva').classList.add('fatto');
    return true;
}

// 1. solo salva
bottoneSalva.addEventListener('click', function() {
    if (fotoInstagram) salvaFotoInstagram();
});

// 2. apre l'app di Instagram (se la foto non è ancora salvata, la salva prima: un tocco solo)
bottoneApri.addEventListener('click', async function() {
    if (!fotoInstagram) return;
    riceviNota.textContent = '';
    if (!document.getElementById('passo-salva').classList.contains('fatto')) {
        const salvata = await salvaFotoInstagram();
        if (!salvata) {
            riceviNota.textContent = 'Per metterla su Instagram, nel menu tocca «Salva immagine». Poi si apre l\'app.';
            return;
        }
    }
    document.getElementById('passo-apri').classList.add('fatto');

    // se dopo un attimo la pagina è ancora qui (e non in secondo piano), l'app non si è aperta
    let andatoVia = false;
    function quandoEsce() { if (document.hidden) andatoVia = true; }
    document.addEventListener('visibilitychange', quandoEsce);
    setTimeout(function() {
        document.removeEventListener('visibilitychange', quandoEsce);
        if (!andatoVia && !document.hidden) {
            riceviNota.textContent = 'Non riesco ad aprire l\'app di Instagram: è installata? Puoi aprirla tu e prendere la foto dalla galleria.';
        }
    }, 1800);

    window.location.href = linkAppInstagram();
});

// in più: il menu di condivisione del telefono, per chi preferisce
bottoneAltreApp.addEventListener('click', async function() {
    if (!fotoInstagram) return;
    try {
        await navigator.share({ files: [fotoInstagram] });
    } catch (errore) {
        if (errore.name !== 'AbortError') console.error(errore);
    }
});


