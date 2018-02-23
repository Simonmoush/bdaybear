function elina_game(){

	//setup canvas and context
	var c = document.getElementById("game_window");
	var ctx = c.getContext("2d");
	ctx.imageSmoothingEnabled = false; // turn off image smoothing to look more pixel/retro
	ctx.font = "15px game";

	// get keyboard events
	window.addEventListener("keydown", doKeyDown, true);
	window.addEventListener("keyup", doKeyUp, true);


	// ==============
	// Data Structures
	// ==============
	
	// Sprite
	// a sprite is an image that appears on screen
	// dx and dy are the coordinates of the anchor/placement point at the bottom left
	// src is the image file location
	// draw method draws the sprite placing it using it's anchor point
	function Sprite(src, dx, dy){
		var img = new Image();
		img.src = src;

		var dx = dx;
		var dy = dy;

		this.width = img.width;
		this.height = img/height;
		this.draw = function(x, y){
			ctx.drawImage(img, x-dx, y-dy, img.width, img.height);
		}
	} 

	// SpriteCycle
	// a sprite cycle is sprite that cycles through a number of poses like a walk cycle
	// sprites is an array of sprite objects, frequency is the rate that the poses change in Hz
	// start starts or continues the cycle
	// stop stops the cycle
	// current_sprite returns the currently active sprite
	// draw draws the current frame
	function SpriteCycle(sprites, frequency){
		var sprites = sprites;
		var frequency = frequency; // Hz
		var current_frame = 0;
		var timer = null;

		var current_sprite = function(){ return sprites[current_frame]; }

		var next_frame = function(){
			current_frame = (current_frame+1)%sprites.length;
		}

		this.do_cycle = function(){
			if(timer != null) {return}// don't restart
			timer = window.setInterval(next_frame, 1000/frequency);
		}

		this.pause_cycle = function(){
			window.clearInterval(timer);
			timer = null;
		}

		this.width = function(){
			return current_sprite().width;
		}

		this.height = function(){
			return current_sprite().height;
		}

		this.draw = function(x, y){
			current_sprite().draw(x, y);
		}
	}

	// Element
	// an element is a container for sprites and sprite_cycles that are for the same element
	// for example the character has many poses, and a walk cycle. all those images are held here
	// type is what kind of element this is, i.e. carrot, player, obstacle, or hat
	// cycle is a sprite cycle object
	// poses is an object holding poses (sprite objects) indexed by the name of the pose
	// do_pose takes a string (name of pose) and a duration (in seconds) for which to hold that pose
	// set_pose takes a string (name of pose) and sets that pose indefinitely
	// after creating the object you must call set pose or set cycle
	function Element(type, cycle, poses){
		this.type = type;
		this.id = Math.random();
		this.x = 0;
		this.y = 0;

		var posing = false;
		var cycle = cycle;
		var poses = poses;
		var current_pose = null;
		var pose_timeout = null;

		this.width = function(){
			if(posing)[
				return poses[current_pose].width;
			}else{
				return cycle.width();
		}

		this.height = function(){
			if(posing)[
				return poses[current_pose].height;
			}else{
				return cycle.height();
		}

		this.set_cycle_mode = function(){
			posing = false;
			window.clearTimeout(this.pose_timeout);
			pose_timeout = null;

			cycle.do_cycle();
		}

		this.set_pose_mode = function(pose){
			posing = true;
			cycle.stop();
			window.clearTimeout(this.pose_timeout);
			pose_timeout = null;
			current_pose = pose;
		}

		this.do_pose_for_duration = function(pose, duration){
			posing = true;
			cycle.stop();
			current_pose = pose;
			pose_timeout = window.setTimeout(resume_cycle, duration*1000);
		}

		this.pause_cycle = function(){
			cycle.stop();
		}

		this.resume_cycle = function(){
			posing = false;
			pose_timeout = null;
			cycle.do_cycle();
		}

		// sets the current pose if there is one
		
		this.current_pose = (this.poses != null) ?
			this.poses[Object.keys(this.poses)[0]] :
			null;
		
		this.draw = function(){
			if (posing) {
				if(this.poses[current_pose]){
					this.poses[current_pose].draw(this.x, this.y);
				}else{
					console.log("pose \"" + current_pose + "\" not found in poses list");
				}
			}else{
				if (cycle != null) {
					cycle.draw(this.x, this.y);
				}else{
					console.log("no cycle to draw");
				}
			}
		}
	}

	// New_Carrot
	// this just makes an element with the carrot sprites and sprite cycle set up. it sets it in cycle mode
	function New_Carrot() {
		var carrot_wobble = 1;
		var carrot_wobble_frequency = 20;

		// carrot cycle sprites
		var carrot1 = new Sprite("carrot3.png", 1, 29);
		var carrot2 = new Sprite("carrot3.png", 1, 29 - carrot_wobble);

		// put the carrot cycle into a sprite cycle
		var carrot_cycle = new SpriteCycle([carrot1, carrot2], carrot_wobble_frequency);

		// put the carrot cycle into an element
		var carrot = new Element("carrot", carrot_cycle, null); // no poses

		// start the carrot in cycle mode
		carrot.set_cycle_mode();

		return carrot;
	}

	// New_Bear
	// make an elment with the bear sprites loaded in their pose object and cycle object
	// adds velocity to the bear and sets it in cycle mode
	function New_Bear(){
		var bear_walk_frequency = 7.5;

		// bear walk cycle sprites
		var bear1 = new Sprite("bear1.png", 2, 48);
		var bear2 = new Sprite("bear2.png", 3, 50);
		
		// put bear walk cycle sprites in a sprite cycle
		var bear_cycle = new SpriteCycle([bear1, bear2], bear_walk_frequency);

		// bear poses sprites
		var bear_crouch = new Sprite("crouch.png", 0, 34);
		var bear_celeb = new Sprite("bang.png", 0, 54);

		// put the poses in an object
		var bear_poses = {
			crouch: bear_crouch,
			celeb: bear_celeb
		};

		// compile all bear stuff into bear element
		var bear = new Element("player", bear_cycle, bear_poses);

		// give bear a velocity!!
		bear.velocity = 0;

		// start the bear in cycle mode
		bear.set_cycle_mode();

		return bear;
	}

	// Game
	// the game object holds the game state and settings
	// it has methods for adding and removing items from the game
	// ...
	function Game(){
		// map
		this.map = new Image();
		this.map.src = "skymap.png";
		this.floor_level = 136;

		// settings ===========================
		this.gravity = .5;

		// carrot
		this.carrot_frequency = 1; //hz
		this.carrot_timer = window.setTimeout(this.add_carrot, this.carrot_frequency*1000);

		// hat
		this.hat_frequency = 5; // hz
		this.hat_timer = window.setTimeout(this.add_hat, this.hat_frequency*1000);

		// obstacle
		this.obstacle_frequency = 3; // hz
		this.obstacle_timer = window.setTimeout(this.add_obstacle, this.obstacle_frequency*1000);

		// bear settings
		this.crouch_time = .4; // sec
		this.celeb_time = .3; // sec
		this.max_jumps = 2;

		// pause and start
		this.start_blink_frequency = 1; // hz

		// on fire
		this.fire_color = "rgba(" + Math.round(Math.random() * 255) +
						  ", " + Math.round(Math.random() * 255) +
						  ", " + Math.round(Math.random() * 255) + ", .3)";
		this.fire_frequency = .5; // hz
		this.max_fire_frequency = .2; // hz
		this.fire_timer = window.setInterval(this.change_fire, this.fire_frequency*1000);
		// ====================================

		// input
		this.right_pressed = false;
		this.left_pressed = false;

		// game state
		this.speed = 3;
		this.time = 0;
		this.map_pos = 0;
		this.jumps = 0;
		this.elements_on_screen = [];
		this.carrots_collected = 0;
		this.paused = false;
		this.pause_color = "rgba(20, 20, 20, .7)";
		this.start_screen = true;
		this.on_fire = false;
		this.fire_frequency = .5;

		this.player = New_Bear();
		this.player.x = 30;
		this.player.y = this.floor_level;


		// ==============
		// METHODS
		// ==============

		// adds a carrot to the world
		this.add_carrot = function() {
			var crt = New_Carrot();

			// position the carrot
			crt.y = this.floor_level;
			crt.x = c.width;

			this.elements_on_screen.push(crt);
		}

		// removes a carrot from the world
		this.remove_carrot = function(index) {
			this.elements_on_screen.splice(index, 1);
		}

		this.pause = function(){
			this.paused = !this.paused;
			this.pause_color = "rgba(" + Math.random() * 35 + ", " + Math.random() * 35 + ", " + Math.random() * 35 + ", .7)";
		}
	}
	
	var g = null;

	function setup(){
		g = new Game();
		g.add_carrot();
	}

	function main_loop(){
		step_frame();
		render();
		window.requestAnimationFrame(main_loop);
	}

	function step_frame(){
		// move the map
		g.time += g.speed;
		g.map_pos = (g.time*2.5)%1995; // *2.5 and the loong number is map specific

		// for each element
		for (var e = 0; e < g.elements_on_screen.length; e++){
			var elem = g.elements_on_screen[e];
			// move it
			elem.x -= g.speed;

			// check for collisions with player
			// horizontal overlap
			// HERE
			if (elem.x <= g.player.x + g.player.width() && crt.x_pos > bear_x_pos - carrot.width){
				// vertical overlap
				if (crt.y_pos <= bear_y_pos + bear.height && crt.y_pos > bear_y_pos - carrot.height){

		}

	}

	function render(){
		// map (Img, read x, read y, read width, read height, write x, write y, write width, write height)
		ctx.drawImage(g.map, g.map_pos, 0, c.width*2.5, 580, 0, 0, c.width, c.height);

		//elements
		for(var e = 0; e < g.elements_on_screen.length; e++){
			g.elements_on_screen[e].draw();
		}

		//player
		g.player.draw();
	}
	
	setup();
	main_loop();

	function doKeyDown(e){
		//console.log(e.keyCode);
		if (e.keyCode == 39){
			//39 is right
		}else if (e.keyCode == 37){
			//37 is left
		}else if (e.keyCode == 40){
			//40 is down
		}else if (e.keyCode == 80){
			// p for pause
		}else if (e.keyCode == 13){
			// enter for start/Restart game
		}else if(e.keyCode == 32 || e.keyCode == 38){
			// space or up for jump
		}
	}

	function doKeyUp(e){
		if (e.keyCode == 39){
			//39 is right
		}else if (e.keyCode == 37){
			//37 is left
		}else if (e.keyCode == 40){
			//40 is down
		}
	}
}


elina_game();
