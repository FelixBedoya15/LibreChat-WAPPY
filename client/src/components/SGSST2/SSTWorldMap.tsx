import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Phaser from 'phaser';
import { emitNavigateToModule, type SSTModule } from './PhaserEventBridge';

// NPC talk event bridge
function emitNpcTalk() { window.dispatchEvent(new CustomEvent('sst-npc-talk')); }

// ─── Map constants ────────────────────────────────────────────────────────────
const TILE  = 16;
const SCALE = 3;
const W     = 27;
const H     = 22;
const T_FLOOR = 0;
const T_WALL  = 1;
const T_DOOR  = 2;

// ─── Room definitions ─────────────────────────────────────────────────────────
const ROOMS: Array<{
  id: SSTModule; label: string; sublabel: string;
  color: number; doorColor: number;
  rect: { x: number; y: number; w: number; h: number };
  doorTile: { x: number; y: number };
}> = [
  { id:'plan',  label:'PLANEAR',   sublabel:'Política · Perfiles · GTC 45', color:0x14532d, doorColor:0x4ade80, rect:{x:1,  y:1,  w:11, h:9},  doorTile:{x:7,  y:9}  },
  { id:'do',    label:'HACER',     sublabel:'IPEVAR · Actos · EPP',          color:0x78350f, doorColor:0xfbbf24, rect:{x:15, y:1,  w:11, h:9},  doorTile:{x:19, y:9}  },
  { id:'check', label:'VERIFICAR', sublabel:'Auditoría · Indicadores',       color:0x7f1d1d, doorColor:0xf87171, rect:{x:1,  y:13, w:11, h:8},  doorTile:{x:7,  y:13} },
  { id:'act',   label:'ACTUAR',    sublabel:'ACPM · Mejora Continua',        color:0x4c1d95, doorColor:0xc084fc, rect:{x:15, y:13, w:11, h:8},  doorTile:{x:19, y:13} },
];

// ─── Sprite color palette ─────────────────────────────────────────────────────
const C = {
  hat:   0xfbbf24, hatD:  0xd97706, hatB:  0x92400e,
  skin:  0xfde68a, skinD: 0xf59e0b,
  eye:   0x1e3a8a, eyeH:  0xdbeafe,
  vest:  0xf97316, vestD: 0xc2410c,
  shirt: 0x1d4ed8, shirtD:0x1e40af,
  pants: 0x1f2937, pantsD:0x111827,
  boot:  0x0f172a, bootH: 0x374151,
  white: 0xffffff,
};

// ─── Pixel-art helper ─────────────────────────────────────────────────────────
type G = Phaser.GameObjects.Graphics;
const r = (g: G, x: number, y: number, w: number, h: number, c: number) => {
  g.fillStyle(c); g.fillRect(x, y, w, h);
};

// ─── Sprite drawing: Safety Inspector in Pokemon FireRed style ────────────────
function drawDown(g: G, step: boolean) {
  // Hard hat + brim
  r(g,4,0,8,3,C.hat);  r(g,3,2,10,2,C.hat);  r(g,3,3,10,1,C.hatD);
  r(g,5,1,6,1,C.hatB); // band
  // Face
  r(g,4,4,8,6,C.skin);  r(g,4,9,8,1,C.skinD);
  // Eyes
  r(g,5,6,2,2,C.eye);  r(g,9,6,2,2,C.eye);
  r(g,6,6,1,1,C.eyeH); r(g,10,6,1,1,C.eyeH);
  // Mouth
  r(g,6,9,4,1,C.hatB);
  // Arms (sides)
  r(g,1,11,2,2,C.skin);  r(g,13,11,2,2,C.skin);
  r(g,1,13,2,1,C.skinD); r(g,13,13,2,1,C.skinD);
  // Vest body
  r(g,3,10,10,4,C.vest); r(g,6,10,4,4,C.shirt);
  r(g,3,13,10,1,C.vestD);
  // Legs
  if (!step) {
    r(g,4,14,3,3,C.pants); r(g,9,14,3,3,C.pants);
    r(g,4,16,3,1,C.boot);  r(g,9,16,3,1,C.boot);
  } else {
    r(g,4,14,3,2,C.pants); r(g,9,14,3,3,C.pants);
    r(g,4,15,3,1,C.boot);  r(g,9,16,3,1,C.boot);
  }
  // Shoe highlight
  r(g,5,15,1,1,C.bootH); r(g,10,15+(!step?1:0),1,1,C.bootH);
}

