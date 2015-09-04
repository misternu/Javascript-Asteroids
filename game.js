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

//Game Objects
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

  this.thrust = function(modifier) {
    this.dx += Math.cos(this.v) * this.speed * modifier;
    this.dy += Math.sin(this.v) * this.speed * modifier;
  }

  this.turn = function(modifier, direction) {
    if (direction == 'left') {
      ship.v += ship.rotate * modifier;
    } else if (direction == 'right') {
      ship.v -= ship.rotate * modifier;
    }
  }

  this.fire = function(modifier) {
    if (this.reload <= 0) {
      this.reload = RELOAD_TIME;
      var new_shot = new Shot(this.x, this.y, this.dx, this.dy, this.v);
      this.shots.push(new_shot);
    }
  }

  this.update = function(modifier) {
    //Drift
    this.x = mmod(this.x + this.dx * modifier, canvas.width);
    this.y = mmod(this.y - this.dy * modifier, canvas.height); //canvas y is reversed

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

    //Increment reload
    this.reload -= modifier;
  }
}

function Shot(x,y,dx,dy,v) {
  this.x = x;
  this.y = y;
  this.dx = dx + Math.cos(v) * SHOT_SPEED;
  this.dy = dy + Math.sin(v) * SHOT_SPEED;
  this.life = SHOT_LIFE;

  this.update = function(modifier) {
    this.x = mmod(this.x + this.dx * modifier, canvas.width);
    this.y = mmod(this.y - this.dy * modifier, canvas.height);
    this.life -= modifier;
  }

  this.dead = function() {
    return this.life <= 0;
  }
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
  //Respond to controls
  if (38 in keysDown) { // Player holding up
    ship.thrust(modifier);
  }
  if (40 in keysDown) { // Player holding down

  }
  if (37 in keysDown) { // Player holding left
    ship.turn(modifier, 'left');
  }
  if (39 in keysDown) { // Player holding right
    ship.turn(modifier, 'right');
  }
  if (32 in keysDown) { //Player holding space
    ship.fire(modifier);
  }

  //Update the ship
  ship.update(modifier);

  //Output to debug
  // document.getElementById("debug").innerHTML =
  //   "X:" + Math.round(ship.x) +
  //   " Y:" + Math.round(ship.y) +
  //   " DX:" + Math.round(ship.dx) +
  //   " DY:" + Math.round(ship.dy) +
  //   " " + (ship.shots.length);
};

//View Object
function AsteroidsView() {
  this.render = function() {
    this.drawBackground();
    this.drawShots();
    this.drawShip();
  }

  this.drawBackground = function() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  this.drawShots = function() {
    ctx.fillStyle = SHOT_COLOR;
    for (i = 0; i < ship.shots.length; i++) {
      ctx.beginPath();
      ctx.arc(
        ship.shots[i].x,
        ship.shots[i].y,
        SHOT_RADIUS,
        0,
        Math.PI * 2);
      ctx.fill();
    }
  }

  this.drawShip = function() {
    var width = 20;
    var height = 30;
    ctx.fillStyle = SHIP_COLOR;

    //Move stroke to ship
    ctx.translate(ship.x, ship.y);
    ctx.rotate(-ship.v); //rotate defaults clockwise, where radians are counterclockwise

    //Draw ship
    ctx.beginPath();
    ctx.moveTo(height * 2 / 3, 0);
    ctx.lineTo(-height / 3, width / 2);
    ctx.lineTo(-height / 3, -width / 2);
    ctx.closePath();
    ctx.fill();

    //Move stroke back
    ctx.rotate(ship.v);
    ctx.translate(-ship.x, -ship.y);
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
var ship = new Ship(WIDTH/2,HEIGHT/2);
var view = new AsteroidsView();
main();