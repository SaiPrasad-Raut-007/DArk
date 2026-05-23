const enemyBullets = [];
const MAX_ENEMY_HEALTH = 90;
let allowedEnemyDamageScore = 30;

const GRID_SIZE = 20; 
const PATH_FOOTPRINT = 19; 
let debugPath = false; 
let debugElements = [];

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

function getClosestValidGridNode(pixelX, pixelY) {
    let snappedX = Math.round(pixelX / GRID_SIZE) * GRID_SIZE;
    let snappedY = Math.round(pixelY / GRID_SIZE) * GRID_SIZE;
    
    if (!isCollidingBox(snappedX, snappedY, PATH_FOOTPRINT)) {
        return { x: snappedX, y: snappedY };
    }
    
    let alternatives = [
        { x: snappedX - GRID_SIZE, y: snappedY },
        { x: snappedX + GRID_SIZE, y: snappedY },
        { x: snappedX, y: snappedY - GRID_SIZE },
        { x: snappedX, y: snappedY + GRID_SIZE },
        { x: snappedX - GRID_SIZE, y: snappedY - GRID_SIZE },
        { x: snappedX + GRID_SIZE, y: snappedY - GRID_SIZE },
        { x: snappedX - GRID_SIZE, y: snappedY + GRID_SIZE },
        { x: snappedX + GRID_SIZE, y: snappedY + GRID_SIZE }
    ];
    
    alternatives.sort((a, b) => {
        let distA = (a.x - pixelX)**2 + (a.y - pixelY)**2;
        let distB = (b.x - pixelX)**2 + (b.y - pixelY)**2;
        return distA - distB;
    });
    
    for (let alt of alternatives) {
        if (!isCollidingBox(alt.x, alt.y, PATH_FOOTPRINT)) {
            return alt;
        }
    }
    
    return { x: snappedX, y: snappedY }; 
}

function findPathAStar(startX, startY, targetX, targetY) {
    const startNode = getClosestValidGridNode(startX, startY);
    startNode.g_cost = 0;
    startNode.h_cost = 0;
    startNode.f_cost = 0;
    startNode.parent = null;

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
            while (curr.parent) {
                path.push({ x: curr.x, y: curr.y });
                curr = curr.parent;
            }
            return path.reverse();
        }

        let neighbourOffsets = [
            {dx: 0, dy: -GRID_SIZE}, {dx: 0, dy: GRID_SIZE}, 
            {dx: -GRID_SIZE, dy: 0}, {dx: GRID_SIZE, dy: 0}
        ];

        for (let offset of neighbourOffsets) {
            let nX = currentNode.x + offset.dx;
            let nY = currentNode.y + offset.dy;

            if (isCollidingBox(nX, nY, PATH_FOOTPRINT) || CLOSED.some(node => node.x === nX && node.y === nY)) {
                continue;
            }

            let halfX = currentNode.x + (offset.dx / 2);
            let halfY = currentNode.y + (offset.dy / 2);
            if (isCollidingBox(halfX, halfY, PATH_FOOTPRINT)) {
                continue;
            }

            let neighbour = { x: nX, y: nY };
            let distanceToNeighbour = 10;
            let newCostToNeighbour = currentNode.g_cost + distanceToNeighbour;
            let existingOpenNode = OPEN.find(node => node.x === nX && node.y === nY);

            if (!existingOpenNode || newCostToNeighbour < existingOpenNode.g_cost) {
                neighbour.g_cost = newCostToNeighbour;
                neighbour.h_cost = Math.abs(nX - targetNode.x) + Math.abs(nY - targetNode.y);
                neighbour.f_cost = neighbour.g_cost + neighbour.h_cost;
                neighbour.parent = currentNode;

                if (!existingOpenNode) {
                    OPEN.push(neighbour);
                } else {
                    existingOpenNode.g_cost = neighbour.g_cost;
                    existingOpenNode.f_cost = neighbour.f_cost;
                    existingOpenNode.parent = neighbour.parent;
                }
            }
        }
    }
    return [];
}

