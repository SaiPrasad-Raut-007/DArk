import { playerXPosition, playerYPosition, PLAYER_SIZE, addScoreAndTime } from './player_logic.js';
import { checkSolidCollision } from './physics_engine.js';
import { fireWeapon } from './projectiles.js';
import { dropLoot, BOX_SIZE } from './economy_manager.js';

// Constants and other variables
export const activeEnemies = [];
const MAX_ENEMY_HEALTH = 90;
export const allowedEnemyDamageScore = 30; 
export const ENEMY_SIZE = 15;

const GRID_SIZE = 20; 
const PATH_FOOTPRINT = 19; 

// Weapons data and related function
const availableWeapons = ['shootShortRanged', 'shootLongRanged', 'shootLaser', 'shootRicochetSingle', 'shootRicochetMulti'];
const weaponsRarity = [65, 30, 4, 10, 1];

function getWeightedRandomWeapon() {
    let totalWeight = 0;
    for (let i = 0; i < weaponsRarity.length; i++) {
        totalWeight += weaponsRarity[i];
    }

    let randomNum = Math.random() * totalWeight;

    for (let i = 0; i < weaponsRarity.length; i++) {
        if (randomNum < weaponsRarity[i]) {
            return availableWeapons[i];
        }
        randomNum -= weaponsRarity[i];
    }
    
    return availableWeapons[0]; 
}

// Spawning Logic 
export function spawnEnemy(x, y, roomKey) {
    const isChaser = Math.random() > 0.75; 
    const type = isChaser ? 'chaser' : 'idle';
    const ROI_RADIUS = 80;

    activeEnemies.push({
        id: Math.random().toString(36).substring(2, 9),
        x: x, 
        y: y,
        facingAngle: Math.random() * Math.PI * 2,
        targetAngle: 0,
        FOV: 120 * (Math.PI / 180),
        spawnX: x, 
        spawnY: y,
        width: ENEMY_SIZE, 
        height: ENEMY_SIZE,
        health: MAX_ENEMY_HEALTH,
        roomKey: roomKey,
        type: type,
        color: isChaser ? "rgb(192, 44, 7)" : "#ff2a40", 
        moveSpeed: isChaser ? 0.4 : 0.2,
        ROI_RADIUS: ROI_RADIUS,
        weapon: getWeightedRandomWeapon(),
        lastShotTime: 0,
        // Chaser variables
        path: [],
        lastPathCalcTime: 0,
        // Patrol variables
        patrolState: 'wait',
        patrolWaitTime: Date.now() + 1000, 
        patrolTargetX: 0, 
        patrolTargetY: 0,
        patrolDx: 0, 
        patrolDy: 0
    });
}

// Pathfinding Logic 
function getClosestValidGridNode(pixelX, pixelY) {
    let snappedX = Math.round(pixelX / GRID_SIZE) * GRID_SIZE;
    let snappedY = Math.round(pixelY / GRID_SIZE) * GRID_SIZE;
    
    if (!checkSolidCollision(snappedX, snappedY, PATH_FOOTPRINT)) return { x: snappedX, y: snappedY };
    
    let alternatives = [
        { x: snappedX - GRID_SIZE, y: snappedY }, { x: snappedX + GRID_SIZE, y: snappedY },
        { x: snappedX, y: snappedY - GRID_SIZE }, { x: snappedX, y: snappedY + GRID_SIZE },
        { x: snappedX - GRID_SIZE, y: snappedY - GRID_SIZE }, { x: snappedX + GRID_SIZE, y: snappedY - GRID_SIZE },
        { x: snappedX - GRID_SIZE, y: snappedY + GRID_SIZE }, { x: snappedX + GRID_SIZE, y: snappedY + GRID_SIZE }
    ];
    
    alternatives.sort((a, b) => {
        let distA = (a.x - pixelX)**2 + (a.y - pixelY)**2;
        let distB = (b.x - pixelX)**2 + (b.y - pixelY)**2;
        return distA - distB;
    });
    
    for (let alt of alternatives) {
        if (!checkSolidCollision(alt.x, alt.y, PATH_FOOTPRINT)) return alt;
    }
    return { x: snappedX, y: snappedY }; 
}

