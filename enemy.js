const enemyBullets = [];

function generateEnemy(x, y, room) {
    const enemy = document.createElement('div');
    const regionOfInfluence = document.createElement('div');

    enemy.className = "enemy";

    regionOfInfluence.style.position = 'absolute';
    const ROI_RADIUS = 75; 
    const enemySize = 20;
    const roiSize = ROI_RADIUS * 2;
    const roiOffset = -(ROI_RADIUS - enemySize / 2);

    regionOfInfluence.style.width = roiSize + 'px';
    regionOfInfluence.style.height = roiSize + 'px';
    regionOfInfluence.style.top = roiOffset + 'px';
    regionOfInfluence.style.left = roiOffset + 'px';

    regionOfInfluence.style.backgroundColor = 'rgba(255, 0, 0, 0.25)';
    regionOfInfluence.style.borderRadius = '50%';
    
    enemy.appendChild(regionOfInfluence);

    enemy.style.left = x + 'px'; 
    enemy.style.top = y + 'px';

    room.appendChild(enemy);

    enemyData.push({
        x: x,
        y: y,
        width: 20,
        height: 20,
        element: enemy,
        ROI_RADIUS: ROI_RADIUS,
        lastShotTime: 0, // add this
    });
}

function damageEnemy() {
}

function killEnemy() {
}

function enemyShoots(enemy) {
    const now = Date.now();
    const interval = Math.random() * 500 + 500; // random between 500ms and 1000ms

    if (now - enemy.lastShotTime < interval) return; // not time yet
    enemy.lastShotTime = now; // update last shot time

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
    gameContainer.appendChild(bullet);

    enemyBullets.push({
        element:bullet,
        x: bulletX,
        y: bulletY,
        dx: dx,
        dy: dy,
        createdAt: Date.now(),
        createdBy: 'enemy',
    })

    console.log("Enemy Shoots")
}

function updateEnemyBullets(speed) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let b = enemyBullets[i];

        if (Date.now() - b.createdAt > 1000) {
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

        if (b.x < 0 || b.x > containerWidth || b.y < 0 || b.y > containerHeight) {
            b.element.remove();      
            bullets.splice(i, 1);    
        }
    }
}