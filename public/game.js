class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Добавляем текст загрузки
        let loadingText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Загрузка...', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // Загружаем ассеты
        this.load.image('map', 'assets/map.png');
        this.load.spritesheet('character', 'assets/character.png', { frameWidth: 48, frameHeight: 64 });
        this.load.image('pressX', 'assets/pressX1.png');
        this.load.image('closeIcon', 'assets/closeIcon.png');
        this.load.image('joystickBase', 'assets/JoystickSplitted.png');
        this.load.image('joystickThumb', 'assets/Joystick.png');
        this.load.image('mobileXButton', 'assets/Press.png');

        // Загружаем изображения для зон
        this.load.image('overlay1', 'assets/1.png');
        this.load.image('overlay2', 'assets/2.png');
        this.load.image('overlay3', 'assets/3.png');
        this.load.image('overlay4', 'assets/4.png');
        this.load.image('overlay5', 'assets/5.png');
        this.load.image('overlay6', 'assets/6.png');
        this.load.image('overlay7', 'assets/7.png');
        this.load.image('overlay8', 'assets/8.png');
        this.load.image('overlay9', 'assets/9.png');
    }

    create() {
        // Переходим к основной сцене
        this.scene.start('MainScene');
    }
}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.isInZone = false;
        this.isOverlayVisible = false;
        this.isDragging = false;
        this.currentZoneIndex = -1;
        this.overlayImages = [];
        this.originalZonePositions = [];
    }

    create() {
        this.createMap();
        this.createPlayer();
        this.createAnimations();
        this.createZones();
        this.createOverlays();
        this.createJoystick();
        this.createMobileXButton();
        this.createInputHandlers();

        // Добавляем обработчик события resize
        window.addEventListener('resize', () => this.resize());
        this.resize(); // Вызываем resize при создании сцены, чтобы установить правильное положение джойстика
    }

    resize() {
        if (this.isMobile()) {
            this.joystickBase.setPosition(150, this.cameras.main.height - 150);
            this.joystickThumb.setPosition(150, this.cameras.main.height - 150);
        }

        // Пересчитываем координаты зон
        this.zones.forEach((zone, index) => {
            let originalPos = this.originalZonePositions[index];
            let scaleX = this.cameras.main.width / this.map.width;
            let scaleY = this.cameras.main.height / this.map.height;
            let scale = Math.max(scaleX, scaleY);
            zone.setPosition(originalPos.x * scale, originalPos.y * scale);
        });
    }

    createMap() {
        this.map = this.add.image(0, 0, 'map').setOrigin(0.5, 0.5);
        this.map.setPosition(this.cameras.main.width / 2, this.cameras.main.height / 2);
        let scaleX = this.cameras.main.width / this.map.width;
        let scaleY = this.cameras.main.height / this.map.height;
        let scale = Math.max(scaleX, scaleY);
        this.map.setScale(scale);

        // Устанавливаем границы мира на основе размеров карты
        this.physics.world.setBounds(0, 0, this.map.width * scale, this.map.height * scale);
    }

    createPlayer() {
        this.player = this.physics.add.sprite(400, 300, 'character');
        this.cursors = this.input.keyboard.createCursorKeys();

        // Ограничиваем движение персонажа в пределах границ мира
        this.player.setCollideWorldBounds(true);

        this.cameras.main.setBounds(0, 0, this.map.width * this.map.scaleX, this.map.height * this.map.scaleY);
    }

    createAnimations() {
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
    }

    createZones() {
        this.zones = [];
        const zonePositions = [
            { x: 656, y: 652 },
            { x: 50, y: 378 },
            { x: 280, y: 50 },
            { x: 560, y: 355 },
            { x: 805, y: 287 },
            { x: 994, y: 437 },
            { x: 946, y: 32 },
            { x: 1144, y: 346 },
            { x: 295, y: 341 }
        ];

        zonePositions.forEach((pos, index) => {
            let zone = this.add.zone(pos.x, pos.y, 40, 40).setOrigin(0.5, 0.5);
            zone.zoneIndex = index + 1;
            this.zones.push(zone);
            this.originalZonePositions.push(pos); // Сохраняем исходные координаты
        });


        this.physics.world.enable(this.zones);
    }

    createOverlays() {
        this.pressX = this.add.image(this.player.x, this.player.y - 50, 'pressX');
        this.pressX.setVisible(false);

        for (let i = 1; i <= 9; i++) {
            let overlayImage = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, `overlay${i}`);
            overlayImage.setOrigin(0.5, 0.5);
            overlayImage.setDisplaySize(this.cameras.main.width * 0.9, this.cameras.main.height * 0.9);
            overlayImage.setVisible(false);
            overlayImage.setAlpha(0); // Начальное значение прозрачности
            this.overlayImages.push(overlayImage);
        }

        this.closeButton = this.add.image(
            this.cameras.main.width / 2 + this.overlayImages[0].displayWidth / 2 - this.overlayImages[0].displayWidth * 0.1 / 2 + 10,
            this.cameras.main.height / 2 - this.overlayImages[0].displayHeight / 2 + this.overlayImages[0].displayHeight * 0.1 / 2 + 10,
            'closeIcon'
        );
        this.closeButton.setDisplaySize(this.overlayImages[0].displayWidth * 0.07, this.overlayImages[0].displayHeight * 0.1);
        this.closeButton.setInteractive();
        this.closeButton.setVisible(false);
        this.closeButton.setAlpha(0); // Начальное значение прозрачности

        this.closeButton.on('pointerdown', () => {
            this.isOverlayVisible = false;
            this.tweens.add({
                targets: [this.overlayImages[this.currentZoneIndex - 1], this.closeButton],
                alpha: 0,
                duration: 500,
                onComplete: () => {
		    try {
                        this.overlayImages[this.currentZoneIndex - 1].setVisible(false);
                        this.closeButton.setVisible(false);
		    } catch(e) {}
                }
            });
        });
    }

    createJoystick() {
        if (this.isMobile()) {
            this.joystickBase = this.add.image(100, this.cameras.main.height - 100, 'joystickBase').setInteractive();
            this.joystickThumb = this.add.image(100, this.cameras.main.height - 100, 'joystickThumb').setInteractive();

            this.joystickBase.setDisplaySize(150, 150);
            this.joystickThumb.setDisplaySize(100, 100);

            this.joystickThumb.on('pointerdown', (pointer) => {
                this.isDragging = true;
                this.dragStartX = pointer.x;
                this.dragStartY = pointer.y;
            });

            this.input.on('pointermove', (pointer) => {
                if (this.isDragging) {
                    let deltaX = pointer.x - this.dragStartX;
                    let deltaY = pointer.y - this.dragStartY;
                    let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    let maxDistance = 50;

                    if (distance > maxDistance) {
                        let angle = Math.atan2(deltaY, deltaX);
                        deltaX = Math.cos(angle) * maxDistance;
                        deltaY = Math.sin(angle) * maxDistance;
                    }

                    this.joystickThumb.setPosition(this.joystickBase.x + deltaX, this.joystickBase.y + deltaY);
                }
            });

            this.input.on('pointerup', () => {
                this.isDragging = false;
                this.joystickThumb.setPosition(this.joystickBase.x, this.joystickBase.y);
            });
        }
    }

    createMobileXButton() {
        if (this.isMobile()) {
            this.mobileXButton = this.add.image(this.cameras.main.width - 150, this.cameras.main.height - 150, 'mobileXButton').setInteractive();
            this.mobileXButton.setDisplaySize(130, 130);
            this.mobileXButton.setVisible(false);

            this.mobileXButton.on('pointerdown', () => {
                if (this.isInZone) {
                    this.isOverlayVisible = !this.isOverlayVisible;
                    if (this.isOverlayVisible) {
                        this.overlayImages[this.currentZoneIndex - 1].setVisible(true);
                        this.closeButton.setVisible(true);
                        this.tweens.add({
                            targets: [this.overlayImages[this.currentZoneIndex - 1], this.closeButton],
                            alpha: 1,
                            duration: 500
                        });
                    } else {
                        this.tweens.add({
                            targets: [this.overlayImages[this.currentZoneIndex - 1], this.closeButton],
                            alpha: 0,
                            duration: 500,
                            onComplete: () => {
                                this.overlayImages[this.currentZoneIndex - 1].setVisible(false);
                                this.closeButton.setVisible(false);
                            }
                        });
                    }
                }
            });
        }
    }

    createInputHandlers() {
        this.input.keyboard.on('keydown-X', () => {
            if (this.isInZone) {
                this.isOverlayVisible = !this.isOverlayVisible;
                if (this.isOverlayVisible) {
                    this.overlayImages[this.currentZoneIndex - 1].setVisible(true);
                    this.closeButton.setVisible(true);
                    this.tweens.add({
                        targets: [this.overlayImages[this.currentZoneIndex - 1], this.closeButton],
                        alpha: 1,
                        duration: 500
                    });
                } else {
                    this.tweens.add({
                        targets: [this.overlayImages[this.currentZoneIndex - 1], this.closeButton],
                        alpha: 0,
                        duration: 500,
                        onComplete: () => {
                            try {
                                this.overlayImages[this.currentZoneIndex - 1].setVisible(false);
                                this.closeButton.setVisible(false);
		            } catch(e) {}
                        }
                    });
                }
            }
        });
    }

    update() {
        this.updatePlayerMovement();
        this.checkZones();
        this.updatePressXVisibility();
    }

    updatePlayerMovement() {
        this.player.setVelocity(0);

        if (!this.isOverlayVisible) {
            if (this.cursors.left.isDown || (this.isDragging && this.joystickThumb.x < this.joystickBase.x - 10)) {
                this.player.setVelocityX(-160);
                this.player.anims.play('walk_left', true);
            } else if (this.cursors.right.isDown || (this.isDragging && this.joystickThumb.x > this.joystickBase.x + 10)) {
                this.player.setVelocityX(160);
                this.player.anims.play('walk_right', true);
            } else if (this.cursors.up.isDown || (this.isDragging && this.joystickThumb.y < this.joystickBase.y - 10)) {
                this.player.setVelocityY(-160);
                this.player.anims.play('walk_up', true);
            } else if (this.cursors.down.isDown || (this.isDragging && this.joystickThumb.y > this.joystickBase.y + 10)) {
                this.player.setVelocityY(160);
                this.player.anims.play('walk_down', true);
            } else {
                this.player.anims.stop();
            }
        }
    }

    checkZones() {
        this.isInZone = false;
        this.currentZoneIndex = -1;
        this.zones.forEach(zone => {
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), zone.getBounds())) {
                this.isInZone = true;
                this.currentZoneIndex = zone.zoneIndex;
            }
        });
    }

    updatePressXVisibility() {
        if (this.isInZone) {
            if (this.isMobile()) {
                this.mobileXButton.setVisible(true);
            } else {
                this.pressX.setPosition(this.player.x, this.player.y - 40);
                this.pressX.setDisplaySize(this.pressX.width * 2 / 3, this.pressX.height * 2 / 3);
                this.pressX.setVisible(true);
            }
        } else {
            if (this.isMobile()) {
                this.mobileXButton.setVisible(false);
            } else {
                this.pressX.setVisible(false);
            }
        }
    }

    isMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|avantgo|blackberry|bada\/|bb|meego|mmp|mobile|opera m(ob|in)i|palm(os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|up\.browser|up\.link|vodafone|wap|windows ce|xda|xiino/i.test(userAgent) || /ipad|tablet|(android(?!.*mobile))/i.test(userAgent);
    }
}

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1260,
        height: 740,
        parent: 'game-container'
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scene: [PreloadScene, MainScene]
};

const game = new Phaser.Game(config);

window.addEventListener('load', () => {
    resizeGame();
    window.addEventListener('resize', resizeGame);
});

function resizeGame() {
    const canvas = document.querySelector('canvas');
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;
    const gameRatio = game.config.width / game.config.height;

    if (windowRatio < gameRatio) {
        canvas.style.width = windowWidth + 'px';
        canvas.style.height = (windowWidth / gameRatio) + 'px';
    } else {
        canvas.style.width = (windowHeight * gameRatio) + 'px';
        canvas.style.height = windowHeight + 'px';
    }
}