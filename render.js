const world = document.getElementById('world');

let cameraOffsetX = 0;
let cameraOffsetY = 0;

function updateCamera() {
    const screenCenterX = gameContainer.clientWidth / 2;
    const screenCenterY = gameContainer.clientHeight / 2;

    cameraOffsetX = screenCenterX - x - (15 / 2); 
    cameraOffsetY = screenCenterY - y - (15 / 2);

    world.style.transform = `translate(${cameraOffsetX}px, ${cameraOffsetY}px)`;
}

function updateGame() {
    moveAndSlide(SPEED);
    updateCamera(); 
    manageInfiniteWorld(); 
    playerShoots();
    rotateSector();
    updatePlayerBullets(BULLET_SPEED);
    updateEnemyBullets(BULLET_SPEED);
    updateEnemies();

    const enemyInRange = isPlayerInROI(x, y);
    if (enemyInRange) enemyShoots(enemyInRange); 

    if (isPlayerHit(enemyBullets, x, y)) damagePlayer();

    pickUpDrop(x, y);
    checkEnemyHits(bullets); 
    checkLootHits(bullets);
    despawnDroppedItem();
    updatePlayerHealth();

    requestAnimationFrame(updateGame);
}

requestAnimationFrame(updateGame);