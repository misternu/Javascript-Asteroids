//Game Settings
var WIDTH = 900; //px width of game
var HEIGHT = 600; //px height of game
var SHIP_THRUST = 300; //px per second squared
var SHIP_ROTATE = Math.PI; //radians per second
var RELOAD_TIME = 0.16; //in seconds
var SHOT_SPEED = 350; //px per second
var SHOT_LIFE = 1; //in seconds
var SHOT_COLOR = 'green';
var SHOT_RADIUS = 3.5; //in px
var SHIP_COLOR = 'blue';
var ROCK_COLOR = 'red';
var ROCK_RADIUS = 20;

//Html Elements
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = WIDTH;
canvas.height = HEIGHT;
document.body.appendChild(canvas);

var debug = document.createElement("p");
debug.setAttribute("id", "debug");
document.body.appendChild(debug);

//Math helper function for modulo because javascript is dumb
function mmod(m, n) {
  return ((m % n) + n) % n;
}

//Game Model
function AsteroidsGame(level) {
  this.level = level;
  this.ship = new Ship(WIDTH/2,HEIGHT/2);
  this.shots = [];
  this.rocks = [];
  this.control_state = {}
}

AsteroidsGame.prototype.update = function(modifier) {
  //Pass on controls
  if (this.control_state.thrust) {
    this.ship.thrust(modifier);
  }
  if (this.control_state.left_turn) {
    this.ship.turn(modifier, 'left');
  }
  if (this.control_state.right_turn) {
    this.ship.turn(modifier, 'right');
  }
  if (this.control_state.fire) {
    if (this.ship.reload <= 0) {
      this.ship.reload = RELOAD_TIME;
      var new_shot = new Shot(this.ship.x, this.ship.y, this.ship.dx, this.ship.dy, this.ship.v);
      this.shots.push(new_shot);
    }
  }


  //Update shots
  for (i = 0; i < this.shots.length; i++) {
    this.shots[i].update(modifier);
  }

  //Remove dead shots
  for (i = this.shots.length - 1; i >= 0; i--) {
    if (this.shots[i].dead()) {
      this.shots.splice(i, 1);
    }
  }

  this.ship.update(modifier);
}


//Ship
function Ship(x, y) {
  this.x = x;
  this.y = y;
  this.v = Math.PI * 0.5;
  this.dx = 0;
  this.dy = 0;
  this.rotate = SHIP_ROTATE;
  this.speed = SHIP_THRUST;
  this.reload = 0;
  this.shots = [];
}

Ship.prototype.thrust = function(modifier) {
  this.dx += Math.cos(this.v) * this.speed * modifier;
  this.dy += Math.sin(this.v) * this.speed * modifier;
}

Ship.prototype.turn = function(modifier, direction) {
  if (direction == 'left') {
    this.v += this.rotate * modifier;
  } else if (direction == 'right') {
    this.v -= this.rotate * modifier;
  }
}



Ship.prototype.update = function(modifier) {
  //Drift
  this.x = mmod(this.x + this.dx * modifier, canvas.width);
  this.y = mmod(this.y - this.dy * modifier, canvas.height); //canvas y is reversed

  //Increment reload
  game.ship.reload -= modifier;
}


//Shot
function Shot(x,y,dx,dy,v) {
  this.x = x;
  this.y = y;
  this.dx = dx + Math.cos(v) * SHOT_SPEED;
  this.dy = dy + Math.sin(v) * SHOT_SPEED;
  this.life = SHOT_LIFE;
}

Shot.prototype.update = function(modifier) {
  this.x = mmod(this.x + this.dx * modifier, canvas.width);
  this.y = mmod(this.y - this.dy * modifier, canvas.height);
  this.life -= modifier;
}

Shot.prototype.dead = function() {
  return this.life <= 0;
}


//Rock
function Rock(x,y,dx,dy) {
  this.x = x;
  this.y = y;
  this.dx = dx;
  this.dy = dy;
}

Rock.prototype.update = function(modifier) {
  this.x = mmod(this.x + this.dx * modifier, canvas.width);
  this.y = mmod(this.y - this.dy * modifier, canvas.height);
}



//Keyboard Controls
var keysDown = {};

addEventListener("keydown", function(e) {
  keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function(e) {
  delete keysDown[e.keyCode];
}, false);

function keyboard(modifier) {
  //clear
  game.control_state = {};
  //Respond to controls
  if (38 in keysDown) { // Player holding up
    game.control_state.thrust = true;
  }
  if (40 in keysDown) { // Player holding down

  }
  if (37 in keysDown) { // Player holding left
    game.control_state.left_turn = true;
  }
  if (39 in keysDown) { // Player holding right
    game.control_state.right_turn = true;
  }
  if (32 in keysDown) { //Player holding space
    game.control_state.fire = true;
  }

  //Update the ship
  game.update(modifier);
};

//View Object
function AsteroidsView() {
}

AsteroidsView.prototype.render = function() {
  this.drawBackground();
  this.drawShots();
  this.drawShip();
  this.drawRocks();
}

AsteroidsView.prototype.drawBackground = function() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

AsteroidsView.prototype.drawShots = function() {
  ctx.fillStyle = SHOT_COLOR;
  for (i = 0; i < game.shots.length; i++) {
    ctx.beginPath();
    ctx.arc(
      game.shots[i].x,
      game.shots[i].y,
      SHOT_RADIUS,
      0,
      Math.PI * 2);
    ctx.fill();
  }
}

AsteroidsView.prototype.drawShip = function() {
  var width = 20;
  var height = 30;
  ctx.fillStyle = SHIP_COLOR;

  //Move stroke to ship
  ctx.translate(game.ship.x, game.ship.y);
  ctx.rotate(-game.ship.v); //rotate defaults clockwise, where radians are counterclockwise

  //Draw ship
  ctx.beginPath();
  ctx.moveTo(height * 2 / 3, 0);
  ctx.lineTo(-height / 3, width / 2);
  ctx.lineTo(-height / 3, -width / 2);
  ctx.closePath();
  ctx.fill();

  //Move stroke back
  ctx.rotate(game.ship.v);
  ctx.translate(-game.ship.x, -game.ship.y);
}

AsteroidsView.prototype.drawRocks = function() {
  ctx.fillStyle = ROCK_COLOR;
  for (i = 0; i < game.rocks.length; i++) {
    ctx.beginPath();
    ctx.arc(
      game.rocks[i].x,
      game.rocks[i].y,
      ROCK_RADIUS,
      0,
      Math.PI * 2);
    ctx.fill();
  }
}

//Main Game Loop
function main() {
  var now = Date.now();
  var delta = now - then;

  keyboard(delta / 1000);
  view.render();

  then = now;

  requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
var then = Date.now();
var game = new AsteroidsGame();
var view = new AsteroidsView();
main();