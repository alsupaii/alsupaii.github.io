// alsupai 3D deneme 5: Samet'in masası, koltuktan bakış. Birimler metre.
// Beyaz L masa: uzun kenar 180 cm (60 cm derin), solda 60 cm genişliğinde kol ~35 cm öne çıkar, iç köşe kavisli.
// Soldaki kablo deliğinden (dik direk yok) iki amortisörlü kol: ortada kavisli 32" ekran, solda laptop.
// Üstte 120 cm raf (kitap, CD, gemi), solda büyük Taxi Driver posteri + küçük kartpostallar.
// Masada 7 devre kartı = 7 proje; her kartın boyu, şekli ve parçaları projenin içeriğine göre.
// Davet (neon yok): açılışta kamera yazıdan koltuğa iner, kartlar masaya dağıtılır, numaralı kâğıt bant,
// ekranda yapışkan not, karta gelince 32" ekranda o projenin dosyası. Üstüne gelince kamera karta yaklaşır.
// Performans: yalnız bir şey değişince çizilir.
import * as THREE from "./vendor/three.module.min.js";
import { RoomEnvironment } from "./vendor/addons/RoomEnvironment.js";
import { mergeGeometries } from "./vendor/addons/BufferGeometryUtils.js";
import { GLTFLoader } from "./vendor/addons/GLTFLoader.js";
import { P } from "./modeller.js";
import { DETAY } from "./detay.js";
// Renk seçenekleri (?renk=1..5): duvar, yazı, laptop ekran zemini. Samet seçince tek seçenek kalacak.
const PALET = { 0: ["#fbf1e2", "#c27f16", "#f6efe3"], 1: ["#d9d5cc", "#1f4d3a", "#ecebe6"], 2: ["#6f7352", "#f1e6cf", "#2e2f22"], 3: ["#2a3a47", "#e3a52b", "#1b252e"], 4: ["#2e2b29", "#e07b39", "#1c1a19"], 5: ["#e8dfcf", "#1d1b1a", "#f4efe6"] };
const RENK = PALET[new URLSearchParams(location.search).get("renk") || 2] || PALET[0];
const GENIS = location.search.includes("genis"); // yalnız açılış görünümünü sabit tutar (renk denemesi için)

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const dokunmatik = matchMedia("(pointer: coarse)").matches;
const canvas = document.getElementById("sahne");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(RENK[0]);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;
pmrem.dispose();

const camera = new THREE.PerspectiveCamera(46, 1, 0.02, 40);
const manager = new THREE.LoadingManager();
const tl = new THREE.TextureLoader(manager);
let kirli = true;
const ciz = () => { kirli = true; };
const kutuG = new THREE.BoxGeometry(1, 1, 1), silG = new THREE.CylinderGeometry(1, 1, 1, 24), kureG = new THREE.SphereGeometry(1, 16, 12);
function kutu(mat, x, y, z, w, h, d, par) { const b = new THREE.Mesh(kutuG, mat); b.scale.set(w, h, d); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; (par || scene).add(b); return b; }
function cubuk(mat, a, b, r, par) {
  const m = new THREE.Mesh(silG, mat), v = new THREE.Vector3().subVectors(b, a);
  m.scale.set(r, v.length(), r); m.position.copy(a).addScaledVector(v, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); m.castShadow = true; (par || scene).add(m); return m;
}
function kure(mat, p, r, par) { const m = new THREE.Mesh(kureG, mat); m.scale.setScalar(r); m.position.copy(p); m.castShadow = true; (par || scene).add(m); return m; }
function dikSil(mat, x, y, z, r, h, par) { const m = new THREE.Mesh(silG, mat); m.scale.set(r, h, r); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); m.castShadow = true; (par || scene).add(m); return m; } // ekseni kartın normali
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const mat = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.5 }, o || {}));

// ---------- oda ----------
function doku(ad, rep, srgb) {
  const t = tl.load("doku/" + ad + ".jpg", ciz);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const duvar = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), new THREE.MeshStandardMaterial({ color: RENK[0], map: doku("painted_plaster_wall-diff", [3, 1.25], true), normalMap: doku("painted_plaster_wall-nor", [3, 1.25]), normalScale: new THREE.Vector2(0.2, 0.2), roughness: 0.95 }));
duvar.position.set(0, 2.5, 0); duvar.receiveShadow = true; scene.add(duvar);
const zemin = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), new THREE.MeshStandardMaterial({ color: "#d9b691", map: doku("wood_floor-diff", [4, 2.6], true), roughness: 0.7 }));
zemin.rotation.x = -Math.PI / 2; zemin.position.z = 4; zemin.receiveShadow = true; scene.add(zemin);
kutu(mat("#f4ecdf", { roughness: 0.6 }), 0, 0.05, 0.008, 12, 0.1, 0.016);

// ---------- duvardaki büyük yazı (açılışta görünür, sonra kamera koltuğa iner) ----------
const yazi = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 0.775), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }));
yazi.position.set(0.15, 2.3, 0.002); scene.add(yazi);
function yaziCiz() {
  const c = document.createElement("canvas"); c.width = 2048; c.height = 512; const g = c.getContext("2d");
  g.fillStyle = g.strokeStyle = RENK[1]; g.lineWidth = 20; g.lineJoin = "round";
  g.font = '400 430px "Gochi Hand"'; g.textAlign = "center"; g.strokeText("alsupai", 1024, 370); g.fillText("alsupai", 1024, 370);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; yazi.material.map = t; yazi.material.needsUpdate = true;
}

// ---------- L masa ----------
const SAG = 1.08, MY = 0.75, TK = 0.028, IC_X = -0.3, ON_Z = 0.6, KOL_Z = 2.0, KAVIS = 0.18;
const BEYAZ = mat("#f3f1ec", { roughness: 0.45 }), AYAK = mat("#e6e3dc", { metalness: 0.25 });
{
  const s = new THREE.Shape();
  s.moveTo(-0.9, 0); s.lineTo(SAG, 0); s.lineTo(SAG, -ON_Z); s.lineTo(IC_X + KAVIS, -ON_Z);
  s.absarc(IC_X + KAVIS, -(ON_Z + KAVIS), KAVIS, Math.PI / 2, Math.PI, false);
  s.lineTo(IC_X, -KOL_Z); s.lineTo(-0.9, -KOL_Z); s.lineTo(-0.9, 0);
  const tabla = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: TK, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 24 }), BEYAZ);
  tabla.rotation.x = -Math.PI / 2; tabla.position.y = MY - TK; tabla.castShadow = tabla.receiveShadow = true; scene.add(tabla);
}
// L kolunu taşıyan tek kalın demir bacak: iç kenara yakın, koltuktan masanın altında görünür
{ const DEMIR = mat("#2b2a28", { metalness: 0.65, roughness: 0.38 });
  kutu(DEMIR, IC_X - 0.09, (MY - TK) / 2, 1.3, 0.09, MY - TK, 0.09); kutu(DEMIR, IC_X - 0.09, 0.012, 1.3, 0.34, 0.024, 0.2); kutu(DEMIR, IC_X - 0.09, MY - TK - 0.012, 1.3, 0.3, 0.024, 0.16); }
// sağ kısım: 4 bacak, aralarında çekmeceler ve altta yazıcı bölmesi
{ const x0 = 0.5, x1 = SAG - 0.03, z0 = 0.04, z1 = ON_Z - 0.04, H = MY - TK;
  [[x0, z0], [x0, z1], [x1, z0], [x1, z1]].forEach((a) => kutu(AYAK, a[0], H / 2, a[1], 0.04, H, 0.04));
  const GOVDE = mat("#ecebe6", { roughness: 0.5 }), cx = (x0 + x1) / 2, w = x1 - x0 - 0.04;
  kutu(GOVDE, cx, H - 0.006, (z0 + z1) / 2, w, 0.012, z1 - z0); kutu(GOVDE, cx, 0.28, (z0 + z1) / 2, w, 0.014, z1 - z0); kutu(GOVDE, cx, 0.06, (z0 + z1) / 2, w, 0.014, z1 - z0);
  kutu(GOVDE, cx, (0.28 + H) / 2, z0 + 0.01, w, H - 0.28, 0.012); // arka panel
  kutu(mat("#f5f4f0", { roughness: 0.4 }), cx, 0.635, z1 + 0.005, w - 0.01, 0.13, 0.016); // tek çekmece
  kutu(mat("#8f8b84", { metalness: 0.8, roughness: 0.3 }), cx, 0.635, z1 + 0.016, 0.12, 0.01, 0.01);
  kutu(GOVDE, cx, 0.565, (z0 + z1) / 2, w, 0.012, z1 - z0); // çekmece altı rafı
  const YAZICI = mat("#3a3936", { roughness: 0.45 }); kutu(YAZICI, cx, 0.16, (z0 + z1) / 2 + 0.03, 0.42, 0.18, 0.34); kutu(mat("#dcdad4"), cx, 0.255, (z0 + z1) / 2 + 0.06, 0.3, 0.01, 0.2); kutu(mat("#f7f6f2"), cx, 0.115, z1 - 0.02, 0.26, 0.004, 0.08); }
const DELIK = mat("#1a1817", { roughness: 0.6 });
const GROMMET = [V(-0.5, MY, 0.12), V(0.72, MY, 0.12)];
GROMMET.forEach((p) => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.004, 28), DELIK); h.position.copy(p).add(V(0, 0.002, 0)); h.receiveShadow = true; scene.add(h); });
cubuk(DELIK, V(0.72, MY, 0.12), V(0.72, 0.62, 0.06), 0.006);

