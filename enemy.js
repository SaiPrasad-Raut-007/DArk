const enemyBullets = [];
const MAX_ENEMY_HEALTH = 90;
let allowedEnemyDamageScore = 30;

function generateEnemy(x, y, room, roomKey) {
    const enemy = document.createElement('div');
    const regionOfInfluence = document.createElement('div');
    enemy.className = "enemy";
    regionOfInfluence.style.position = 'absolute';

    const isChaser = Math.random() > 0.75;
    const type = isChaser ? 'chaser' : 'idle';

    if (isChaser) {
        enemy.style.backgroundColor = "rgb(252, 82, 3)";
    }

    const ROI_RADIUS = 75; 
    const enemySize = 15;
    const roiSize = ROI_RADIUS * 2;
    const roiOffset = -(ROI_RADIUS - enemySize / 2);

    regionOfInfluence.style.width = roiSize + 'px';
    regionOfInfluence.style.height = roiSize + 'px';
    regionOfInfluence.style.top = roiOffset + 'px';
    regionOfInfluence.style.left = roiOffset + 'px';
    regionOfInfluence.style.backgroundColor = 'transparent';
    regionOfInfluence.style.borderRadius = '50%';

    const enemyHealthBar = document.createElement('div');
    enemyHealthBar.className = 'health-bar';

    enemy.appendChild(regionOfInfluence);
    enemy.appendChild(enemyHealthBar);

    enemy.style.left = x + 'px'; 
    enemy.style.top = y + 'px';

    room.appendChild(enemy);

    enemyData.push({
        x: x,
        y: y,
        width: 15,
        height: 15,
        element: enemy,
        ROI_RADIUS: ROI_RADIUS,
        lastShotTime: 0, 
        health: MAX_ENEMY_HEALTH,
        healthBar: enemyHealthBar,
        roomKey: roomKey,

        type : type,
        moveSpeed: isChaser ? 0.5 : 0.2,

        path: [],
        lastPathCalcTime: 0,

        spawnX: x, 
        spawnY: y,
        patrolState: 'wait', // 'wait' or 'move'
        patrolWaitTime: Date.now() + Math.random() * 2000,
        patrolTargetX: 0,
        patrolTargetY: 0,
        patrolDx: 0,
        patrolDy: 0
    });
}

function enemyShoots(enemy) {
    const now = Date.now();
    const interval = Math.random() * 500 + 1500; 

    if (now - enemy.lastShotTime < interval) return; 
    enemy.lastShotTime = now; 

    let bulletX = enemy.x;
    let bulletY = enemy.y;

    let dx = x - bulletX;
    let dy = y - bulletY;

    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
        dx /= length;
        dy /= length;
    }

    const bullet = document.createElement('div');
    bullet.className = "bullet";
    bullet.style.transform = `translate(${bulletX}px, ${bulletY}px)`;

    world.appendChild(bullet);

    enemyBullets.push({
        element: bullet,
        x: bulletX,
        y: bulletY,
        dx: dx,
        dy: dy,
        createdAt: Date.now(),
        createdBy: 'enemy',
    });
}

function updateEnemyBullets(speed) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let b = enemyBullets[i];
        if (Date.now() - b.createdAt > 3000) {
            b.element.remove();
            enemyBullets.splice(i, 1);
            continue;
        }
        b.x += b.dx * speed; 
        if (isCollidingBox(b.x, b.y, 10)) {
            b.x -= b.dx * speed; 
            b.dx = -b.dx;        
        }
        b.y += b.dy * speed;
        if (isCollidingBox(b.x, b.y, 10)) {
            b.y -= b.dy * speed; 
            b.dy = -b.dy;        
        }
        b.element.style.transform = `translate(${b.x}px, ${b.y}px)`;
    }
}

function updateEnemyHealth(enemy) {
    const healthPercentage = enemy.health / MAX_ENEMY_HEALTH;
    const newWidth = 30 * healthPercentage;
    
    enemy.healthBar.style.width = newWidth + 'px'; 
    if (healthPercentage > 0.5) {
        enemy.healthBar.style.backgroundColor = "greenyellow";
    } 
    
    else if (healthPercentage > 0.25) {
        enemy.healthBar.style.backgroundColor = "orange";
    } 
    
    else {
        enemy.healthBar.style.backgroundColor = "red";
    }

    if (enemy.health === 0) {
        killEnemy(enemy);
    }
}

function damageEnemy(enemy) {
    enemy.health -= allowedEnemyDamageScore;
    if (enemy.health < 0) enemy.health = 0;
    updateEnemyHealth(enemy);
}

function killEnemy(enemy) {
    enemy.element.remove();
    const index = enemyData.indexOf(enemy);
    if (index > -1) {
        enemyData.splice(index, 1);
    }
}

const GRID_SIZE = 20;

