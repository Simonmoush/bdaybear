/*
	var audio = new Audio('audio_file.mp3');
	audio.play();
*/
	
function play(){
	//setup canvas and context
	var c = document.getElementById("game_window");
	var ctx = c.getContext("2d");
	ctx.imageSmoothingEnabled = false; // turn off image smoothing to look more pixel/retro
	ctx.font = "15px game"; // font defined in the HTML head 

	// ==============
	// Data Structures
	// ==============
	
	// sprite constructor
	// a sprite is a thing that appears on screen
	// dx and dy are the coordinates of the anchor/placement point
	// src is the image file location
	// draw method draws the sprite placing it using it's anchor point
	function Sprite(src, dx, dy){
		this.img = new Image();
		this.img.src = src;
		this.dx = dx;
		this.dy = dy;

		this.draw = function(x, y){
			ctx.drawImage(this.img, x-this.dx, y-this.dy, this.img.width, this.img.height);
		}
	} 
	
	// sprite_cycle object constructor
	// a sprite cycle is sprite that cycles through a number of poses
	// sprites is an array of sprite objects, frequency is the framerate in Hz
	function Sprite_cycle(sprites, frequency){
		this.sprites = sprites;
		this.frequency = frequency; // Hz
		this.current_frame = 0;
		this.timer = null;
		this.next_frame = function(){
			this.frame = (this.frame+1)%this.sprites.length;
		}

		this.start = function(){
			if(this.timer != null) {return};
			if(this.sprites.length > 1){
				this.timer = window.setInterval(this.next_frame, 1000/this.frequency);
			}
		}

		this.stop = function(){
			window.clearInterval(this.timer);
			this.timer = null
		}

		this.current_sprite = function(){ return sprites[frame]; }

		this.draw = function(x, y){
			this.current_sprite().draw(x, y);
		}
	}

	// element constructor
	// an element is a container for sprites and sprite_cycles that are for the same element
	// for example the character has many poses, and a walk cycle. all those images are held here
	// cycle is a sprite cycle object
	// poses is an object holding poses (sprite objects) indexed by the name of the pose
	// do_pose takes a string (name of pose) and a duration (in seconds) for which to hold that pose
	// set_pose takes a string (name of pose) and sets that pose indefinitely
	// after creating the object you must call set pose or set cycle
	function Element(type, cycle, poses){
		this.tag = tag;
		this.x = 0;
		this.y = 0;
		this.cycle = cycle;
		this.poses = poses;
		this.posing = false;

		if (Object.keys(this.poses).length > 0){
			this.current_pose = this.poses[Object.keys(this.poses)[0]];
		}else{
			this.current_pose = null;
		}

		this.pose_timeout = null;

		this.stop_posing(){
			this.posing = false;
			this.cycle.start();
		}
		
		this.do_pose_for_duration = function(pose, duration){
			this.posing = true;
			this.cycle.stop();
			this.current_pose = pose;
			this.pose_timeout = window.setTimeout(stop_posing, duration*1000);
		}

		this.set_pose = function(pose){
			this.posing = true;
			this.cycle.stop();
			this.current_pose = pose;
			window.clearTimeout(this.pose_timeout);
		}
		
		this.set_cycle = function(){
			this.posing = false;
			this.cycle.start();
			window.clearTimeout(this.pose_timeout);
		}
		
		this.draw = function(){
			if (this.posing) {
				if (Object.keys(this.poses).length > 0){
					if(this.poses[this.current_pose]){
						this.poses[this.current_pose].draw(this.x, this.y);
					}else{
						console.log("pose \"" + this.current_pose "\" not found in poses list");
					}
				}else{
					console.log("no poses to draw");
				}
			}else{
				if (this.cycle){
					this.cycle.draw(this.x, this.y);
				}else{
					console.log("no cycle to draw");
				}
			}
		}
	}

	function Game(){
		// map
		this.map = new Image();
		this.map.src = "skymap.png";
		this.floor_level = 115;

		// settings ===========================
		// game
		this.speed = 3; // what is this?
		this.gravity = .5; // used to be accel

		// carrot
		this.carrot_frequency = 1; // change this to hz where it gets uzed
		this.carrot_timer = window.setTimeout(add_carrot, carrot_frequency*1000);

		// hat
		this.hat_frequency = 1; // change this to hz where it gets uzed
		this.hat_timer = window.setTimeout(add_carrot, carrot_frequency*1000);

		// obstacle
		this.obstacle_frequency = 1; // change this to hz where it gets uzed
		this.obstacle_timer = window.setTimeout(add_carrot, carrot_frequency*1000);

		// bear settings
		this.crouch_time = .4; // change these to seconds where it gets used
		this.celeb_time = .3; // change this to seconds where it gets used
		this.max_jumps = 2;

		// pause and start
		this.pause_color = "rgba(20, 20, 20, .7)";
		this.start_blink_frequency = 1; // change this to frequency where it gets used

		// on fire
		this.fire_color = "rgba(" + Math.round(Math.random() * 255) +
						  ", " + Math.round(Math.random() * 255) +
						  ", " + Math.round(Math.random() * 255) + ", .3)";
		this.max_fire_frequency = .2;
		this.fire_timer = window.setTimeout(add_carrot, carrot_frequency*1000);
		// ====================================

		// input
		this.right_pressed = false;
		this.left_pressed = false;

		// game state
		this.time = 0;
		this.map_pos = 0;
		this.jumps = 0;
		this.carrots_on_screen = [];
		this.carrots_collected = 0;
		this.paused = false;
		this.start_screen = true;
		this.on_fire = false;
		this.fire_frequency = .5;



		// ==============
		// METHODS
		// ==============

		// adds a carrot to the world
		this.add_carrot = function() {
			var crt = New_carrot();

			// position the carrot
			crt.y = floor_level;
			crt.x = c.width;

			this.carrots_on_screen.push(crt);

			// put a thing at a random height
			// crt.y_pos = Math.random()*(c.height - 100);


			/*
			// this puts the things in the start of the game
			if (start) {
				if(Math.random() > .5){
					crt.x_pos = Math.random()*(c.width/5) - carrot.width;
				}else{
					crt.x_pos = c.width - (Math.random()*(c.width/5) - carrot.width);
				}
			}
			*/
		}

	}

	// BEAR
	function New_bear(){
		var bear_walk_frequency = .3;

		// bear walk cycle sprites
		var bear1 = new Sprite("bear1.png", 3, 47);
		var bear2 = new Sprite("bear2.png", 1, 50);
		
		// put bear walk cycle sprites in a sprite cycle
		var bear_cycle = new Sprite_cycle([bear1, bear2], bear_walk_frequency);

		// bear poses sprites
		var bear_crouch = new Sprite("crouch.png", todo, todo);
		var bear_celeb = new Sprite("bang.png", todo, todo);

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
		bear.set_cycle();

		return bear;
	}

	// CARROT
	function New_carrot() {
		var carrot_wobble = .5;
		var carrot_wobble_frequency = .5;

		// carrot cycle sprites
		var carrot1 = new Sprite("carrot3.png", todo, todo);
		var carrot2 = new Sprite("carrot3.png", todo, todo - carrot_wobble);

		// put the carrot cycle into a sprite cycle
		var carrot_cycle = new Sprite_cycle([carrot1, carrot2], carrot_wobble_frequency);

		// put the carrot cycle into an element
		var carrot = new Element("carrot", carrot_cycle, null); // no poses

		carrot.burried = true;

		// start the carrot in cycle mode
		carrot.set_cycle();

		return carrot;
	}

	function render(){
		// background

		if (start) {
			// Background color
			ctx.fillStyle = "rgb(80, 40, 0)";
			ctx.fillRect(0, 0, c.width, c.height);

			// Title
			ctx.fillStyle = "white";
			ctx.font = "30px game";
			ctx.textAlign = "center"
			ctx.fillText("Elina    Bear", c.width/2, c.height/3);

			// Press Enter
			ctx.font = "20px game";
			if (g.blink_on){
				ctx.fillText("press    enter", c.width/2, c.height/2);
			}

			// Controls
			ctx.font = "10px game";
			ctx.fillText("space---jump", c.width/2, c.height*.6);
			ctx.fillText("Right/Left---move", c.width/2, c.height*.6 + 10);
			ctx.fillText("Down---pick carrot", c.width/2, c.height*.6 + 20);
			ctx.fillText("p---pause", c.width/2, c.height*.6 + 30);
		} else{
			// map
			ctx.drawImage(map, map_pos, 0, c.width*2, 600, 0, 0, c.width, c.height);

			// on fire
			if(carrot_count >= 50){
				ctx.fillStyle = fire_color;
				ctx.fillRect(0, 0, c.width, c.height);
			}
		}


		// draw elements
		
		//bear
		// something like bear.draw()
		//ctx.drawImage(bear, bear_x_pos, bear_y_pos, bear.width, bear.height);
		

		// carrots
		// TODO make this an everything list that decides what to do by type
		for (var i = 0; i < carrot_list.length; i++){
			crt = carrot_list[i];
			ctx.drawImage(carrot, crt.x_pos, crt.y_pos+wobble, carrot.width, carrot.height);
		}

		// pause screen
		if (paused){
			ctx.fillStyle = pause_color;
			ctx.fillRect(0, 0, c.width, c.height);
			ctx.fillStyle = "white";
			ctx.font = "30px game";
			ctx.textAlign = "center"
			ctx.fillText("Paused", c.width/2, c.height/2);
		}
		

		// stats
		ctx.textAlign = "left"
		ctx.font = "15px game";
		ctx.fillStyle = paused ? "white" : "black";

		ctx.fillText("x" + carrot_count, 20, 15);
		ctx.drawImage(carrot, 0, 0, carrot.width, carrot.height, 10, 2, carrot.width/2, carrot.height/2);
	}

	function stepFrame(){
		time += speed;

		map_pos = (time*2)%2000;

		//all items
		for (var i = 0; i < carrot_list.length; i++){
			crt = carrot_list[i];

			// move
			if(!start){
				crt.x_pos -= speed;
			}

			// collisions
			if (crt.x_pos <= bear_x_pos + bear.width && crt.x_pos > bear_x_pos - carrot.width){ // horizontal overlap
				if (crt.y_pos <= bear_y_pos + bear.height && crt.y_pos > bear_y_pos - carrot.height){ // vertical collision
					var collect = true;
					if (crt.burried){
						collect = false;
						if (crouch){
							collect = true;
							crouch = false;
							celeb = true;
							start_celeb = Date.now();
						}
					}else{
						collect = true;
					}
					if(collect){
						carrot_list.splice(i, 1);
						carrot_count += 1;
						if(carrot_count % 5 == 0){
							fire_frequency = Math.max(min_fire_frequency, fire_frequency*.6);
						}
						speed += .1;
					}
				}
			}

			// remove carrots out of bounds
			if (crt.x_pos <= -20) {
				carrot_list.splice(i, 1);
			}
		}

		// do bear jump physics
		bear.velocity += g.gravity;
		bear.y += velocity;

		if (bear.y >= g.floor_level){
			bear.velocity = 0;
			bear.y = g.floor_level;
			g.jumps = 0;
		}

		// only run when on the ground
		if(bear.y == g.floor_level){
			bear.cycle.start();
		}else{
			bear.cycle.stop();
		}

		if(start){
			if (bear_x_pos > c.width + 50){
				right = false;
				left = true;
				bear_x_pos = c.width + 40;
			} else if (bear_x_pos < -90){
				right = true;
				left = false;
				bear_x_pos = -80;
			}
		}

		// go right and left
		if (right){
			bear_x_pos += 1.5;
		}else if (left){
			bear_x_pos -= 1.5;
		}
		if(!start){
			bear_x_pos = Math.max(Math.min(bear_x_pos, c.width - bear.width), 0)
		}
	}

	function main_loop(){
		if (start){
			show_start();
		}
		stepFrame();
		render();
		window.requestAnimationFrame(main_loop);
	}

	function doKeyDown(e){
		//console.log(e.keyCode);
		if (e.keyCode == 39){
			//39 is right
			if(!start){
				right = true;
				left = false;
			}
		}else if (e.keyCode == 37){
			//37 is left
			if(!start){
				left = true;
				right = false;
			}
		}else if (e.keyCode == 40){
			//40 is down
			if(!start && bear_y_pos == floor_height && !paused){
				crouch = true;
				start_crouch = Date.now();
			}
		}else if (e.keyCode == 80){
			// pause
			if(!start){
				paused = !paused;
				pause_color = "rgba(" + Math.random() * 35 + ", " + Math.random() * 35 + ", " + Math.random() * 35 + ", .7)";
			}
		}else if (e.keyCode == 13){
			// start/Restart game
			start = !start;
			reset();
		}else if(e.keyCode == 32){
			if(jumps < max_jumps){
				velocity = -7;
				jumps += 1;
			}

		}
	}

	function doKeyUp(e){
		if (e.keyCode == 39){
			//39 is right
			if(!start){
				right = false;
			}
		}else if (e.keyCode == 37){
			//37 is left
			if(!start){
				left = false;
			}
		}else if (e.keyCode == 40){
			//40 is down
			crouch = false;
		}
	}
	
	window.addEventListener("keydown", doKeyDown, true);
	window.addEventListener("keyup", doKeyUp, true);
	window.requestAnimationFrame(main_loop);
}

play();
