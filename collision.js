const ROI_RADIUS = 75;
let wallData = [];
let enemyData = [];

function isCollidingBox(x, y, playerSize) {
    for (let i = 0; i < wallData.length; i++) {
        let wall = wallData[i];
        if (wall.x < x + playerSize && x < (wall.x + wall.width) && wall.y < y + playerSize && y < (wall.y + wall.height)) {
            return true; 
        }
    }
    
    if (typeof lootBoxesData !== 'undefined') {
        for (let i = 0; i < lootBoxesData.length; i++) {
            let box = lootBoxesData[i];
            if (box.x < x + playerSize && x < (box.x + box.boxSize) && box.y < y + playerSize && y < (box.y + box.boxSize)) {
                return true;
            }
        }
    }
    
    return false; 
}

function checkEnemyHits(playerBullets) {
    const bulletSize = 10; 
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        let b = playerBullets[i];
        for (let j = enemyData.length - 1; j >= 0; j--) {
            let enemy = enemyData[j];
            if (
                b.x < enemy.x + enemy.width && 
                b.x + bulletSize > enemy.x && 
                b.y < enemy.y + enemy.height && 
                b.y + bulletSize > enemy.y
            ) {
                b.element.remove();
                playerBullets.splice(i, 1);
                damageEnemy(enemy);
                break; 
            }
        }
    }
}

function isPlayerInROI(playerX, playerY) {
    for (let i = 0; i < enemyData.length; i++) {
        let enemy = enemyData[i];
        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;
        const playerCenterX = playerX + 15 / 2;
        const playerCenterY = playerY + 15 / 2;

        const dist = Math.sqrt((playerCenterX - enemyCenterX) ** 2 + (playerCenterY - enemyCenterY) ** 2);
        if (dist < ROI_RADIUS) return enemy;
    }
    return null;
}

function isPlayerHit(enemyBullets, playerX, playerY) {
    const playerSize = 15; 
    const bulletSize = 10; 

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let b = enemyBullets[i];
        if (
            b.x < playerX + playerSize && 
            b.x + bulletSize > playerX && 
            b.y < playerY + playerSize && 
            b.y + bulletSize > playerY   
        ) {
            b.element.remove();
            enemyBullets.splice(i, 1);
            return true; 
        }
    }
    return false; 
}

function checkLootHits(playerBullets) {
    const bulletSize = 10; 
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        let b = playerBullets[i];
        for (let j = lootBoxesData.length - 1; j >= 0; j--) {
            let box = lootBoxesData[j];
            if (
                b.x < box.x + box.boxSize && 
                b.x + bulletSize > box.x && 
                b.y < box.y + box.boxSize && 
                b.y + bulletSize > box.y
            ) {
                b.element.remove();
                playerBullets.splice(i, 1);
                damageBox(box);
                break; 
            }
        }
    }
}