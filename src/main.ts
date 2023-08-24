import kaboom from "kaboom";

const ENEMY_SPEED = 100;
const MIN_DIST = 600;

const k = kaboom();

k.loadRoot("sprites/");
k.loadSprite("apple", "apple.png");
k.loadSprite("bean", "bean.png");
k.loadSprite("coin", "coin.png");
k.loadSprite("ghosty", "ghosty.png");
k.loadSprite("gigagantrum", "gigagantrum.png");

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
  const enemyLevel = Math.floor(k.rand(1, 5));
  const enemyMinSpeed = ENEMY_SPEED * (1 / enemyLevel);

  const enemy = k.add([
    enemyLevel >= 4 ? k.sprite("gigagantrum") : k.sprite("ghosty"),
    k.health(enemyLevel),
    k.pos(randomPos()),
    k.area(),
    healthBar(),
    "enemy",
    {
      level: enemyLevel,
      speed: k.rand(enemyMinSpeed, ENEMY_SPEED),
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

const scoreLabel = k.add([
  k.text("Score: 0"),
  k.pos(10, 10),
  k.color(k.BLACK),
  { value: 0 },
]);
const comboLabel = k.add([
  k.text("Combo: x0"),
  k.pos(10, 40),
  k.color(k.BLACK),
  { value: 1 },
]);

const player = k.add([
  k.sprite("bean"),
  k.pos(k.width() / 2 - 16, k.height() / 2 - 16),
  k.area(),
  k.health(10),
  healthBar(),
  "player",
]);

k.onUpdate(() => {
  scoreLabel.text = `Score: ${scoreLabel.value}`;
  comboLabel.text = `Combo: x${comboLabel.value}`;

  const enemies = k.get("enemy");

  enemies.forEach((e) => {
    const dir = player.pos.sub(e.pos).unit();
    e.move(dir.scale(e.speed));
  });
});

k.onHover("enemy", (e) => {
  k.setCursor("pointer");
});

k.onHoverEnd("enemy", (e) => {
  k.setCursor("default");
});

k.onCollide("enemy", "player", (e) => {
  comboLabel.value = 0;
  player.hurt(1);
  k.shake(3);
  k.destroy(e);
});

k.onClick("enemy", (e) => {
  e.hurt(1);
});

k.on("hurt", "enemy", (e) => {
  scoreLabel.value += 100 * (comboLabel.value * 0.1 || 1);
  k.shake(1);
  addExplode(e.pos, 1, 24, 0.5);
});

k.on("death", "enemy", (e) => {
  comboLabel.value += 1;
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
