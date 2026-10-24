'use strict';
/* =====================================================================
   AVATAR 3D LOW-POLY PROCEDURAL DE FÉLIX (WAPPY IA) — THREE.JS (60 FPS)
   ---------------------------------------------------------------------
   Versión original Low-Poly (v1) con los dos ajustes exactos:
   1. Frente despejada (sin el bloque de cabello que invadía la frente).
   2. Barba completada por los lados de la quijada con el mismo estilo
      facetado plano de la chivera central, conectando hasta las patillas.
   ===================================================================== */

class WappyAvatar3D {
  constructor(o = {}) {
    this.t0 = o.t0 ?? 0;
    this.ancho = o.ancho ?? 680;
    this.alto = o.alto ?? 780;
    this.sableDesde = o.sableDesde ?? null;
    this.sableColor = o.sableColor ?? 0xc7f303;

    this.el = mk('div', 'L z5', o.parent || WORLD);
    this.el.style.width = this.ancho + 'px';
    this.el.style.height = this.alto + 'px';

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.ancho;
    this.canvas.height = this.alto;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.el.appendChild(this.canvas);

    if (typeof USAR !== 'undefined') USAR.voz = true;

    this._initThree();
  }

  _initThree() {
    if (typeof THREE === 'undefined') {
      console.error('Three.js no está cargado.');
      return;
    }

    const W = this.ancho, H = this.alto;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
    this.camera.position.set(0, 0.55, 6.2);
    this.camera.lookAt(0, 0.35, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(W, H, false);
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;

    // Iluminación de estudio con estética Low-Poly (flatShading)
    const amb = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(amb);

    const keyLight = new THREE.DirectionalLight(0xfff8eb, 1.35);
    keyLight.position.set(3.5, 5.0, 4.5);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x5bb8f5, 0.65);
    fillLight.position.set(-4.0, 2.0, 3.0);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xc7f303, 0.95);
    rimLight.position.set(0, 4.0, -4.5);
    this.scene.add(rimLight);

    // Materiales Low-Poly (flatShading: true para facetas tipo @elkis.dev / Claude Artifacts)
    const mat = (hex, extra = {}) => new THREE.MeshStandardMaterial({
      color: hex,
      roughness: extra.roughness ?? 0.55,
      metalness: extra.metalness ?? 0.08,
      flatShading: extra.flat ?? true,
      ...extra,
    });

    const mSkin = mat(0xe8a882, { roughness: 0.6 });
    const mSkinRosy = mat(0xd98768, { roughness: 0.6 });
    const mHair = mat(0x361e14, { roughness: 0.48 });
    const mBeard = mat(0x2b170e, { roughness: 0.65 });
    const mGlasses = mat(0x16181d, { roughness: 0.25, metalness: 0.3 });
    const mLens = new THREE.MeshPhysicalMaterial({
      color: 0xdff4ff,
      transparent: true,
      opacity: 0.24,
      roughness: 0.1,
      metalness: 0.1,
    });
    const mEyeWhite = mat(0xffffff, { flat: false, roughness: 0.2 });
    const mIris = mat(0x4a2511, { flat: false, roughness: 0.15 });
    const mPupil = mat(0x090a0c, { flat: false, roughness: 0.1 });
    const mJacket = mat(0x233554, { roughness: 0.55 });
    const mJacketTex = mat(0x1b2942, { roughness: 0.45 });
    const mOrange = mat(0xf28729, { roughness: 0.35, emissive: 0x3a1800 });
    const mWhite = mat(0xf4f4f0, { roughness: 0.4 });
    const mMouthIn = mat(0x3a0f14, { roughness: 0.8 });
    const mTongue = mat(0xd14b58, { roughness: 0.6 });

    // Raíz del personaje
    this.root = new THREE.Group();
    this.scene.add(this.root);

    // ===================================================================
    // 1. TORSO Y CHAQUETA DEPORTIVA AZUL MARINO WAPPY + LOGO "W:"
    // ===================================================================
    this.torso = new THREE.Group();
    this.torso.position.set(0, -0.55, 0);
    this.root.add(this.torso);