function drawBack(g: G, step: boolean) {
  r(g,4,0,8,3,C.hat); r(g,3,2,10,2,C.hat); r(g,3,3,10,1,C.hatD);
  r(g,5,1,6,1,C.hatB);
  // Back of head
  r(g,4,4,8,6,C.skin); r(g,5,4,6,1,C.hatD);
  // Arms
  r(g,1,11,2,2,C.skin); r(g,13,11,2,2,C.skin);
  // Vest
  r(g,3,10,10,4,C.vest); r(g,6,10,4,4,C.shirt);
  r(g,3,13,10,1,C.vestD);
  // Legs
  if (!step) {
    r(g,4,14,3,3,C.pants); r(g,9,14,3,3,C.pants);
  } else {
    r(g,4,14,3,3,C.pants); r(g,9,14,3,2,C.pants);
  }
  r(g,4,16,3,1,C.boot); r(g,9,16,3,1,C.boot);
}

function drawSide(g: G, step: boolean) {
  // Hat (side brim extends left/forward)
  r(g,4,0,8,3,C.hat); r(g,2,2,11,2,C.hat); r(g,2,3,11,1,C.hatD);
  r(g,5,1,5,1,C.hatB);
  // Head (shifted slightly forward)
  r(g,3,4,8,6,C.skin); r(g,3,9,8,1,C.skinD);
  // Eye (one visible)
  r(g,4,6,2,2,C.eye); r(g,5,6,1,1,C.eyeH);
  // Ear (back of head)
  r(g,10,6,2,2,C.skinD);
  // Arm (front)
  r(g,2,11,2,3,C.skin); r(g,2,13,2,1,C.skinD);
  // Arm (back, partial)
  r(g,12,11,2,2,C.vest);
  // Vest body
  r(g,3,10,10,4,C.vest); r(g,9,10,4,4,C.shirt);
  r(g,3,13,10,1,C.vestD);
  // Legs
  if (!step) {
    r(g,4,14,8,3,C.pants);
  } else {
    // stride: front leg forward, back leg back
    r(g,5,14,4,3,C.pants); // front leg
    r(g,8,14,5,2,C.pantsD); // back leg (raised/shorter)
    r(g,8,15,5,1,C.pants);
  }
  // Boot
  if (!step) {
    r(g,4,16,4,1,C.boot); r(g,9,16,3,1,C.boot);
  } else {
    r(g,4,16,4,1,C.boot); r(g,9,15,4,1,C.boot);
  }
  r(g,5,16,1,1,C.bootH);
}

// ─── NPC Sprite: Capitán SST (red helmet, white coat, clipboard) ───────────────
function drawNpc(g: G) {
  // Red hard hat
  r(g,4,0,8,3,0xdc2626); r(g,3,2,10,2,0xdc2626); r(g,3,3,10,1,0x991b1b);
  r(g,5,1,6,1,0xfef2f2);
  // Face
  r(g,4,4,8,6,0xfde68a); r(g,4,9,8,1,0xf59e0b);
  // Eyes
  r(g,5,6,2,2,0x1e3a8a); r(g,9,6,2,2,0x1e3a8a);
  r(g,6,6,1,1,0xdbeafe); r(g,10,6,1,1,0xdbeafe);
  // Smile
  r(g,6,9,4,1,0x92400e);
  // White coat
  r(g,2,10,12,4,0xf1f5f9); r(g,6,10,4,4,0xe2e8f0);
  r(g,2,13,12,1,0xcbd5e1);
  // Arms
  r(g,1,11,2,2,0xfde68a); r(g,1,13,2,1,0xf59e0b);
  // Clipboard (right hand area)
  r(g,12,10,3,4,0xfbbf24); r(g,12,10,3,1,0x92400e);
  r(g,13,11,1,1,0x000000); r(g,13,12,1,1,0x000000);
  // Pants
  r(g,4,14,3,3,0x1f2937); r(g,9,14,3,3,0x1f2937);
  r(g,4,16,3,1,0x0f172a); r(g,9,16,3,1,0x0f172a);
  r(g,5,16,1,1,0x374151); r(g,10,16,1,1,0x374151);
}

