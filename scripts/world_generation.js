import { ENEMY_SIZE, spawnEnemy, activeEnemies } from './enemy_logic.js';
import { playerXPosition, playerYPosition, PLAYER_SIZE, healPlayer, updatePlayerIndicator, setDarknessVisible, setIsVisionBoostActive, getIsVisionBoostActive } from "./player_logic.js";
import { applyEffect } from './status_manager.js';
import { activeLootDrops, activeLootBoxes, spawnLootBox, BOX_SIZE, openShop, closeShop } from './economy_manager.js';

// Constants and other Variables
export let wallData = [];
export let activeZones = []; 
export let currentActiveZone = null; 
let wasInShoppingZone = false;

const ROOM_STRIDE = 170; 
let activeRooms = new Set();

// Rendering Logic of the generated rooms
export function drawWalls(ctx) {
    ctx.beginPath();

    ctx.fillStyle = '#377946'; 
    ctx.strokeStyle = '#377946';
    ctx.lineWidth = 1;

    for (let i = 0; i < wallData.length; i++) {
        let wall = wallData[i];
        ctx.rect(wall.x, wall.y, wall.width, wall.height);
    }

    ctx.fill();
    ctx.stroke();

    ctx.closePath();
} 

// Update Logic of the generating rooms
export function generateRoom(x, y, roomKey, width = 100, height = 100, thickness = 4, openingSize = 40) {
    const doorIndex = Math.floor(Math.random() * 4);

    const wallConfigs = [
        { left: x, top: y, w: width + thickness, h: thickness },                  // Top
        { left: x + width, top: y, w: thickness, h: height + thickness },         // Right
        { left: x, top: y + height, w: width + thickness, h: thickness },         // Bottom
        { left: x, top: y, w: thickness, h: height + thickness }                  // Left
    ];

    const piecesToDraw = [];

    wallConfigs.forEach((config, i) => {
        if (i !== doorIndex) { // Solid wall
            piecesToDraw.push(config);
        } else { // Wall with a door
            if (i % 2 === 0) { // Top or Bottom (Horizontal walls)
                const dw = (config.w - openingSize) / 2;
                piecesToDraw.push({ left: config.left, top: config.top, w: dw, h: config.h });
                piecesToDraw.push({ left: config.left + dw + openingSize, top: config.top, w: dw, h: config.h });
            } else {           // Left or Right (Vertical walls)
                const dh = (config.h - openingSize) / 2;
                piecesToDraw.push({ left: config.left, top: config.top, w: config.w, h: dh });
                piecesToDraw.push({ left: config.left, top: config.top + dh + openingSize, w: config.w, h: dh });
            }
        }
    });

    piecesToDraw.forEach(piece => {
        wallData.push({
            x: piece.left, 
            y: piece.top,
            width: piece.w, 
            height: piece.h,
            roomKey: roomKey
        });
    });

    const padding = 10;
    const enemyPositionOptions = [
        [x + padding, y + padding], 
        [x + width + 2*thickness - padding - ENEMY_SIZE, y + padding], 
        [x + padding, y + height + 2*thickness - padding - ENEMY_SIZE], 
        [x + width + 2*thickness - padding - ENEMY_SIZE, y + height + 2*thickness - padding - ENEMY_SIZE] 
    ];

    const enemyPosition = enemyPositionOptions[Math.floor(Math.random() * 4)];
    
    spawnEnemy(enemyPosition[0], enemyPosition[1], roomKey);

    const centerPositionX = x + (width / 2) - (BOX_SIZE / 2) + thickness;
    const centerPositionY = y + (height / 2) - (BOX_SIZE / 2) + thickness;

    let isLootBoxSpawned = false;

    if (Math.random() > 0.95) {
        spawnLootBox(centerPositionX, centerPositionY)
        isLootBoxSpawned = true;
    };

    const percentageZoneSpawning = isLootBoxSpawned ? 0.99 : 0.95;
    if (Math.random() > percentageZoneSpawning) {
        const zoneTypes = ['Health', 'Vision', 'Surprise', 'Shopping'];
        const type = zoneTypes[Math.floor(Math.random() * zoneTypes.length)];
        
        let surpriseEffect = null;
        if (type === 'Surprise') {
            const roll = Math.random();
            if (roll < 0.80) surpriseEffect = 'damage';
            else if (roll < 0.90) surpriseEffect = 'heal';
            else if (roll < 0.95) surpriseEffect = 'vision';
            else surpriseEffect = 'speed';
        }

        activeZones.push({
            roomKey: roomKey,
            x: x, 
            y: y, 
            width: width, 
            height: height, 
            type: type, 
            surpriseTriggered: false,
            surpriseEffect: surpriseEffect,
            lastHealTime: 0 
        });
    }
}

