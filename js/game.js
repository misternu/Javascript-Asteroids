//Game Settings
var WIDTH = 900; //px width of game
var HEIGHT = 600; //px height of game
var SHIP_THRUST = 300; //px per second squared
var SHIP_ROTATE = Math.PI; //radians per second
var RELOAD_TIME = 0.16; //in seconds
var SHOT_SPEED = 350; //px per second
var SHOT_LIFE = 1; //in seconds
var SHOT_COLOR = 'orange';
var SHOT_RADIUS = 3.5; //in px
var SHIP_COLOR = 'blue';
var ROCK_COLOR = 'red';
var ROCK_RADIUS = 30;
var MAX_ROCK_SPEED = 90;
var MIN_ROCK_SPEED = 30;
var MIN_ROCK_DISTANCE = 150;

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
  this.playing = false;
  this.ship = new Ship(WIDTH/2,HEIGHT/2);
  this.shots = [];
  this.rocks = [];
  this.control_state = {};

  this.newLevel(this.level);
}

AsteroidsGame.prototype.newLevel = function(level) {
  var num_rocks = this.level + 8;
  for (i = 0; i < num_rocks; i++) {
    var new_rock = false;
    while (!new_rock) {
      var new_x = Math.random() * WIDTH;
      var new_y = Math.random() * HEIGHT;
      var new_speed = Math.random() * (MAX_ROCK_SPEED - MIN_ROCK_SPEED) + MIN_ROCK_SPEED;
      var new_v = Math.random() * Math.PI * 2;
      var new_dx = Math.cos(new_v) * new_speed;
      var new_dy = Math.sin(new_v) * new_speed;
      var try_rock = new Rock(new_x, new_y, new_dx, new_dy);
      if (this.distance(try_rock, this.ship) > MIN_ROCK_DISTANCE) {
        new_rock = try_rock;
      }
    }
    this.rocks.push(new_rock);
    var new_rock = false;
  }
}

AsteroidsGame.prototype.distance = function(object1, object2) {
  var x1 = object1.x;
  var y1 = object1.y;
  var x2 = object2.x;
  var y2 = object2.y;
  var distance = Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2));
  return distance;
}

AsteroidsGame.prototype.collide = function() {
  var num_rocks = this.rocks.length;
  var num_shots = this.shots.length;
  for (var i = num_rocks; i > 0 && this.rocks.length > 0; i--) {
    for (var j = num_shots; j > 0 && this.shots.length > 0; j--) {
      if (this.distance(this.shots[j-1], this.rocks[i-1]) < ROCK_RADIUS) {
        this.rocks.splice(i-1,1);
        this.shots[j-1].life = 0;
        break;
      }
    }
  }
}

AsteroidsGame.prototype.update = function(modifier) {
  //Pass on controls
  if (this.control_state.thrust) {
    this.ship.thrust(modifier);
    this.playing = true;
  }
  if (this.control_state.left_turn) {
    this.ship.turn(modifier, 'left');
  }
  if (this.control_state.right_turn) {
    this.ship.turn(modifier, 'right');
  }
  if (this.control_state.fire) {
    if (this.ship.reload <= 0 && this.playing) {
      this.ship.reload = RELOAD_TIME;
      var new_shot = new Shot(this.ship.x, this.ship.y, this.ship.dx, this.ship.dy, this.ship.v);
      this.shots.push(new_shot);
    }
  }

  //Update shots and rocks
  if (this.playing) {
    for (i = 0; i < this.shots.length; i++) {
      this.shots[i].update(modifier);
    }
    for (i = 0; i < this.rocks.length; i++) {
      this.rocks[i].update(modifier);
    }
  }
  //Check for collisions
  this.collide();

  //Remove dead shots
  for (i = this.shots.length - 1; i >= 0; i--) {
    if (this.shots[i].dead()) {
      this.shots.splice(i, 1);
    }
  }

  //Update the ship
  this.ship.update(modifier);
}



//Generic Game Object
function GameObject(x,y,dx,dy) {
  this.x = x;
  this.y = y;
  this.dx = dx;
  this.dy = dy;
}

GameObject.prototype.drift = function(modifier) {
  this.x = mmod(this.x + this.dx * modifier, canvas.width);
  this.y = mmod(this.y - this.dy * modifier, canvas.height); //Canvas y-reversed
}

GameObject.prototype.update = function(modifier) {
  this.drift(modifier);
}



//Ship
Ship.prototype = new GameObject()
Ship.prototype.constructor = Ship;
function Ship(x, y) {
  GameObject.call(this, x, y, 0, 0);
  this.v = Math.PI * 0.5;
  this.rotate = SHIP_ROTATE;
  this.speed = SHIP_THRUST;
  this.reload = 0;
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
  GameObject.prototype.update.call(this, modifier);
  //Increment reload
  game.ship.reload -= modifier;
}



//Shot
Shot.prototype = new GameObject()
Shot.prototype.constructor = Shot;
function Shot(x,y,dx,dy,v) {
  GameObject.call(this, x,
                        y,
                        dx + Math.cos(v) * SHOT_SPEED,
                        dy + Math.sin(v) * SHOT_SPEED);
  this.life = SHOT_LIFE;
}

Shot.prototype.update = function(modifier) {
  GameObject.prototype.update.call(this, modifier);
  this.life -= modifier;
}

Shot.prototype.dead = function() {
  return this.life <= 0;
}



//Rock
Rock.prototype = new GameObject()
Rock.prototype.constructor = Rock;
function Rock(x,y,dx,dy) {
  GameObject.call(this, x, y, dx, dy);
}

Rock.prototype.update = function(modifier) {
  GameObject.prototype.update.call(this, modifier);
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
  if (game.playing == false) {
    this.drawLevel();
  }
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
  ctx.save()
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
  ctx.restore()
}

AsteroidsView.prototype.drawRocks = function() {
  for (i = 0; i < game.rocks.length; i++) {
    var x = game.rocks[i].x;
    var y = game.rocks[i].y;
    this.drawRock(x,y);
    //Draw looping rocks
    this.drawRock(x + WIDTH,y);
    this.drawRock(x + WIDTH,y + HEIGHT);
    this.drawRock(x + WIDTH,y - HEIGHT);
    this.drawRock(x - WIDTH,y);
    this.drawRock(x - WIDTH,y + HEIGHT);
    this.drawRock(x - WIDTH,y - HEIGHT);
    this.drawRock(x,y + HEIGHT);
    this.drawRock(x + WIDTH,y + HEIGHT);
    this.drawRock(x - WIDTH,y + HEIGHT);
    this.drawRock(x,y - HEIGHT);
    this.drawRock(x + WIDTH,y - HEIGHT);
    this.drawRock(x - WIDTH,y - HEIGHT);
  }
}

AsteroidsView.prototype.drawRock = function(x,y) {
  ctx.fillStyle = ROCK_COLOR;
  ctx.beginPath();
  ctx.arc(
    x,
    y,
    ROCK_RADIUS,
    0,
    Math.PI * 2);
  ctx.fill();
}

AsteroidsView.prototype.drawLevel = function() {
  ctx.textAlign="center";
  ctx.fillStyle="white";
  ctx.font="30px Courier"
  ctx.fillText("Level " + game.level + " - Press \u2191 to start", WIDTH/2, HEIGHT/2)
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
var game = new AsteroidsGame(1);
var view = new AsteroidsView();
main();