function findPathAStar(startX, startY, targetX, targetY) {
    const startNode = {
        x: Math.round(startX/GRID_SIZE) * GRID_SIZE,
        y: Math.round(startY/GRID_SIZE) * GRID_SIZE,
        g_cost:0,
        h_cost: 0,
        f_cost: 0,
        parent: null
    };
    const targetNode = {
        x: Math.round(targetX/GRID_SIZE) * GRID_SIZE, 
        y: Math.round(targetY/GRID_SIZE) * GRID_SIZE
    }

    let OPEN = [startNode];
    let CLOSED = [];

    let maxIterations = 500;

    while (OPEN.length > 0 && maxIterations > 0) {
        maxIterations--;

        let currentNode = OPEN.reduce((prev, curr) => (curr.f_cost < prev.f_cost ? curr : prev));
        
        OPEN.splice(OPEN.indexOf(currentNode), 1);
        CLOSED.push(currentNode);

        if (currentNode.x === targetNode.x && currentNode.y === targetNode.y) {
            let path = [];
            let curr = currentNode;
            while (curr.parent) {
                path.push({
                    x: currentNode.x,
                    y: currentNode.y
                });
                curr = curr.parent;
            }
            return path.reverse();
        }

        let neighbourOffsets = [
            {dx: 0, dy: -GRID_SIZE}, 
            {dx: 0, dy: GRID_SIZE}, 
            {dx: -GRID_SIZE, dy: 0}, 
            {dx: GRID_SIZE, dy: 0}
        ]

        for (let offset of neighbourOffsets) {
            let nX = currentNode.x + offset.dx;
            let nY = currentNode.y + offset.dy;

            if ((isCollidingBox(nX, nY, 15)) || (CLOSED.some(node => node.x === nX && node.y === nY))) {
                continue;
            };

            let neighbour = {
                x: nX,
                y: nY
            };
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
                } 

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

function updateEnemies() {
    const now = Date.now();

    for (let enemy of enemyData) {
        
        // ==========================================
        // BEHAVIOR 1: THE CHASER (A* Pathfinding)
        // ==========================================
        if (enemy.type === 'chaser') {
            const distToPlayer = Math.sqrt((enemy.x - x)**2 + (enemy.y - y)**2);
            
            if (distToPlayer < enemy.ROI_RADIUS * 3) { 
                if (now - enemy.lastPathCalcTime > 500) {
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
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < enemy.moveSpeed) {
                    enemy.path.shift(); 
                } else {
                    let moveX = (dx / distance) * enemy.moveSpeed;
                    let moveY = (dy / distance) * enemy.moveSpeed;
                    
                    let nextX = enemy.x + moveX;
                    let nextY = enemy.y + moveY;

                    if (!isCollidingBox(nextX, enemy.y, 15)) enemy.x = nextX;
                    if (!isCollidingBox(enemy.x, nextY, 15)) enemy.y = nextY;

                    enemy.element.style.left = enemy.x + 'px';
                    enemy.element.style.top = enemy.y + 'px';
                }
            }
        } 
        
        // =====================
        // BEHAVIOR 2: THE IDLER 
        // =====================
        else if (enemy.type === 'idle') {
            
            if (enemy.patrolState === 'wait') {
                if (now > enemy.patrolWaitTime) {
                    // Pick a random orthogonal direction (Up, Down, Left, Right)
                    const directions = [
                        {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
                        {dx: 0, dy: 1}, {dx: 0, dy: -1}
                    ];
                    const dir = directions[Math.floor(Math.random() * directions.length)];
                    
                    // Pick a random distance to walk (between 20 and 50 pixels)
                    const walkDist = 20 + (Math.random() * 30);
                    
                    enemy.patrolDx = dir.dx;
                    enemy.patrolDy = dir.dy;
                    enemy.patrolTargetX = enemy.x + (dir.dx * walkDist);
                    enemy.patrolTargetY = enemy.y + (dir.dy * walkDist);
                    
                    enemy.patrolState = 'move';
                }
            } 
            
            else if (enemy.patrolState === 'move') {
                let nextX = enemy.x + (enemy.patrolDx * enemy.moveSpeed);
                let nextY = enemy.y + (enemy.patrolDy * enemy.moveSpeed);
                
                // 1. Check if we reached the target distance
                let reachedTarget = false;
                if (enemy.patrolDx > 0 && nextX >= enemy.patrolTargetX) reachedTarget = true;
                if (enemy.patrolDx < 0 && nextX <= enemy.patrolTargetX) reachedTarget = true;
                if (enemy.patrolDy > 0 && nextY >= enemy.patrolTargetY) reachedTarget = true;
                if (enemy.patrolDy < 0 && nextY <= enemy.patrolTargetY) reachedTarget = true;

                // 2. Check if we are wandering too far from our spawn point (prevents leaving doors)
                const maxWander = 75; 
                const outOfBounds = 
                    Math.abs(nextX - enemy.spawnX) > maxWander || 
                    Math.abs(nextY - enemy.spawnY) > maxWander;

                // 3. Check physical wall collisions
                const collision = isCollidingBox(nextX, nextY, 15);

                // If any of these are true, stop walking and go back to waiting
                if (reachedTarget || outOfBounds || collision) {
                    enemy.patrolState = 'wait';
                    enemy.patrolWaitTime = now + 1000 + (Math.random() * 3000); // Wait 1 to 4 seconds
                } else {
                    // Safe to step forward
                    enemy.x = nextX;
                    enemy.y = nextY;
                    enemy.element.style.left = enemy.x + 'px';
                    enemy.element.style.top = enemy.y + 'px';
                }
            }
        }
    }
}