function drawPathVisualizer() {
    for (let el of debugElements) el.remove();
    debugElements = [];
    if (!debugPath) return;
    const gameWorld = document.getElementById('world');
    if (!gameWorld) return;

    for (let enemy of enemyData) {
        if (enemy.type === 'chaser' && enemy.path && enemy.path.length > 0) {
            for (let node of enemy.path) {
                let dot = document.createElement('div');
                dot.style.position = 'absolute';
                dot.style.width = '6px';
                dot.style.height = '6px';
                dot.style.backgroundColor = 'fuchsia';
                dot.style.borderRadius = '50%';
                dot.style.left = (node.x + 7) + 'px'; 
                dot.style.top = (node.y + 7) + 'px';
                dot.style.zIndex = "1000"; 
                gameWorld.appendChild(dot);
                debugElements.push(dot);
            }
        }
    }
}

function generateEnemy(x, y, room, roomKey) {
    const enemy = document.createElement('div');  
    enemy.className = "enemy";

    const isChaser = Math.random() > 0.75; 
    const type = isChaser ? 'chaser' : 'idle';

    if (isChaser) enemy.style.backgroundColor = "rgb(192, 44, 7)";

    const ROI_RADIUS = 75; 
    const enemySize = 15;
    const roiSize = ROI_RADIUS * 2;
    const roiOffset = -(ROI_RADIUS - enemySize / 2);

    const enemyHealthBar = document.createElement('div');
    enemyHealthBar.className = 'health-bar';

    enemy.appendChild(enemyHealthBar);

    enemy.style.left = '0px'; 
    enemy.style.top = '0px';
    enemy.style.transform = `translate(${x}px, ${y}px)`;

    room.appendChild(enemy);

    const assignedWeapon = getWeightedRandomWeapon();

    enemyData.push({
        x: x, y: y,
        width: 15, height: 15,
        element: enemy,
        ROI_RADIUS: ROI_RADIUS,
        lastShotTime: 0, 
        health: MAX_ENEMY_HEALTH,
        healthBar: enemyHealthBar,
        roomKey: roomKey,
        type: type,
        moveSpeed: isChaser ? 0.4 : 0.2,
        path: [],
        lastPathCalcTime: 0,
        spawnX: x, spawnY: y,
        patrolState: 'wait',
        patrolWaitTime: Date.now() + 1000, 
        patrolTargetX: 0, patrolTargetY: 0,
        patrolDx: 0, patrolDy: 0,
        weapon: assignedWeapon
    });
}

function updateEnemies() {
    const now = Date.now();

    for (let enemy of enemyData) {
        let dxToPlayer = (x + 7.5) - (enemy.x + 7.5);
        let dyToPlayer = (y + 7.5) - (enemy.y + 7.5);
        let distanceToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);

        if (distanceToPlayer <= enemy.ROI_RADIUS) {
            enemyShoots(enemy);
        }

        if (enemy.type === 'chaser') {
            if (distanceToPlayer < enemy.ROI_RADIUS * 3.5) { 
                if (now - enemy.lastPathCalcTime > 400) { 
                    enemy.lastPathCalcTime = now;
                    enemy.path = findPathAStar(enemy.x, enemy.y, x, y);
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
                    let movedX = false;
                    let movedY = false;

                    if (!isCollidingBox(nextX, enemy.y, 15)) {
                        enemy.x = nextX;
                        movedX = true;
                    }
                    if (!isCollidingBox(enemy.x, nextY, 15)) {
                        enemy.y = nextY;
                        movedY = true;
                    }

                    if (!movedX && Math.abs(dx) > 2) {
                        let driftY = enemy.y + (dy > 0 ? enemy.moveSpeed : -enemy.moveSpeed);
                        if (!isCollidingBox(enemy.x, driftY, 15)) enemy.y = driftY;
                    }

                    if (!movedY && Math.abs(dy) > 2) {
                        let driftX = enemy.x + (dx > 0 ? enemy.moveSpeed : -enemy.moveSpeed);
                        if (!isCollidingBox(driftX, enemy.y, 15)) enemy.x = driftX;
                    }

                    enemy.element.style.transform = `translate(${enemy.x}px, ${enemy.y}px)`;
                }
            }
        } 
        else if (enemy.type === 'idle') {
            if (distanceToPlayer > enemy.ROI_RADIUS) {
                if (enemy.patrolState === 'wait') {
                    if (now > enemy.patrolWaitTime) {
                        const directions = [{dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1}];
                        const dir = directions[Math.floor(Math.random() * directions.length)];
                        const walkDist = 20 + (Math.random() * 30);
                        
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
                    const collision = isCollidingBox(nextX, nextY, 15);

                    if (reachedTarget || outOfBounds || collision) {
                        enemy.patrolState = 'wait';
                        enemy.patrolWaitTime = now + 1000; 
                    } else {
                        enemy.x = nextX;
                        enemy.y = nextY;
                        enemy.element.style.transform = `translate(${enemy.x}px, ${enemy.y}px)`;
                    }
                }
            }
        }
    }
    drawPathVisualizer();
}