// ---------- kollar: soldaki delikte taban, dik direk yok; iki amortisörlü kol ----------
const KOL = mat("#222120", { metalness: 0.45, roughness: 0.4 });
const TABAN = GROMMET[0].clone();
dikSil(KOL, TABAN.x, MY + 0.012, TABAN.z, 0.04, 0.012).rotation.x = 0;
cubuk(KOL, V(TABAN.x, MY + 0.005, TABAN.z), V(TABAN.x, MY + 0.07, TABAN.z), 0.022);
function amortisorlu(a, dirsek, bas) {
  cubuk(KOL, a, dirsek, 0.02); // gaz yaylı alt kol
  const yay = V(0, -0.026, 0); cubuk(KOL, a.clone().lerp(dirsek, 0.15).add(yay), a.clone().lerp(dirsek, 0.8).add(yay), 0.007);
  kure(KOL, dirsek, 0.026);
  cubuk(KOL, dirsek, bas, 0.016); kure(KOL, bas, 0.022);
}
const EKRAN_M = V(0.02, 1.15, 0.27), YAR = 1.5, ACI = 0.71 / YAR;
amortisorlu(V(TABAN.x, MY + 0.07, TABAN.z), V(-0.26, MY + 0.36, 0.08), V(EKRAN_M.x, EKRAN_M.y, EKRAN_M.z - 0.06));
kutu(KOL, EKRAN_M.x, EKRAN_M.y, EKRAN_M.z - 0.035, 0.1, 0.1, 0.02);
const CERCEVE = mat("#141313", { roughness: 0.4, side: THREE.DoubleSide });
const govde = new THREE.Mesh(new THREE.CylinderGeometry(YAR + 0.012, YAR + 0.012, 0.425, 40, 1, true, Math.PI - ACI / 2 - 0.006, ACI + 0.012), CERCEVE);
govde.position.set(EKRAN_M.x, EKRAN_M.y, EKRAN_M.z + YAR); govde.castShadow = true; scene.add(govde);
const ekranCan = document.createElement("canvas"); ekranCan.width = 1024; ekranCan.height = 576;
const ekranDoku = new THREE.CanvasTexture(ekranCan); ekranDoku.colorSpace = THREE.SRGBColorSpace; ekranDoku.anisotropy = 4;
ekranDoku.wrapS = THREE.RepeatWrapping; ekranDoku.repeat.x = -1; ekranDoku.offset.x = 1;
const ekran = new THREE.Mesh(new THREE.CylinderGeometry(YAR, YAR, 0.395, 40, 1, true, Math.PI - ACI / 2, ACI), new THREE.MeshBasicMaterial({ map: ekranDoku, toneMapped: false, side: THREE.BackSide }));
ekran.position.set(EKRAN_M.x, EKRAN_M.y + 0.006, EKRAN_M.z + YAR - 0.0005); scene.add(ekran);
const LAP = V(-0.62, 0.93, 0.3);
amortisorlu(V(TABAN.x, MY + 0.06, TABAN.z), V(-0.78, MY + 0.12, 0.1), V(LAP.x, LAP.y - 0.03, LAP.z));
const lap = new THREE.Group(); lap.position.copy(LAP); lap.rotation.set(0.7, 0.35, 0, "YXZ"); scene.add(lap); // taban öne doğru 40 derece aşağı
const ALU = mat("#b9b7b3", { metalness: 0.8, roughness: 0.35 });
kutu(KOL, 0, -0.012, 0, 0.34, 0.006, 0.25, lap); kutu(ALU, 0, 0, 0, 0.32, 0.016, 0.22, lap);
kutu(mat("#2a2927"), 0, 0.0085, 0.01, 0.27, 0.001, 0.1, lap); // klavye
const kapak = new THREE.Group(); kapak.position.set(0, 0.008, -0.11); kapak.rotation.x = -0.7; lap.add(kapak); // ekran dünyada dik; taban ile ekran arası 130 derece
kutu(ALU, 0, 0.105, -0.004, 0.32, 0.21, 0.008, kapak);
const lapCan = document.createElement("canvas"); lapCan.width = 512; lapCan.height = 320;
const lapDoku = new THREE.CanvasTexture(lapCan); lapDoku.colorSpace = THREE.SRGBColorSpace;
function lapCiz() { const g = lapCan.getContext("2d"); g.fillStyle = RENK[2]; g.fillRect(0, 0, 512, 320); g.fillStyle = RENK[1]; g.font = '400 120px "Gochi Hand"'; g.textAlign = "center"; g.fillText("alsupai", 256, 190); lapDoku.needsUpdate = true; }
const lapEkran = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.19), new THREE.MeshBasicMaterial({ map: lapDoku, toneMapped: false }));
lapEkran.position.set(0, 0.105, 0.0005); kapak.add(lapEkran);

// ---------- masadaki CD'ler (kolların yanında) ----------
const CDM = ["#2b2a33", "#7a2f2a", "#e9e2d2", "#21483f", "#c9a24a", "#3a3f5c", "#5b4a3a", "#9c8a6a"].map((c) => mat(c, { roughness: 0.35 }));
for (let k = 0; k < 5; k++) { const c = kutu(CDM[k], -0.28, MY + 0.006 + k * 0.0105, 0.13, 0.142, 0.01, 0.125); c.rotation.y = (k * 0.37) % 0.4 - 0.2; }

// ---------- raf ----------
const RAF_Y = 1.68, CEVIZ = mat("#f2f0eb", { roughness: 0.5 }); // beyaz raf
kutu(CEVIZ, IC_X + 0.6, RAF_Y, 0.11, 1.2, 0.025, 0.22);
[IC_X + 0.12, IC_X + 1.08].forEach((x) => kutu(CEVIZ, x, RAF_Y - 0.05, 0.08, 0.02, 0.09, 0.16));
const KITAP = ["#6b2d2a", "#24384d", "#c9b48a", "#2f4a33", "#8a6a3a", "#3b2f4f", "#d6cbb5", "#4a3a2a", "#7a7f6a"].map((c) => mat(c, { roughness: 0.7 }));
{ let x = IC_X + 0.04; for (let k = 0; k < 11; k++) { const h = 0.17 + ((k * 37) % 7) * 0.012, w = 0.022 + ((k * 13) % 4) * 0.006; kutu(KITAP[k % 9], x + w / 2, RAF_Y + 0.0125 + h / 2, 0.1, w, h, 0.15 + ((k * 7) % 3) * 0.015); x += w + 0.002; }
  const yat = kutu(KITAP[2], x + 0.03, RAF_Y + 0.02, 0.1, 0.17, 0.03, 0.13); yat.rotation.y = 0.1; }
{ let x = IC_X + 0.46; for (let k = 0; k < 14; k++) { kutu(CDM[k % 8], x, RAF_Y + 0.075, 0.08, 0.0105, 0.125, 0.142); x += 0.0112; } }
const GEMI_G = mat("#5a3a22", { roughness: 0.6 }), YELKEN = mat("#efe6d2", { roughness: 0.9, side: THREE.DoubleSide });
function gemi(x, olc, ry) {
  const g = new THREE.Group(); g.position.set(x, RAF_Y + 0.0125, 0.11); g.scale.setScalar(olc); g.rotation.y = ry; scene.add(g);
  const s = new THREE.Shape(); s.moveTo(-0.16, 0.06); s.quadraticCurveTo(-0.13, 0, -0.06, 0); s.lineTo(0.1, 0); s.quadraticCurveTo(0.17, 0.02, 0.2, 0.07); s.lineTo(-0.16, 0.06);
  const h = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 2 }), GEMI_G);
  h.position.z = -0.03; h.castShadow = true; g.add(h);
  kutu(GEMI_G, 0, 0.012, 0, 0.16, 0.024, 0.03, g);
  [[-0.08, 0.2], [0.02, 0.26], [0.11, 0.19]].forEach((d) => {
    cubuk(GEMI_G, V(d[0], 0.06, 0), V(d[0], 0.06 + d[1], 0), 0.004, g);
    [0.35, 0.65].forEach((f) => { const y = new THREE.Mesh(new THREE.PlaneGeometry(0.075 * (1.1 - f * 0.4), d[1] * 0.26), YELKEN); y.position.set(d[0], 0.06 + d[1] * f, 0.004); y.castShadow = true; g.add(y); });
  });
  cubuk(GEMI_G, V(0.19, 0.08, 0), V(0.27, 0.12, 0), 0.003, g);
}
gemi(IC_X + 0.8, 0.38, 0.2); // minyatür
{ // mavi-beyaz yelkenli: mavi gövde, beyaz şerit, tek direk, ana yelken + flok
  const g = new THREE.Group(); g.position.set(IC_X + 1.0, RAF_Y + 0.0125, 0.11); g.rotation.y = -0.25; scene.add(g);
  const MAVI = mat("#2a4f8a", { roughness: 0.4 }), AK = mat("#f4f2ec", { roughness: 0.6, side: THREE.DoubleSide });
  const s = new THREE.Shape(); s.moveTo(-0.11, 0.045); s.quadraticCurveTo(-0.09, 0, -0.03, 0); s.lineTo(0.07, 0); s.quadraticCurveTo(0.12, 0.012, 0.14, 0.05); s.lineTo(-0.11, 0.045);
  const h = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 2 }), MAVI); h.position.z = -0.0225; h.castShadow = true; g.add(h);
  kutu(AK, 0.015, 0.038, 0, 0.24, 0.008, 0.058, g); // beyaz şerit / güverte
  kutu(MAVI, 0, 0.01, 0, 0.1, 0.02, 0.025, g); // kaide
  cubuk(mat("#d9d4c8"), V(0.0, 0.05, 0), V(0.0, 0.3, 0), 0.0035, g);
  const ana = new THREE.Shape(); ana.moveTo(0, 0); ana.lineTo(0, 0.24); ana.lineTo(-0.1, 0); ana.lineTo(0, 0);
  const y1 = new THREE.Mesh(new THREE.ShapeGeometry(ana), AK); y1.position.set(-0.004, 0.055, 0); y1.castShadow = true; g.add(y1);
  const flok = new THREE.Shape(); flok.moveTo(0, 0); flok.lineTo(0, 0.2); flok.lineTo(0.09, 0); flok.lineTo(0, 0);
  const y2 = new THREE.Mesh(new THREE.ShapeGeometry(flok), AK); y2.position.set(0.006, 0.055, 0); y2.castShadow = true; g.add(y2);
}

