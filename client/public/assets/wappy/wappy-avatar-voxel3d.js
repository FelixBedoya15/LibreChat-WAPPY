'use strict';
/* =====================================================================
   AVATAR 3D MINECRAFT VOXEL DE MAURICIO / FÉLIX (WAPPY IA) — THREE.JS
   ---------------------------------------------------------------------
   Fiel al diseño Voxel / Minecraft aprobado:
   - Geometría 100% cúbica Voxel (BoxGeometry) con sombreado nítido.
   - Camisa a cuadros amarilla y negra/azul marino abierta sobre camiseta blanca.
   - Bolsillo amarillo en el pecho con logo "W" en pixel-art negro.
   - Cabello pompadour escalonado en cubos Voxel (frente despejada).
   - Barba y bigote Voxel de bajo relieve y gafas negras rectangulares.
   - Animación a 60 fps: Lip-sync al hablar + gesto de señalar a la pantalla.
   ===================================================================== */

class WappyAvatarVoxel3D {
  constructor(o = {}) {
    this.ancho = o.ancho ?? 720;
    this.alto = o.alto ?? 780;

    this.el = document.createElement('div');
    this.el.style.width = this.ancho + 'px';
    this.el.style.height = this.alto + 'px';
    (o.parent || document.body).appendChild(this.el);

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.ancho;
    this.canvas.height = this.alto;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.el.appendChild(this.canvas);

    this._initThree();
  }

