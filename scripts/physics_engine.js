import { wallData } from "./world_generation.js";
import { activeEnemies } from './enemy_logic.js';
import { playerXPosition, playerYPosition, PLAYER_SIZE } from './player_logic.js';
import { activeLootBoxes } from "./economy_manager.js";

export function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

export function checkWallCollision(targetX, targetY, targetSize) {
    const testRect = { 
        x: targetX, 
        y: targetY, 
        width: targetSize, 
        height: targetSize 
    };
    
    for (let i = 0; i < wallData.length; i++) {
        if (isColliding(testRect, wallData[i])) return true; 
    }

    return false; 
}

export function checkSolidCollision(targetX, targetY, targetSize) {
    const testRect = { 
        x: targetX, 
        y: targetY, 
        width: targetSize, 
        height: targetSize 
    };
    
    for (let i = 0; i < wallData.length; i++) {
        if (isColliding(testRect, wallData[i])) return true; 
    }

    for (let i = 0; i < activeLootBoxes.length; i++) {
        if (isColliding(testRect, activeLootBoxes[i])) return true;
    }
    
    return false; 
}

export function getHitEnemy(bulletX, bulletY, bulletSize) {
    const bulletRect = { x: bulletX, y: bulletY, width: bulletSize, height: bulletSize };
    
    for (let i = 0; i < activeEnemies.length; i++) {
        if (isColliding(bulletRect, activeEnemies[i])) {
            return activeEnemies[i].id;
        }
    }
    return null;
}

export function isPlayerHit(bulletX, bulletY, bulletSize) {
    const bulletRect = { x: bulletX, y: bulletY, width: bulletSize, height: bulletSize };
    const playerRect = { x: playerXPosition, y: playerYPosition, width: PLAYER_SIZE, height: PLAYER_SIZE };
    
    return isColliding(bulletRect, playerRect);
}

export function getHitLootBox(bulletX, bulletY, bulletSize) {
    const bullectRect = { x: bulletX, y: bulletY, width: bulletSize, height: bulletSize };

    for (let i = 0; i < activeLootBoxes.length; i++) {
        if (isColliding(bullectRect, activeLootBoxes[i])) {
            return activeLootBoxes[i].id;
        }
    }
    return null;
}