// ---------- duvar: büyük Taxi Driver posteri + bantlı kartpostallar (yalnız yazı ve renkle özgün tasarım) ----------
const duvarCizim = [];
function asili(x, y, w, h, rz, cerceve, ciz) {
  const c = document.createElement("canvas"); c.width = 420; c.height = Math.round(420 * h / w);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.65 }));
  m.position.set(x, y, cerceve ? 0.0135 : 0.003); m.rotation.z = rz; m.receiveShadow = true; scene.add(m);
  if (cerceve) kutu(mat("#121110"), x, y, 0.006, w + 0.02, h + 0.02, 0.012);
  else [[-1, 1], [1, -1]].forEach((k) => { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.016), mat("#e9dcb8", { roughness: 0.9, transparent: true, opacity: 0.9 })); b.position.set(x + k[0] * w * 0.42, y + k[1] * h * 0.42, 0.0045); b.rotation.z = rz + k[0] * 0.7; scene.add(b); });
  duvarCizim.push(() => { ciz(c.getContext("2d"), c.width, c.height); t.needsUpdate = true; });
}
asili(-1.08, 1.36, 0.46, 0.66, 0, true, (g, w, h) => {
  g.fillStyle = "#151313"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#e0b229"; g.fillRect(0, h * 0.58, w, h * 0.1);
  for (let k = 0; k < 14; k++) { g.fillStyle = k % 2 ? "#151313" : "#e0b229"; g.fillRect(k * w / 14, h * 0.68, w / 14, 14); }
  g.fillStyle = "#f1ede4"; g.textAlign = "center"; g.font = '800 48px "Manrope"'; g.fillText("TAXI", w / 2, h * 0.84); g.fillText("DRIVER", w / 2, h * 0.84 + 50);
});
asili(-0.62, 1.6, 0.15, 0.105, 0.07, false, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0e1a33"); gr.addColorStop(1, "#2b2140"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,240,200,.8)"; for (let k = 0; k < 40; k++) g.fillRect((k * 97) % w, (k * 61) % (h * 0.5), 2, 2);
  g.fillStyle = "#d9b25a"; g.textAlign = "center"; g.font = '800 46px "Manrope"'; g.fillText("HARRY POTTER", w / 2, h * 0.72);
});
resimKart(-0.45, 1.64, 0.13, 0.13, 0.05, "doku/sakin.jpg"); // Sakin: Samet'in gönderdiği görsel

function resimKart(x, y, w, h, rz, yol) { // bantlı kartpostal, görsel dosyadan
  const t = tl.load(yol, ciz); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.65 }));
  m.position.set(x, y, 0.003); m.rotation.z = rz; m.receiveShadow = true; scene.add(m);
  [[-1, 1], [1, -1]].forEach((k) => { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.016), mat("#e9dcb8", { roughness: 0.9, transparent: true, opacity: 0.9 })); b.position.set(x + k[0] * w * 0.42, y + k[1] * h * 0.42, 0.0045); b.rotation.z = rz + k[0] * 0.7; scene.add(b); });
}

// ---------- devre kartları: her proje kendi kartı ----------
// x,y kart merkezine göre metre; kartlar gerçek boyun yaklaşık 2 katı (okunsun diye).
const KART = {
  telearm: { w: 0.22, h: 0.15, mask: "#0d454b", ad: [-0.035, -0.055, 0.016], p: [
    { t: "modul", x: -0.062, y: 0.028 }, { t: "ic", x: 0.026, y: 0.04, w: 0.026, h: 0.01, n: 14, ad: "PCA9685" },
    { t: "servo", x: 0.068, y: 0.0, n: 6 }, { t: "kap", x: -0.088, y: -0.042, r: 0.011, h: 0.024 }, { t: "jak", x: -0.098, y: -0.005 },
    { t: "jst", x: 0.03, y: -0.05, n: 4 }, { t: "pasif", x: 0.0, y: 0.008, n: 5 }] },
  spotify: { w: 0.15, h: 0.11, mask: "#0f5530", ad: [0, -0.044, 0.012], p: [
    { t: "modul", x: -0.038, y: 0.014 }, { t: "oled", x: 0.035, y: 0.016 }, { t: "buton", x: 0.012, y: -0.022 }, { t: "buton", x: 0.036, y: -0.022 }, { t: "buton", x: 0.06, y: -0.022 },
    { t: "usbc", x: -0.038, y: 0.052 }, { t: "pasif", x: -0.01, y: -0.02, n: 3 }] },
  ev: { w: 0.24, h: 0.14, mask: "#ebe6da", ad: [-0.07, -0.056, 0.014], p: [
    { t: "modul", x: -0.075, y: 0.022 }, { t: "kamera", x: -0.02, y: 0.03 },
    { t: "role", x: 0.03, y: 0.02 }, { t: "role", x: 0.062, y: 0.02 }, { t: "role", x: 0.094, y: 0.02 },
    { t: "klemens", x: 0.062, y: -0.035, n: 6 }, { t: "led", x: -0.02, y: -0.012 }, { t: "led", x: -0.008, y: -0.012 }, { t: "pasif", x: -0.03, y: -0.03, n: 4 }] },
  tab: { w: 0.16, h: 0.12, mask: "#121110", ad: [0.025, -0.046, 0.012], p: [
    { t: "din", x: -0.05, y: 0.022 }, { t: "ic", x: 0.03, y: 0.022, w: 0.022, h: 0.022, n: 8, ad: "MCU" }, { t: "usbc", x: 0.03, y: 0.056 },
    { t: "piyano", x: 0.0, y: -0.022 }, { t: "pasif", x: -0.05, y: -0.03, n: 3 }] },
  nilm: { w: 0.2, h: 0.13, mask: "#3a1d66", ad: [0.04, -0.05, 0.013], p: [
    { t: "ct", x: -0.065, y: 0.018 }, { t: "yarik", x: -0.028, y: 0.0 }, { t: "klemens", x: -0.072, y: -0.045, n: 2 },
    { t: "modul", x: 0.05, y: 0.022 }, { t: "ic", x: 0.0, y: 0.03, w: 0.012, h: 0.01, n: 4, ad: "OPA" }, { t: "ic", x: 0.004, y: -0.02, w: 0.014, h: 0.012, n: 8, ad: "ADC" },
    { t: "pasif", x: 0.045, y: -0.022, n: 4 }] },
  robot: { w: 0.22, h: 0.12, mask: "#9a4510", on: 0.05, ad: [-0.03, -0.047, 0.013], p: [
    { t: "ir", x: 0, y: 0.044, n: 5 }, { t: "sogutucu", x: 0.06, y: -0.012 }, { t: "header", x: -0.045, y: 0.004, n: 15 }, { t: "header", x: -0.045, y: -0.02, n: 15 },
    { t: "klemens", x: 0.088, y: -0.045, n: 2 }, { t: "pasif", x: 0.015, y: -0.03, n: 3 }] },
  sofra: { w: 0.17, h: 0.11, mask: "#142c54", ad: [-0.03, -0.043, 0.012], p: [
    { t: "header2", x: -0.01, y: 0.046, n: 20 }, { t: "soc", x: -0.02, y: 0.006 }, { t: "ic", x: 0.012, y: 0.006, w: 0.014, h: 0.01, n: 6, ad: "RAM" },
    { t: "eth", x: 0.07, y: -0.024 }, { t: "usba", x: 0.07, y: 0.014 }, { t: "sd", x: -0.077, y: 0.0 }, { t: "led", x: 0.04, y: -0.04 }] },
};
const ALTIN = "#d6b36c", KARA = "#241c15", PX = 2600; // doku: metre başına piksel
const M_ = { siyah: mat("#151311", { roughness: 0.55 }), krom: mat("#c9c5bd", { metalness: 0.9, roughness: 0.32 }), altin: mat(ALTIN, { metalness: 1, roughness: 0.3 }),
  kapak: mat("#8f8b84", { metalness: 0.6, roughness: 0.55 }), cam: new THREE.MeshPhysicalMaterial({ color: "#0d0f10", roughness: 0.08, clearcoat: 1 }),
  seramik: mat("#b49a74", { roughness: 0.6 }), krem: mat("#eee6d4", { roughness: 0.5 }), yesil: mat("#2f6b45", { roughness: 0.5 }), lacivert: mat("#1d2433", { roughness: 0.4 }),
  fr4: mat("#cdb98a", { roughness: 0.7 }), led: mat("#f0b23a", { emissive: "#f0a020", emissiveIntensity: 0.6 }), alu: mat("#a7a39b", { metalness: 0.8, roughness: 0.4 }) };
