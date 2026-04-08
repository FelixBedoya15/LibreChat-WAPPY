import React, { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { emitNavigateToModule, type SSTModule } from './PhaserEventBridge';

// ─── Constants ────────────────────────────────────────────────────────────────
const TILE  = 16;   // tile size in px
const SCALE = 3;    // render scale (3× → 48px tiles on screen)
const W     = 25;   // map width in tiles
const H     = 20;   // map height in tiles

// Tile indices (used in the map array)
const T_FLOOR   = 0; // passable floor
const T_WALL    = 1; // solid wall
const T_DOOR    = 2; // interactive door

// Room color palette (Phaser CSS colours)
const ROOMS: Array<{
  id: SSTModule;
  label: string;
  color: number;
  doorColor: number;
  rect: { x: number; y: number; w: number; h: number };
  doorTile: { x: number; y: number };
}> = [
  {
    id: 'plan',
    label: 'PLANEAR',
    color: 0x166534,   // dark green
    doorColor: 0x4ade80,
    rect: { x: 1, y: 1, w: 10, h: 8 },
    doorTile: { x: 6, y: 8 },
  },
  {
    id: 'do',
    label: 'HACER',
    color: 0x854d0e,   // dark amber
    doorColor: 0xfacc15,
    rect: { x: 14, y: 1, w: 10, h: 8 },
    doorTile: { x: 19, y: 8 },
  },
  {
    id: 'check',
    label: 'VERIFICAR',
    color: 0x7e1d1d,   // dark red
    doorColor: 0xf87171,
    rect: { x: 1, y: 12, w: 10, h: 7 },
    doorTile: { x: 6, y: 12 },
  },
  {
    id: 'act',
    label: 'ACTUAR',
    color: 0x4c1d95,   // dark purple
    doorColor: 0xc084fc,
    rect: { x: 14, y: 12, w: 10, h: 7 },
    doorTile: { x: 19, y: 12 },
  },
];

// ─── Scene: Preload ────────────────────────────────────────────────────────────
class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  create() {
    // ── Generate textures programmatically ──

    // Floor tile (dark grey checkerboard)
    const floor = this.make.graphics();
    floor.fillStyle(0x1a1a2e);
    floor.fillRect(0, 0, TILE, TILE);
    floor.fillStyle(0x16213e, 1);
    floor.fillRect(0, 0, TILE / 2, TILE / 2);
    floor.fillRect(TILE / 2, TILE / 2, TILE / 2, TILE / 2);
    floor.generateTexture('floor', TILE, TILE);
    floor.destroy();

    // Wall tile (solid with bright border)
    const wall = this.make.graphics();
    wall.fillStyle(0x334155);
    wall.fillRect(0, 0, TILE, TILE);
    wall.fillStyle(0x64748b);
    wall.fillRect(0, 0, TILE, 2);
    wall.fillRect(0, 0, 2, TILE);
    wall.generateTexture('wall', TILE, TILE);
    wall.destroy();

    // Avatar sprite (8×8 pixel humanoid on 16×16 frame)
    const av = this.make.graphics();
    // helmet
    av.fillStyle(0xfbbf24); av.fillRect(5, 2, 6, 2);
    // head
    av.fillStyle(0xfde68a); av.fillRect(4, 4, 8, 6);
    // eyes
    av.fillStyle(0x000000); av.fillRect(6, 6, 2, 2); av.fillRect(10, 6, 2, 2);
    // body
    av.fillStyle(0x2563eb); av.fillRect(4, 10, 8, 4);
    // legs
    av.fillStyle(0x1e40af); av.fillRect(4, 14, 3, 2); av.fillRect(9, 14, 3, 2);
    av.generateTexture('avatar', TILE, TILE);
    av.destroy();

    // Door tile (glowing archway)
    const door = this.make.graphics();
    door.fillStyle(0x0f172a); door.fillRect(0, 0, TILE, TILE);
    door.fillStyle(0x22c55e); door.fillRect(2, 0, 12, 14);
    door.fillStyle(0x000000); door.fillRect(4, 2, 8, 12);
    door.fillStyle(0x4ade80); door.fillRect(6, 10, 4, 4);
    door.generateTexture('door', TILE, TILE);
    door.destroy();

    this.scene.start('MapScene');
  }
}