function findPathAStar(startX, startY, targetX, targetY) {
    const startNode = getClosestValidGridNode(startX, startY);
    startNode.g_cost = 0; startNode.h_cost = 0; startNode.f_cost = 0; startNode.parent = null;

    const targetNode = getClosestValidGridNode(targetX, targetY);

    let OPEN = [startNode];
    let CLOSED = [];
    let maxIterations = 800; 

    while (OPEN.length > 0 && maxIterations > 0) {
        maxIterations--;
        let currentNode = OPEN.reduce((prev, curr) => (curr.f_cost < prev.f_cost ? curr : prev));
        
        OPEN.splice(OPEN.indexOf(currentNode), 1);
        CLOSED.push(currentNode);

        if (currentNode.x === targetNode.x && currentNode.y === targetNode.y) {
            let path = [];
            let curr = currentNode;
            while (curr.parent) { path.push({ x: curr.x, y: curr.y }); curr = curr.parent; }
            return path.reverse();
        }

        let neighbourOffsets = [
            {dx: 0, dy: -GRID_SIZE}, {dx: 0, dy: GRID_SIZE}, 
            {dx: -GRID_SIZE, dy: 0}, {dx: GRID_SIZE, dy: 0}
        ];

        for (let offset of neighbourOffsets) {
            let nX = currentNode.x + offset.dx;
            let nY = currentNode.y + offset.dy;

            if (checkSolidCollision(nX, nY, PATH_FOOTPRINT) || CLOSED.some(node => node.x === nX && node.y === nY)) continue;

            let halfX = currentNode.x + (offset.dx / 2);
            let halfY = currentNode.y + (offset.dy / 2);
            if (checkSolidCollision(halfX, halfY, PATH_FOOTPRINT)) continue;

            let neighbour = { x: nX, y: nY };
            let distanceToNeighbour = 10;
            let newCostToNeighbour = currentNode.g_cost + distanceToNeighbour;
            let existingOpenNode = OPEN.find(node => node.x === nX && node.y === nY);

            if (!existingOpenNode || newCostToNeighbour < existingOpenNode.g_cost) {
                neighbour.g_cost = newCostToNeighbour;
                neighbour.h_cost = Math.abs(nX - targetNode.x) + Math.abs(nY - targetNode.y);
                neighbour.f_cost = neighbour.g_cost + neighbour.h_cost;
                neighbour.parent = currentNode;

                if (!existingOpenNode) OPEN.push(neighbour);
                else {
                    existingOpenNode.g_cost = neighbour.g_cost;
                    existingOpenNode.f_cost = neighbour.f_cost;
                    existingOpenNode.parent = neighbour.parent;
                }
            }
        }
    }
    return [];
}

function isInLineOfSight(startX, startY, endX, endY) {
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dy * dy + dx * dx);

    const stepSize = 4;
    const totalSteps = distance / stepSize;

    for (let i = 0; i < totalSteps; i++) {
        const progress = i / totalSteps;

        const checkX = startX + dx * progress;
        const checkY = startY + dy * progress;

        if (checkSolidCollision(checkX, checkY, 1)) {
            return true; 
        }
    }

    return false;
}

function isPlayerInConeVision(enemy, playerX, playerY) {
    const distanceToPlayer = Math.sqrt((playerX - enemy.x)**2 + (playerY - enemy.y)**2);

    if (distanceToPlayer > enemy.ROI_RADIUS) return false;

    const angleToPlayer = Math.atan2(playerY - enemy.y, playerX - enemy.x);

    const angularDifference = Math.atan2(
        Math.sin(angleToPlayer - enemy.facingAngle), 
        Math.cos(angleToPlayer - enemy.facingAngle)
    );

    if (Math.abs(angularDifference) > enemy.FOV / 2) return false;

    const eCenterX = enemy.x + (ENEMY_SIZE / 2);
    const eCenterY = enemy.y + (ENEMY_SIZE / 2);

    if (isInLineOfSight(eCenterX, eCenterY, playerX, playerY)) {
        return false;
    }

    return true;
}