function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
const karis = (hex, o, h) => "#" + new THREE.Color(hex).lerp(new THREE.Color(h), o).getHexString();
function sekil(k) {
  const w = k.w, h = k.h, r = 0.006, ro = k.on || r, s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - ro); s.quadraticCurveTo(w / 2, h / 2, w / 2 - ro, h / 2); s.lineTo(-w / 2 + ro, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - ro);
  s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s;
}
// her parça: [genişlik, yükseklik] ayak izi; ciz(): dokuya ped + ipek; yap(): 3B
function parca(p, k, g, mg, ipek, grup, U, ref) {
  const X = (x) => (x + k.w / 2) * PX, Y = (y) => (k.h / 2 - y) * PX, L = (d) => d * PX;
  const ped = (x, y, w, h) => { g.fillStyle = ALTIN; g.fillRect(X(x - w / 2), Y(y + h / 2), L(w), L(h)); mg.fillRect(X(x - w / 2), Y(y + h / 2), L(w), L(h)); };
  const delik = (x, y, R) => { g.fillStyle = ALTIN; g.beginPath(); g.arc(X(x), Y(y), L(R), 0, 7); g.fill(); mg.beginPath(); mg.arc(X(x), Y(y), L(R), 0, 7); mg.fill(); g.fillStyle = KARA; g.beginPath(); g.arc(X(x), Y(y), L(R * 0.45), 0, 7); g.fill(); };
  const cerceve = (w, h, etiket) => { g.strokeStyle = g.fillStyle = ipek; g.lineWidth = 2; g.strokeRect(X(p.x - w / 2), Y(p.y + h / 2), L(w), L(h)); if (etiket) { g.font = '700 ' + Math.round(L(0.0042)) + 'px "Manrope"'; g.textAlign = "left"; g.fillText(etiket, X(p.x - w / 2), Y(p.y + h / 2) - 3); } };
  const x = p.x, y = p.y;
  switch (p.t) {
    case "modul": { // ESP32 modülü: kenar pedleri, metal kapak, anten bölgesi
      for (let i = 0; i < 9; i++) { ped(x - 0.019, y + 0.014 - i * 0.0042, 0.004, 0.0022); ped(x + 0.019, y + 0.014 - i * 0.0042, 0.004, 0.0022); }
      cerceve(0.038, 0.052, ref("U"));
      kutu(M_.siyah, x, y, U + 0.001, 0.036, 0.05, 0.002, grup); kutu(M_.kapak, x, y - 0.006, U + 0.0045, 0.03, 0.034, 0.005, grup);
      kutu(mat("#2a2622"), x, y + 0.019, U + 0.0021, 0.034, 0.01, 0.0002, grup); break; }
    case "ic": { const n = p.n || 8; for (let i = 0; i < n; i++) { const f = (i + 0.5) / n - 0.5; ped(x + f * p.w, y + p.h / 2 + 0.002, p.w / n * 0.55, 0.004); ped(x + f * p.w, y - p.h / 2 - 0.002, p.w / n * 0.55, 0.004); }
      cerceve(p.w + 0.004, p.h + 0.008, ref("U"));
      kutu(M_.siyah, x, y, U + 0.0012, p.w, p.h, 0.0024, grup); [-1, 1].forEach((s) => kutu(M_.krom, x, y + s * (p.h / 2 + 0.0012), U + 0.0006, p.w * 0.95, 0.0024, 0.0008, grup));
      if (p.ad) { g.fillStyle = ipek; g.font = '700 ' + Math.round(L(0.0036)) + 'px "Manrope"'; g.textAlign = "center"; g.fillText(p.ad, X(x), Y(y - p.h / 2 - 0.009)); } break; }
    case "servo": { for (let i = 0; i < p.n; i++) { const yy = y + (i - (p.n - 1) / 2) * 0.012; for (let j = 0; j < 3; j++) delik(x - 0.005 + j * 0.005, yy, 0.0016); kutu(M_.siyah, x, yy, U + 0.004, 0.015, 0.0052, 0.008, grup); }
      cerceve(0.018, p.n * 0.012, ref("J")); g.font = '700 ' + Math.round(L(0.0035)) + 'px "Manrope"'; g.fillText("SERVO", X(x - 0.009), Y(y - p.n * 0.006) + 14); break; }
    case "kap": { delik(x, y, p.r * 0.25); cerceve(p.r * 2.1, p.r * 2.1, ref("C"));
      dikSil(M_.lacivert, x, y, U + p.h / 2, p.r, p.h, grup); dikSil(M_.alu, x, y, U + p.h + 0.0004, p.r * 0.92, 0.001, grup); break; }
    case "jak": { cerceve(0.02, 0.014, ref("J")); kutu(M_.siyah, x, y, U + 0.0055, 0.02, 0.014, 0.011, grup); break; }
    case "jst": { for (let i = 0; i < p.n; i++) { const xx = x + (i - (p.n - 1) / 2) * 0.014; ped(xx, y, 0.008, 0.005); kutu(M_.krem, xx, y, U + 0.003, 0.009, 0.006, 0.006, grup); } cerceve(p.n * 0.014, 0.008, ref("J")); break; }
    case "pasif": { const r = rng(Math.round((x + 1) * 1000)); for (let i = 0; i < p.n; i++) { const xx = x + (r() - 0.5) * 0.03, yy = y + (r() - 0.5) * 0.02, dik = r() > 0.5; const w = dik ? 0.0026 : 0.0045, h = dik ? 0.0045 : 0.0026;
      ped(xx - (dik ? 0 : 0.0022), yy - (dik ? 0.0022 : 0), 0.002, 0.002); ped(xx + (dik ? 0 : 0.0022), yy + (dik ? 0.0022 : 0), 0.002, 0.002); kutu(i % 2 ? M_.seramik : M_.siyah, xx, yy, U + 0.0008, w, h, 0.0016, grup); } break; }
    case "oled": { cerceve(0.05, 0.036, ref("DS")); for (let i = 0; i < 4; i++) delik(x - 0.006 + i * 0.004, y + 0.019, 0.0013);
      kutu(mat("#1b2a3a"), x, y, U + 0.002, 0.048, 0.034, 0.002, grup); const cm = kutu(M_.cam, x, y - 0.002, U + 0.0035, 0.044, 0.024, 0.0012, grup);
      const c = document.createElement("canvas"); c.width = 256; c.height = 128; const og = c.getContext("2d"); og.fillStyle = "#050607"; og.fillRect(0, 0, 256, 128); og.fillStyle = "#e9e0c8"; og.font = "700 22px Manrope"; og.fillText("Şimdi çalıyor", 14, 36); og.fillRect(14, 70, 150, 6); og.fillStyle = "#c27f16"; og.fillRect(14, 70, 90, 6); og.fillRect(14, 92, 34, 20); og.fillRect(60, 92, 34, 20); og.fillRect(106, 92, 34, 20);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.02), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); sc.position.set(x, y - 0.002, U + 0.0042); grup.add(sc); break; }
    case "buton": { cerceve(0.013, 0.013, ref("SW")); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((s) => ped(x + s[0] * 0.0065, y + s[1] * 0.0045, 0.0025, 0.0022));
      kutu(M_.siyah, x, y, U + 0.002, 0.012, 0.012, 0.004, grup); dikSil(M_.krem, x, y, U + 0.0055, 0.0042, 0.003, grup); break; }
    case "usbc": { cerceve(0.01, 0.008, ""); kutu(M_.krom, x, y, U + 0.0017, 0.009, 0.007, 0.0034, grup); break; }
    case "kamera": { cerceve(0.022, 0.022, ref("CAM")); kutu(M_.siyah, x, y, U + 0.0015, 0.02, 0.02, 0.003, grup); dikSil(M_.siyah, x, y, U + 0.005, 0.0055, 0.006, grup); dikSil(M_.cam, x, y, U + 0.0082, 0.0035, 0.0008, grup); break; }
    case "role": { cerceve(0.026, 0.02, ref("K")); for (let i = 0; i < 5; i++) delik(x - 0.01 + (i % 3) * 0.01, y + (i < 3 ? -0.007 : 0.007), 0.0013);
      kutu(mat("#1a1b1e"), x, y, U + 0.009, 0.024, 0.018, 0.018, grup); break; }
    case "klemens": { for (let i = 0; i < p.n; i++) { const xx = x + (i - (p.n - 1) / 2) * 0.01; delik(xx, y, 0.0018); kutu(M_.yesil, xx, y, U + 0.005, 0.0098, 0.012, 0.01, grup); dikSil(M_.krom, xx, y + 0.002, U + 0.0102, 0.0025, 0.0008, grup); } cerceve(p.n * 0.01, 0.013, ref("J")); break; }
    case "led": { ped(x - 0.002, y, 0.002, 0.002); ped(x + 0.002, y, 0.002, 0.002); kutu(M_.led, x, y, U + 0.0008, 0.0034, 0.0018, 0.0014, grup); break; }
    case "din": { cerceve(0.024, 0.024, ref("J")); for (let i = 0; i < 5; i++) { const a = Math.PI * (0.15 + i * 0.175); delik(x + Math.cos(a) * 0.006, y + Math.sin(a) * 0.006 - 0.002, 0.0011); }
      kutu(M_.siyah, x, y, U + 0.009, 0.022, 0.022, 0.018, grup); const d = new THREE.Mesh(silG, M_.krom); d.scale.set(0.0085, 0.006, 0.0085); d.position.set(x, y + 0.013, U + 0.009); grup.add(d);
      g.fillStyle = ipek; g.font = '700 ' + Math.round(L(0.0038)) + 'px "Manrope"'; g.textAlign = "center"; g.fillText("MIDI", X(x), Y(y - 0.016)); break; }
    case "piyano": { g.fillStyle = ipek; for (let i = 0; i < 14; i++) g.strokeRect(X(x - 0.042 + i * 0.006), Y(y + 0.008), L(0.006), L(0.016)); for (let i = 0; i < 13; i++) if ([0, 1, 3, 4, 5, 7, 8, 10, 11, 12].includes(i)) g.fillRect(X(x - 0.0375 + i * 0.006), Y(y + 0.008), L(0.0032), L(0.0095));
      for (let i = 0; i < 4; i++) { g.fillRect(X(x - 0.042), Y(y - 0.012 - i * 0.003), L(0.084), 1.5); } g.font = '700 ' + Math.round(L(0.0034)) + 'px "Manrope"'; g.textAlign = "left"; g.fillText("0  2  3  5", X(x - 0.03), Y(y - 0.0155)); break; }
    case "ct": { const tor = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0065, 14, 36), M_.siyah); tor.position.set(x, y, U + 0.0068); tor.castShadow = true; grup.add(tor);
      kutu(M_.siyah, x + 0.019, y - 0.008, U + 0.006, 0.012, 0.012, 0.012, grup); g.strokeStyle = ipek; g.lineWidth = 2; g.beginPath(); g.arc(X(x), Y(y), L(0.024), 0, 7); g.stroke();
      g.fillStyle = ipek; g.font = '700 ' + Math.round(L(0.0036)) + 'px "Manrope"'; g.textAlign = "center"; g.fillText("CT1", X(x), Y(y - 0.029)); break; }
    case "yarik": { g.fillStyle = "#0c0a08"; g.fillRect(X(x - 0.0015), Y(y + 0.045), L(0.003), L(0.09)); g.strokeStyle = ipek; g.setLineDash([6, 5]); g.lineWidth = 2; g.strokeRect(X(x - 0.004), Y(y + 0.048), L(0.008), L(0.096)); g.setLineDash([]);
      g.fillStyle = ipek; g.save(); g.translate(X(x + 0.008), Y(y)); g.rotate(-Math.PI / 2); g.font = '700 ' + Math.round(L(0.0034)) + 'px "Manrope"'; g.textAlign = "center"; g.fillText("YÜKSEK GERİLİM", 0, 0); g.restore(); break; }
    case "ir": { for (let i = 0; i < p.n; i++) { const xx = x + (i - (p.n - 1) / 2) * 0.024; g.strokeStyle = ipek; g.lineWidth = 2; g.strokeRect(X(xx - 0.006), Y(y + 0.0035), L(0.012), L(0.007)); ped(xx - 0.004, y - 0.007, 0.002, 0.002); ped(xx + 0.004, y - 0.007, 0.002, 0.002);
      kutu(M_.siyah, xx, y, U + 0.0032, 0.011, 0.006, 0.0064, grup); kure(mat("#2a2240"), V(xx - 0.0026, y, U + 0.0066), 0.0019, grup); kure(M_.cam, V(xx + 0.0026, y, U + 0.0066), 0.0019, grup); } break; }
    case "sogutucu": { cerceve(0.04, 0.03, ref("U")); kutu(M_.alu, x, y, U + 0.002, 0.036, 0.026, 0.004, grup); for (let i = 0; i < 6; i++) kutu(M_.alu, x - 0.015 + i * 0.006, y, U + 0.011, 0.0014, 0.026, 0.016, grup); break; }
    case "header": case "header2": { const sira = p.t === "header2" ? 2 : 1; for (let s = 0; s < sira; s++) for (let i = 0; i < p.n; i++) delik(x + (i - (p.n - 1) / 2) * 0.0051, y + s * 0.0051, 0.0015);
      cerceve(p.n * 0.0051, sira * 0.0051, ref("J")); kutu(M_.siyah, x, y + (sira - 1) * 0.00255, U + 0.0025, p.n * 0.0051, sira * 0.0051, 0.005, grup);
      const pin = new THREE.InstancedMesh(kutuG, M_.altin, p.n * sira), o = new THREE.Object3D(); let c = 0;
      for (let s = 0; s < sira; s++) for (let i = 0; i < p.n; i++) { o.position.set(x + (i - (p.n - 1) / 2) * 0.0051, y + s * 0.0051, U + 0.009); o.scale.set(0.0012, 0.0012, 0.009); o.updateMatrix(); pin.setMatrixAt(c++, o.matrix); }
      grup.add(pin); break; }
    case "soc": { cerceve(0.026, 0.026, ref("U")); for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) if ((i + j) % 3 === 0) ped(x - 0.011 + i * 0.0024, y - 0.011 + j * 0.0024, 0.0008, 0.0008);
      kutu(M_.siyah, x, y, U + 0.0012, 0.024, 0.024, 0.0024, grup); kutu(M_.alu, x, y, U + 0.0027, 0.018, 0.018, 0.0008, grup); break; }
    case "eth": { cerceve(0.032, 0.03, ref("J")); kutu(M_.krom, x, y, U + 0.0075, 0.03, 0.028, 0.015, grup); kutu(M_.siyah, x + 0.0151, y, U + 0.007, 0.0004, 0.016, 0.009, grup); break; }
    case "usba": { cerceve(0.03, 0.03, ref("J")); kutu(M_.krom, x, y, U + 0.0085, 0.028, 0.028, 0.017, grup); break; }
    case "sd": { cerceve(0.024, 0.022, ref("J")); kutu(M_.krom, x, y, U + 0.0009, 0.022, 0.02, 0.0018, grup); break; }
  }
}
function kartYap(p, i) {
  const k = KART[p.id], g = new THREE.Group();
  const TW = Math.round(k.w * PX), TH = Math.round(k.h * PX);
  const c = document.createElement("canvas"); c.width = TW; c.height = TH; const cg = c.getContext("2d");
  const m = document.createElement("canvas"); m.width = TW; m.height = TH; const mg = m.getContext("2d"); mg.fillStyle = "#000"; mg.fillRect(0, 0, TW, TH); mg.fillStyle = "#fff";
  const acik = new THREE.Color(k.mask).getHSL({}).l > 0.6, ipek = acik ? "#1b1714" : "#f4f1ea", r = rng(i + 7);
  cg.fillStyle = k.mask; cg.fillRect(0, 0, TW, TH);
  cg.fillStyle = karis(k.mask, 0.05, acik ? "#000" : "#fff"); cg.fillRect(TW * 0.03, TH * 0.04, TW * 0.94, TH * 0.92);
  // bakir yollar: her parcayi EN YAKIN komsusuyla, dik (Manhattan) ve koseleri yuvarlak baglar.
  // boylece izler kisa, yerel ve pad'lere oturur; eski capraz-sirali "orumcek agi" gider.
  cg.strokeStyle = karis(k.mask, 0.26, acik ? "#8a6a3a" : "#ffffff"); cg.lineCap = cg.lineJoin = "round";
  const X = (x) => (x + k.w / 2) * PX, Y = (y) => (k.h / 2 - y) * PX;
  const kalan = k.p.map((_, j) => j), sira = [kalan.shift()];
  while (kalan.length) {
    const son = k.p[sira[sira.length - 1]];
    let bi = 0, bd = Infinity;
    kalan.forEach((j, idx) => { const d = (k.p[j].x - son.x) ** 2 + (k.p[j].y - son.y) ** 2; if (d < bd) { bd = d; bi = idx; } });
    sira.push(kalan.splice(bi, 1)[0]);
  }
  const RR = 0.0045 * PX;
  for (let a = 0; a < sira.length - 1; a++) {
    const A = k.p[sira[a]], B = k.p[sira[a + 1]], yatay = Math.abs(B.x - A.x) >= Math.abs(B.y - A.y);
    for (let s = 0; s < 3; s++) {
      const o = (s - 1) * 0.0024;
      const ax = X(A.x + (yatay ? 0 : o)), ay = Y(A.y + (yatay ? o : 0));
      const bx = X(B.x + (yatay ? 0 : o)), by = Y(B.y + (yatay ? o : 0));
      const cx = yatay ? bx : ax, cy = yatay ? ay : by;
      cg.lineWidth = 2.4; cg.beginPath(); cg.moveTo(ax, ay); cg.arcTo(cx, cy, bx, by, RR); cg.lineTo(bx, by); cg.stroke();
    }
  }
  for (let v = 0; v < 12; v++) { const vx = (r() - 0.5) * k.w * 0.85, vy = (r() - 0.5) * k.h * 0.8; cg.fillStyle = ALTIN; cg.beginPath(); cg.arc(X(vx), Y(vy), 5, 0, 7); cg.fill(); mg.beginPath(); mg.arc(X(vx), Y(vy), 5, 0, 7); mg.fill(); cg.fillStyle = KARA; cg.beginPath(); cg.arc(X(vx), Y(vy), 2, 0, 7); cg.fill(); }
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((s) => { if (k.on && s[1] > 0) return; const x = s[0] * (k.w / 2 - 0.006), y = s[1] * (k.h / 2 - 0.006); cg.fillStyle = ALTIN; cg.beginPath(); cg.arc(X(x), Y(y), 11, 0, 7); cg.fill(); mg.beginPath(); mg.arc(X(x), Y(y), 11, 0, 7); mg.fill(); cg.fillStyle = KARA; cg.beginPath(); cg.arc(X(x), Y(y), 6, 0, 7); cg.fill(); });
  const sayac = {}, ref = (h) => h + (sayac[h] = (sayac[h] || 0) + 1);
  const U = 0.0016 + 0.0004;
  k.p.forEach((pp) => parca(pp, k, cg, mg, ipek, g, U, ref));
  cg.fillStyle = ipek; cg.font = "800 " + Math.round(k.ad[2] * PX) + 'px "Manrope"'; cg.textAlign = "center"; cg.textBaseline = "middle"; cg.fillText(p.short, X(k.ad[0]), Y(k.ad[1]));
  cg.font = '700 ' + Math.round(0.0038 * PX) + 'px "Manrope"'; cg.textAlign = "right"; cg.fillText("alsupai · " + String(i + 1).padStart(2, "0") + " · REV A", X(k.w / 2 - 0.012), Y(-k.h / 2 + 0.008));
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const met = new THREE.CanvasTexture(m);
  [map, met].forEach((t) => { t.repeat.set(1 / k.w, 1 / k.h); t.offset.set(0.5, 0.5); });
  const yuz = new THREE.MeshStandardMaterial({ map, metalnessMap: met, metalness: 1, roughness: 0.45 });
  const geo = new THREE.ExtrudeGeometry(sekil(k), { depth: 0.0032, bevelEnabled: false, curveSegments: 10 }); geo.translate(0, 0, -0.0016);
  const kart = new THREE.Mesh(geo, [yuz, M_.fr4]); kart.castShadow = kart.receiveShadow = true; g.add(kart);
  // kâğıt bant: numara + ad
  const bc = document.createElement("canvas"); bc.width = 512; bc.height = 128; const bg = bc.getContext("2d");
  bg.fillStyle = "#efe2bf"; bg.beginPath(); bg.moveTo(6, 10); for (let x = 6; x <= 506; x += 20) bg.lineTo(x, 8 + (x * 7 % 9)); bg.lineTo(506, 118); for (let x = 506; x >= 6; x -= 20) bg.lineTo(x, 116 + (x * 5 % 8)); bg.closePath(); bg.fill();
  bg.fillStyle = "#2a211b"; bg.textBaseline = "middle"; bg.font = '800 64px "Manrope"'; bg.fillText(String(i + 1).padStart(2, "0"), 26, 66);
  let fs = 50; bg.font = "700 " + fs + 'px "Manrope"'; while (bg.measureText(p.short).width > 340 && fs > 26) { fs -= 2; bg.font = "700 " + fs + 'px "Manrope"'; } bg.fillText(p.short, 140, 68);
  const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace; bt.anisotropy = 8;
  const bw = Math.min(0.13, k.w * 0.66), bant = new THREE.Mesh(new THREE.PlaneGeometry(bw, bw / 4), new THREE.MeshStandardMaterial({ map: bt, transparent: true, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -3 }));
  // bant sağ ön köşede, kartın üstünde: koyu maske üstünde okunur
  bant.position.set(k.w / 2 - bw / 2 + 0.004, -k.h / 2 + 0.004, 0.0019); bant.rotation.z = 0.06 * ((i % 3) - 1); bant.castShadow = true; g.add(bant);
  birlestir(g, true);
  g.traverse((o) => { if (o.isMesh) o.userData.i = i; });
  return g;
}
// Aynı malzemeli parçaları tek ağa birleştir: çizim çağrısı sayısı düşer (kasmanın ana sebebi).
function birlestir(ust, golge) {
  const gruplar = new Map();
  ust.children.slice().forEach((m) => {
    if (!m.isMesh || m.isInstancedMesh || Array.isArray(m.material) || m.material.transparent || m.children.length) return;
    if (!gruplar.has(m.material)) gruplar.set(m.material, []);
    gruplar.get(m.material).push(m);
  });
  gruplar.forEach((liste, malz) => {
    if (liste.length < 2) return;
    const geos = liste.map((m) => { m.updateMatrix(); let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrix); ["uv1", "uv2", "color"].forEach((a) => g.deleteAttribute(a)); return g; });
    const geo = mergeGeometries(geos, false); if (!geo) return;
    const yeni = new THREE.Mesh(geo, malz); yeni.castShadow = golge; yeni.receiveShadow = true; ust.add(yeni);
    liste.forEach((m) => ust.remove(m)); geos.forEach((g) => g.dispose());
  });
}
// ---- gerçek KiCad GLB kartı (akım = NILM): malzemeyi renge göre düzelt, birleştir, masaya prosedürel kart gibi otur ----
const GLB_MALZ = new Map();
function glbMalz(eski) {
  const hex = eski && eski.color ? eski.color.getHexString() : "888888";
  if (GLB_MALZ.has(hex)) return GLB_MALZ.get(hex);
  let p = { color: "#" + hex, metalness: 0, roughness: 0.45 };
  if (hex === "507c69") p = { color: "#173f2c", roughness: 0.3 };
  else if (hex === "adb393") p = { color: "#cfc6a0", roughness: 0.85 };
  else if (hex === "ffffff") p = { color: "#efede4", roughness: 0.8 };
  else if (hex === "dacd00") p = { color: "#d6aa3a", metalness: 1, roughness: 0.28 };
  else if (hex === "bcbcbc" || hex === "d2d1c7" || hex === "b0a998") p = { color: "#c9c7c0", metalness: 1, roughness: 0.32 };
  else if (hex === "151618" || hex === "262525") p = { color: "#" + hex, roughness: 0.55 };
  const m = new THREE.MeshStandardMaterial(p); GLB_MALZ.set(hex, m); return m;
}
function glbMerge(src, hedef) {
  const gruplar = new Map(), ters = new THREE.Matrix4().copy(hedef.matrixWorld).invert();
  src.updateWorldMatrix(true, true);
  src.traverse((o) => {
    if (!o.isMesh) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const ad of Object.keys(g.attributes)) if (ad !== "position" && ad !== "normal") g.deleteAttribute(ad);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(ters, o.matrixWorld));
    const m = glbMalz(o.material);
    if (!gruplar.has(m)) gruplar.set(m, []);
    gruplar.get(m).push(g);
  });
  hedef.remove(src);
  for (const [m, liste] of gruplar) { const mesh = new THREE.Mesh(mergeGeometries(liste, false), m); mesh.castShadow = mesh.receiveShadow = true; hedef.add(mesh); }
}
const glbYukle = (yol) => new Promise((ok, hata) => new GLTFLoader().load(yol, (gl) => ok(gl.scene), undefined, hata));
async function glbKart(p, i, dosya) {
  const k = KART[p.id], src = await glbYukle("kart/" + dosya + ".glb");
  const g = new THREE.Group(), wrap = new THREE.Group(); g.add(wrap); wrap.add(src);
  let bb = new THREE.Box3().setFromObject(src), s = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
  src.position.sub(c);
  const mn = Math.min(s.x, s.y, s.z);                 // ince eksen = kart normali -> Z'ye getir (XY düzlemi, parçalar +Z)
  if (mn === s.y) wrap.rotation.x = Math.PI / 2; else if (mn === s.x) wrap.rotation.y = -Math.PI / 2;
  g.updateMatrixWorld(true);
  bb = new THREE.Box3().setFromObject(wrap); s = bb.getSize(new THREE.Vector3());
  wrap.scale.setScalar((k.w * 0.98) / s.x);           // slot genişliğine ölçekle (iyi boyut)
  g.updateMatrixWorld(true);
  bb = new THREE.Box3().setFromObject(wrap); c = bb.getCenter(new THREE.Vector3());
  // x,y merkeze al; z'de TABANDAN otur (board arkasi masa duzleminde, parcalar yukari) -> masaya gommez
  wrap.position.x -= c.x; wrap.position.y -= c.y; wrap.position.z -= (bb.min.z + 0.001);
  g.updateMatrixWorld(true);
  glbMerge(wrap, g);
  // kâğıt bant: numara + ad (prosedürel kartla aynı)
  const bc = document.createElement("canvas"); bc.width = 512; bc.height = 128; const bg = bc.getContext("2d");
  bg.fillStyle = "#efe2bf"; bg.beginPath(); bg.moveTo(6, 10); for (let x = 6; x <= 506; x += 20) bg.lineTo(x, 8 + (x * 7 % 9)); bg.lineTo(506, 118); for (let x = 506; x >= 6; x -= 20) bg.lineTo(x, 116 + (x * 5 % 8)); bg.closePath(); bg.fill();
  bg.fillStyle = "#2a211b"; bg.textBaseline = "middle"; bg.font = '800 64px "Manrope"'; bg.fillText(String(i + 1).padStart(2, "0"), 26, 66);
  let fs = 50; bg.font = "700 " + fs + 'px "Manrope"'; while (bg.measureText(p.short).width > 340 && fs > 26) { fs -= 2; bg.font = "700 " + fs + 'px "Manrope"'; } bg.fillText(p.short, 140, 68);
  const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace; bt.anisotropy = 8;
  const bw = Math.min(0.13, k.w * 0.66), bant = new THREE.Mesh(new THREE.PlaneGeometry(bw, bw / 4), new THREE.MeshStandardMaterial({ map: bt, transparent: true, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -3 }));
  bant.position.set(k.w / 2 - bw / 2 + 0.004, -k.h / 2 + 0.004, 0.004); bant.rotation.z = 0.06 * ((i % 3) - 1); bant.castShadow = true; g.add(bant);
  g.traverse((o) => { if (o.isMesh) o.userData.i = i; });
  return g;
}
async function gercekKartlar() {
  const esle = { nilm: "akim" };                      // akım.glb = NILM (akım okuma kartı). prototip1 belirli bir projeye oturunca eklenir.
  for (const [id, dosya] of Object.entries(esle)) {
    const idx = P.findIndex((p) => p.id === id); if (idx < 0) continue;
    try {
      const g = await glbKart(P[idx], idx, dosya), r = raf[idx];
      if (!r) continue;
      scene.remove(r.g); r.g = g; r.gercek = true; scene.add(g);
      vurulan = []; raf.forEach((rr) => rr.g.traverse((o) => { if (o.isMesh) vurulan.push(o); }));
      kartKoy(r, idx); renderer.shadowMap.needsUpdate = true; ciz();
    } catch (e) { /* GLB yüklenmezse prosedürel kart kalır */ }
  }
}
// masadaki yerler (x, z, dönüş): 01-02 L kolunda, 03-07 ana tablanın önünde soldan sağa
const YER = [[-0.68, 1.02, 0.16], [-0.5, 0.74, -0.2], [-0.2, 0.45, 0.06], [0.07, 0.47, -0.1], [0.34, 0.44, 0.12], [0.62, 0.47, -0.08], [0.9, 0.32, 0.14]];
let raf = [], vurulan = [];
function kartlariKur() {
  raf.forEach((r) => scene.remove(r.g));
  raf = P.map((p, i) => { const g = kartYap(p, i), y = YER[i]; scene.add(g); return { g, k: KART[p.id], ev: { x: y[0], y: MY + 0.0017, z: y[1], rz: y[2] }, kalk: 0, dagit: reduce ? 1 : 0 }; });
  vurulan = []; raf.forEach((r) => r.g.traverse((o) => { if (o.isMesh) vurulan.push(o); }));
  raf.forEach((r, i) => kartKoy(r, i));
}
function kartKoy(r, i) {
  const e = 1 - Math.pow(1 - r.dagit, 3), k = r.kalk;
  r.g.position.set(r.ev.x + (1 - e) * (0.5 - i * 0.1), r.ev.y + (1 - e) * 0.45 + k * 0.05, r.ev.z + (1 - e) * 0.35 + k * 0.02);
  r.g.rotation.set(-Math.PI / 2 + k * 0.7, 0, r.ev.rz * (1 - k * 0.6) + (1 - e) * 1.2, "XYZ");
}