// ─── Scene: MapScene ────────────────────────────────────────────────────────
class MapScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private eKey!: Phaser.Input.Keyboard.Key;
  private wallGroup!: Phaser.GameObjects.Group;
  private mapData!: number[][];
  private nearDoor: { id: SSTModule; label: string; doorColor: number } | null = null;
  private promptText!: Phaser.GameObjects.Text;
  private hpBar!: Phaser.GameObjects.Graphics;
  private hp = 100;
  private playerFaceLeft = false;
  private moveTimer = 0;
  private readonly MOVE_DELAY = 140; // ms between tile moves
  private roomLabels: Phaser.GameObjects.Text[] = [];

  constructor() { super({ key: 'MapScene' }); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    // Build map array
    this.mapData = this.buildMap();

    // Render tiles
    for (let row = 0; row < H; row++) {
      for (let col = 0; col < W; col++) {
        const t = this.mapData[row][col];
        if (t === T_FLOOR) {
          this.add.image(col * TILE + TILE / 2, row * TILE + TILE / 2, 'floor');
        } else if (t === T_WALL) {
          this.add.image(col * TILE + TILE / 2, row * TILE + TILE / 2, 'wall');
        } else if (t === T_DOOR) {
          this.add.image(col * TILE + TILE / 2, row * TILE + TILE / 2, 'door');
        }
      }
    }

    // Room colour overlays + labels
    ROOMS.forEach(room => {
      const rx = room.rect.x * TILE;
      const ry = room.rect.y * TILE;
      const rw = room.rect.w * TILE;
      const rh = room.rect.h * TILE;

      const overlay = this.add.graphics();
      overlay.fillStyle(room.color, 0.35);
      overlay.fillRect(rx, ry, rw, rh);
      overlay.lineStyle(2, room.doorColor, 0.8);
      overlay.strokeRect(rx, ry, rw, rh);

      // Door glow
      const dx = room.doorTile.x * TILE;
      const dy = room.doorTile.y * TILE;
      const glow = this.add.graphics();
      glow.fillStyle(room.doorColor, 0.5);
      glow.fillRect(dx, dy, TILE, TILE);

      // Room label
      const lbl = this.add.text(
        rx + rw / 2,
        ry + rh / 2,
        room.label,
        { fontFamily: '"Press Start 2P"', fontSize: '8px', color: `#${room.doorColor.toString(16).padStart(6, '0')}`, align: 'center' }
      ).setOrigin(0.5);
      this.roomLabels.push(lbl);

      // Animated door pulse
      this.tweens.add({ targets: glow, alpha: 0.1, duration: 800, yoyo: true, repeat: -1 });
    });

    // Player
    this.player = this.add.image(
      Math.floor(W / 2) * TILE + TILE / 2,
      Math.floor(H / 2) * TILE + TILE / 2,
      'avatar'
    ).setDepth(10);

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setBounds(0, 0, W * TILE, H * TILE);
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

    // HUD: prompt text (fixed to camera)
    this.promptText = this.add
      .text(W * TILE / 2, H * TILE - 12, '', {
        fontFamily: '"Press Start 2P"',
        fontSize: '7px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(20)
      .setScrollFactor(0)
      .setVisible(false);

    // HP bar (fixed to camera)
    this.hpBar = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.drawHP();

    // Listen for HP updates from React
    window.addEventListener('sst-map-hp', (e: Event) => {
      this.hp = Math.max(0, Math.min(100, (e as CustomEvent).detail.hp));
      this.drawHP();
    });
  }

  update(_time: number, delta: number) {
    this.moveTimer -= delta;

    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;

    if (this.moveTimer <= 0 && (up || down || left || right)) {
      this.moveTimer = this.MOVE_DELAY;

      const px = Math.round((this.player.x - TILE / 2) / TILE);
      const py = Math.round((this.player.y - TILE / 2) / TILE);

      let nx = px, ny = py;
      if (up)    ny -= 1;
      if (down)  ny += 1;
      if (left)  { nx -= 1; this.playerFaceLeft = true; }
      if (right) { nx += 1; this.playerFaceLeft = false; }

      this.player.setFlipX(this.playerFaceLeft);

      if (nx >= 0 && nx < W && ny >= 0 && ny < H && this.mapData[ny][nx] !== T_WALL) {
        this.player.setPosition(nx * TILE + TILE / 2, ny * TILE + TILE / 2);
      }
    }

    // Check door proximity
    this.checkDoorProximity();

    // Enter door
    if (Phaser.Input.Keyboard.JustDown(this.eKey) && this.nearDoor) {
      emitNavigateToModule(this.nearDoor.id);
    }
  }

  private checkDoorProximity() {
    const px = Math.round((this.player.x - TILE / 2) / TILE);
    const py = Math.round((this.player.y - TILE / 2) / TILE);

    this.nearDoor = null;
    for (const room of ROOMS) {
      const dx = room.doorTile.x;
      const dy = room.doorTile.y;
      if (Math.abs(px - dx) <= 1 && Math.abs(py - dy) <= 1) {
        this.nearDoor = { id: room.id, label: room.label, doorColor: room.doorColor };
        break;
      }
    }

    if (this.nearDoor) {
      this.promptText
        .setText(`[ E ] ENTER ${this.nearDoor.label}`)
        .setVisible(true);
    } else {
      this.promptText.setVisible(false);
    }
  }

  private drawHP() {
    this.hpBar.clear();
    const barX = 8, barY = 8, barW = 80, barH = 8;
    // background
    this.hpBar.fillStyle(0x000000); this.hpBar.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    this.hpBar.lineStyle(1, 0xffffff); this.hpBar.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);
    // fill
    const pct = this.hp / 100;
    const col = pct > 0.5 ? 0x22c55e : pct > 0.25 ? 0xfacc15 : 0xef4444;
    this.hpBar.fillStyle(col); this.hpBar.fillRect(barX, barY, Math.round(barW * pct), barH);
  }

  private buildMap(): number[][] {
    // Start with all walls
    const map: number[][] = Array.from({ length: H }, () => Array(W).fill(T_WALL));

    // Carve central hallway connecting all rooms
    for (let col = 1; col < W - 1; col++) { map[10][col] = T_FLOOR; }
    for (let row = 1; row < H - 1; row++) { map[row][12] = T_FLOOR; }

    // Carve rooms
    ROOMS.forEach(room => {
      for (let row = room.rect.y; row < room.rect.y + room.rect.h; row++) {
        for (let col = room.rect.x; col < room.rect.x + room.rect.w; col++) {
          map[row][col] = T_FLOOR;
        }
      }
      // Place door
      map[room.doorTile.y][room.doorTile.x] = T_DOOR;
    });

    return map;
  }
}

