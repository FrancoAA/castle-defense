import kaboom, { GameObj } from "kaboom";

const ENEMY_SPEED = 100;
const ENEMY_ATTACK_DMG = 1;
const ENEMY_TYPES = {
  "ghosty": {
    speed: ENEMY_SPEED,
    attack: 1,
    health: 1,
  },
  "dino": {
    speed: ENEMY_SPEED * 0.75,
    attack: 1,
    health: 1,
  },
  "gigagantrum": {
    speed: ENEMY_SPEED * 0.5,
    attack: 1,
    health: 1,
  },
};
const SWORD_DMG = 2;
const SWORD_COOLDOWN = 0.5;
let SWORD_CAN_ATTACK = true;
const GUN_DMG = 1;
const GUN_COOLDOWN = 0.2;
let GUN_CAN_ATTACK = true;
const MIN_DIST = 600;

const k = kaboom();

let currentWeapon = 'sword';

k.loadRoot("sprites/");
k.loadSprite("apple", "apple.png");
k.loadSprite("bean", "bean.png");
k.loadSprite("coin", "coin.png");
k.loadSprite("ghosty", "ghosty.png");
k.loadSprite("dino", "dino.png");
k.loadSprite("gigagantrum", "gigagantrum.png");
k.loadSprite("sword", "sword.png");
k.loadSprite("gun", "gun.png");

function grow(rate) {
  return {
    update() {
      const n = rate * k.dt();
      this.scale.x += n;
      this.scale.y += n;
    },
  };
}

function healthBar(barHeight = 10) {
  return {
    id: "healthBar",
    require: ["health"],
    add() {
      this.on("hurt", (amount: number) => {
        console.log("hurt", amount);
        this.add([
          k.text(`${amount}`, { size: 20 }),
          k.color(k.RED),
          k.pos(k.vec2(this.width, this.height / 2)),
          k.move(k.UP, 100),
          k.lifespan(0.5, { fade: 0.2 }),
        ]);
      });
    },
    draw() {
      const barWidth = (this.width * this.hp()) / this.maxHP();
      k.drawRect({
        width: this.width,
        height: barHeight,
        pos: k.vec2(0, this.height + 5),
        color: k.RED,
        outline: { color: k.BLACK, width: 1 },
      });
      k.drawRect({
        width: barWidth,
        height: barHeight,
        pos: k.vec2(0, this.height + 5),
        color: k.GREEN,
      });
    },
  };
}

function randomPoint() {
  return k.vec2(
    Math.floor(k.rand(0, k.width())),
    Math.floor(k.rand(0, k.height()))
  );
}

function randomPos() {
  let pos;
  while (true) {
    pos = randomPoint();
    if (pos.dist(player.pos) >= MIN_DIST) {
      return pos;
    }
  }
}

function spawnEnemy() {
  const type = k.choose(Object.keys(ENEMY_TYPES));
  const baseStats = ENEMY_TYPES[type];
  const level = Math.floor(k.rand(1, 5));
  const speed = k.rand(baseStats.speed * (1 / level), baseStats.speed);
  const attack = (baseStats.attack + (level * 0.1));
  const pos = randomPos();

  const enemy = k.add([
    k.sprite(type),
    k.health(level),
    k.pos(pos),
    k.area(),
    k.move(player.pos.sub(pos).unit(), speed),
    healthBar(),
    "enemy",
    {
      level,
      attack,
      speed,
    },
  ]);

  return enemy;
}

function addExplode(p, n, rad, size) {
  for (let i = 0; i < n; i++) {
    k.wait(k.rand(n * 0.1), () => {
      for (let i = 0; i < 2; i++) {
        k.add([
          k.pos(p.add(k.rand(k.vec2(-rad), k.vec2(rad)))),
          k.rect(4, 4),
          k.color(k.RED),
          k.scale(1 * size, 1 * size),
          k.lifespan(0.1),
          grow(k.rand(48, 72) * size),
          k.anchor("center"),
        ]);
      }
    });
  }
}

const infoLabel = k.add([
  k.text("Score: 0\nCombo: x0"),
  k.pos(10, 10),
  k.color(k.BLACK),
  { 
    score: 0,
    combo: 0,
  },
]);

const player = k.add([
  k.sprite("bean"),
  k.pos(k.width() / 2 - 16, k.height() / 2 - 16),
  k.area(),
  k.health(10),
  healthBar(),
  "player",
]);

const swordCursor = k.add([
  k.pos(k.mousePos()),
  k.sprite("sword"),
  k.z(100),
  k.scale(0.5),
  k.rotate(-45),
  'cursor',
  'sword',
]);

const gunCursor = k.add([
  k.pos(k.mousePos()),
  k.anchor('topright'),
  k.sprite("gun"),
  k.z(100),
  k.scale(0.5),
  'cursor',
  'gun',
]);

k.onUpdate(() => {
  infoLabel.text = `
  Score: ${infoLabel.score}\n
  Combo: x${infoLabel.combo}\n
  Weapon: ${currentWeapon}
  `;
  
  k.setCursor('none');
  if (currentWeapon === 'sword') {
    gunCursor.hidden = true;
    swordCursor.hidden = false;
    swordCursor.pos = k.mousePos();
  } else {
    swordCursor.hidden = true;
    gunCursor.hidden = false;
    gunCursor.pos = k.mousePos();
  }
});

k.onCollide("enemy", "player", (e) => {
  infoLabel.combo = 0;
  player.hurt(1);
  k.shake(3);
  k.destroy(e);
});

k.onClick((btn) => {
  if (btn !== 'right') return;
  currentWeapon = currentWeapon === 'sword' ? 'gun' : 'sword';
});

k.onClick("enemy", (e) => {
  if (currentWeapon === 'sword' && SWORD_CAN_ATTACK) {
    e.hurt(SWORD_DMG);
    addExplode(k.mousePos(), 1, 24, 0.5);
    SWORD_CAN_ATTACK = false;
    k.wait(SWORD_COOLDOWN, () => SWORD_CAN_ATTACK = true);
  } else if (currentWeapon === 'gun' && GUN_CAN_ATTACK) {
    e.hurt(GUN_DMG);
    addExplode(k.mousePos(), 1, 24, 0.5);
    GUN_CAN_ATTACK = false;
    k.wait(GUN_COOLDOWN, () => GUN_CAN_ATTACK = true);
  }
});

k.on("hurt", "enemy", () => {
  infoLabel.score += 100 * (infoLabel.combo * 0.1 || 1);
  k.shake(1);
});

k.on("death", "enemy", (e) => {
  infoLabel.combo += 1;
  k.setCursor("default");
  k.destroy(e);
});

k.on("death", "player", (p) => {
  k.go("gameover");
});

k.loop(1, spawnEnemy);

k.scene("gameover", () => {
  k.add([
    k.text("Game Over!", { size: 20 }),
    k.anchor("center"),
    k.pos(k.center()),
    k.color(k.RED),
  ]);
});