// Update Logic 
export function updateEnemies() {
    const now = Date.now();

    for (let i = activeEnemies.length - 1; i >= 0; i--) {
        let enemy = activeEnemies[i];

        let dxToPlayer = (playerXPosition + (PLAYER_SIZE/2)) - (enemy.x + (ENEMY_SIZE/2));
        let dyToPlayer = (playerYPosition + (PLAYER_SIZE/2)) - (enemy.y + (ENEMY_SIZE/2));
        let distanceToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);

        if (distanceToPlayer <= enemy.ROI_RADIUS && isPlayerInConeVision(enemy, playerXPosition, playerYPosition)) {
            enemyShoots(enemy);
        }

        if (enemy.type === 'chaser') {
            if (distanceToPlayer < enemy.ROI_RADIUS * 3.5) { 
                enemy.facingAngle = Math.atan2(dyToPlayer, dxToPlayer);

                if (now - enemy.lastPathCalcTime > 400) { 
                    enemy.lastPathCalcTime = now;
                    enemy.path = findPathAStar(enemy.x, enemy.y, playerXPosition, playerYPosition);
                }
            } else {
                enemy.path = []; 
            }

            if (enemy.path && enemy.path.length > 0) {
                let targetWaypoint = enemy.path[0];
                let dx = targetWaypoint.x - enemy.x;
                let dy = targetWaypoint.y - enemy.y;
                let distanceSq = dx * dx + dy * dy;

                if (distanceSq < 144 || (enemy.path.length === 1 && distanceSq < enemy.moveSpeed**2)) {
                    enemy.path.shift(); 
                } else {
                    let distance = Math.sqrt(distanceSq);
                    let moveX = (dx / distance) * enemy.moveSpeed;
                    let moveY = (dy / distance) * enemy.moveSpeed;
                    let nextX = enemy.x + moveX;
                    let nextY = enemy.y + moveY;
                    let movedX = false; let movedY = false;

                    if (!checkSolidCollision(nextX, enemy.y, ENEMY_SIZE)) { enemy.x = nextX; movedX = true; }
                    if (!checkSolidCollision(enemy.x, nextY, ENEMY_SIZE)) { enemy.y = nextY; movedY = true; }

                    if (!movedX && Math.abs(dx) > 2) {
                        let driftY = enemy.y + (dy > 0 ? enemy.moveSpeed : -enemy.moveSpeed);
                        if (!checkSolidCollision(enemy.x, driftY, ENEMY_SIZE)) enemy.y = driftY;
                    }
                    if (!movedY && Math.abs(dy) > 2) {
                        let driftX = enemy.x + (dx > 0 ? enemy.moveSpeed : -enemy.moveSpeed);
                        if (!checkSolidCollision(driftX, enemy.y, ENEMY_SIZE)) enemy.x = driftX;
                    }
                }
            }
        } 

        else if (enemy.type === 'idle') {
            let angleDiff = Math.atan2(
                Math.sin(enemy.targetAngle - enemy.facingAngle), 
                Math.cos(enemy.targetAngle - enemy.facingAngle)
            );
            enemy.facingAngle += angleDiff * 0.05;

            if (distanceToPlayer > enemy.ROI_RADIUS) {
                if (enemy.patrolState === 'wait') {
                    if (now > enemy.patrolWaitTime) {
                        const directions = [{dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1}];
                        const dir = directions[Math.floor(Math.random() * directions.length)];
                        const walkDist = 20 + (Math.random() * 30);
                        
                        let randomOffset = (Math.random() - 0.5) * (Math.PI / 2);
                        enemy.targetAngle = enemy.facingAngle + randomOffset;

                        enemy.patrolDx = dir.dx;
                        enemy.patrolDy = dir.dy;
                        enemy.patrolTargetX = enemy.x + (dir.dx * walkDist);
                        enemy.patrolTargetY = enemy.y + (dir.dy * walkDist);
                        enemy.patrolState = 'move';
                    }
                } else if (enemy.patrolState === 'move') {
                    let nextX = enemy.x + (enemy.patrolDx * enemy.moveSpeed);
                    let nextY = enemy.y + (enemy.patrolDy * enemy.moveSpeed);
                    
                    let reachedTarget = false;
                    if (enemy.patrolDx > 0 && nextX >= enemy.patrolTargetX) reachedTarget = true;
                    if (enemy.patrolDx < 0 && nextX <= enemy.patrolTargetX) reachedTarget = true;
                    if (enemy.patrolDy > 0 && nextY >= enemy.patrolTargetY) reachedTarget = true;
                    if (enemy.patrolDy < 0 && nextY <= enemy.patrolTargetY) reachedTarget = true;

                    const maxWander = 75; 
                    const outOfBounds = Math.abs(nextX - enemy.spawnX) > maxWander || Math.abs(nextY - enemy.spawnY) > maxWander;
                    const collision = checkSolidCollision(nextX, nextY, ENEMY_SIZE);

                    if (reachedTarget || outOfBounds || collision) {
                        enemy.patrolState = 'wait';
                        enemy.patrolWaitTime = now + 1000; 
                    } else {
                        enemy.x = nextX;
                        enemy.y = nextY;
                    }
                }
            }
        }
    }
}

