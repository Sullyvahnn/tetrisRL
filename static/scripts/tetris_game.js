const socket = io();
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const scale = 20;
let score = 0;
let collider_color;

const colors = [
  null,
  '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF',
  '#FF8E0D', '#FFE138', '#3877FF',
];

const arena = createMatrix(12, 20);

const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
};

function sendGameUpdate() {
    // console.log('Sending game state:', gameState);
    socket.emit('game_update', getGameState());
}

socket.on('visualise',async (data) => {
  reload()
  calculateCollision(data['x'], data['matrix'])

});
function getGameState() {
  return { player_matrix: player.matrix, arena: arena};

}
function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function createPiece(type) {
  if (type === 'T') return [[0,0,0],[1,1,1],[0,1,0]];
  if (type === 'O') return [[2,2],[2,2]];
  if (type === 'L') return [[0,3,0],[0,3,0],[0,3,3]];
  if (type === 'J') return [[0,4,0],[0,4,0],[4,4,0]];
  if (type === 'I') return [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]];
  if (type === 'S') return [[0,6,6],[6,6,0],[0,0,0]];
  if (type === 'Z') return [[7,7,0],[0,7,7],[0,0,0]];
}
function calculateCollision(x=null, matrix=null) {
  let collider;
  if(x !== null && matrix != null) {
    collider = {
  pos: { x: x, y: 0 },
  matrix: matrix,
};
  } else collider = structuredClone(player);
  for(let y = 0; y<collider.matrix.length;y++) {
    for (let x = 0; x < collider.matrix[y].length; x++) {
    if (collider.matrix[x][y] !== 0) {
      collider_color = structuredClone(colors[collider.matrix[x][y]]);
      collider.matrix[x][y] = -2;
    }


    }
  }
  while(!collide(arena,collider, true)) {
     collider.pos.y++;
  }
  drawMatrix(collider.matrix, { x: collider.pos.x, y: collider.pos.y -1}, true);


}
function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0 && value > 0) {
          ctx.fillStyle = colors[value];
          ctx.strokeStyle = 'white';
          ctx.fillRect((x + offset.x) * scale, (y + offset.y) * scale, scale, scale);
          ctx.strokeRect((x + offset.x) * scale, (y + offset.y) * scale, scale, scale);
      }
      else if(value === -1) {
        ctx.fillStyle = 'grey';
        ctx.fillRect((x + offset.x) * scale, (y + offset.y) * scale, scale, scale);
      }
      else if(value === -2) {
        ctx.strokeStyle = collider_color;
        ctx.strokeRect((x + offset.x) * scale, (y + offset.y) * scale, scale, scale);
      }
    });
  });
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0 && value !== -2) {
        arena[y + player.pos.y][x + player.pos.x] = -1;
      }
    });
  });
}

function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 &&
          (arena[y + o.y] &&
           arena[y + o.y][x + o.x]) !== 0) {
          return true;
      }
    }
  }
  return false;
}

function playerDrop() {
  player.pos.y++;

  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
  }
  dropCounter = 0;
}

function arenaSweep() {
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    y++;
    score += 10;
  }
  scoreElement.innerText = score;
}

function playerReset() {
  const pieces = 'TJLOSZI';
  player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
  player.pos.y = 0;
  player.pos.x = Math.floor((arena[0].length - player.matrix[0].length) / 2);
  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    score = 0;
    scoreElement.innerText = score;
  }
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function draw() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
  drawPlayer();
}
function drawPlayer() {
  ctx.fillStyle = 'orange';
          ctx.fillRect((player.pos.x) * scale, (player.pos.y) * scale, scale, scale);
}
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
    // sendGameUpdate();
    reload();
  }
  requestAnimationFrame(update);
}
function reload() {
  draw();
  calculateCollision();
}
const sleep = ms => new Promise(res => setTimeout(res, ms));

function repeatVisualisation() {
  sendGameUpdate();
}

document.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') {
    playerMove(-1);
  } else if (event.key === 'ArrowRight') {
    playerMove(1);
  } else if (event.key === 'ArrowDown') {
    playerDrop();
  } else if (event.key === 'ArrowUp') {
    playerRotate(-1);
  } else if (event.key === 'w') {
    playerRotate(1);
  }
  else if (event.key === 'r') {
    playerReset()
  }
  else if(event.key === 'p') {
    if(dropInterval === 1000000) dropInterval=1000;
    else dropInterval = 1000000;
  }
  else if(event.key === 'q') {
    repeatVisualisation();
  }

  reload();
});
update();
playerReset();
reload();