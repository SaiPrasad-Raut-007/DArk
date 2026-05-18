function collisionBox(x, y, playerSize) {
    const walls = document.getElementsByClassName('wall');

    for (let i = 0; i < walls.length; i++) {
        let currentWall = walls[i];

        let wallWidth = currentWall.clientWidth;
        let wallHeight = currentWall.clientHeight;
        let wallXPos = currentWall.offsetLeft;
        let wallYPos = currentWall.offsetTop;

        if (wallXPos < x + playerSize && x < (wallXPos + wallWidth) && wallYPos < y + playerSize && y < (wallYPos + wallHeight)) {
            return true; 
        }
    }

    return false; 
}