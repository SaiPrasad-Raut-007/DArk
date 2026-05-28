import { checkWallCollision, getHitEnemy, getHitLootBox, isPlayerHit } from './physics_engine.js';
import { damageEnemy } from './enemy_logic.js';
import { damagePlayer } from './player_logic.js';
import { damageLootBox } from './economy_manager.js';
import { playBulletBounce, playLaser, playRangedShoot, playRicochetMulti, playRicochetSingle } from './sound_engine.js';

// Constants and other variables
export const playerBullets = [];
export const enemyBullets = [];

const BULLET_SIZE = 10;

export const WEAPON_CONFIGS = {
    shootShortRanged: { speed: 4, lifeSpan: 250, color: '#78909C', bounces: 0 },
    shootLongRanged: { speed: 5, lifeSpan: 3000, color: '#00695C', bounces: 0 },
    shootLaser: { speed: 6, lifeSpan: 1500, color: 'rgb(77, 76, 254)', bounces: 0, isLaser: true },
    shootRicochetSingle: { speed: 4, lifeSpan: 5000, color: '#FFB300', bounces: 1000 },
    shootRicochetMulti: { speed: 4, lifeSpan: 5000, color: '#FF6D00', bounces: 5, isMulti: true }
};

// Rendering Logic
export function drawBullets(ctx) {
    const renderArray = (bulletsArray) => {
        for (let i = 0; i < bulletsArray.length; i++) {
            let b = bulletsArray[i];
            ctx.beginPath();

            ctx.fillStyle = b.color;
            ctx.rect(b.x, b.y, BULLET_SIZE, BULLET_SIZE);
            
            ctx.fill();
            ctx.closePath();
        }
    };

    renderArray(playerBullets);
    renderArray(enemyBullets);
}

export function updateBullets() {
    const now = Date.now();

    const processArray = (bulletsArray, isPlayerBullet) => {
        for (let i = bulletsArray.length - 1; i >= 0; i--) {
            let b = bulletsArray[i];
            
            if (now - b.createdAt > b.lifeSpan) {
                bulletsArray.splice(i, 1);
                continue; 
            }

            b.x += b.dx * b.speed; 
            if (!b.isLaser && checkWallCollision(b.x - 5, b.y - 5, 10)) { 
                if (b.bounces > 0) { b.bounces--; b.x -= b.dx * b.speed; b.dx = -b.dx; playBulletBounce()} 
                else { bulletsArray.splice(i, 1); continue; }
            }

            b.y += b.dy * b.speed;
            if (!b.isLaser && checkWallCollision(b.x - 5, b.y - 5, 10)) { 
                if (b.bounces > 0) { b.bounces--; b.y -= b.dy * b.speed; b.dy = -b.dy; playBulletBounce()} 
                else { bulletsArray.splice(i, 1); continue; }
            }

            let hitBody = false;

            if (isPlayerBullet) {
                const hitEnemyId = getHitEnemy(b.x - 5, b.y - 5, 10);
                if (hitEnemyId) {
                    damageEnemy(hitEnemyId);
                    hitBody = true;
                } else {
                    const hitBoxId = getHitLootBox(b.x - 5, b.y - 5, 10);
                    if (hitBoxId) {
                        damageLootBox(hitBoxId);
                        hitBody = true;
                    }
                }
            } else {
                if (isPlayerHit(b.x - 5, b.y - 5, 10)) {
                    damagePlayer();
                    hitBody = true;
                }
            }

            if (hitBody) {
                bulletsArray.splice(i, 1);
                continue;
            }
        }
    };

    processArray(playerBullets, true);
    processArray(enemyBullets, false);
}

// Updating Logic
function getNormalizedDirection(startX, startY, targetX, targetY) {
    let dx = targetX - startX;
    let dy = targetY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
        dx /= length;
        dy /= length;
    }
    return { dx, dy };
}

function spawnBullet(hostType, startX, startY, dirX, dirY, config) {
    const bullet = {
        x: startX, 
        y: startY,
        dx: dirX, 
        dy: dirY,
        speed: config.speed,
        bounces: config.bounces,
        createdAt: Date.now(),
        lifeSpan: config.lifeSpan,
        isLaser: config.isLaser || false,
        color: config.color
    };

    if (hostType === 'player') {
        playerBullets.push(bullet);
    } else {
        enemyBullets.push(bullet);
    }
}

export function fireWeapon(hostType, weaponName, startX, startY, targetX, targetY) {
    const config = WEAPON_CONFIGS[weaponName];
    if (!config) return; 

    const { dx, dy } = getNormalizedDirection(startX, startY, targetX, targetY);

    if (config.isMulti) {
        const spreadAngle = 30; 
        const radians = spreadAngle * (Math.PI / 180);

        const leftDx = dx * Math.cos(-radians) - dy * Math.sin(-radians);
        const leftDy = dx * Math.sin(-radians) + dy * Math.cos(-radians);

        const rightDx = dx * Math.cos(radians) - dy * Math.sin(radians);
        const rightDy = dx * Math.sin(radians) + dy * Math.cos(radians);

        spawnBullet(hostType, startX, startY, dx, dy, config); 
        spawnBullet(hostType, startX, startY, leftDx, leftDy, config); 
        spawnBullet(hostType, startX, startY, rightDx, rightDy, config); 
    } else {
        spawnBullet(hostType, startX, startY, dx, dy, config);
    }

    switch (weaponName) {
        case 'shootShortRanged':
            playRangedShoot();
            break;

        case 'shootLongRanged':
            playRangedShoot();
            break;

        case 'shootRicochetSingle':
            playRicochetSingle();
            break;

        case 'shootRicochetMulti':
            playRicochetMulti();
            break;

        case 'shootLaser':
            playLaser();
            break;
    }
}

export function resetProjectiles() {
    playerBullets.length = 0;
    enemyBullets.length = 0;
}