// ─── React Component ───────────────────────────────────────────────────────────
interface SSTWorldMapProps {
  onNavigate?: (phase: SSTModule) => void;
}

const SSTWorldMap: React.FC<SSTWorldMapProps> = ({ onNavigate }) => {
  const gameRef = useRef<HTMLDivElement>(null);

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
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);

    // Listen for navigate events from Phaser
    const handler = (e: Event) => {
      const module = (e as CustomEvent).detail.module as SSTModule;
      onNavigate?.(module);
    };
    window.addEventListener('sst-map-navigate', handler);

    return () => {
      window.removeEventListener('sst-map-navigate', handler);
      game.destroy(true);
    };
  }, [onNavigate]);

  return (
    <div className="flex flex-col items-center space-y-4 animate-in fade-in w-full">
      <div className="pixel-box w-full max-w-4xl p-2 bg-[#0a0a0a]">
        {/* HUD Header */}
        <div className="flex items-center justify-between border-b-4 border-green-500 pb-2 mb-2 px-2">
          <h2 className="font-pixel text-green-400 text-[10px] uppercase">SGSST-WORLD v2.0</h2>
          <div className="flex items-center gap-4">
            <span className="font-pixel text-[8px] text-white">WASD/↑↓←→ MOVE</span>
            <span className="font-pixel text-[8px] text-yellow-400">E = ENTER</span>
          </div>
        </div>
        {/* Phaser Canvas */}
        <div ref={gameRef} className="w-full border-4 border-white" style={{ height: 480 }} />
        {/* Room legend */}
        <div className="flex flex-wrap gap-3 mt-3 px-2">
          {ROOMS.map(r => (
            <span key={r.id} className="font-pixel text-[8px]" style={{ color: `#${r.doorColor.toString(16).padStart(6,'0')}` }}>
              ■ {r.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SSTWorldMap;
