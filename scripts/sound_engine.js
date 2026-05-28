const effect = new Audio('assets/sounds/effect.wav');
const reload = new Audio('assets/sounds/reload.mp3')
const hurt = new Audio('assets/sounds/hurt.mp3')
const dead = new Audio('assets/sounds/dead.mp3');
const gameLoop = new Audio('assets/sounds/game loop.mp3');
gameLoop.loop = true;

export function playRangedShoot() {
    const rangedShoot = new Audio('assets/sounds/ranged shoot.mp3');
    rangedShoot.preservesPitch = false;
    rangedShoot.currentTime = 0.05;

    const randomPitchFactor = Math.random() * (1 - 0.75) + 0.75; 

    rangedShoot.playbackRate = 0.1 + randomPitchFactor;
    rangedShoot.volume = 0.75;
    rangedShoot.play()
}

export function playLaser() {
    const laser = new Audio('assets/sounds/laser.mp3');
    laser.preservesPitch = false;

    const randomPitchFactor = Math.random() * (1 - 0.25) + 0.25;

    laser.playbackRate = 1.5 + randomPitchFactor;
    laser.currentTime = 0;
    laser.play()
}

export function playRicochetSingle() {
    const ricochetSingle = new Audio('assets/sounds/ricochet.mp3');
    ricochetSingle.preservesPitch = false;

    const randomPitchFactor = Math.random() * (1 - 0.5) + 0.5;

    ricochetSingle.currentTime = 0;
    ricochetSingle.playbackRate = 0.5 + randomPitchFactor;
    ricochetSingle.volume = 0.65;
    ricochetSingle.play();
}

export function playRicochetMulti() {  
    const ricochetMulti = new Audio('assets/sounds/ricochet.mp3');
    ricochetMulti.preservesPitch = false;

    const randomPitchFactor = Math.random() * (0.65 - 0.55) + 0.55;

    ricochetMulti.currentTime = 0;
    ricochetMulti.playbackRate = 0.25 + randomPitchFactor;
    ricochetMulti.volume = 0.75;
    ricochetMulti.play();
}

export function playEffect() {
    effect.currentTime = 0;
    effect.volume = 0.55;
    effect.play()
}

export function playReload() {
    reload.currentTime = 0;
    reload.volume = 0.85;
    reload.play();
}

export function playHurt() {
    hurt.currentTime = 0;
    hurt.play();
}

export function playDead() {
    dead.currentTime = 0;
    dead.play()
}

export function playBulletBounce() {
    const bulletBounce = new Audio('assets/sounds/bounce.mp3');

    bulletBounce.currentTime = 0;
    bulletBounce.volume = 0.05;
    bulletBounce.play();
}

export function playGameLoop() {
    gameLoop.currentTime = 0;
    gameLoop.volume = 0.45;
    gameLoop.play()
}

export function pauseGameLoop() {
    gameLoop.pause();
    gameLoop.currentTime = 0;
}