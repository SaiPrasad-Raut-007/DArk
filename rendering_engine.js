import { playerXPosition, playerYPosition, PLAYER_SIZE, drawPlayer, movePlayer, isPaused, updatePlayerHealth, playerShoots, tickTimer, resetPlayer, isPlayerKilled, setPaused, drawLighting } from "./player_logic.js";
import { drawBullets, updateBullets, resetProjectiles } from "./projectiles.js";
import { generateRoom, drawWalls, manageInfiniteWorld, drawZones, checkZoneInteractions, resetWorld } from "./world_generation.js";
import { updateEnemies, drawEnemies, resetEnemies } from './enemy_logic.js';
import { updateEffects } from './status_manager.js';
import { checkSolidCollision } from './physics_engine.js';
import { drawLoot, updateLoot, spawnSpecificLoot, BOX_SIZE, resetEconomy } from './economy_manager.js';
import { pauseGameLoop, playGameLoop } from "./sound_engine.js";

const gameContainerElement = document.getElementById('game-container');
const UIContainerElement = document.getElementById('ui-container');
const resumeButtonElement = document.getElementById('resume-button');

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let cameraOffsetX = 0;
let cameraOffsetY = 0;

let lastFrameTime = 0;
let lastBulletSpawnTime = 0;

let isMusicPlaying = false;

resumeButtonElement.addEventListener('click', () => {
    if (isPlayerKilled) {
        resetWorld();
        resetEnemies();
        resetEconomy();
        resetProjectiles();
        
        resetPlayer(); 
        playGameLoop();
    } else {
        setPaused(false); 
        document.getElementById('game-menu').style.display = 'none';
    }
});

function updateGame(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    // Update Setup
    if (!isPaused) {
        tickTimer(deltaTime); 

        if (!lastBulletSpawnTime) lastBulletSpawnTime = timestamp;
        
        if (timestamp - lastBulletSpawnTime > 10000) {
            lastBulletSpawnTime = timestamp;
            
            const spawnX = playerXPosition + (Math.random() * 500 - 250);
            const spawnY = playerYPosition + (Math.random() * 500 - 250);

            if (!checkSolidCollision(spawnX, spawnY, BOX_SIZE)) {
                spawnSpecificLoot('reload', spawnX, spawnY);
            }
        }
        
        movePlayer();
        checkZoneInteractions();    
        playerShoots(canvas);

        updateBullets(deltaTime);
        updateEnemies(); 
        updateEffects(deltaTime); 
        updateLoot(deltaTime); 

        manageInfiniteWorld(canvas);
    }

    // Camera Setup 
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cameraOffsetX = (canvas.width / 2) - playerXPosition - (PLAYER_SIZE / 2);
    cameraOffsetY = (canvas.height / 2) - playerYPosition - (PLAYER_SIZE / 2);
    ctx.translate(cameraOffsetX, cameraOffsetY);

    // Drawing (world space)
    drawZones(ctx);
    drawWalls(ctx);
    drawLoot(ctx);      
    drawEnemies(ctx); 
    drawBullets(ctx);
    drawPlayer(ctx);
    drawLighting(ctx, canvas);

    requestAnimationFrame(updateGame);
}

const startBackgroundMusic = () => {
    if (!isMusicPlaying && !isPlayerKilled) {
        playGameLoop();
        isMusicPlaying = true;
        
        window.removeEventListener('click', startBackgroundMusic);
        window.removeEventListener('keydown', startBackgroundMusic);
    }
};

window.addEventListener('click', startBackgroundMusic);
window.addEventListener('keydown', startBackgroundMusic);

updatePlayerHealth();
requestAnimationFrame(updateGame);