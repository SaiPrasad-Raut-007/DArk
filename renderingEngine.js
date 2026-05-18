function drawBox(x, y, width = 100, height = 100, thickness = 4, openingSize = 40) {
    const doorIndex = Math.floor(Math.random() * 4);
    const boxContainer = document.createElement('div');

    const wallConfigs = [
        { left: x, top: y, w: width + thickness, h: thickness }, // Top Wall
        { left: x + width, top: y, w: thickness, h: height + thickness }, // Right Wall
        { left: x, top: y + height, w: width + thickness, h: thickness }, // Bottom wall
        { left: x, top: y, w: thickness, h: height + thickness } // Left Wall 
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
    });

    gameContainer.appendChild(boxContainer);
}

for (let x = 100; x < ((100 + 70) * 10); x += 100 + 70) {
    for (let y = 100; y < ((100 + 70) * 5); y += 100 + 70) {
        drawBox(x, y)
    }
}
