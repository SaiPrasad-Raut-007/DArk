const ROI_RADIUS = 75;

const wallData = [];
const enemyData = [];

function isCollidingBox(x, y, playerSize) {
    for (let i = 0; i < wallData.length; i++) {
        let wall = wallData[i];

        if (wall.x < x + playerSize && x < (wall.x + wall.width) && wall.y < y + playerSize && y < (wall.y + wall.height)) {
            return true; 
        }
    }
    return false; 
}

function isCollidingEnemy(x, y, EnemySize = 20) {
    for (let i = 0; i < enemyData.length; i++) {
        let enemy = enemyData[i];

        if (enemy.x < x + EnemySize && x < (enemy.x + enemy.width) && enemy.y < y + EnemySize && y < (enemy.y + enemy.height)) {
            return true;
        }
    }
    return false;
}

function isPlayerInROI(playerX, playerY) {
    for (let i = 0; i < enemyData.length; i++) {
        let enemy = enemyData[i];
        
        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;
        
        const playerCenterX = playerX + playerSize / 2;
        const playerCenterY = playerY + playerSize / 2;
        
        const dist = Math.sqrt(
            (playerCenterX - enemyCenterX) ** 2 + 
            (playerCenterY - enemyCenterY) ** 2
        );

        if (dist < ROI_RADIUS) return enemy;
    }
    return null;
}