// ---------- yapışkan not ----------
const notCan = document.createElement("canvas"); notCan.width = notCan.height = 256;
const notM = new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.085), new THREE.MeshStandardMaterial({ roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }));
notM.position.set(EKRAN_M.x + 0.3, EKRAN_M.y - 0.17, EKRAN_M.z + (YAR - Math.sqrt(YAR * YAR - 0.09)) + 0.003); notM.rotation.set(0, -0.2, -0.08); scene.add(notM);
function notCiz() {
  const g = notCan.getContext("2d");
  g.fillStyle = "#f3d36b"; g.fillRect(0, 0, 256, 256); g.fillStyle = "rgba(0,0,0,.06)"; g.fillRect(0, 0, 256, 40);
  g.fillStyle = "#2a211b"; g.font = '400 50px "Gochi Hand"'; g.textAlign = "center"; g.fillText("kartlar =", 128, 100); g.fillText("projelerim", 128, 150);
  g.lineWidth = 6; g.strokeStyle = "#2a211b"; g.lineCap = "round"; g.beginPath(); g.moveTo(128, 175); g.lineTo(128, 236); g.moveTo(108, 214); g.lineTo(128, 238); g.lineTo(148, 214); g.stroke();
  const t = new THREE.CanvasTexture(notCan); t.colorSpace = THREE.SRGBColorSpace; notM.material.map = t; notM.material.needsUpdate = true;
}

