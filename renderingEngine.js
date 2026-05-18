const world = document.getElementById('world');

let cameraOffsetX = 0;
let cameraOffsetY = 0;

const ROOM_STRIDE = 170; 
const worldData = {}; 
const activeRooms = {};

function updateCamera() {
    const screenCenterX = gameContainer.clientWidth / 2;
    const screenCenterY = gameContainer.clientHeight / 2;

    cameraOffsetX = screenCenterX - x - (15 / 2); 
    cameraOffsetY = screenCenterY - y - (15 / 2);

    world.style.transform = `translate(${cameraOffsetX}px, ${cameraOffsetY}px)`;
}

function drawBox(x, y, roomKey, width = 100, height = 100, thickness = 4, openingSize = 40) {
    const doorIndex = Math.floor(Math.random() * 4);
    const boxContainer = document.createElement('div');
    boxContainer.className = "room";

    const wallConfigs = [
        { left: x, top: y, w: width + thickness, h: thickness }, 
        { left: x + width, top: y, w: thickness, h: height + thickness },
        { left: x, top: y + height, w: width + thickness, h: thickness }, 
        { left: x, top: y, w: thickness, h: height + thickness } 
    ];

    const piecesToDraw = [];
    wallConfigs.forEach((config, i) => {
        if (i !== doorIndex) {
            piecesToDraw.push(config);
        } 
        
        else {
            if (i % 2 === 0) {
                const dw = (config.w - openingSize) / 2;
                piecesToDraw.push({ left: config.left, top: config.top, w: dw, h: config.h });
                piecesToDraw.push({ left: config.left + dw + openingSize, top: config.top, w: dw, h: config.h });
            } 
            
            else {
                const dh = (config.h - openingSize) / 2;
                piecesToDraw.push({ left: config.left, top: config.top, w: config.w, h: dh });
                piecesToDraw.push({ left: config.left, top: config.top + dh + openingSize, w: config.w, h: dh });
            }
        }
    });

    piecesToDraw.forEach(piece => {
        const wall = document.createElement("div");
        wall.className = "wall";
        wall.style.left = piece.left + 'px';
        wall.style.top = piece.top + 'px';
        wall.style.width = piece.w + 'px';
        wall.style.height = piece.h + 'px';

        boxContainer.appendChild(wall);

        wallData.push({
            x: piece.left,
            y: piece.top,
            width: piece.w,
            height: piece.h,
            roomKey: roomKey
        });
    });

    world.appendChild(boxContainer);

    const enemySize = 20; 
    const padding = 10;

    const enemyPosOptions = [
        [x + padding, y + padding], 
        [x + width + 2*thickness - padding - enemySize, y + padding], 
        [x + padding, y + height + 2*thickness - padding - enemySize], 
        [x + width + 2*thickness - padding - enemySize, y + height + 2*thickness - padding - enemySize] 
    ];

    const enemyPos = enemyPosOptions[Math.floor(Math.random() * 4)];

    generateEnemy(enemyPos[0], enemyPos[1], boxContainer, roomKey);
    return boxContainer; 
}

function manageInfiniteWorld() {
    const playerCellX = Math.floor(x / ROOM_STRIDE);
    const playerCellY = Math.floor(y / ROOM_STRIDE);

    const screenWidthCells = Math.ceil((gameContainer.clientWidth / 2) / ROOM_STRIDE);
    const screenHeightCells = Math.ceil((gameContainer.clientHeight / 2) / ROOM_STRIDE);

    const RENDER_DISTANCE = Math.max(screenWidthCells, screenHeightCells) + 2; 

    const requiredRooms = new Set();

    for (let col = playerCellX - RENDER_DISTANCE; col <= playerCellX + RENDER_DISTANCE; col++) {
        for (let row = playerCellY - RENDER_DISTANCE; row <= playerCellY + RENDER_DISTANCE; row++) {
            const roomKey = `${col},${row}`;
            requiredRooms.add(roomKey);
            if (!worldData[roomKey]) {
                const roomPixelX = col * ROOM_STRIDE;
                const roomPixelY = row * ROOM_STRIDE;

                const htmlElement = drawBox(roomPixelX, roomPixelY, roomKey); 

                worldData[roomKey] = { generated: true }; 

                activeRooms[roomKey] = htmlElement;       
            } else if (!activeRooms[roomKey]) {
                const roomPixelX = col * ROOM_STRIDE;
                const roomPixelY = row * ROOM_STRIDE;

                const htmlElement = drawBox(roomPixelX, roomPixelY, roomKey);

                activeRooms[roomKey] = htmlElement;
            }
        }
    }
    for (const roomKey in activeRooms) {
        if (!requiredRooms.has(roomKey)) {
            activeRooms[roomKey].remove();
            delete activeRooms[roomKey];
            wallData = wallData.filter(wall => wall.roomKey !== roomKey);
            enemyData = enemyData.filter(enemy => enemy.roomKey !== roomKey);
        }
    }
}

function updateGame() {
    moveAndSlide(SPEED);

    updateCamera(); 
    manageInfiniteWorld(); 
    playerShoots();

    updatePlayerBullets(BULLET_SPEED);
    updateEnemyBullets(BULLET_SPEED);

    const enemyInRange = isPlayerInROI(x, y);

    if (enemyInRange) {
        enemyShoots(enemyInRange); 
    }

    if (isPlayerHit(enemyBullets, x, y)) {
        damagePlayer();
    }

    checkEnemyHits(bullets); 
    updatePlayerHealth();

    requestAnimationFrame(updateGame);
}

requestAnimationFrame(updateGame);