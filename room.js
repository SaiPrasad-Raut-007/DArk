const ROOM_STRIDE = 170; 
let activeRooms = {};

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
        } else {
            if (i % 2 === 0) {
                const dw = (config.w - openingSize) / 2;
                piecesToDraw.push({ left: config.left, top: config.top, w: dw, h: config.h });
                piecesToDraw.push({ left: config.left + dw + openingSize, top: config.top, w: dw, h: config.h });
            } else {
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
            x: piece.left, y: piece.top,
            width: piece.w, height: piece.h,
            roomKey: roomKey
        });
    });

    world.appendChild(boxContainer);

    let isLootBox = false;
    if (Math.random() > 0.95) {
        isLootBox = true;
        generateLootBox(x + (width/2) - 10 + thickness*0.5, y + (height/2) - 10 + thickness*0.5);
    }
    const shouldGenerateZoneFactor = isLootBox ? 0.99 : 0.95;
    const shouldGenerateZone = Math.random() > shouldGenerateZoneFactor;

    if (shouldGenerateZone) {
        generateZone(x, y, width, height);
    } 
    
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
    if (isLootBox) {
        const altEnemyPos = enemyPosOptions[Math.floor(Math.random() * 4)]
        generateEnemy(altEnemyPos[0], altEnemyPos[1], boxContainer, roomKey);
        isLootBox = false;
    }
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
            if (!activeRooms[roomKey]) {
                const roomPixelX = col * ROOM_STRIDE;
                const roomPixelY = row * ROOM_STRIDE;
                activeRooms[roomKey] = drawBox(roomPixelX, roomPixelY, roomKey);       
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