// ---------- 32" ekran içeriği ----------
function ekranCiz(i) {
  const g = ekranCan.getContext("2d");
  g.fillStyle = "#17140f"; g.fillRect(0, 0, 1024, 576); g.fillStyle = "#221d16"; g.fillRect(0, 0, 1024, 40); g.fillRect(0, 40, 64, 536);
  g.font = '600 20px Consolas, "Courier New", monospace'; g.textBaseline = "middle";
  g.fillStyle = "#8a7a62"; g.fillText(i < 0 ? "masa.md" : "projeler/" + P[i].id + ".md", 84, 20);
  for (let k = 1; k <= 18; k++) { g.fillStyle = "#5c5040"; g.fillText(String(k).padStart(2, " "), 16, 40 + k * 28); }
  const sat = (k, renk, metin) => { g.fillStyle = renk; g.fillText(metin, 84, 40 + k * 28); };
  if (i < 0) {
    sat(1, "#c27f16", "# alsupai / Samet Can Oruç"); sat(2, "#d8cfc0", "Elektronik + yazılım.");
    sat(4, "#8a7a62", "// masadaki 7 devre kartı = 7 projem"); sat(5, "#8a7a62", "// birinin üstüne gel, burada açılır");
    P.forEach((p, k) => sat(7 + k, "#b9c98a", "- [" + String(k + 1).padStart(2, "0") + "] " + p.title));
  } else {
    const p = P[i];
    sat(1, "#c27f16", "# " + p.title); sat(2, "#d8cfc0", p.spoiler);
    sat(4, "#8a7a62", "tür:    " + p.year); sat(5, "#8a7a62", "teknik: " + p.tags.slice(0, 4).join(", ")); sat(6, "#8a7a62", "not:    " + p.meta);
    sat(8, "#b9c98a", "> tıkla: projeyi aç");
  }
  ekranDoku.needsUpdate = true;
}

