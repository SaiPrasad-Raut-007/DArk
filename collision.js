const ROI_RADIUS = 75;
let wallData = [];
let enemyData = [];

function isCollidingBox(x, y, playerSize, ignoreLootBoxes = false) {
    const xEnd = x + playerSize;
    const yEnd = y + playerSize;
    const wLen = wallData.length;

    for (let i = 0; i < wLen; i++) {
        let wall = wallData[i];
        if (wall.x < xEnd && x < (wall.x + wall.width) && wall.y < yEnd && y < (wall.y + wall.height)) {
            return true; 
        }
    }
    
    if (!ignoreLootBoxes && typeof lootBoxesData !== 'undefined') {
        const lLen = lootBoxesData.length;
        for (let i = 0; i < lLen; i++) {
            let box = lootBoxesData[i];
            if (box.x < xEnd && x < (box.x + box.boxSize) && box.y < yEnd && y < (box.y + box.boxSize)) {
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