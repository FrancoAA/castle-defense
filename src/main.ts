import kaboom from "kaboom";

const ENEMY_SPEED = 100;
const MIN_DIST = 600;

let combo = 0;

const k = kaboom();

k.loadRoot('sprites/');
k.loadSprite('apple', 'apple.png');
k.loadSprite('bean', 'bean.png');
k.loadSprite('coin', 'coin.png');
k.loadSprite('ghosty', 'ghosty.png');

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
    id: 'healthBar',
    require: ['health'],
    draw() {
      const barWidth = (this.width * this.hp()) / this.maxHP();
      k.drawRect({
        width: this.width,
        height: barHeight,
        pos: k.vec2(this.width * -0.5, this.height * 0.5 + 5),
        color: k.RED,
        outline: { color: k.BLACK, width: 1 },
      });
      k.drawRect({
        width: barWidth,
        height: barHeight,
        pos: k.vec2(this.width * -0.5, this.height * 0.5 + 5),
        color: k.GREEN,
      });
    },
  };
}

function randomPoint() {
  return k.vec2(Math.floor(k.rand(0, k.width())), Math.floor(k.rand(0, k.height())));
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
  const enemy = k.add([
    k.sprite('ghosty'),
    k.pos(randomPos()),
    k.area(),
    k.health(3),
    k.anchor('center'),
    healthBar(),
    'enemy',
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
			k.anchor('center'),
        ]);
      }
    });
  }
}

const scoreLabel = k.add([
	k.text('Score: 0'),
	k.pos(10, 10),
	k.color(k.BLACK),
  { value: 0 },
]);

const player = k.add([
	k.sprite('bean'),
	k.anchor('center'),
	k.pos(k.center()),
	k.area(),
	k.health(10),
  healthBar(),
  'player',
]);

k.onUpdate(() => {
  scoreLabel.text = `Score: ${scoreLabel.value}`;

  const enemies = k.get('enemy');

  enemies.forEach((e) => {
    const dir = player.pos.sub(e.pos).unit();
    e.move(dir.scale(ENEMY_SPEED));
  });
});

k.onCollide('enemy', 'player', (e) => {
  player.hurt(1);
  k.shake(3);
  k.destroy(e);
});

k.onClick('enemy', (e) => {
  combo += 0.1;
  e.hurt(1);
});

k.onClick(() => {
  combo = 0;
  console.log('lost combo');
});

k.on('hurt', 'enemy', (e) => {
  scoreLabel.value += 100 * combo;
  k.shake(1);
  addExplode(e.pos, 1, 24, 0.5);
});

k.on('death', 'enemy', (e) => {
	k.destroy(e);
});

k.on('death', 'player', (p) => {
	k.go('gameover');
});

k.loop(1, spawnEnemy);

k.scene('gameover', () => {
	k.add([
		k.text('Game Over!', { size: 20 }),
		k.anchor('center'),
		k.pos(k.center()),
		k.color(k.RED),
  ]);
});