function enemyShoots(enemy) {
    const now = Date.now();
    let interval = Math.random() * 100 + 750; 
    
    if (enemy.weapon === 'shootLongRanged') {
        interval *= 1.15;
    } else if (enemy.weapon === 'shootLaser') {
        interval *= 2;
    } else if (enemy.weapon === 'shootRicochetMulti') {
        interval *= 3;
    }

    if (now - enemy.lastShotTime < interval) return; 
    enemy.lastShotTime = now; 

    window[enemy.weapon]('enemy', enemy.x, enemy.y, x, y);
}

function updateEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let b = enemyBullets[i];
        
        if (Date.now() - b.createdAt > b.lifeSpan) {
            b.element.remove();
            enemyBullets.splice(i, 1);
            continue; 
        }

        b.x += b.dx * b.speed; 
        if (!b.isLaser && isCollidingBox(b.x, b.y, 10)) {
            if (b.bounces > 0) {
                b.bounces--;
                b.x -= b.dx * b.speed; 
                b.dx = -b.dx;
            } else {
                b.element.remove();
                enemyBullets.splice(i, 1);
                continue;
            }
        }

        b.y += b.dy * b.speed;
        if (!b.isLaser && isCollidingBox(b.x, b.y, 10)) { 
            if (b.bounces > 0) {
                b.bounces--;
                b.y -= b.dy * b.speed; 
                b.dy = -b.dy; 
            } else {
                b.element.remove();
                enemyBullets.splice(i, 1);
                continue;
            }       
        }
        b.element.style.transform = `translate(${b.x}px, ${b.y}px)`;
    }
}

function updateEnemyHealth(enemy) {
    const healthPercentage = enemy.health / MAX_ENEMY_HEALTH;
    const newWidth = 30 * healthPercentage;
    
    enemy.healthBar.style.width = newWidth + 'px'; 
    if (healthPercentage > 0.67) {
        enemy.healthBar.style.backgroundColor = "greenyellow";
    } else if (healthPercentage > 0.34) {
        enemy.healthBar.style.backgroundColor = "orange";
    } else {
        enemy.healthBar.style.backgroundColor = "red";
    }

    if (enemy.health === 0) killEnemy(enemy);
}

function damageEnemy(enemy) {
    enemy.health -= allowedEnemyDamageScore;
    if (enemy.health < 0) enemy.health = 0;
    updateEnemyHealth(enemy);
}

function killEnemy(enemy) {
    playerScore += 1;
    timer += 5000;
    dropLoot(enemy.x, enemy.y);
    enemy.element.remove();
    const index = enemyData.indexOf(enemy);
    if (index > -1) {
        enemyData.splice(index, 1);
    }
}