    // Cuerpo principal de la chaqueta
    const bodyGeo = new THREE.CylinderGeometry(0.68, 0.58, 1.38, 8);
    const bodyMesh = new THREE.Mesh(bodyGeo, mJacket);
    this.torso.add(bodyMesh);

    // Panel superior texturizado del pecho
    const chestGeo = new THREE.BoxGeometry(1.18, 0.46, 0.62);
    const chestMesh = new THREE.Mesh(chestGeo, mJacketTex);
    chestMesh.position.set(0, 0.32, 0.12);
    this.torso.add(chestMesh);

    // Cremallera central
    const zipGeo = new THREE.BoxGeometry(0.05, 1.36, 0.06);
    const zipMesh = new THREE.Mesh(zipGeo, mGlasses);
    zipMesh.position.set(0, 0, 0.58);
    this.torso.add(zipMesh);

    // Cuello deportivo con borde naranja y camiseta blanca interior
    const shirtGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.32, 8);
    const shirtMesh = new THREE.Mesh(shirtGeo, mWhite);
    shirtMesh.position.set(0, 0.72, 0.08);
    this.torso.add(shirtMesh);

    const collarGeo = new THREE.TorusGeometry(0.34, 0.075, 6, 10, Math.PI * 1.45);
    const collarMesh = new THREE.Mesh(collarGeo, mJacket);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.rotation.z = -Math.PI * 0.22;
    collarMesh.position.set(0, 0.68, 0.02);
    this.torso.add(collarMesh);

    // Cintura con franja naranja y blanca (como el avatar oficial)
    const hemOrange = new THREE.Mesh(new THREE.CylinderGeometry(0.60, 0.59, 0.07, 8), mOrange);
    hemOrange.position.set(0, -0.64, 0);
    this.torso.add(hemOrange);

    const hemWhite = new THREE.Mesh(new THREE.CylinderGeometry(0.605, 0.60, 0.04, 8), mWhite);
    hemWhite.position.set(0, -0.59, 0);
    this.torso.add(hemWhite);

    // Logo "W:" naranja en el pecho izquierdo
    const logoG = new THREE.Group();
    logoG.position.set(0.30, 0.34, 0.58);
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.19, 0.04), mOrange);
    bar1.position.set(-0.09, 0, 0); bar1.rotation.z = 0.18;
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.14, 0.04), mOrange);
    bar2.position.set(-0.03, -0.02, 0); bar2.rotation.z = -0.25;
    const bar3 = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.14, 0.04), mOrange);
    bar3.position.set(0.03, -0.02, 0); bar3.rotation.z = 0.25;
    const bar4 = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.19, 0.04), mOrange);
    bar4.position.set(0.09, 0, 0); bar4.rotation.z = -0.18;
    const dotTop = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), mOrange);
    dotTop.position.set(0.14, 0.09, 0.01);
    logoG.add(bar1, bar2, bar3, bar4, dotTop);
    this.torso.add(logoG);

    // Piernas y zapatillas blancas
    const legGeo = new THREE.CylinderGeometry(0.24, 0.19, 0.95, 7);
    const legL = new THREE.Mesh(legGeo, mJacket);
    legL.position.set(-0.27, -1.15, 0);
    const legR = new THREE.Mesh(legGeo, mJacket);
    legR.position.set(0.27, -1.15, 0);
    this.torso.add(legL, legR);

    const shoeGeo = new THREE.BoxGeometry(0.32, 0.20, 0.52);
    const shoeL = new THREE.Mesh(shoeGeo, mWhite);
    shoeL.position.set(-0.28, -1.68, 0.09);
    shoeL.rotation.y = 0.15;
    const shoeR = new THREE.Mesh(shoeGeo, mWhite);
    shoeR.position.set(0.28, -1.68, 0.09);
    shoeR.rotation.y = -0.15;
    this.torso.add(shoeL, shoeR);

    // ===================================================================
    // 2. BRAZOS ARTICULADOS + FRANJAS NARANJAS + SABLE LÁSER EN MANO
    // ===================================================================
    const crearBrazo = (lado) => {
      const s = lado === 'izq' ? -1 : 1;
      const pivote = new THREE.Group();
      pivote.position.set(s * 0.74, 0.48, 0);

      const hombro = new THREE.Mesh(new THREE.DodecahedronGeometry(0.23, 0), mJacket);
      pivote.add(hombro);

      const manga = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.15, 0.88, 7), mJacket);
      manga.position.set(s * 0.08, -0.44, 0);
      manga.rotation.z = s * 0.12;
      pivote.add(manga);

      // Franja naranja en la manga
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.86, 0.06), mOrange);
      stripe.position.set(s * 0.25, -0.44, 0);
      stripe.rotation.z = s * 0.12;
      pivote.add(stripe);

      // Puño naranja y blanco
      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.15, 0.08, 7), mOrange);
      cuff.position.set(s * 0.14, -0.88, 0);
      pivote.add(cuff);

      // Mano Low-Poly
      const mano = new THREE.Group();
      mano.position.set(s * 0.15, -1.04, 0.04);
      const palma = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), mSkin);
      const pulgar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.07), mSkin);
      pulgar.position.set(-s * 0.11, -0.02, 0.08);
      pulgar.rotation.z = s * 0.4;
      mano.add(palma, pulgar);
      pivote.add(mano);

      this.torso.add(pivote);
      return { pivote, mano };
    };

    this.brazoIzq = crearBrazo('izq');
    this.brazoDer = crearBrazo('der');

    // ===================================================================
    // 3. CABEZA ESTILIZADA CHIBI LOW-POLY (PROPORCIÓN DEL AVATAR OFICIAL)
    // ===================================================================
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.86, 0.05);
    this.root.add(this.headGroup);

    // Cráneo / Rostro Low-Poly original
    const headGeo = new THREE.BoxGeometry(1.52, 1.56, 1.36, 2, 2, 2);
    const pos = headGeo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const nx = v.x / 0.76, ny = v.y / 0.78, nz = v.z / 0.68;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 0) {
        const k = 0.68 + 0.32 / len;
        v.x *= k; v.y *= k; v.z *= k;
      }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    headGeo.computeVertexNormals();
    const headMesh = new THREE.Mesh(headGeo, mSkin);
    this.headGroup.add(headMesh);

    // Orejas
    const earGeo = new THREE.DodecahedronGeometry(0.22, 0);
    const earL = new THREE.Mesh(earGeo, mSkinRosy);
    earL.scale.set(0.55, 1.15, 0.7);
    earL.position.set(-0.78, -0.02, -0.02);
    const earR = earL.clone();
    earR.position.x = 0.78;
    this.headGroup.add(earL, earR);

    // Nariz facetada
    const noseGeo = new THREE.ConeGeometry(0.16, 0.30, 5);
    const noseMesh = new THREE.Mesh(noseGeo, mSkinRosy);
    noseMesh.rotation.x = Math.PI * 0.38;
    noseMesh.position.set(0, -0.02, 0.74);
    this.headGroup.add(noseMesh);

    // Cejas expresivas
    const browGeo = new THREE.BoxGeometry(0.38, 0.085, 0.09);
    this.browL = new THREE.Mesh(browGeo, mHair);
    this.browL.position.set(-0.33, 0.38, 0.68);
    this.browL.rotation.z = 0.08;
    this.browR = new THREE.Mesh(browGeo, mHair);
    this.browR.position.set(0.33, 0.38, 0.68);
    this.browR.rotation.z = -0.08;
    this.headGroup.add(this.browL, this.browR);

    // Ojos grandes con iris marrón, pupila y brillo
    const crearOjo = (x) => {
      const g = new THREE.Group();
      g.position.set(x, 0.14, 0.63);
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mEyeWhite);
      sclera.scale.set(1, 1.05, 0.6);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), mIris);
      iris.position.set(0, 0, 0.055);
      iris.scale.set(1, 1, 0.5);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mPupil);
      pupil.position.set(0, 0, 0.085);
      const shine = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), mEyeWhite);
      shine.position.set(0.038, 0.042, 0.11);
      g.add(sclera, iris, pupil, shine);
      this.headGroup.add(g);
      return g;
    };
    this.eyeL = crearOjo(-0.31);
    this.eyeR = crearOjo(0.31);

    // ===================================================================
    // 4. GAFAS NEGRAS RECTANGULARES DE MARCO GRUESO (ICONO DEL AVATAR)
    // ===================================================================
    this.glasses = new THREE.Group();
    this.glasses.position.set(0, 0.13, 0.74);
    this.headGroup.add(this.glasses);

    const crearMarcoGafa = (cx) => {
      const fg = new THREE.Group();
      fg.position.set(cx, 0, 0);
      const w = 0.54, h = 0.38, t = 0.055, d = 0.06;
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), mGlasses); top.position.y = h / 2;
      const bot = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), mGlasses); bot.position.y = -h / 2;
      const lft = new THREE.Mesh(new THREE.BoxGeometry(t, h, d), mGlasses); lft.position.x = -w / 2 + t / 2;
      const rgt = new THREE.Mesh(new THREE.BoxGeometry(t, h, d), mGlasses); rgt.position.x = w / 2 - t / 2;
      const lens = new THREE.Mesh(new THREE.PlaneGeometry(w - t, h - t), mLens);
      fg.add(top, bot, lft, rgt, lens);
      return fg;
    };
    const frameL = crearMarcoGafa(-0.33);
    const frameR = crearMarcoGafa(0.33);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.055, 0.06), mGlasses);
    bridge.position.set(0, 0.08, 0);
    const templeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.055, 0.68), mGlasses);
    templeL.position.set(-0.60, 0.06, -0.32);
    const templeR = templeL.clone();
    templeR.position.x = 0.60;
    this.glasses.add(frameL, frameR, bridge, templeL, templeR);

    // ===================================================================
    // 5. CABELLO LOW-POLY (SIN EL PELO EN LA FRENTE)
    // ===================================================================
    const hairG = new THREE.Group();
    this.headGroup.add(hairG);

    // Base superior y trasera retraída en Z (-0.16) para NO invadir la frente
    const topCap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.76, 1), mHair);
    topCap.scale.set(1.05, 0.64, 0.86);
    topCap.position.set(0, 0.62, -0.16);
    hairG.add(topCap);

    // Mechones superiores del copete (elevados sobre la línea de la frente para dejarla limpia)
    const mechones = [
      { x: -0.32, y: 0.90, z: 0.16, sx: 0.44, sy: 0.30, sz: 0.44, rz: 0.28 },
      { x: -0.02, y: 0.96, z: 0.18, sx: 0.48, sy: 0.32, sz: 0.46, rz: 0.15 },
      { x: 0.28,  y: 0.86, z: 0.14, sx: 0.40, sy: 0.26, sz: 0.42, rz: -0.14 },
      { x: -0.50, y: 0.78, z: 0.08, sx: 0.34, sy: 0.26, sz: 0.38, rz: 0.42 },
      { x: 0.50,  y: 0.72, z: 0.06, sx: 0.30, sy: 0.22, sz: 0.36, rz: -0.35 },
      { x: -0.68, y: 0.25, z: -0.04, sx: 0.18, sy: 0.52, sz: 0.48, rz: 0.08 },
      { x: 0.68,  y: 0.25, z: -0.04, sx: 0.18, sy: 0.52, sz: 0.48, rz: -0.08 },
    ];
    mechones.forEach(m => {
      const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 0), mHair);
      mesh.scale.set(m.sx, m.sy, m.sz);
      mesh.position.set(m.x, m.y, m.z);
      mesh.rotation.z = m.rz;
      hairG.add(mesh);
    });

    // ===================================================================
    // 6. BARBA LOW-POLY DE BAJO RELIEVE (MISMA ALTURA DE RELIEVE QUE EL BOSO)
    // ===================================================================
    const beardG = new THREE.Group();
    this.headGroup.add(beardG);

    // Función de superficie exacta de headGeo (Box 1.52 x 1.56 x 1.36 suavizado 2x2x2)
    // para que toda la barba (boso, chivera, quijada y patillas) tenga el mismo relieve bajo (~0.036)
    const gridPt = (ix, iy, iz) => {
      const x = ix * 0.76, y = iy * 0.78, z = iz * 0.68;
      const len = Math.sqrt(ix * ix + iy * iy + iz * iz);
      const k = len > 0 ? (0.68 + 0.32 / len) : 1;
      return new THREE.Vector3(x * k, y * k, z * k);
    };
    const axisLerp = (u) => {
      const cl = Math.max(-1, Math.min(1, u));
      return cl < 0 ? { i0: -1, i1: 0, t: cl + 1 } : { i0: 0, i1: 1, t: cl };
    };
    const surf = (ux, uy, uz, h = 0) => {
      const ax = axisLerp(ux), ay = axisLerp(uy), az = axisLerp(uz);
      const p = new THREE.Vector3();
      for (let dx = 0; dx <= 1; dx++) {
        const ix = dx ? ax.i1 : ax.i0;
        const wx = dx ? ax.t : (1 - ax.t);
        for (let dy = 0; dy <= 1; dy++) {
          const iy = dy ? ay.i1 : ay.i0;
          const wy = dy ? ay.t : (1 - ay.t);
          for (let dz = 0; dz <= 1; dz++) {
            const iz = dz ? az.i1 : az.i0;
            const wz = dz ? az.t : (1 - az.t);
            p.addScaledVector(gridPt(ix, iy, iz), wx * wy * wz);
          }
        }
      }
      const bulge = 0.011 * (4 * ax.t * (1 - ax.t) * ay.t * (1 - ay.t) + 4 * ay.t * (1 - ay.t) * az.t * (1 - az.t));
      const dir = p.clone().normalize();
      p.addScaledVector(dir, bulge + h);
      return p;
    };

    const beardVerts = [];
    const pushTri = (p1, p2, p3) => {
      beardVerts.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
    };
    // Añade una placa facetada Low-Poly con relieve uniforme hOut sobre la piel
    const addPlaca = (u00, u10, u11, u01, hOut = 0.036, hIn = -0.022, flip = false) => {
      const c00 = flip ? u10 : u00;
      const c10 = flip ? u00 : u10;
      const c11 = flip ? u01 : u11;
      const c01 = flip ? u11 : u01;
      const A = surf(c00[0], c00[1], c00[2], hOut);
      const B = surf(c10[0], c10[1], c10[2], hOut);
      const C = surf(c11[0], c11[1], c11[2], hOut);
      const D = surf(c01[0], c01[1], c01[2], hOut);
      const a = surf(c00[0], c00[1], c00[2], hIn);
      const b = surf(c10[0], c10[1], c10[2], hIn);
      const c = surf(c11[0], c11[1], c11[2], hIn);
      const d = surf(c01[0], c01[1], c01[2], hIn);
      // Cara frontal facetada
      pushTri(A, B, C); pushTri(A, C, D);
      // Biseles laterales de bajo relieve
      pushTri(a, b, B); pushTri(a, B, A);
      pushTri(b, c, C); pushTri(b, C, B);
      pushTri(c, d, D); pushTri(c, D, C);
      pushTri(d, a, A); pushTri(d, A, D);
    };

    for (const s of [-1, 1]) {
      const fl = s < 0;
      // 1. El Boso (bigote de bajo relieve)
      addPlaca(
        [0, -0.33, 1],
        [s * 0.44, -0.38, 1],
        [s * 0.42, -0.23, 1],
        [0, -0.19, 1],
        0.036, -0.02, fl
      );
      // 2. Bajante lateral del candado (une el boso con la chivera)
      addPlaca(
        [s * 0.31, -0.60, 1],
        [s * 0.45, -0.60, 1],
        [s * 0.44, -0.35, 1],
        [s * 0.31, -0.34, 1],
        0.035, -0.02, fl
      );
      // 3. Chivera central (mismo relieve bajo que el boso, dividida en 2 facetas Low-Poly)
      addPlaca(
        [0, -1.0, 1],
        [s * 0.25, -1.0, 1],
        [s * 0.24, -0.56, 1],
        [0, -0.55, 1],
        0.038, -0.02, fl
      );
      addPlaca(
        [s * 0.25, -1.0, 1],
        [s * 0.48, -1.0, 1],
        [s * 0.46, -0.57, 1],
        [s * 0.24, -0.56, 1],
        0.036, -0.02, fl
      );
      // 4. Quijada lateral baja (continúa la chivera con el mismo relieve rasurado dejando limpia la mejilla)
      addPlaca(
        [s * 0.48, -1.0, 1],
        [s * 0.76, -1.0, 1],
        [s * 0.76, -0.52, 1],
        [s * 0.46, -0.57, 1],
        0.035, -0.02, fl
      );
      addPlaca(
        [s * 0.76, -1.0, 1],
        [s * 1.0, -1.0, 1],
        [s * 1.0, -0.44, 1],
        [s * 0.76, -0.52, 1],
        0.035, -0.02, fl
      );
      // Cierre inferior bajo el mentón/quijada
      addPlaca(
        [0, -1.0, 0.55],
        [s * 0.50, -1.0, 0.55],
        [s * 0.50, -1.0, 1.0],
        [0, -1.0, 1.0],
        0.032, -0.02, fl
      );
      addPlaca(
        [s * 0.50, -1.0, 0.45],
        [s * 1.0, -1.0, 0.45],
        [s * 1.0, -1.0, 1.0],
        [s * 0.50, -1.0, 1.0],
        0.032, -0.02, fl
      );
      // 5. Patillas (borde frontal fino + cara lateral hasta las gafas, mismo relieve 0.034)
      addPlaca(
        [s * 0.80, -0.48, 1],
        [s * 1.0, -0.44, 1],
        [s * 1.0, -0.04, 1],
        [s * 0.84, -0.04, 1],
        0.034, -0.02, fl
      );
      addPlaca(
        [s * 0.84, -0.04, 1],
        [s * 1.0, -0.04, 1],
        [s * 1.0, 0.30, 1],
        [s * 0.86, 0.30, 1],
        0.034, -0.02, fl
      );
      // Cara lateral de la quijada y patilla (hacia la oreja)
      addPlaca(
        [s * 1.0, -1.0, 1.0],
        [s * 1.0, -1.0, 0.28],
        [s * 1.0, -0.44, 0.28],
        [s * 1.0, -0.44, 1.0],
        0.034, -0.02, fl
      );
      addPlaca(
        [s * 1.0, -0.44, 1.0],
        [s * 1.0, -0.44, 0.24],
        [s * 1.0, -0.04, 0.22],
        [s * 1.0, -0.04, 1.0],
        0.034, -0.02, fl
      );
      addPlaca(
        [s * 1.0, -0.04, 1.0],
        [s * 1.0, -0.04, 0.22],
        [s * 1.0, 0.32, 0.16],
        [s * 1.0, 0.32, 1.0],
        0.034, -0.02, fl
      );
    }

    const beardGeo = new THREE.BufferGeometry();
    beardGeo.setAttribute('position', new THREE.Float32BufferAttribute(beardVerts, 3));
    beardGeo.computeVertexNormals();
    const beardMesh = new THREE.Mesh(beardGeo, mBeard);
    beardG.add(beardMesh);

    // Boca con dientes superiores, lengua y mandíbula que se abre al hablar (Lip-Sync)
    this.mouthGroup = new THREE.Group();
    this.mouthGroup.position.set(0, -0.34, 0.66);
    this.headGroup.add(this.mouthGroup);

    this.mouthCav = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.12), mMouthIn);
    const teethTop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.055, 0.13), mWhite);
    teethTop.position.set(0, 0.055, 0.01);
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.045, 0.125), mTongue);
    tongue.position.set(0, -0.05, 0.01);
    this.mouthGroup.add(this.mouthCav, teethTop, tongue);
  }

  _aperturaBoca(t, hablando = true) {
    if (!hablando) return 0.15;
    if (typeof nivelVoz === 'function' && typeof VOZ !== 'undefined' && VOZ.length > 0) {
      const nv = nivelVoz(t);
      return clamp(0.15 + nv * 1.45, 0.12, 1.35);
    }
    const syllable = Math.max(0, Math.sin(t * 18) * 0.6 + Math.sin(t * 11.3) * 0.45);
    const pause = Math.sin(t * 1.9) > -0.65 ? 1 : 0.15;
    return 0.18 + syllable * pause * 0.95;
  }

  pintar(t, k = {}) {
    const op = k.o ?? 1;
    if (op <= 0.002 || t < this.t0 - 0.05) { off(this.el); return; }

    const pIn = P(t, this.t0, 0.62, E.spring);

    const micro = typeof microFloat === 'function'
      ? microFloat(t, 0.7, { ax: 4, ay: 6, ar: 0.6 })
      : { dx: 0, dy: Math.sin(t * 2.2) * 6, dr: 0 };

    put(this.el, {
      x: (k.x ?? 1470) + micro.dx,
      y: (k.y ?? 560) + (1 - pIn) * 45 + micro.dy,
      s: (k.s ?? 1) * lerp(0.75, 1, pIn),
      r: (k.r ?? 0) + micro.dr,
      o: clamp(pIn * 1.6) * op,
    });

    if (!this.renderer) return;

    const hablando = k.hablando !== false;
    const boca = this._aperturaBoca(t, hablando);

    this.root.position.y = Math.sin(t * 2.4) * 0.04;
    this.root.rotation.y = (k.giroY ?? -0.18) + Math.sin(t * 1.3) * 0.14;

    this.headGroup.rotation.x = Math.sin(t * 3.2) * 0.05 + (boca - 0.2) * 0.08;
    this.headGroup.rotation.y = Math.sin(t * 1.7 + 0.5) * 0.12;
    this.headGroup.rotation.z = Math.cos(t * 2.1) * 0.045;

    const blinkCycle = (t + 0.2) % 3.6;
    const blinkScale = (blinkCycle > 3.44 && blinkCycle < 3.56) ? 0.08 : 1.0;
    this.eyeL.scale.y = blinkScale;
    this.eyeR.scale.y = blinkScale;

    const browLift = (boca - 0.2) * 0.06;
    this.browL.position.y = 0.38 + browLift;
    this.browR.position.y = 0.38 + browLift;

    this.mouthGroup.scale.y = lerp(0.35, 1.45, clamp(boca));
    this.mouthGroup.scale.x = lerp(1.05, 0.88, clamp(boca * 0.6));

    // Movimiento orgánico y conversacional de brazos (sin sable láser)
    const gesticulando = hablando ? 1 : 0.3;
    this.brazoIzq.pivote.rotation.x = -0.20 + Math.sin(t * 2.3) * 0.16 * gesticulando + boca * 0.08;
    this.brazoIzq.pivote.rotation.z = -0.10 + Math.cos(t * 1.9) * 0.06;
    this.brazoDer.pivote.rotation.x = -0.22 - Math.sin(t * 2.8) * 0.18 * gesticulando - boca * 0.08;
    this.brazoDer.pivote.rotation.z = 0.10 + Math.sin(t * 2.1) * 0.06;

    this.renderer.render(this.scene, this.camera);
  }
}

window.WappyAvatar3D = WappyAvatar3D;