  _createPlaidTexture() {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');

    // Fondo amarillo brillante de la camisa a cuadros
    ctx.fillStyle = '#f5c71a';
    ctx.fillRect(0, 0, 64, 64);

    // Franjas secundarias mostaza/ámbar para textura tejida voxel
    ctx.fillStyle = '#d99f0b';
    for (let i = 0; i < 64; i += 16) {
      ctx.fillRect(i + 4, 0, 8, 64);
      ctx.fillRect(0, i + 4, 64, 8);
    }

    // Cuadrícula azul marino / negro profundo
    ctx.fillStyle = '#182032';
    for (let i = 0; i < 64; i += 16) {
      ctx.fillRect(i + 6, 0, 5, 64);
      ctx.fillRect(0, i + 6, 64, 5);
    }

    // Intersecciones oscuras más marcadas
    ctx.fillStyle = '#0e131f';
    for (let x = 0; x < 64; x += 16) {
      for (let y = 0; y < 64; y += 16) {
        ctx.fillRect(x + 5, y + 5, 6, 6);
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  _initThree() {
    const W = this.ancho, H = this.alto;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
    this.camera.position.set(0, 0.58, 6.95);
    this.camera.lookAt(0, 0.36, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(W, H, false);
    this.renderer.setPixelRatio(1);

    // Iluminación de estudio Raytraced Voxel
    const amb = new THREE.AmbientLight(0xffffff, 0.78);
    this.scene.add(amb);

    const keyLight = new THREE.DirectionalLight(0xfff6e5, 1.38);
    keyLight.position.set(3.8, 5.2, 4.8);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
    fillLight.position.set(-4.2, 2.2, 3.2);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xc7f303, 0.85);
    rimLight.position.set(0, 4.2, -4.5);
    this.scene.add(rimLight);

    const mat = (hex, extra = {}) => new THREE.MeshStandardMaterial({
      color: hex,
      roughness: extra.roughness ?? 0.52,
      metalness: extra.metalness ?? 0.06,
      flatShading: true,
      ...extra,
    });

    const plaidTex = this._createPlaidTexture();
    const mPlaid = new THREE.MeshStandardMaterial({
      map: plaidTex,
      roughness: 0.58,
      metalness: 0.04,
      flatShading: true,
    });

    const mSkin = mat(0xeab38f, { roughness: 0.55 });
    const mSkinShade = mat(0xd99b74, { roughness: 0.58 });
    const mHair = mat(0x3b2213, { roughness: 0.50 });
    const mHairLight = mat(0x4d2e1b, { roughness: 0.48 });
    const mBeard = mat(0x2d180c, { roughness: 0.62 });
    const mGlasses = mat(0x12141a, { roughness: 0.25, metalness: 0.25 });
    const mLens = new THREE.MeshPhysicalMaterial({
      color: 0xdff4ff,
      transparent: true,
      opacity: 0.20,
      roughness: 0.1,
    });
    const mWhite = mat(0xf8fafc, { roughness: 0.35 });
    const mYellowPocket = mat(0xf5c71a, { roughness: 0.45 });
    const mLogoDark = mat(0x111318, { roughness: 0.3 });
    const mEyeWhite = mat(0xffffff, { roughness: 0.2 });
    const mIris = mat(0x4a2511, { roughness: 0.18 });
    const mPupil = mat(0x0b0c0e, { roughness: 0.1 });
    const mMouthIn = mat(0x3a0f14, { roughness: 0.8 });
    const mTongue = mat(0xd9535f, { roughness: 0.6 });
    const mJeans = mat(0x365f8a, { roughness: 0.6 });
    const mJeansCuff = mat(0x6fa0c7, { roughness: 0.55 });

    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Helper para crear cubos Voxel rápidamente
    const addBox = (parent, w, h, d, material, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };

    // ===================================================================
    // 1. TORSO VOXEL: CAMISA A CUADROS AMARILLA/NEGRA + CAMISETA BLANCA
    // ===================================================================
    this.torso = new THREE.Group();
    this.torso.position.set(0, -0.58, 0);
    this.root.add(this.torso);

    // Camiseta blanca interior visible en el centro del pecho
    addBox(this.torso, 0.46, 1.34, 0.62, mWhite, 0, 0.02, 0.02);

    // Espalda y laterales de la camisa a cuadros
    addBox(this.torso, 1.32, 1.36, 0.44, mPlaid, 0, 0.0, -0.10);

    // Paneles frontales izquierdo y derecho de la camisa a cuadros abierta
    addBox(this.torso, 0.46, 1.36, 0.28, mPlaid, -0.43, 0.0, 0.24);
    addBox(this.torso, 0.46, 1.36, 0.28, mPlaid,  0.43, 0.0, 0.24);

    // Cuello escalonado tipo Voxel de la camisa
    addBox(this.torso, 0.26, 0.16, 0.24, mPlaid, -0.30, 0.72, 0.22);
    addBox(this.torso, 0.26, 0.16, 0.24, mPlaid,  0.30, 0.72, 0.22);
    addBox(this.torso, 0.34, 0.18, 0.16, mSkin,   0.00, 0.74, 0.06); // Cuello piel

    // Bolsillo amarillo Voxel en el pecho izquierdo con el logo "W" en píxeles negros
    const pocketG = new THREE.Group();
    pocketG.position.set(0.41, 0.16, 0.39);
    this.torso.add(pocketG);
    addBox(pocketG, 0.32, 0.30, 0.05, mYellowPocket, 0, 0, 0);
    addBox(pocketG, 0.22, 0.06, 0.05, mYellowPocket, 0, -0.17, 0); // Base escalonada del bolsillo

    // Píxeles negros formando la "W" de WAPPY dentro del bolsillo
    const px = 0.036;
    // Columnas de la W
    addBox(pocketG, px, px * 4, 0.03, mLogoDark, -px * 2.1, 0.01, 0.025);
    addBox(pocketG, px, px * 3, 0.03, mLogoDark,  0,        -0.01, 0.025);
    addBox(pocketG, px, px * 4, 0.03, mLogoDark,  px * 2.1, 0.01, 0.025);
    // Uniones inferiores de la W
    addBox(pocketG, px * 1.4, px, 0.03, mLogoDark, -px * 1.05, -px * 1.6, 0.025);
    addBox(pocketG, px * 1.4, px, 0.03, mLogoDark,  px * 1.05, -px * 1.6, 0.025);

    // Jeans azules Voxel y zapatillas blancas escalonadas
    addBox(this.torso, 1.22, 0.18, 0.58, mJeans, 0, -0.74, 0.02);
    addBox(this.torso, 0.50, 0.85, 0.52, mJeans, -0.31, -1.20, 0.02);
    addBox(this.torso, 0.50, 0.85, 0.52, mJeans,  0.31, -1.20, 0.02);
    addBox(this.torso, 0.54, 0.12, 0.56, mJeansCuff, -0.31, -1.58, 0.02);
    addBox(this.torso, 0.54, 0.12, 0.56, mJeansCuff,  0.31, -1.58, 0.02);
    addBox(this.torso, 0.50, 0.22, 0.64, mWhite, -0.31, -1.74, 0.08);
    addBox(this.torso, 0.50, 0.22, 0.64, mWhite,  0.31, -1.74, 0.08);

    // ===================================================================
    // 2. BRAZOS VOXEL CON MANGAS A CUADROS REMANGADAS Y DEDO SEÑALADOR
    // ===================================================================
    const crearBrazoVoxel = (lado) => {
      const s = lado === 'izq' ? -1 : 1;
      const pivote = new THREE.Group();
      pivote.position.set(s * 0.84, 0.50, 0.04);

      // Manga superior a cuadros
      addBox(pivote, 0.40, 0.62, 0.42, mPlaid, s * 0.04, -0.22, 0);

      // Dobladillo amarillo escalonado en el codo (manga remangada)
      addBox(pivote, 0.44, 0.14, 0.46, mYellowPocket, s * 0.04, -0.56, 0);
      addBox(pivote, 0.45, 0.04, 0.47, mLogoDark, s * 0.04, -0.56, 0);

      // Antebrazo cúbico piel
      const antebrazo = new THREE.Group();
      antebrazo.position.set(s * 0.04, -0.63, 0);
      pivote.add(antebrazo);

      addBox(antebrazo, 0.32, 0.38, 0.34, mSkin, 0, -0.19, 0);

      // Mano Voxel con pulgar y dedo índice articulado para señalar
      const mano = new THREE.Group();
      mano.position.set(0, -0.44, 0.02);
      antebrazo.add(mano);

      addBox(mano, 0.30, 0.24, 0.28, mSkin, 0, 0, 0);
      addBox(mano, 0.09, 0.14, 0.10, mSkinShade, -s * 0.17, 0.02, 0.08); // Pulgar

      // Dedo índice que sobresale al señalar el celular/pantalla
      const dedoIndice = addBox(mano, 0.09, 0.20, 0.09, mSkin, -s * 0.08, -0.16, 0.06);

      this.torso.add(pivote);
      return { pivote, antebrazo, mano, dedoIndice };
    };

    this.brazoIzq = crearBrazoVoxel('izq');
    this.brazoDer = crearBrazoVoxel('der');

    // ===================================================================
    // 3. CABEZA CÚBICA MINECRAFT VOXEL (PIEL, OREJAS, NARIZ, OJOS)
    // ===================================================================
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.86, 0.06);
    this.root.add(this.headGroup);

    // Cráneo cúbico Voxel principal
    addBox(this.headGroup, 1.54, 1.50, 1.34, mSkin, 0, 0.02, 0);

    // Orejas cúbicas Voxel
    addBox(this.headGroup, 0.16, 0.38, 0.26, mSkinShade, -0.84, 0.0, -0.02);
    addBox(this.headGroup, 0.16, 0.38, 0.26, mSkinShade,  0.84, 0.0, -0.02);

    // Nariz cúbica Voxel
    addBox(this.headGroup, 0.22, 0.20, 0.18, mSkinShade, 0, -0.04, 0.72);

    // Cejas rectangulares Voxel
    this.browL = addBox(this.headGroup, 0.38, 0.09, 0.08, mHair, -0.34, 0.39, 0.68);
    this.browR = addBox(this.headGroup, 0.38, 0.09, 0.08, mHair,  0.34, 0.39, 0.68);

    // Ojos cuadrados estilo Minecraft Voxel (Esclerótica blanca, iris café, pupila y brillo pixel)
    const crearOjoVoxel = (cx) => {
      const g = new THREE.Group();
      g.position.set(cx, 0.14, 0.67);
      addBox(g, 0.30, 0.22, 0.04, mEyeWhite, 0, 0, 0);
      addBox(g, 0.16, 0.18, 0.05, mIris, 0.01, -0.01, 0.01);
      addBox(g, 0.09, 0.11, 0.06, mPupil, 0.01, -0.01, 0.015);
      addBox(g, 0.045, 0.045, 0.065, mEyeWhite, 0.045, 0.04, 0.02);
      this.headGroup.add(g);
      return g;
    };
    this.eyeL = crearOjoVoxel(-0.33);
    this.eyeR = crearOjoVoxel(0.33);

    // ===================================================================
    // 4. GAFAS NEGRAS RECTANGULARES DE MARCO GRUESO VOXEL
    // ===================================================================
    this.glasses = new THREE.Group();
    this.glasses.position.set(0, 0.14, 0.74);
    this.headGroup.add(this.glasses);

    const crearMarcoGafaVoxel = (cx) => {
      const fg = new THREE.Group();
      fg.position.set(cx, 0, 0);
      const w = 0.58, h = 0.38, t = 0.065, d = 0.07;
      addBox(fg, w, t, d, mGlasses, 0, h / 2, 0);
      addBox(fg, w, t, d, mGlasses, 0, -h / 2, 0);
      addBox(fg, t, h, d, mGlasses, -w / 2 + t / 2, 0, 0);
      addBox(fg, t, h, d, mGlasses,  w / 2 - t / 2, 0, 0);
      const lens = new THREE.Mesh(new THREE.PlaneGeometry(w - t, h - t), mLens);
      fg.add(lens);
      return fg;
    };
    this.glasses.add(crearMarcoGafaVoxel(-0.34));
    this.glasses.add(crearMarcoGafaVoxel(0.34));
    addBox(this.glasses, 0.16, 0.065, 0.07, mGlasses, 0, 0.06, 0); // Puente
    addBox(this.glasses, 0.06, 0.065, 0.72, mGlasses, -0.64, 0.05, -0.34); // Patilla izq
    addBox(this.glasses, 0.06, 0.065, 0.72, mGlasses,  0.64, 0.05, -0.34); // Patilla der

    // ===================================================================
    // 5. CABELLO POMPADOUR VOXEL ESCALONADO (FRENTE DESPEJADA)
    // ===================================================================
    const hairG = new THREE.Group();
    this.headGroup.add(hairG);

    // Capas superiores escalonadas tipo Voxel (retraídas de la frente)
    addBox(hairG, 1.62, 0.24, 1.42, mHair, 0, 0.78, -0.02);
    addBox(hairG, 1.46, 0.18, 1.24, mHairLight, 0, 0.94, 0.02);
    addBox(hairG, 1.18, 0.14, 0.96, mHair, 0.04, 1.06, 0.06);
    // Mechones Voxel frontales del copete (sobre la línea de la frente y=0.68)
    addBox(hairG, 0.42, 0.16, 0.24, mHairLight, -0.28, 0.86, 0.62);
    addBox(hairG, 0.46, 0.20, 0.26, mHair,       0.06, 0.90, 0.64);
    addBox(hairG, 0.38, 0.14, 0.22, mHairLight,  0.42, 0.84, 0.60);
    // Laterales y nuca Voxel (sin z-fighting en el plano frontal z=0.67)
    addBox(hairG, 0.12, 0.72, 1.28, mHair, -0.79, 0.36, -0.04);
    addBox(hairG, 0.12, 0.72, 1.28, mHair,  0.79, 0.36, -0.04);
    addBox(hairG, 1.58, 0.95, 0.14, mHair,  0,    0.26, -0.66);

    // ===================================================================
    // 6. BARBA Y BIGOTE VOXEL DE BAJO RELIEVE + BOCA ANIMADA LIP-SYNC
    // ===================================================================
    const beardG = new THREE.Group();
    this.headGroup.add(beardG);

    const zFront = 0.685;
    const hRel = 0.055; // Bajo relieve uniforme Voxel
    // Bigote Voxel escalonado
    addBox(beardG, 0.84, 0.11, hRel, mBeard, 0, -0.20, zFront);
    addBox(beardG, 0.96, 0.08, hRel, mBeard, 0, -0.26, zFront);
    // Bajantes del candado a los lados de la boca
    addBox(beardG, 0.16, 0.26, hRel, mBeard, -0.40, -0.38, zFront);
    addBox(beardG, 0.16, 0.26, hRel, mBeard,  0.40, -0.38, zFront);
    // Quijada y mentón Voxel escalonado
    addBox(beardG, 1.58, 0.28, 1.38, mBeard, 0, -0.62, 0.01);
    addBox(beardG, 1.24, 0.12, hRel, mBeard, 0, -0.78, zFront - 0.02);
    // Escalones laterales de la barba hacia las patillas (dejando mejillas limpias)
    addBox(beardG, 0.26, 0.24, hRel, mBeard, -0.65, -0.40, zFront);
    addBox(beardG, 0.26, 0.24, hRel, mBeard,  0.65, -0.40, zFront);
    addBox(beardG, 0.14, 0.42, 0.36, mBeard, -0.75, -0.10, 0.50);
    addBox(beardG, 0.14, 0.42, 0.36, mBeard,  0.75, -0.10, 0.50);

    // Boca Voxel animada (Dientes blancos, interior y lengua)
    this.mouthGroup = new THREE.Group();
    this.mouthGroup.position.set(0, -0.37, 0.68);
    this.headGroup.add(this.mouthGroup);

    this.mouthCav = addBox(this.mouthGroup, 0.48, 0.18, 0.06, mMouthIn, 0, 0, 0);
    addBox(this.mouthGroup, 0.42, 0.065, 0.07, mWhite, 0, 0.055, 0.005); // Dientes superiores
    addBox(this.mouthGroup, 0.26, 0.05, 0.068, mTongue, 0, -0.05, 0.005); // Lengua
  }
}

window.WappyAvatarVoxel3D = WappyAvatarVoxel3D;
