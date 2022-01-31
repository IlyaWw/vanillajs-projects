const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const WINDOW_HEIGHT = window.innerHeight;
const WINDOW_WIDTH = window.innerWidth;
const WALL_WIDTH = 10;
const ROW_COUNT = 5;
const COLUMN_COUNT = 10;
const ACCELERATION_STEP = 5;
const MAX_SPEED = 15;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    height: WINDOW_HEIGHT,
    width: WINDOW_WIDTH,
    wireframes: false,
  },
});
Render.run(render);
Runner.run(Runner.create(), engine);

/********** Walls **********/

const walls = [
  Bodies.rectangle(WINDOW_WIDTH / 2, 0, WINDOW_WIDTH, WALL_WIDTH, {
    isStatic: true,
    render: { fillStyle: 'white' },
  }),
  Bodies.rectangle(WINDOW_WIDTH, WINDOW_HEIGHT / 2, WALL_WIDTH, WINDOW_HEIGHT, {
    isStatic: true,
    render: { fillStyle: 'white' },
  }),
  Bodies.rectangle(WINDOW_WIDTH / 2, WINDOW_HEIGHT, WINDOW_WIDTH, WALL_WIDTH, {
    isStatic: true,
    render: { fillStyle: 'white' },
  }),
  Bodies.rectangle(0, WINDOW_HEIGHT / 2, WALL_WIDTH, WINDOW_HEIGHT, {
    isStatic: true,
    render: { fillStyle: 'white' },
  }),
];
World.add(world, walls);

/********** Maze generation **********/

const grid = Array(ROW_COUNT)
  .fill(null)
  .map(() => Array(COLUMN_COUNT).fill(false));

const verticals = Array(ROW_COUNT)
  .fill(null)
  .map(() => Array(COLUMN_COUNT - 1).fill(false));

const horisontals = Array(ROW_COUNT - 1)
  .fill(null)
  .map(() => Array(COLUMN_COUNT).fill(false));

const startRow = Math.floor(Math.random() * ROW_COUNT);
const startColumn = Math.floor(Math.random() * COLUMN_COUNT);

const visitCell = (row, column) => {
  // if cell was visited - return
  if (grid[row][column]) return;

  // mark this cell as visited
  grid[row][column] = true;

  // assemble randomly ordered list of neighbors
  const neighbors = shuffle([
    [row - 1, column, 'up'],
    [row, column + 1, 'right'],
    [row + 1, column, 'down'],
    [row, column - 1, 'left'],
  ]);

  // for each neighbor...
  neighbors.forEach((neighbor) => {
    const [nextRow, nextColumn, direction] = neighbor;

    // see if that neighbor is out of bounds
    if (
      nextRow < 0 ||
      nextRow >= ROW_COUNT ||
      nextColumn < 0 ||
      nextColumn >= COLUMN_COUNT
    ) {
      return;
    }

    // if we visited that neighbor - skip to the next one
    if (grid[nextRow][nextColumn]) {
      return;
    }

    // remove wall either from verticals or horisontals
    switch (direction) {
      case 'left':
        verticals[row][column - 1] = true;
        break;
      case 'right':
        verticals[row][column] = true;
        break;
      case 'up':
        horisontals[row - 1][column] = true;
        break;
      case 'down':
        horisontals[row][column] = true;
        break;
    }

    // visit next neighbor
    visitCell(nextRow, nextColumn);
  });
};

visitCell(startRow, startColumn);

/********** Maze walls **********/

const innerWallWidth = WALL_WIDTH / 2;
const horisontalWallLength = WINDOW_WIDTH / COLUMN_COUNT;
const verticalWallLength = WINDOW_HEIGHT / ROW_COUNT;

horisontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (!open) {
      const wall = Bodies.rectangle(
        horisontalWallLength * columnIndex + horisontalWallLength / 2,
        verticalWallLength * (rowIndex + 1),
        horisontalWallLength + innerWallWidth / 2,
        innerWallWidth,
        {
          isStatic: true,
          label: 'wall',
          render: { fillStyle: 'white' },
        }
      );
      World.add(world, wall);
    }
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (!open) {
      const wall = Bodies.rectangle(
        horisontalWallLength * (columnIndex + 1),
        verticalWallLength * rowIndex + verticalWallLength / 2,
        innerWallWidth,
        verticalWallLength + innerWallWidth / 2,
        {
          isStatic: true,
          label: 'wall',
          render: { fillStyle: 'white' },
        }
      );
      World.add(world, wall);
    }
  });
});

/********** Goal **********/

const goalSide = Math.min(horisontalWallLength, verticalWallLength) * 0.7;

const goal = Bodies.rectangle(
  WINDOW_WIDTH - horisontalWallLength / 2,
  WINDOW_HEIGHT - verticalWallLength / 2,
  goalSide,
  goalSide,
  {
    isStatic: true,
    label: 'goal',
    render: { fillStyle: 'lime' },
  }
);

World.add(world, goal);

/********** Ball **********/

const ball = Bodies.circle(
  horisontalWallLength / 2,
  verticalWallLength / 2,
  Math.min(horisontalWallLength, verticalWallLength) / 4,
  { label: 'ball' }
);

World.add(world, ball);

document.querySelector('body').addEventListener('keydown', (e) => {
  const { x, y } = ball.velocity;

  switch (e.key) {
    case 'ArrowUp':
      Body.setVelocity(ball, {
        x,
        y: Math.max(y - ACCELERATION_STEP, -MAX_SPEED),
      });
      break;
    case 'ArrowRight':
      Body.setVelocity(ball, {
        x: Math.min(x + ACCELERATION_STEP, MAX_SPEED),
        y,
      });
      break;
    case 'ArrowDown':
      Body.setVelocity(ball, {
        x,
        y: Math.min(y + ACCELERATION_STEP, MAX_SPEED),
      });
      break;
    case 'ArrowLeft':
      Body.setVelocity(ball, {
        x: Math.max(x - ACCELERATION_STEP, -MAX_SPEED),
        y,
      });
      break;
  }
});

/********** Ball **********/

Events.on(engine, 'collisionStart', (e) => {
  e.pairs.forEach((collision) => {
    const labels = ['ball', 'goal'];

    if (
      labels.includes(collision.bodyA.label) &
      labels.includes(collision.bodyB.label)
    ) {
      document.querySelector('.winner').classList.remove('hidden');
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === 'wall') {
          Body.setStatic(body, false);
        }
      });
      World.remove(world, goal);
    }
  });
});
