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
			window.clearInterval(this.timer);
			if(this.sprites.length > 1){
				this.timer = window.setInterval(this.next_frame, 1000/this.frequency);
			}
		}

		this.stop = function(){
			window.clearInterval(this.timer);
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
		// ==================================
		// Make the Game World
		// ==================================

		// GAME WORLD

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
		this.carrot_wobble = .5;

		// bear
		this.bear_crouch_time = .4; // change these to seconds where it gets used
		this.bear_celeb_time = .3; // change this to seconds where it gets used
		this.max_jumps = 2;

		// pause and start
		this.pause_color = "rgba(20, 20, 20, .7)";
		this.start_blink_frequency = 1; // change this to frequency where it gets used

		// on fire
		this.fire_color = "rgba(" + Math.round(Math.random() * 255) +
						  ", " + Math.round(Math.random() * 255) +
						  ", " + Math.round(Math.random() * 255) + ", .3)";
		this.max_fire_frequency = .2;
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
		this.fire_frequency = .5;
	}

	// =============================
	// Load assets into Data Structures
	// =============================
	
	// BEAR
	// bear walk cycle sprites
	var bear1 = new Sprite("bear1.png", 3, 47);
	var bear2 = new Sprite("bear2.png", 1, 50);
	
	// put bear walk cycle sprites in a sprite cycle
	var bear_cycle = new Sprite_cycle([bear1, bear2], bear_walk_frequency_todo);

	// bear poses sprites
	var bear_crouch = new Sprite("crouch.png", todo, todo);
	var bear_celeb = new Sprite("bang.png", todo, todo);

	// put the poses in an object
	var bear_poses = {
		crouch: bear_crouch,
		celeb: bear_celeb
	};

	// compile all bear stuff into bear element
	this.bear = new Element("player", bear_cycle, bear_poses);

	// give bear a velocity!!
	this.bear.velocity = 0;

	// start the bear in cycle mode
	this.bear.set_cycle();

	// CARROT
	// carrot cycle sprites
	var carrot1 = new Sprite("carrot3.png", todo, todo);
	var carrot2 = new Sprite("carrot3.png", todo, todo - carrot_wobble_todo);

	// put the carrot cycle into a sprite cycle
	var carrot_cycle = new Sprite_cycle([carrot1, carrot2], carrot_wobble_frequency_todo);

	// put the carrot cycle into an element
	this.carrot = new Element("carrot", carrot_cycle, null); // no poses

	// start the carrot in cycle mode
	this.carrot.set_cycle();

	/*
	if (start) {
		for( var i = 0; i < (Math.random()*5)+4; i++){
			addCarrot();
		}
	}
	*/

	function addCarrot(g) {
		var crt = {burried: false, y_pos: 100, x_pos: c.width, creation_pos: map_pos};
		if (!start){
			crt.burried = Math.random() > .5;
		}
		if (crt.burried){
			crt.y_pos = dirt_level;
		}else{
			crt.y_pos = Math.random()*(c.height - 100);
		}

		if (start) {
			if(Math.random() > .5){
				crt.x_pos = Math.random()*(c.width/5) - carrot.width;
			}else{
				crt.x_pos = c.width - (Math.random()*(c.width/5) - carrot.width);
			}
		}
		carrot_list.push(crt);
	}

	function show_start(){
		// Background
		ctx.fillStyle = "rgb(80, 40, 0)";
		ctx.fillRect(0, 0, c.width, c.height);
		
		for (var i = 0; i < carrot_list.length; i++){
			crt = carrot_list[i];
			ctx.drawImage(carrot, crt.x_pos, crt.y_pos+wobble, carrot.width, carrot.height);
		}

		ctx.fillStyle = "white";
		ctx.font = "30px game";
		ctx.textAlign = "center"
		ctx.fillText("Elina    Bear", c.width/2, c.height/3);
		ctx.font = "20px game";
		if (time % blink_time > blink_time/2){
			ctx.fillText("press    enter", c.width/2, c.height/2);
		}
		ctx.font = "10px game";
		ctx.fillText("space---jump", c.width/2, c.height*.6);
		ctx.fillText("Right/Left---move", c.width/2, c.height*.6 + 10);
		ctx.fillText("Down---pick carrot", c.width/2, c.height*.6 + 20);
		ctx.fillText("p---pause", c.width/2, c.height*.6 + 30);

		//bear
		ctx.drawImage(bear, bear_x_pos, bear_y_pos, bear.width, bear.height);
	}


	function render(){
		//map
		ctx.drawImage(map, map_pos, 0, c.width*2, 600, 0, 0, c.width, c.height);
		if(carrot_count >= 50){
			ctx.fillStyle = fire_color;
			ctx.fillRect(0, 0, c.width, c.height);
		}
		//bear
		if(crouch){
			bear_y_pos += 15;
		}else if(celeb){
			bear_y_pos -= 8;
		}
		ctx.drawImage(bear, bear_x_pos, bear_y_pos, bear.width, bear.height);
		if(celeb){
			ctx.drawImage(carrot, bear_x_pos+7, bear_y_pos+30, carrot.width*.8, carrot.height*.8);
		}
		if(crouch){
			bear_y_pos -= 15;
		}else if(celeb){
			bear_y_pos += 8;
		}
		
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
		
		ctx.textAlign = "left"
		ctx.font = "15px game";
		if(paused){
			ctx.fillStyle = "white";
		} else {
			ctx.fillStyle = "black";
		}
		ctx.fillText("x" + carrot_count, 20, 15);
		ctx.drawImage(carrot, 0, 0, carrot.width, carrot.height, 10, 2, carrot.width/2, carrot.height/2);
	}

	function stepFrame(){
		var now = Date.now();
		time += speed;

		if (now - last_wobble > (40)){
			wobble *= -1;
			last_wobble = Date.now();
		}

		if (now - start_crouch > crouch_time){
			crouch = false;
		}

		if (now - start_celeb > celeb_time){
			celeb = false;
		}


		if(!start){
			if (now - last_carrot > (Math.random()*8000) + 1000){
				addCarrot();
				last_carrot = Date.now();
			}
		}

		if (now - last_fire > fire_frequency){
			fire_color = "rgba(" + Math.random() * 255 + ", " + Math.random() * 255 + ", " + Math.random() * 255 + ", .2)";
			last_fire = Date.now();
		}

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


		// do jump physics
		velocity += accel;
		bear_y_pos += velocity;

		if (bear_y_pos >= floor_height){
			velocity = 0;
			bear_y_pos = floor_height;
			jumps = 0;
		}

		// only run when on the ground
		if(floor_height == bear_y_pos){
			if (celeb){
				bear = bear_celeb;
			}else if(crouch){
				bear = bear_crouch;
			}else{
				bear = walk_cycle[Math.floor(walk_cycle_counter)%2];
				walk_cycle_counter += .15;
			}
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

	function update(){
		if (!paused){
			stepFrame();
		}
		if (start){
			show_start();
		}else{
			render();
		}
		window.requestAnimationFrame(update);
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
	window.requestAnimationFrame(update);
}

play();