// ---------- ışık ----------
scene.add(new THREE.HemisphereLight("#fff8ee", "#7a6250", 0.7));
const gunes = new THREE.DirectionalLight("#fff0dc", 2.4);
gunes.position.set(-2.2, 3.6, 3.4); gunes.target.position.set(0, MY, 0.5);
gunes.castShadow = true; gunes.shadow.mapSize.set(1024, 1024);
Object.assign(gunes.shadow.camera, { left: -1.8, right: 1.8, top: 1.8, bottom: -1.6, near: 1, far: 9 });
gunes.shadow.bias = -0.0004; gunes.shadow.normalBias = 0.01; gunes.shadow.radius = 3;
scene.add(gunes, gunes.target);

// ---------- kamera: açılışta yazı, sonra koltuk ----------
let dar = false, panHedef = -0.05, aktif = -1, giris = !reduce;
const kam = { px: 0.1, py: 2.05, pz: 4.4, lx: 0.1, ly: 1.75, lz: 0 }, hedef = { ...kam };
function hedefKur() {
  if (aktif >= 0) {
    const r = raf[aktif], c = r.ev, o = dar ? 0 : 0.08 + r.k.w * 0.55;
    const yuk = r.gercek ? 0.05 : 0;   // gerçek (GLB) kart büyük: çerçevede biraz yukarı kaldır ki panel örtmesin
    Object.assign(hedef, { px: c.x + o, py: MY + 0.42 + yuk, pz: c.z + 0.5, lx: c.x + o, ly: MY + 0.03 - yuk, lz: c.z - 0.03 });
    if (dar) { hedef.py = MY + 0.46 + yuk; hedef.pz = c.z + 0.48; hedef.ly = MY - 0.04 - yuk; }
  } else {
    const cx = dar ? panHedef : 0.42; // koltuk: göz ~1,22 m, sağa yakın, biraz geride; raf sağ ucundan görünür
    Object.assign(hedef, { px: cx, py: 1.22, pz: dar ? 2.25 : 2.1, lx: dar ? cx : 0.02, ly: 1.08, lz: 0.2 });
    if (GENIS) Object.assign(hedef, { px: 0.1, py: 2.05, pz: 4.4, lx: 0.1, ly: 1.75, lz: 0 });
  }
}
function boyut() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 1 ? 58 : 46; camera.updateProjectionMatrix();
  dar = camera.aspect < 1; hedefKur(); if (!giris) Object.assign(kam, hedef); ciz();
}
addEventListener("resize", boyut);

