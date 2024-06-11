const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let player;
let map;
let pressX;
let zones = [];
let overlayImage;
let closeButton;
let isOverlayVisible = false;
let joystickBase;
let joystickThumb;
let isDragging = false;
let dragStartX, dragStartY;
let mobileXButton;

function preload() {
    this.load.image('map', 'assets/map.png');
    this.load.spritesheet('character', 'assets/character.png', { frameWidth: 48, frameHeight: 64 });
    this.load.image('pressX', 'assets/pressX.png');
    this.load.image('overlay', 'assets/1.png');
    this.load.image('closeIcon', 'assets/closeIcon.png');
    this.load.image('joystickBase', 'assets/JoystickSplitted.png');
    this.load.image('joystickThumb', 'assets/LargeHandleFilled.png');
    this.load.image('mobileXButton', 'assets/X.png');
}

function create() {
    // Добавляем карту и центрируем её
    map = this.add.image(0, 0, 'map').setOrigin(0.5, 0.5);
    map.setPosition(this.cameras.main.width / 2, this.cameras.main.height / 2);

    // Масштабируем карту, чтобы она занимала весь экран
    let scaleX = this.cameras.main.width / map.width;
    let scaleY = this.cameras.main.height / map.height;
    let scale = Math.max(scaleX, scaleY);
    map.setScale(scale);

    // Добавляем игрока
    player = this.physics.add.sprite(400, 300, 'character');
    this.cursors = this.input.keyboard.createCursorKeys();

    // Создаем анимации
    this.anims.create({
        key: 'walk_down',
        frames: this.anims.generateFrameNumbers('character', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
    });

    this.anims.create({
        key: 'walk_left',
        frames: this.anims.generateFrameNumbers('character', { start: 4, end: 7 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'walk_right',
        frames: this.anims.generateFrameNumbers('character', { start: 8, end: 11 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'walk_up',
        frames: this.anims.generateFrameNumbers('character', { start: 12, end: 15 }),
        frameRate: 10,
        repeat: -1
    });

    // Добавляем зоны
    zones.push(this.add.zone(200, 200, 100, 100).setOrigin(0.5, 0.5));
    zones.push(this.add.zone(600, 400, 100, 100).setOrigin(0.5, 0.5));
    this.physics.world.enable(zones);

    // Добавляем изображение "Press X"
    pressX = this.add.image(player.x, player.y - 50, 'pressX');
    pressX.setVisible(false);

    // Добавляем изображение overlay
    overlayImage = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'overlay');
    overlayImage.setOrigin(0.5, 0.5);
    overlayImage.setDisplaySize(this.cameras.main.width * 0.9, this.cameras.main.height * 0.9);
    overlayImage.setVisible(false);

    // Добавляем кнопку "close"
    closeButton = this.add.image(
        overlayImage.x + overlayImage.displayWidth / 2 - overlayImage.displayWidth * 0.1 / 2 + 10,
        overlayImage.y - overlayImage.displayHeight / 2 + overlayImage.displayHeight * 0.1 / 2 + 10,
        'closeIcon'
    );
    closeButton.setDisplaySize(overlayImage.displayWidth * 0.07, overlayImage.displayHeight * 0.1);
    closeButton.setInteractive();
    closeButton.setVisible(false);

    // Обработчик нажатия на кнопку "close"
    closeButton.on('pointerdown', () => {
        isOverlayVisible = false;
        overlayImage.setVisible(false);
        closeButton.setVisible(false);
    });

    // Добавляем обработчик нажатия клавиши "X"
    this.input.keyboard.on('keydown-X', () => {
        if (isInZone) {
            isOverlayVisible = !isOverlayVisible;
            overlayImage.setVisible(isOverlayVisible);
            closeButton.setVisible(isOverlayVisible);
        }
    });

    // Добавляем джойстик только для мобильных устройств
    if (isMobile()) {
        joystickBase = this.add.image(100, this.cameras.main.height - 100, 'joystickBase').setInteractive();
        joystickThumb = this.add.image(100, this.cameras.main.height - 100, 'joystickThumb').setInteractive();

        joystickBase.setDisplaySize(100, 100);
        joystickThumb.setDisplaySize(50, 50);

        joystickThumb.on('pointerdown', (pointer) => {
            isDragging = true;
            dragStartX = pointer.x;
            dragStartY = pointer.y;
        });

        this.input.on('pointermove', (pointer) => {
            if (isDragging) {
                let deltaX = pointer.x - dragStartX;
                let deltaY = pointer.y - dragStartY;
                let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                let maxDistance = 50;

                if (distance > maxDistance) {
                    let angle = Math.atan2(deltaY, deltaX);
                    deltaX = Math.cos(angle) * maxDistance;
                    deltaY = Math.sin(angle) * maxDistance;
                }

                joystickThumb.setPosition(joystickBase.x + deltaX, joystickBase.y + deltaY);
            }
        });

        this.input.on('pointerup', () => {
            isDragging = false;
            joystickThumb.setPosition(joystickBase.x, joystickBase.y);
        });

        // Добавляем кнопку "X" для мобильных устройств
        mobileXButton = this.add.image(this.cameras.main.width - 100, this.cameras.main.height - 80, 'mobileXButton').setInteractive();
        mobileXButton.setDisplaySize(70, 70); // Размеры чуть меньше размеров джойстика
        mobileXButton.setVisible(false);

        // Обработчик нажатия на кнопку "X" для мобильных устройств
        mobileXButton.on('pointerdown', () => {
            if (isInZone) {
                isOverlayVisible = !isOverlayVisible;
                overlayImage.setVisible(isOverlayVisible);
                closeButton.setVisible(isOverlayVisible);
            }
        });
    }
}

let isInZone = false;

function update() {
    player.setVelocity(0);

    if (this.cursors.left.isDown || (isDragging && joystickThumb.x < joystickBase.x - 10)) {
        player.setVelocityX(-160);
        player.anims.play('walk_left', true);
    } else if (this.cursors.right.isDown || (isDragging && joystickThumb.x > joystickBase.x + 10)) {
        player.setVelocityX(160);
        player.anims.play('walk_right', true);
    } else if (this.cursors.up.isDown || (isDragging && joystickThumb.y < joystickBase.y - 10)) {
        player.setVelocityY(-160);
        player.anims.play('walk_up', true);
    } else if (this.cursors.down.isDown || (isDragging && joystickThumb.y > joystickBase.y + 10)) {
        player.setVelocityY(160);
        player.anims.play('walk_down', true);
    } else {
        player.anims.stop();
    }

    // Проверяем пересечение с зонами
    isInZone = false;
    zones.forEach(zone => {
        if (Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), zone.getBounds())) {
            isInZone = true;
        }
    });

    // Отображаем или скрываем изображение "Press X"
    if (isInZone) {
        pressX.setPosition(player.x, player.y - 40);
        pressX.setDisplaySize(player.width * 3 / 2, player.height * 2 / 5);
        pressX.setVisible(true);
        if (isMobile()) {
            mobileXButton.setVisible(true);
        }
    } else {
        pressX.setVisible(false);
        if (isMobile()) {
            mobileXButton.setVisible(false);
        }
    }
}

function isMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|avantgo|blackberry|bada\/|bb|meego|mmp|mobile|opera m(ob|in)i|palm(os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|up\.browser|up\.link|vodafone|wap|windows ce|xda|xiino/i.test(userAgent) || /ipad|tablet|(android(?!.*mobile))/i.test(userAgent);
}