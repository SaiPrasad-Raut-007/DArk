let currentWeapon = 'shootRicochetSingle';

function spawnBullet(hostType, startX, startY, dirX, dirY, config) {
    const bullet = document.createElement('div');
    bullet.className = "bullet";
    
    bullet.style.backgroundColor = config.color;
    bullet.style.transform = `translate(${startX}px, ${startY}px)`;
    
    world.appendChild(bullet);

    const bulletData = {
        element: bullet,
        x: startX, 
        y: startY,
        dx: dirX, 
        dy: dirY,
        speed: config.speed || 3,
        bounces: config.bounces || 0,
        createdAt: Date.now(),
        lifeSpan: config.lifeSpan || 3000,
        isLaser: config.isLaser || false
    };

    if (hostType === 'player') {
        bullets.push(bulletData);
    } else {
        enemyBullets.push(bulletData);
    }
}

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

function shootShortRanged(hostType, startX, startY, targetX, targetY) {
    const { dx, dy } = getNormalizedDirection(startX, startY, targetX, targetY);
    spawnBullet(hostType, startX, startY, dx, dy, { 
        speed: 4, 
        lifeSpan: 250,
        color: '#78909C' 
    });
}

function shootLongRanged(hostType, startX, startY, targetX, targetY) {
    const { dx, dy } = getNormalizedDirection(startX, startY, targetX, targetY);
    spawnBullet(hostType, startX, startY, dx, dy, { 
        speed: 5, 
        lifeSpan: 3000,
        color: '#00695C' 
    });
}

function shootLaser(hostType, startX, startY, targetX, targetY) {
    const { dx, dy } = getNormalizedDirection(startX, startY, targetX, targetY);
    spawnBullet(hostType, startX, startY, dx, dy, { 
        speed: 6, 
        lifeSpan: 1500,
        isLaser: true,
        color: 'rgb(77, 76, 254)'
    });
}

function shootRicochetSingle(hostType, startX, startY, targetX, targetY) {
    const { dx, dy } = getNormalizedDirection(startX, startY, targetX, targetY);
    spawnBullet(hostType, startX, startY, dx, dy, { 
        speed: 4, 
        lifeSpan: 5000,
        bounces: 1000,
        color: '#FFB300'
    });
}

function shootRicochetMulti(hostType, startX, startY, targetX, targetY) {
    const { dx, dy } = getNormalizedDirection(startX, startY, targetX, targetY);
    const spreadAngle = 30; 
    const radians = spreadAngle * (Math.PI / 180);

    const leftDx = dx * Math.cos(-radians) - dy * Math.sin(-radians);
    const leftDy = dx * Math.sin(-radians) + dy * Math.cos(-radians);

    const rightDx = dx * Math.cos(radians) - dy * Math.sin(radians);
    const rightDy = dx * Math.sin(radians) + dy * Math.cos(radians);

    const config = { speed: 4, lifeSpan: 5000, bounces: 1000, color: '#FF6D00' };

    spawnBullet(hostType, startX, startY, dx, dy, config); 
    spawnBullet(hostType, startX, startY, leftDx, leftDy, config); 
    spawnBullet(hostType, startX, startY, rightDx, rightDy, config); 
}