// ─── Scene: Preload ───────────────────────────────────────────────────────────
class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  create() {
    // Floor
    const floor = this.make.graphics();
    floor.fillStyle(0x0f172a); floor.fillRect(0,0,TILE,TILE);
    floor.fillStyle(0x1e293b); floor.fillRect(0,0,TILE/2,TILE/2); floor.fillRect(TILE/2,TILE/2,TILE/2,TILE/2);
    floor.generateTexture('floor', TILE, TILE); floor.destroy();

    // Wall
    const wall = this.make.graphics();
    wall.fillStyle(0x374151); wall.fillRect(0,0,TILE,TILE);
    wall.fillStyle(0x6b7280); wall.fillRect(0,0,TILE,2); wall.fillRect(0,0,2,TILE);
    wall.fillStyle(0x1f2937); wall.fillRect(2,2,TILE-2,TILE-2);
    wall.generateTexture('wall', TILE, TILE); wall.destroy();

    // Door
    const door = this.make.graphics();
    door.fillStyle(0x0f172a); door.fillRect(0,0,TILE,TILE);
    door.fillStyle(0x1a1a2e); door.fillRect(2,0,12,14);
    door.fillStyle(0x000000); door.fillRect(4,2,8,12);
    door.fillStyle(0x4ade80); door.fillRect(6,10,4,4); // glow
    door.generateTexture('door', TILE, TILE); door.destroy();

    // Character frames
    const frames: Array<[string, (g:G,step:boolean)=>void, boolean]> = [
      ['char-down-0', drawDown, false],
      ['char-down-1', drawDown, true],
      ['char-back-0', drawBack, false],
      ['char-back-1', drawBack, true],
      ['char-side-0', drawSide, false],
      ['char-side-1', drawSide, true],
    ];
    for (const [key, fn, step] of frames) {
      const g = this.make.graphics();
      fn(g, step);
      g.generateTexture(key, TILE, TILE);
      g.destroy();
    }

    // NPC sprite (Capitán SST)
    const npc = this.make.graphics();
    drawNpc(npc);
    npc.generateTexture('npc', TILE, TILE);
    npc.destroy();

    // "!" indicator
    const exc = this.make.graphics();
    exc.fillStyle(0xfbbf24); exc.fillRect(5,0,6,9); exc.fillRect(5,11,6,5);
    exc.generateTexture('exclaim', TILE, TILE);
    exc.destroy();

    this.scene.start('MapScene');
  }
}