export function manageInfiniteWorld(canvas) {
    const playerCellX = Math.floor(playerXPosition / ROOM_STRIDE);
    const playerCellY = Math.floor(playerYPosition / ROOM_STRIDE);

    const screenWidthCells = Math.ceil((canvas.width / 2) / ROOM_STRIDE);
    const screenHeightCells = Math.ceil((canvas.height / 2) / ROOM_STRIDE);

    const RENDER_DISTANCE = Math.max(screenWidthCells, screenHeightCells) + 2;
    
    const requiredRooms = new Set();

    for (let col = playerCellX - RENDER_DISTANCE; col <= playerCellX + RENDER_DISTANCE; col++) {
        for (let row = playerCellY - RENDER_DISTANCE; row <= playerCellY + RENDER_DISTANCE; row++) {
            const roomKey = `${col},${row}`;
            
            requiredRooms.add(roomKey);
            
            if (!activeRooms.has(roomKey)) {
                const roomPixelX = col * ROOM_STRIDE;
                const roomPixelY = row * ROOM_STRIDE;
                generateRoom(roomPixelX, roomPixelY, roomKey);
                activeRooms.add(roomKey);       
            }
        }
    }

    for (const roomKey of activeRooms) {
        if (!requiredRooms.has(roomKey)) {
            activeRooms.delete(roomKey);

            activeZones = activeZones.filter(z => z.roomKey !== roomKey);
            wallData = wallData.filter(wall => wall.roomKey !== roomKey);
            
            for (let i = activeEnemies.length - 1; i >= 0; i--) {
                if (activeEnemies[i].roomKey === roomKey) activeEnemies.splice(i, 1);
            }
        }
    }
}

export function drawZones(ctx) {
    for (let i = 0; i < activeZones.length; i++) {
        let z = activeZones[i];
        
        if (z.type === 'Health')   ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
        if (z.type === 'Vision')   ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        if (z.type === 'Surprise') ctx.fillStyle = 'rgba(128, 0, 128, 0.15)';
        if (z.type === 'Shopping') ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';

        ctx.fillRect(z.x, z.y, z.width, z.height);
    }
}

export function checkZoneInteractions() {
    const pSize = PLAYER_SIZE;
    const now = Date.now();
    
    let currentlyInShoppingZone = false;
    let isInsideVisionZone = false;
    let currentZoneEmoji = ""; 

    currentActiveZone = null; 

    for (let i = 0; i < activeZones.length; i++) {
        let z = activeZones[i];

        if (playerXPosition < z.x + z.width  && playerXPosition + pSize > z.x && 
            playerYPosition < z.y + z.height && playerYPosition + pSize > z.y) {
            
            currentActiveZone = z.type; 

            if (z.type === 'Health') {
                currentZoneEmoji = "➕";
                if (now - z.lastHealTime >= 2000) {
                    healPlayer(5); 
                    z.lastHealTime = now; 
                }
            } 
            else if (z.type === 'Shopping') {
                currentlyInShoppingZone = true;
                currentZoneEmoji = "🛒";
            } 
            else if (z.type === 'Vision') {
                isInsideVisionZone = true;
                currentZoneEmoji = "👁️";
            }
            else if (z.type === 'Surprise') {
                let effectEmoji = "❓";
                if (z.surpriseEffect === 'damage') effectEmoji = "☠️";
                else if (z.surpriseEffect === 'heal') effectEmoji = "💖";
                else if (z.surpriseEffect === 'speed') effectEmoji = "⚡";
                else if (z.surpriseEffect === 'vision') effectEmoji = "👁️";

                currentZoneEmoji = Math.floor(now / 500) % 2 === 0 ? "❓" : effectEmoji;

                if (!z.surpriseTriggered) {
                    z.surpriseTriggered = true;
                    
                    if (z.surpriseEffect === 'damage') healPlayer(-25); 
                    else if (z.surpriseEffect === 'heal')   healPlayer(25);
                    else if (z.surpriseEffect === 'speed')  applyEffect('speed_boost', 2, 5000); 
                    else if (z.surpriseEffect === 'vision') applyEffect('vision_boost', 600, 15000);
                }
            }
        }
    }

    if (currentlyInShoppingZone && !wasInShoppingZone) {
        openShop(); 
    } else if (!currentlyInShoppingZone && wasInShoppingZone) {
        closeShop();
    }
    if (isInsideVisionZone || getIsVisionBoostActive()) {
        setDarknessVisible(false);
    } else {
        setDarknessVisible(true);
    }
    
    wasInShoppingZone = currentlyInShoppingZone;

    updatePlayerIndicator(currentZoneEmoji);
}

export function resetWorld() {
    wallData.length = 0;
    activeZones.length = 0;
    activeRooms.clear();
}