const enemyBullets = [];
const MAX_ENEMY_HEALTH = 100;
let allowedEnemyDamageScore = 25;

function generateEnemy(x, y, room, roomKey) {
    const enemy = document.createElement('div');
    const regionOfInfluence = document.createElement('div');
    enemy.className = "enemy";
    regionOfInfluence.style.position = 'absolute';

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
        roomKey: roomKey
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