// ─── Scene: MapScene ──────────────────────────────────────────────────────────
class MapScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private npcSprite!: Phaser.GameObjects.Image;
  private npcExclaim!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'up'|'left'|'down'|'right', Phaser.Input.Keyboard.Key>;
  private eKey!: Phaser.Input.Keyboard.Key;
  private mapData!: number[][];
  private nearDoor: typeof ROOMS[0] | null = null;
  private nearNpc = false;
  private promptText!: Phaser.GameObjects.Text;
  private roomBanner!: Phaser.GameObjects.Text;
  private hpBarGfx!: Phaser.GameObjects.Graphics;
  private hp = 100;
  private walkFrame = false;
  private moveTimer = 0;
  private readonly MOVE_MS = 130;
  private dir: 'down'|'back'|'left'|'right' = 'down';
  private currentRoomId: SSTModule | null = null;
  private bannerTimer: ReturnType<typeof setTimeout> | null = null;
  // NPC position (1 tile left of center, corridor row)
  private readonly NPC_TX = Math.floor(W/2) - 2;
  private readonly NPC_TY = Math.floor(H/2);

  constructor() { super({ key: 'MapScene' }); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    this.mapData = this.buildMap();

    // Render tiles
    for (let row = 0; row < H; row++) {
      for (let col = 0; col < W; col++) {
        const t = this.mapData[row][col];
        const key = t === T_FLOOR ? 'floor' : t === T_WALL ? 'wall' : 'door';
        this.add.image(col*TILE+TILE/2, row*TILE+TILE/2, key);
      }
    }

    // Room overlays + labels + pulsing doors
    ROOMS.forEach(room => {
      const rx = room.rect.x*TILE, ry = room.rect.y*TILE;
      const rw = room.rect.w*TILE, rh = room.rect.h*TILE;

      const ov = this.add.graphics();
      ov.fillStyle(room.color, 0.4); ov.fillRect(rx, ry, rw, rh);
      ov.lineStyle(2, room.doorColor, 0.9); ov.strokeRect(rx, ry, rw, rh);

      // Room name label (center)
      this.add.text(rx+rw/2, ry+rh/2-6, room.label, {
        fontFamily:'"Press Start 2P"', fontSize:'8px',
        color:`#${room.doorColor.toString(16).padStart(6,'0')}`, align:'center',
      }).setOrigin(0.5).setAlpha(0.7);
      this.add.text(rx+rw/2, ry+rh/2+8, room.sublabel, {
        fontFamily:'"Press Start 2P"', fontSize:'4px',
        color:'#ffffff', align:'center',
      }).setOrigin(0.5).setAlpha(0.5);

      // Pulsing door glow
      const glow = this.add.graphics();
      glow.fillStyle(room.doorColor, 0.7);
      glow.fillRect(room.doorTile.x*TILE, room.doorTile.y*TILE, TILE, TILE);
      this.tweens.add({ targets: glow, alpha: 0.1, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    // Center corridor label
    this.add.text(W*TILE/2, H*TILE/2, 'CENTRAL\nHQ', {
      fontFamily:'"Press Start 2P"', fontSize:'6px', color:'#94a3b8', align:'center',
    }).setOrigin(0.5).setAlpha(0.6);

    // NPC
    const npcX = this.NPC_TX * TILE + TILE/2;
    const npcY = this.NPC_TY * TILE + TILE/2;
    this.npcSprite = this.add.image(npcX, npcY, 'npc').setDepth(9);
    // "!" indicator above NPC - bobbing
    this.npcExclaim = this.add.image(npcX, npcY - TILE - 2, 'exclaim').setDepth(9).setScale(0.6);
    this.tweens.add({ targets: this.npcExclaim, y: npcY - TILE - 5, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Player (starts at center)
    const px = Math.floor(W/2)*TILE+TILE/2;
    const py = Math.floor(H/2)*TILE+TILE/2;
    this.player = this.add.image(px, py, 'char-down-0').setDepth(10);

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, W*TILE, H*TILE);
    this.cameras.main.setZoom(SCALE);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // HUD: prompt text (fixed)
    this.promptText = this.add.text(W*TILE/2, H*TILE-8, '', {
      fontFamily:'"Press Start 2P"', fontSize:'6px', color:'#facc15',
      backgroundColor:'#000000', padding:{x:5,y:3},
    }).setOrigin(0.5,1).setDepth(30).setScrollFactor(0).setVisible(false);

    // Room entry banner (fixed, center screen)
    this.roomBanner = this.add.text(W*TILE/2, 20, '', {
      fontFamily:'"Press Start 2P"', fontSize:'8px', color:'#000000',
      backgroundColor:'#4ade80', padding:{x:8,y:5},
    }).setOrigin(0.5,0).setDepth(30).setScrollFactor(0).setAlpha(0).setVisible(false);

    // HP bar (fixed)
    this.hpBarGfx = this.add.graphics().setScrollFactor(0).setDepth(30);
    this.drawHP();

    // Listen for HP updates from React
    window.addEventListener('sst-map-hp', (e: Event) => {
      this.hp = Math.max(0, Math.min(100, (e as CustomEvent).detail.hp));
      this.drawHP();
    });
  }

  update(_t: number, delta: number) {
    this.moveTimer -= delta;

    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;

    if (this.moveTimer <= 0 && (up||down||left||right)) {
      this.moveTimer = this.MOVE_MS;
      this.walkFrame = !this.walkFrame;

      const tx = Math.round((this.player.x - TILE/2) / TILE);
      const ty = Math.round((this.player.y - TILE/2) / TILE);
      let nx = tx, ny = ty;

      if (up)    { ny -= 1; this.dir = 'back';  }
      if (down)  { ny += 1; this.dir = 'down';  }
      if (left)  { nx -= 1; this.dir = 'left';  }
      if (right) { nx += 1; this.dir = 'right'; }

      if (nx>=0 && nx<W && ny>=0 && ny<H && this.mapData[ny][nx] !== T_WALL) {
        this.player.setPosition(nx*TILE+TILE/2, ny*TILE+TILE/2);
      }
    } else if (!up && !down && !left && !right) {
      this.walkFrame = false;
    }

    // Update sprite texture
    const dirKey = this.dir === 'left' || this.dir === 'right' ? 'side' : this.dir;
    const frameKey = `char-${dirKey}-${this.walkFrame ? '1' : '0'}`;
    this.player.setTexture(frameKey);
    this.player.setFlipX(this.dir === 'right');

    this.checkDoorProximity();
    this.checkNpcProximity();
    this.checkRoomEntry();

    // Enter door or talk to NPC
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      if (this.nearNpc) { emitNpcTalk(); return; }
      if (this.nearDoor) emitNavigateToModule(this.nearDoor.id);
    }
  }

  private checkDoorProximity() {
    const px = Math.round((this.player.x - TILE/2) / TILE);
    const py = Math.round((this.player.y - TILE/2) / TILE);

    this.nearDoor = null;
    for (const room of ROOMS) {
      if (Math.abs(px - room.doorTile.x) <= 1 && Math.abs(py - room.doorTile.y) <= 1) {
        this.nearDoor = room;
        break;
      }
    }

    if (this.nearDoor) {
      this.promptText.setText(`[ E ]  ENTER  ${this.nearDoor.label}`).setVisible(true);
    } else if (this.nearNpc) {
      this.promptText.setText('[ E ]  HABLAR CON CAPITÁN SST').setVisible(true);
    } else {
      this.promptText.setVisible(false);
    }
  }

  private checkNpcProximity() {
    const px = Math.round((this.player.x - TILE/2) / TILE);
    const py = Math.round((this.player.y - TILE/2) / TILE);
    this.nearNpc = Math.abs(px - this.NPC_TX) <= 1 && Math.abs(py - this.NPC_TY) <= 1;
    // Hide/show exclamation mark
    this.npcExclaim.setVisible(!this.nearNpc);
  }

  private checkRoomEntry() {
    const px = Math.round((this.player.x - TILE/2) / TILE);
    const py = Math.round((this.player.y - TILE/2) / TILE);

    let enteredRoom: typeof ROOMS[0] | null = null;
    for (const room of ROOMS) {
      const { x, y, w, h } = room.rect;
      if (px >= x && px < x+w && py >= y && py < y+h) {
        enteredRoom = room;
        break;
      }
    }

    const newId = enteredRoom?.id ?? null;
    if (newId !== this.currentRoomId) {
      this.currentRoomId = newId;
      if (enteredRoom) this.showRoomBanner(enteredRoom);
    }
  }

  private showRoomBanner(room: typeof ROOMS[0]) {
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    const hexColor = `#${room.doorColor.toString(16).padStart(6,'0')}`;

    this.roomBanner
      .setText(`◄ ${room.label} ►`)
      .setStyle({ color:'#000000', backgroundColor: hexColor })
      .setVisible(true).setAlpha(0);

    this.tweens.add({
      targets: this.roomBanner, alpha: 1, duration: 300, ease:'Power2',
      onComplete: () => {
        this.bannerTimer = setTimeout(() => {
          this.tweens.add({ targets: this.roomBanner, alpha: 0, duration: 500,
            onComplete: () => this.roomBanner.setVisible(false) });
        }, 2000);
      },
    });
  }

  private drawHP() {
    this.hpBarGfx.clear();
    const bx = 6, by = 6, bw = 52, bh = 7;
    this.hpBarGfx.fillStyle(0x000000); this.hpBarGfx.fillRect(bx-1,by-1,bw+2,bh+2);
    this.hpBarGfx.lineStyle(1,0xffffff,1); this.hpBarGfx.strokeRect(bx-1,by-1,bw+2,bh+2);
    const pct = this.hp/100;
    const col = pct>0.5 ? 0x22c55e : pct>0.25 ? 0xfacc15 : 0xef4444;
    this.hpBarGfx.fillStyle(col); this.hpBarGfx.fillRect(bx, by, Math.round(bw*pct), bh);
    // Label
    // HP text drawn as part of the React HUD
  }

  private buildMap(): number[][] {
    const map: number[][] = Array.from({length:H}, () => Array(W).fill(T_WALL));

    // Carve corridors
    const midRow = Math.floor(H/2);
    const midCol = Math.floor(W/2);
    for (let c=1; c<W-1; c++) map[midRow][c] = T_FLOOR;
    for (let rr=1; rr<H-1; rr++) map[rr][midCol] = T_FLOOR;

    // Carve rooms
    ROOMS.forEach(room => {
      for (let rr=room.rect.y; rr<room.rect.y+room.rect.h; rr++) {
        for (let cc=room.rect.x; cc<room.rect.x+room.rect.w; cc++) {
          map[rr][cc] = T_FLOOR;
        }
      }
      map[room.doorTile.y][room.doorTile.x] = T_DOOR;
    });

    return map;
  }
}

// ─── React Component ──────────────────────────────────────────────────────────
interface SSTWorldMapProps {
  onNavigate?: (phase: SSTModule) => void;
  hp?: number;
  questData?: { planear: number; hacer: number; verificar: number; actuar: number };
}

const NPC_DIALOGS = [
  '¡BIENVENIDO, INSPECTOR!\nRevisa cada sala para\ncompletar tus misiones SST.',
  '¡OJO! Cada accidente\nabierto reduce tu HP.\nCiérralos en HACER > Actos.',
  '¿Viste el mapa?\nLas puertas brillantes\nson entradas a los módulos.',
  'La sala PLANEAR tiene\ntus Perfiles de Cargo\ny la Política SST.',
  'VERIFICAR registra tus\nauditorías y el nivel\nde cumplimiento legal.',
  'ACTUAR almacena los ACPM,\nacciones correctivas y\nde mejora continua.',
];

const SSTWorldMap: React.FC<SSTWorldMapProps> = ({ onNavigate, hp = 100, questData }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [showDialogue, setShowDialogue] = useState(false);
  const [dialogIdx, setDialogIdx] = useState(0);

  const handleNpcTalk = useCallback(() => {
    setDialogIdx(Math.floor(Math.random() * NPC_DIALOGS.length));
    setShowDialogue(true);
  }, []);

  const nextDialog = () => {
    const next = (dialogIdx + 1) % NPC_DIALOGS.length;
    setDialogIdx(next);
  };

  // Push HP updates into Phaser via custom event
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sst-map-hp', { detail: { hp } }));
  }, [hp]);

  // Listen for NPC talk
  useEffect(() => {
    window.addEventListener('sst-npc-talk', handleNpcTalk);
    return () => window.removeEventListener('sst-npc-talk', handleNpcTalk);
  }, [handleNpcTalk]);

  useEffect(() => {
    if (!gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: W * TILE,
      height: H * TILE,
      parent: gameRef.current,
      pixelArt: true,
      backgroundColor: '#000000',
      scene: [PreloadScene, MapScene],
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    };

    const game = new Phaser.Game(config);

    const handler = (e: Event) => {
      onNavigate?.((e as CustomEvent).detail.module as SSTModule);
    };
    window.addEventListener('sst-map-navigate', handler);

    return () => {
      window.removeEventListener('sst-map-navigate', handler);
      game.destroy(true);
    };
  }, [onNavigate]);

  const hpPct = hp / 100;
  const hpColor = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#facc15' : '#ef4444';
  const hpLabel = hpPct > 0.75 ? '🟢 EXCELLENT' : hpPct > 0.5 ? '🟡 STABLE' : hpPct > 0.25 ? '🟠 CAUTION' : '🔴 CRITICAL';

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in">
      <div className="pixel-box w-full max-w-4xl bg-[#060714]">
        {/* ── HUD header ── */}
        <div className="flex flex-wrap items-center justify-between border-b-4 border-green-500 px-4 py-2 gap-3">
          <div className="flex items-center gap-4">
            <span className="font-pixel text-green-400 text-[10px]">SOMOS SST v2.0</span>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[8px] text-white">HP:</span>
              <div className="w-28 h-3 bg-black border-2 border-white">
                <div className="h-full transition-all" style={{ width:`${hp}%`, backgroundColor: hpColor }} />
              </div>
              <span className="font-pixel text-[8px]" style={{ color: hpColor }}>{hp}/100</span>
            </div>
            <span className="font-pixel text-[7px]" style={{ color: hpColor }}>{hpLabel}</span>
          </div>
          <div className="flex gap-4">
            <span className="font-pixel text-[8px] text-gray-400">WASD / ↑↓←→ MOVER</span>
            <span className="font-pixel text-[8px] text-yellow-400">E = ENTRAR</span>
          </div>
        </div>

        {/* ── Phaser canvas ── */}
        <div ref={gameRef} className="w-full border-b-4 border-white" style={{ height: 500 }} />

        {/* ── Legend ── */}
        <div className="flex flex-wrap gap-4 px-4 py-2">
          {ROOMS.map(room => (
            <span key={room.id} className="font-pixel text-[7px]" style={{ color:`#${room.doorColor.toString(16).padStart(6,'0')}` }}>
              ■ {room.label}
            </span>
          ))}
        </div>
      </div>

      {/* ─── NPC Dialogue Overlay ─── */}
      {showDialogue && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-16 px-4 bg-black/60" onClick={() => setShowDialogue(false)}>
          <div
            className="pixel-box w-full max-w-xl bg-[#0a0a0a] border-4 border-white p-0"
            onClick={e => e.stopPropagation()}
          >
            {/* Speaker label */}
            <div className="flex items-center gap-3 bg-red-700 border-b-4 border-white px-4 py-2">
              <div className="w-10 h-10 bg-red-500 border-2 border-white flex items-center justify-center">
                <span className="font-pixel text-white text-lg">C</span>
              </div>
              <span className="font-pixel text-white text-[10px] uppercase">Capitán SST</span>
            </div>
            {/* Dialogue text */}
            <div className="px-6 py-4 min-h-[80px] flex items-center">
              <p className="font-pixel text-green-400 text-[9px] leading-6 whitespace-pre-line">
                {NPC_DIALOGS[dialogIdx]}
              </p>
            </div>
            {/* Quest summary */}
            {questData && (
              <div className="border-t-4 border-white px-6 py-3 grid grid-cols-2 gap-2">
                <span className="font-pixel text-[7px] text-green-400">■ PLANEAR: {questData.planear} pendientes</span>
                <span className="font-pixel text-[7px] text-yellow-400">■ HACER: {questData.hacer} pendientes</span>
                <span className="font-pixel text-[7px] text-red-400">■ VERIFICAR: {questData.verificar} pendientes</span>
                <span className="font-pixel text-[7px] text-purple-400">■ ACTUAR: {questData.actuar} pendientes</span>
              </div>
            )}
            {/* Actions */}
            <div className="border-t-4 border-white flex">
              <button onClick={nextDialog} className="flex-1 pixel-btn bg-blue-700 border-r-4 border-white text-[8px]">SIGUIENTE ►</button>
              <button onClick={() => setShowDialogue(false)} className="flex-1 pixel-btn bg-gray-800 text-[8px]">CERRAR ×</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SSTWorldMap;
