import React, { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';

// Escena Básica de 8-bits
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Cargar un sprite temporal simulado
        const g = this.add.graphics();
        g.fillStyle(0x4ade80, 1); // Verde retro
        g.fillRect(0, 0, 32, 32);
        g.generateTexture('avatar', 32, 32);
        g.destroy();
    }

    create() {
        // Fondo negro
        this.cameras.main.setBackgroundColor('#000000');

        // Textos retro
        this.add.text(10, 10, 'SGSST-WORLD v1.0', { 
            fontFamily: '"Press Start 2P"', 
            fontSize: '16px', 
            color: '#4ade80' 
        });

        // Crear el Avatar
        const player = this.add.sprite(400, 300, 'avatar');

        // Bucle básico de animación o interacción (placeholder)
        this.tweens.add({
            targets: player,
            y: 310,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
}

const SSTWorldMap: React.FC = () => {
    const gameRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!gameRef.current) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: gameRef.current,
            pixelArt: true, // ¡Clave para el estilo 8-bits!
            scene: [MainScene],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };

        const game = new Phaser.Game(config);

        return () => {
            game.destroy(true);
        };
    }, []);

    return (
        <div className="flex flex-col items-center space-y-4 animate-in fade-in">
            <div className="pixel-box w-full max-w-4xl p-2 bg-[#222]">
                <div className="flex items-center justify-between border-b-4 border-white pb-2 mb-2 px-2">
                    <h2 className="font-pixel text-green-400 text-sm uppercase">SGSST RISKS MAP (BETA)</h2>
                    <span className="font-pixel text-white text-[10px]">HP: 100/100</span>
                </div>
                {/* Contenedor del Juego Phaser */}
                <div ref={gameRef} className="w-full h-[600px] border-4 border-white" />
            </div>
        </div>
    );
};

export default SSTWorldMap;