// ---------- etkileşim ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const kart = document.querySelector("[data-card]"), ipucu = document.querySelector("[data-hint]");
ipucu.lastChild.textContent = dokunmatik ? "Elektronik + yazılım. Masadaki her devre kartı bir projem, birine dokun." : "Elektronik + yazılım. Masadaki her devre kartı bir projem, üstüne gel.";
function vur(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const h = ray.intersectObjects(vurulan, false)[0];
  return h ? h.object.userData.i : -1;
}
function ac(i) {
  if (i === aktif) return;
  aktif = i; hedefKur(); ekranCiz(i); ciz();
  if (i < 0) { kart.classList.remove("on"); ipucu.style.opacity = 1; canvas.style.cursor = "default"; return; }
  const p = P[i], dl = kart.querySelector("[data-d]");
  kart.querySelector("[data-k]").textContent = "ALSUPAI · KART " + String(i + 1).padStart(2, "0");
  kart.querySelector("[data-t]").textContent = p.title;
  kart.querySelector("[data-s]").textContent = p.spoiler;
  dl.textContent = "";
  [["Tür", p.year], ["Teknik", p.tags.slice(0, 3).join(", ")], ["Not", p.meta]].forEach((s) => { const dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = s[0]; dd.textContent = s[1]; dl.append(dt, dd); });
  kart.querySelector("[data-a]").href = "#" + p.id;
  kart.classList.add("on"); ipucu.style.opacity = 0; canvas.style.cursor = "pointer";
}
let kapat = 0;
const kapatPlanla = () => { clearTimeout(kapat); kapat = setTimeout(() => ac(-1), 300); };
const kapatIptal = () => clearTimeout(kapat);
kart.addEventListener("pointerenter", kapatIptal);
// Fare gerçekten oynamadıysa (kart ya da kamera imlecin altından kaydıysa) kapanma.
const sonFare = { x: -1, y: -1 }, oynadi = (e) => Math.abs(e.clientX - sonFare.x) + Math.abs(e.clientY - sonFare.y) > 0.5;
addEventListener("pointermove", (e) => { sonFare.x = e.clientX; sonFare.y = e.clientY; }, true);
kart.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && oynadi(e) && vur(e) !== aktif) kapatPlanla(); });
kart.querySelector("[data-x]").addEventListener("click", () => ac(-1));
let surukle = null;
canvas.addEventListener("pointermove", (e) => {
  if (surukle && dar && aktif < 0) { panHedef = THREE.MathUtils.clamp(surukle.px - (e.clientX - surukle.x) / innerWidth * 1.0, -0.6, 0.55); if (Math.abs(e.clientX - surukle.x) > 6) surukle.oynadi = true; hedefKur(); ciz(); return; }
  if (e.pointerType !== "mouse" || giris || acikDetay >= 0) return;
  const i = vur(e);
  if (i >= 0) { kapatIptal(); if (i !== aktif) ac(i); } else if (aktif >= 0) kapatPlanla();
});
canvas.addEventListener("pointerdown", (e) => { surukle = { x: e.clientX, px: panHedef, oynadi: false }; });
canvas.addEventListener("pointerup", (e) => {
  const oy = surukle && surukle.oynadi; surukle = null;
  if (oy) return;
  const i = vur(e);
  if (e.pointerType !== "mouse") { ac(i); return; }
  if (i >= 0) detayAc(i);
});
canvas.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && aktif >= 0 && !kart.matches(":hover")) kapatPlanla(); });
addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (acikDetay >= 0) { if (e.key === "Escape") detayKapat(); else if (e.key === "ArrowRight" || e.key === "ArrowLeft") detayAc((acikDetay + (e.key === "ArrowRight" ? 1 : 6)) % 7, true); return; }
  if (e.key === "Escape") ac(-1);
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const d = e.key === "ArrowRight" ? 1 : -1; ac(aktif < 0 ? (d > 0 ? 0 : 6) : (aktif + d + 7) % 7); }
});
// ---------- proje ayrıntısı paneli (aynı sayfada) ----------
const panel = document.querySelector("[data-detay]");
let acikDetay = -1, bizAcdik = false;
const el = (etiket, sinif, metin) => { const e = document.createElement(etiket); if (sinif) e.className = sinif; if (metin != null) e.textContent = metin; return e; };
function bolum(baslik, icerik) { const b = el("section"); b.append(el("h3", null, baslik), icerik); return b; }
function liste2(dizi) { const u = el("ul"); dizi.forEach((x) => u.append(el("li", null, x))); return u; }
function detayDoldur(i) {
  const p = P[i], d = DETAY[i], govde = panel.querySelector("[data-govde]");
  panel.querySelector("[data-dk]").textContent = "KART " + String(i + 1).padStart(2, "0") + " / 07 · " + p.meta;
  panel.querySelector("[data-dt]").textContent = p.title;
  panel.querySelector("[data-dd]").textContent = d.desc;
  const gh = panel.querySelector("[data-dl]"); gh.hidden = !d.link; if (d.link) gh.href = d.link;
  govde.textContent = "";
  if (d.stats.length) { const o = el("div", "sayilar"); d.stats.forEach((x) => { const k = el("div"); k.append(el("b", null, x[0]), el("span", null, x[1])); o.append(k); }); govde.append(o); }
  if (d.did.length) govde.append(bolum("Ne yaptım", liste2(d.did)));
  if (d.specs.length) { const dl = el("dl"); d.specs.forEach((x) => dl.append(el("dt", null, x[0]), el("dd", null, x[1]))); govde.append(bolum("Teknik", dl)); }
  if (d.gallery.length) { const g = el("div", "galeri"); d.gallery.forEach((x) => { const src = "../img/proje/" + p.id + "/" + x[0], a = el("a"); a.href = src; a.target = "_blank"; a.rel = "noopener"; const im = el("img"); im.src = src; im.alt = x[1]; im.loading = "lazy"; const fc = el("figure"); fc.append(im, el("figcaption", null, x[1])); a.append(fc); g.append(a); }); govde.append(bolum("Fotoğraflar ve şemalar", g)); }
  if (d.lessons.length) govde.append(bolum("Zor kısımlar ve dersler", liste2(d.lessons)));
  panel.querySelector("[data-onceki]").textContent = "← " + P[(i + 6) % 7].short;
  panel.querySelector("[data-sonraki]").textContent = P[(i + 1) % 7].short + " →";
  document.title = p.title + " | alsupai";
}
function detayGoster(i) {
  acikDetay = i; detayDoldur(i); ac(i); kart.classList.remove("on");
  panel.hidden = false; requestAnimationFrame(() => panel.classList.add("on"));
  panel.scrollTop = 0; panel.querySelector("[data-kapat]").focus({ preventScroll: true });
}
function detayAc(i, yerine) {
  if (yerine && acikDetay >= 0) history.replaceState(null, "", "#" + P[i].id); else { history.pushState(null, "", "#" + P[i].id); bizAcdik = true; }
  detayGoster(i);
}
function detayGizle() {
  if (acikDetay < 0) return;
  acikDetay = -1; panel.classList.remove("on"); document.title = "alsupai";
  setTimeout(() => { if (acikDetay < 0) panel.hidden = true; }, 450);
  ac(-1);
}
function detayKapat() { if (bizAcdik) { bizAcdik = false; history.back(); } else { history.replaceState(null, "", location.pathname + location.search); detayGizle(); } }
function yol() { const i = P.findIndex((p) => "#" + p.id === location.hash); if (i >= 0) detayGoster(i); else { bizAcdik = false; detayGizle(); } }
addEventListener("popstate", yol);
addEventListener("hashchange", yol);
if (location.hash) yol(); // #proje ile gelinirse ayrıntı açık başlasın
panel.querySelector("[data-kapat]").addEventListener("click", detayKapat);
panel.querySelector("[data-onceki]").addEventListener("click", () => detayAc((acikDetay + 6) % 7, true));
panel.querySelector("[data-sonraki]").addEventListener("click", () => detayAc((acikDetay + 1) % 7, true));
kart.querySelector("[data-a]").addEventListener("click", (e) => { e.preventDefault(); if (aktif >= 0) detayAc(aktif); });

const liste = document.querySelector("[data-liste]");
P.forEach((p) => { const a = document.createElement("a"); a.href = "#" + p.id; a.textContent = p.title + ": " + p.spoiler; liste.append(a); });

const kartNokta = new THREE.Vector3();
function kartYeri() {
  if (aktif < 0 || dar) return;
  const k = raf[aktif].k;
  raf[aktif].g.localToWorld(kartNokta.set(k.w / 2 + 0.015, k.h / 2, 0)).project(camera);
  kart.style.left = Math.round(Math.min(innerWidth - 340, (kartNokta.x + 1) / 2 * innerWidth)) + "px";
  kart.style.top = Math.round(Math.max(80, Math.min(innerHeight - 420, (1 - kartNokta.y) / 2 * innerHeight - 40))) + "px";
}

// ---------- döngü ----------
const timer = new THREE.Timer(); timer.connect(document);
const yuk = document.querySelector("[data-yuk]");
let basla = -1;
manager.onLoad = () => { yuk.classList.add("bitti"); ciz(); };
boyut();
document.fonts.load('400 100px "Gochi Hand"').then(() => Promise.all([document.fonts.load('800 40px "Manrope"'), document.fonts.load('300 40px "Manrope"')])).then(() => {
  yaziCiz(); notCiz(); ekranCiz(-1); lapCiz(); duvarCizim.forEach((f) => f()); kartlariKur();
  gercekKartlar(); // NILM = gerçek akım.glb kartı (yüklenince prosedürel yerine geçer)
  renderer.compile(scene, camera); // ilk yakınlaşmada takılma olmasın
  basla = timer.getElapsed() + 1.1; renderer.shadowMap.needsUpdate = true; ciz();
});
birlestir(scene, true); // masa, raf, kitaplar, CD'ler, kollar
if (location.search.includes("debug")) { window.__s = { scene, renderer }; const r0 = renderer.render.bind(renderer); window.__rt = []; renderer.render = (a, b) => { const t = performance.now(); r0(a, b); window.__rt.push(performance.now() - t); }; }
renderer.shadowMap.needsUpdate = true;
let sonKare = 0, oncekiCizim = 0, kalite = 2, yavasSay = 0;
// Otomatik kalite: hareket sırasında kareler sürekli yavaşsa önce çözünürlüğü, sonra gölgeyi düşür.
const gl = renderer.getContext(), dbg = gl.getExtension("WEBGL_debug_renderer_info"), GPU = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "?";
function kaliteAyarla(k) {
  kalite = k;
  renderer.setPixelRatio(k === 2 ? Math.min(devicePixelRatio, 1.25) : k === 1 ? 1 : 0.75);
  renderer.shadowMap.enabled = k > 0; scene.traverse((o) => { if (o.material && !Array.isArray(o.material)) o.material.needsUpdate = true; });
  boyut();
}
if (/SwiftShader|llvmpipe|Basic Render|Software/i.test(GPU)) kaliteAyarla(0); // donanım hızlandırması kapalı
const olc = location.search.includes("olc") ? Object.assign(document.body.appendChild(document.createElement("div")), { style: "position:fixed;left:16px;top:64px;z-index:9;font:600 12px Consolas,monospace;color:#f1e6cf;background:rgba(0,0,0,.55);padding:6px 9px;border-radius:6px;max-width:60vw" }) : null;
let olcKare = 0, olcT = 0;
renderer.setAnimationLoop((zaman) => {
  if (zaman - sonKare < 15.5) return; // en çok ~60 kare/sn: 120-180 Hz ekranda boşa çizim yok
  sonKare = zaman;
  if (olc) { olcKare++; if (zaman - olcT > 1000) { olc.textContent = "GPU: " + GPU + " | " + Math.round(olcKare * 1000 / (zaman - olcT)) + " kare/sn (hareket varken) | kalite " + kalite; olcKare = 0; olcT = zaman; } }
  timer.update();
  const t = timer.getElapsed(), dt = Math.min(timer.getDelta(), 0.05);
  const k = reduce ? 1 : 1 - Math.pow(giris ? 0.12 : 0.002, dt);
  let hareket = false;
  if (giris && basla > 0 && t > basla - 0.5) { hedefKur(); }
  if (!(giris && (basla < 0 || t < basla - 0.5))) for (const a in hedef) if (Math.abs(hedef[a] - kam[a]) > 0.0005) { kam[a] += (hedef[a] - kam[a]) * k; hareket = true; }
  if (giris && basla > 0 && t > basla && !hareket) giris = false;
  if (giris) hareket = true;
  raf.forEach((r, i) => {
    let degisti = false;
    if (r.dagit < 1 && basla > 0 && t > basla + 0.6 + i * 0.16) { r.dagit = Math.min(1, r.dagit + dt / 0.55); degisti = true; }
    const hk = i === aktif ? 1 : 0;
    if (Math.abs(hk - r.kalk) > 0.002) { r.kalk += (hk - r.kalk) * (reduce ? 1 : 1 - Math.pow(0.002, dt)); degisti = true; }
    if (degisti) { kartKoy(r, i); hareket = true; renderer.shadowMap.needsUpdate = true; }
  });
  if (!hareket && !kirli) return;
  camera.position.set(kam.px, kam.py, kam.pz); camera.lookAt(kam.lx, kam.ly, kam.lz);
  kartYeri();
  renderer.render(scene, camera);
  kirli = false;
  // ardışık çizimler arası süre 40 ms'yi (25 kare/sn) sık sık geçiyorsa kaliteyi düşür
  if (zaman - oncekiCizim < 200) { if (zaman - oncekiCizim > 40) yavasSay++; else yavasSay = Math.max(0, yavasSay - 1); }
  oncekiCizim = zaman;
  if (yavasSay > 12 && kalite > 0) { yavasSay = 0; kaliteAyarla(kalite - 1); }
});