// Combat Logic 
function enemyShoots(enemy) {
    const now = Date.now();
    let interval = Math.random() * 100 + 750; 
    
    if (enemy.weapon === 'shootLongRanged') interval *= 1.15;
    else if (enemy.weapon === 'shootLaser') interval *= 2;
    else if (enemy.weapon === 'shootRicochetMulti') interval *= 3;

    if (now - enemy.lastShotTime < interval) return; 
    enemy.lastShotTime = now; 

    const eCenterX = enemy.x + (ENEMY_SIZE/2);
    const eCenterY = enemy.y + (ENEMY_SIZE/2);
    const pCenterX = playerXPosition + (PLAYER_SIZE/2);
    const pCenterY = playerYPosition + (PLAYER_SIZE/2);

    fireWeapon('enemy', enemy.weapon, eCenterX, eCenterY, pCenterX, pCenterY);
}

export function damageEnemy(enemyId) {
    let enemyIndex = activeEnemies.findIndex(e => e.id === enemyId);
    if (enemyIndex === -1) return;

    let enemy = activeEnemies[enemyIndex];
    enemy.health -= allowedEnemyDamageScore;

    if (enemy.health <= 0) {
        killEnemy(enemyIndex);
    }
}

function killEnemy(index) {
    // +1 Point and +5secs to the timer
    addScoreAndTime(1, 5000); 
    
    dropLoot(activeEnemies[index].x + (BOX_SIZE / 2), activeEnemies[index].y + (BOX_SIZE / 2)); 
    activeEnemies.splice(index, 1);
}

// Rendering Logic 
export function drawEnemies(ctx) {
    for (let i = 0; i < activeEnemies.length; i++) {
        let enemy = activeEnemies[i];

        // Enemy Sector
        ctx.beginPath();
        ctx.moveTo(enemy.x + (enemy.width / 2), enemy.y + (enemy.height / 2));

        ctx.arc(
            enemy.x + (enemy.width / 2), 
            enemy.y + (enemy.height / 2), 
            enemy.ROI_RADIUS, 
            enemy.facingAngle - (enemy.FOV / 2), 
            enemy.facingAngle + (enemy.FOV / 2)
        );
        ctx.lineTo(enemy.x + (enemy.width / 2), enemy.y + (enemy.height / 2));
        
        let gradient = ctx.createRadialGradient(
            enemy.x + (enemy.width / 2), enemy.y + (enemy.height / 2), 0, 
            enemy.x + (enemy.width / 2), enemy.y + (enemy.height / 2), enemy.ROI_RADIUS
        );
        
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.4)');
        gradient.addColorStop(0.6, 'rgba(255, 0, 0, 0.1)');  
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');      

        ctx.fillStyle = gradient;
        
        ctx.globalCompositeOperation = 'lighter';
        
        ctx.fill();
        ctx.closePath();

        ctx.globalCompositeOperation = 'source-over';

        // Enemy itself
        ctx.beginPath();
        ctx.fillStyle = enemy.color;
        ctx.rect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.fill();
        ctx.closePath();

        // Health Bar
        const barWidth = 30;
        const barHeight = 4;
        const xOffset = enemy.x + (enemy.width / 2) - (barWidth / 2);
        const yOffset = enemy.y - 10; 

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(xOffset, yOffset, barWidth, barHeight);

        const healthPercentage = enemy.health / MAX_ENEMY_HEALTH;
        if (healthPercentage > 0.67) ctx.fillStyle = "greenyellow";
        else if (healthPercentage > 0.34) ctx.fillStyle = "orange";
        else ctx.fillStyle = "red";

        ctx.fillRect(xOffset, yOffset, barWidth * healthPercentage, barHeight);
    }
}

export function resetEnemies() {
    activeEnemies.length = 0;
}