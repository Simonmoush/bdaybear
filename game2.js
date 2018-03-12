function elina_game(){

	function Timer(callback, duration){ // takes seconds
		var start_time = Date.now();
		var timerID = null;
		var remaining = duration*1000;

		this.resume = function(){
			if(timerID == null){
				start_time = Date.now();
				window.clearTimeout(timerID);
				timerID = window.setTimeout(callback, remaining);
			}
		}

		this.pause = function(){
			var elapsed = Date.now() - start_time;
			remaining -= elapsed;
			window.clearTimeout(timerID);
			timerID = null;
		}

		this.resume();
	}

	// frequency in hz, fuzz: 0.2 means the frequency will vary from f*.9 to f*1.1
	// null will be strict interval
	function Interval(callback, frequency, fuzz){
		var fuzzy_interval = function(){
			if (fuzz == null) {
				return 1/frequency;
			} else{
				return 1/(frequency + (frequency*((Math.random()*fuzz) - fuzz/2)));
			}
		}
		var repeat = function(){
			callback();
			t = new Timer(repeat, fuzzy_interval());
		}
		this.pause = function(){
			t.pause();
		}
		this.resume = function(){
			t.resume();
		}
		var t = new Timer(repeat, fuzzy_interval());
	}

	//setup canvas and context
	var c = document.getElementById("game_window");
	var ctx = c.getContext("2d");
	ctx.imageSmoothingEnabled = false; // turn off image smoothing to look more pixel/retro
	ctx.font = "15px game";

	var anim_frame = null;

	// get keyboard events
	var keys_pressed = {};
	window.addEventListener("keydown", doKeyDown, true);
	window.addEventListener("keyup", doKeyUp, true);


	// should probably put this somewhere else...
	var start_blink = true;
	var showing_start = true;

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

		var dx = dx == null ? img.width/2 : dx;
		var dy = dy == null ? img.height/2 : dy;

		this.width = img.width;
		this.height = img.height;

		this.set_width = function(w){ img.width = w; this.width = w; }
		this.set_height = function(h){ img.height = h; this.height = h; }

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

		this.next_frame = function(){
			current_frame = (current_frame+1)%sprites.length;
		}

		this.do_cycle = function(){
			if (timer == null){
				timer = new Interval(this.next_frame, frequency, null);
			}
		}

		this.pause_cycle = function(){
			if(timer != null){
				timer.pause();
				timer = null;
			}
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
		var current_pose = (poses != null) ?  poses[Object.keys(poses)[0]] : null;
		var pose_timeout = null;

		this.get_current_pose = function(){
			if (posing) {
				return current_pose;
			} else {return false;}
		}

		this.width = function(){
			if(posing){
				return poses[current_pose].width;
			}else{
				return cycle.width();
			}
		}

		this.height = function(){
			if(posing){
				return poses[current_pose].height;
			}else{
				return cycle.height();
			}
		}

		this.set_cycle_mode = function(){
			posing = false;
			if(pose_timeout != null){
				pose_timeout.pause();
				pose_timeout = null;
			}

			cycle.do_cycle();
		}

		this.set_pose_mode = function(pose){
			posing = true;
			cycle.pause_cycle();

			if(pose_timeout != null){
				pose_timeout.pause();
				pose_timeout = null;
			}

			current_pose = pose;
		}

		this.do_pose_for_duration = function(pose, duration){
			posing = true;
			cycle.pause_cycle();
			current_pose = pose;
			pose_timeout = new Timer(this.resume_cycle, duration);
		}

		this.pause_cycle = function(){
			cycle.pause_cycle();
		}

		this.unpause_cycle = function(){
			cycle.do_cycle();
		}

		this.resume_cycle = function(){
			posing = false;
			pose_timeout = null;
			cycle.do_cycle();
		}

		this.step_cycle = function(){
			cycle.next_frame();
		}

		this.set_cycle = function(new_cycle){
			cycle = new_cycle;
		}

		this.set_poses = function(new_poses){
			poses = new_poses;
		}
		
		this.draw = function(){
			if (posing) {
				if(poses[current_pose]){
					poses[current_pose].draw(this.x, this.y);
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
			if(this.type == "player" && this.wearing_hat){
				this.hat.draw();
			}
		}
	}

	// New_Carrot
	// this just makes an element with the carrot sprites and sprite cycle set up. it sets it in cycle mode
	function New_Carrot() {
		var carrot_wobble = 1;
		var carrot_wobble_frequency = 20;

		// carrot cycle sprites
		var carrot1 = new Sprite("carrot.png", 1, 29);
		var carrot2 = new Sprite("carrot.png", 1, 29 - carrot_wobble);

		// put the carrot cycle into a sprite cycle
		var carrot_cycle = new SpriteCycle([carrot1, carrot2], carrot_wobble_frequency);

		// put the carrot cycle into an element
		var carrot = new Element("carrot", carrot_cycle, null); // no poses

		// start the carrot in cycle mode
		carrot.set_cycle_mode();

		return carrot;
	}

	function New_Banana() {
		var banana_wobble = 2.5;
		var banana_wobble_frequency = 30;

		// banana cycle sprites
		var banana1 = new Sprite("banana.png", 0, 15);
		var banana2 = new Sprite("banana.png", 0, 15 - banana_wobble);
		var banana3 = new Sprite("banana.png", 0 + banana_wobble, 15 - banana_wobble);
		var banana4 = new Sprite("banana.png", 0 + banana_wobble, 15);

		// put the banana cycle into a sprite cycle
		var banana_cycle = new SpriteCycle([banana1, banana2, banana3, banana4], banana_wobble_frequency);

		// put the banana cycle into an element
		var banana = new Element("banana", banana_cycle, null); // no poses

		// start the carrot in cycle mode
		banana.set_cycle_mode();

		return banana;
	}

	// New_Obstacle
	// this just makes an element with the obstacle sprites and sprite cycle set up. it sets it in cycle mode
	function New_Obstacle() {
		var speech_bubble_frequency = 4;
		var man_scale = 1.3;

		// cycle sprites
		var man1 = new Sprite("man1.png", 0, 23*man_scale);
		var man2 = new Sprite("man2.png", 0, 23*man_scale);

		man1.set_width(man1.width*man_scale);
		man1.set_height(man1.height*man_scale);

		man2.set_width(man2.width*man_scale);
		man2.set_height(man2.height*man_scale);


		// put the cycle sprites into a sprite cycle
		var man_cycle = new SpriteCycle([man1, man2], speech_bubble_frequency);

		// put the SpriteCycle into an element
		var obstacle = new Element("obstacle", man_cycle, null); // no poses

		// start the man in cycle mode
		obstacle.set_cycle_mode();

		return obstacle;
	}

	// New_Hat
	// this just makes an element with the hat sprite
	function New_Hat() {
		var hat_change_frequency = 8;
		var hat_scale = 1;
		var hat_height = 15;

		// sprites
		var hat1 = new Sprite("hat1.png", 0, hat_height*hat_scale);
		var hat2 = new Sprite("hat2.png", 0, hat_height*hat_scale);
		var hat3 = new Sprite("hat3.png", 0, hat_height*hat_scale);
		var hat4 = new Sprite("hat4.png", 0, hat_height*hat_scale);

		var hats = [hat1, hat2, hat3, hat4];
		for (var i = 0; i < 4; i++){
			hats[i].set_width(hats[i].width*hat_scale);
			hats[i].set_height(hats[i].height*hat_scale);
		}

		var hat_cycle = new SpriteCycle(hats, hat_change_frequency);

		// put the Spriteinto an element
		var hat = new Element("hat", hat_cycle, null); // no poses

		// start the hat in cycle mode
		hat.set_cycle_mode();

		return hat;
	}

	// New_Bear
	// make an elment with the bear sprites loaded in their pose object and cycle object
	// adds velocity to the bear and sets it in cycle mode
	function New_Bear(){
		var bear_walk_frequency = 7.5;
		var death_walk_frequency = 12;

		// bear walk cycle sprites
		var bear1 = new Sprite("bear1.png", 2, 48);
		var bear2 = new Sprite("bear2.png", 3, 50);
		
		// put bear walk cycle sprites in a sprite cycle
		var bear_cycle = new SpriteCycle([bear1, bear2], bear_walk_frequency);

		// bear poses sprites
		var bear_crouch = new Sprite("bear_crouch.png", 0, 34);
		var bear_celeb = new Sprite("bear_celeb.png", 0, 54);

		// put the poses in an object
		var bear_poses = {
			crouch: bear_crouch,
			celeb: bear_celeb
		};



		// compile all bear stuff into bear element
		var bear = new Element("player", bear_cycle, bear_poses);

		//death cycles
		var b_deaths = [new Sprite("bear_death_0.png", null, null),
						new Sprite("bear_death_1.png", null, null),
						new Sprite("bear_death_2.png", null, null),
						new Sprite("bear_death_3.png", null, null),
						new Sprite("bear_death_4.png", null, null),
						new Sprite("bear_death_5.png", null, null),
						new Sprite("bear_death_6.png", null, null),
						new Sprite("bear_death_7.png", null, null),
						new Sprite("bear_death_8.png", null, null)];

		var b_death_cycle = new SpriteCycle(b_deaths, death_walk_frequency);

		var m_deaths = [new Sprite("minion_death_0.png", null, null),
						new Sprite("minion_death_1.png", null, null),
						new Sprite("minion_death_2.png", null, null),
						new Sprite("minion_death_3.png", null, null),
						new Sprite("minion_death_4.png", null, null),
						new Sprite("minion_death_5.png", null, null),
						new Sprite("minion_death_6.png", null, null),
						new Sprite("minion_death_7.png", null, null)];

		var m_death_cycle = new SpriteCycle(m_deaths, death_walk_frequency);

		bear.b_death_cycle = b_death_cycle;
		bear.m_death_cycle = m_death_cycle;

		// save a backup of the bear poses and cycle
		bear.b_poses = bear_poses;
		bear.b_cycle = bear_cycle;

		// minion walk cycle sprites
		var minion1 = new Sprite("minion1.png", 2, 48);
		var minion2 = new Sprite("minion2.png", 3, 50);
		
		// put minion walk cycle sprites in a sprite cycle
		var minion_cycle = new SpriteCycle([minion1, minion2], bear_walk_frequency*1.5);

		// minion poses sprites
		var minion_crouch = new Sprite("minion_crouch.png", 0, 34);
		var minion_celeb = new Sprite("minion_celeb.png", 0, 54);

		// put the poses in an object
		var minion_poses = {
			crouch: minion_crouch,
			celeb: minion_celeb
		};

		bear.is_minion = false;

		bear.m_poses = minion_poses;
		bear.m_cycle = minion_cycle;

		bear.minion_timeout = null;
		bear.become_minion = function(){
			bear.is_minion = true;
			bear.set_cycle(bear.m_cycle);
			bear.set_poses(bear.m_poses);
			bear.max_jumps = bear.m_max_jumps;
			bear.speed = bear.m_speed;
			
			if(bear.minion_timeout != null){
				bear.minion_timeout.pause();
				bear.minion_timeout = null;
			}
			bear.minion_timeout = new Timer(function(){g.player.become_bear()}, g.minion_time);
		}

		bear.become_bear = function(){
			bear.is_minion = false;
			bear.max_jumps = bear.b_max_jumps;
			bear.speed = bear.b_speed;
			bear.set_cycle(bear.b_cycle);
			bear.set_poses(bear.b_poses);
		}

		bear.wearing_hat = false;
		bear.hat = null;

		bear.hat_timeout = null;
		bear.wear_hat = function(hat_element){
			bear.hat = hat_element;
			bear.hat.pause_cycle();
			bear.wearing_hat = true;

			if (bear.hat_timeout != null){
				bear.hat_timeout.pause();
				bear.hat_timeout == null;
			}
			bear.hat_timeout = new Timer(function(){g.player.remove_hat()}, g.hat_time);
		}

		bear.remove_hat = function(){
			bear.hat = null;
			bear.wearing_hat = false;
		}

		bear.die = function(){
			bear.remove_hat();
			bear.set_cycle(bear.is_minion ? bear.m_death_cycle : bear.b_death_cycle);
			bear.set_cycle_mode();
			bear.x = c.width/2;//- bear.width()/2;
			bear.y = c.height/2;// + bear.height()/2;
		}

		// give bear a velocity for jump physics
		bear.velocity = 0;

		// - is backwards, + is forwards, 0 is stopped
		bear.direction = 0;

		// how fast the bear moves
		bear.speed = 2;
		bear.b_speed = 2;
		bear.m_speed = 4;

		bear.jumps = 0;
		bear.max_jumps = 2;
		bear.b_max_jumps = 2;
		bear.m_max_jumps = 5;

		bear.jump = function(){
			if(bear.jumps < bear.max_jumps){
				bear.velocity = -7.2;
				bear.step_cycle();
				bear.jumps++;
			}
		}

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
		this.carrot_frequency = 1/2; //hz
		this.carrot_timer = new Interval(function(){g.add_carrot()}, this.carrot_frequency, .8);

		// hat
		this.hat_frequency = 1/8.5; // hz
		this.hat_timer = new Interval(function(){g.add_hat()}, this.hat_frequency, .4);

		// obstacle
		this.obstacle_frequency = 1/5.2; // hz
		this.obstacle_timer = new Interval(function(){g.add_obstacle()}, this.obstacle_frequency, .6);

		// banana
		this.banana_frequency = 1/28; // hz
		this.banana_timer = new Interval(function(){g.add_banana()}, this.banana_frequency, .2);

		// bear settings
		this.crouch_time = .4; // sec
		this.celeb_time = .3; // sec
		this.minion_time = 10; // sec
		this.hat_time = 25; // sec

		// ====================================

		// leaderboard username
		this.username = window.localStorage.getItem("username") || "anonymous";
		this.leaderboard = [];

		// game state
		this.speed = 3;
		this.time = 0;
		this.map_pos = 0;
		this.elements_on_screen = [];
		this.carrots_collected = 0;
		this.paused = false;
		this.pause_color = "rgba(20, 20, 20, .7)";
		this.game_over = false;

		this.player = New_Bear();
		this.player.x = 30;
		this.player.y = this.floor_level;


		// ==============
		// METHODS
		// ==============

		this.add_carrot = function() {
			var crt = New_Carrot();

			// position the carrot
			crt.y = this.floor_level + crt.height()*.4;
			crt.x = c.width;

			this.elements_on_screen.push(crt);
		}

		this.add_obstacle = function() {
			var obs = New_Obstacle();

			// position the obstacle
			obs.y = this.floor_level;
			obs.x = c.width;

			this.elements_on_screen.push(obs);
		}

		this.add_hat = function() {
			var hat = New_Hat();

			// position the hat
			hat.y = Math.random()*this.floor_level - 10;
			hat.x = c.width;

			this.elements_on_screen.push(hat);
		}

		this.add_banana = function() {
			var ban = New_Banana();

			// position the banana
			ban.y = Math.random()*this.floor_level - 10;
			ban.x = c.width;

			this.elements_on_screen.push(ban);
		}

		// removes an element from the world
		this.remove_element = function(index) {
			this.elements_on_screen.splice(index, 1);
		}

		this.pause_timers = function(){
			// game timers
			g.carrot_timer.pause();
			g.hat_timer.pause();
			g.obstacle_timer.pause();
			g.banana_timer.pause();

			//bear timers
			if (g.player.minion_timeout != null){
				g.player.minion_timeout.pause();
			}
			if (g.player.hat_timeout != null){
				g.player.hat_timeout.pause();
			}
		}

		this.resume_timers = function(){
			// game timers
			g.carrot_timer.resume();
			g.hat_timer.resume();
			g.obstacle_timer.resume();
			g.banana_timer.resume();

			//bear timers
			if (g.player.minion_timeout != null){
				g.player.minion_timeout.resume();
			}
			if (g.player.hat_timeout != null){
				g.player.hat_timeout.resume();
			}
		}

		this.stop = function(){
			this.speed = 0;
			this.submit_score();
			this.game_over = true;
			this.pause_timers();
		}

		this.pause = function(){
			this.paused = !this.paused;
			this.pause_color = "rgba(" + Math.random() * 35 + ", " + Math.random() * 35 + ", " + Math.random() * 35 + ", .7)";
			if(this.paused){
				this.pause_timers();
			}else{
				this.resume_timers();
				anim_frame = window.requestAnimationFrame(main_loop);
			}
		}

		this.refresh_leaderboard = function() {
                  fetch(new Request("https://jesskenney.com/leaderboard/get"))
                      .then(response => response.json())
                      .then(json => {
                          if (json.results == null) {
                              return;
                          }
                          else {
                              if (json.results.length > 6) {
                                  json.results.slice(0, 6);
                              }
                              this.leaderboard = json.results;
                          }
                      });
                }

                this.submit_score = function() {
                  fetch(new Request("https://jesskenney.com/leaderboard/post", {
                      method: "POST",
                      body: JSON.stringify({
                        "user": this.username,
                        "score": this.carrots_collected
                      })}))
                    .then(r => {
                      this.refresh_leaderboard();
                    });
                }

                this.set_username = function(u) {
                  u = u || "anonymous";
                  if (u != "anonymous") {
                    window.localStorage.setItem("username", u);
                  }
                  this.username = u;
                }
	}

function main_loop(){
		if(!g.game_over && !g.paused){
			step_frame();
		}
		render();
		if(!g.paused){
			anim_frame = window.requestAnimationFrame(main_loop);
		}
	}

	function toggle_blink(){
		start_blink = !start_blink;
	}

	function start_screen(g, request_username_after){
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
		if (start_blink){
			ctx.fillText("press    enter", c.width/2, c.height/2);
		}
		// Controls
		ctx.font = "10px game";
		ctx.fillText("space---jump", c.width/4, c.height*.6);
		ctx.fillText("Right/Left---move", c.width/4, c.height*.6 + 10);
		ctx.fillText("Down---pick carrot", c.width/4, c.height*.6 + 20);
		ctx.fillText("p---pause", c.width/4, c.height*.6 + 30);

		// Leaderboard
		ctx.fillText("LEADERBOARD", c.width*3/4, c.height*.6);
                var offset = 10;
                for (var i=0; i<g.leaderboard.length; i++) {
                  if (i > 6) { break; }
                  var user = g.leaderboard[i].user;
                  var score = g.leaderboard[i].score;
                  ctx.fillText(user + ": " + score, c.width*3/4, c.height*.6 + offset);
                  offset += 10;
                }

		anim_frame = window.requestAnimationFrame(() => start_screen(g));
		if (request_username_after) {
	          g.set_username(window.prompt("What is your name?", g.username));
                }
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
			if (elem.x <= g.player.x + g.player.width() && elem.x > g.player.x - elem.width()){
				// vertical overlap
				if (elem.y <= g.player.y + elem.height() && elem.y > g.player.y - g.player.height()){
					// collision
					if(elem.type == "carrot"){
						// collect if crouched
						if (g.player.get_current_pose() == "crouch"){
							g.remove_element(e);
							g.carrots_collected++;
							g.submit_score();
							g.speed += .15;
							g.player.do_pose_for_duration("celeb", g.celeb_time);
						}
					}else if(elem.type == "obstacle"){
						// die
						g.player.die()
						g.stop();
						return;
					}else if(elem.type == "hat"){
						// wear hat
						g.player.wear_hat(elem);
						g.remove_element(e);
					}else if(elem.type == "banana"){
						// become minion
						g.remove_element(e);
						g.player.become_minion();

					}
				}
			}
			// remove all elements that go out of bounds
			if (elem.x < 0-elem.width()){
				g.remove_element(e);
			}
		}

		// move the player
		g.player.direction = 0;

		// right and left
		if (keys_pressed[39]) { g.player.direction += g.player.speed*.8; }
		if (keys_pressed[37]) { g.player.direction -= g.player.speed*1.5; }
		g.player.x += g.player.direction;

		// keep the player in bounds
		g.player.x = Math.max(Math.min(g.player.x, c.width - g.player.width()), 0);


		// do jump physics
		g.player.velocity += g.gravity;
		g.player.y += g.player.velocity;

		if (g.player.y >= g.floor_level){
			g.player.velocity = 0;
			g.player.y = g.floor_level;
			g.player.jumps = 0;
		}

		// keep the hat on the head
		if(g.player.wearing_hat){
			g.player.hat.x = g.player.x + g.player.width()*.25;
			g.player.hat.y = g.player.y - g.player.height()*.9;
		}

		// only run when on the ground
		if(g.player.jumps != 0){ g.player.pause_cycle(); }
		else{ g.player.unpause_cycle(); }
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

		if(g.paused){
			ctx.fillStyle = g.pause_color;
			ctx.fillRect(0, 0, c.width, c.height);
			ctx.fillStyle = "white";
			ctx.font = "30px game";
			ctx.textAlign = "center"
			ctx.fillText("Paused", c.width/2, c.height/2);
		}
	}

	function doKeyDown(e){
		keys_pressed[e.keyCode] = true;

		if(!g.game_over){
			// console.log(e.keyCode);
			if (e.keyCode == 40) {
				// 40 is down arrow key
				g.player.do_pose_for_duration("crouch", g.crouch_time);
			} else if (e.keyCode == 80){
				// p for pause
				if(!showing_start){ g.pause();}
			} else if(e.keyCode == 32 || e.keyCode == 38){
				// space or up for jump
				if (!g.paused){ g.player.jump();}
			}
		}

		if (e.keyCode == 13){
                      // enter for start/Restart game
                      if (g.paused) {
                              g.pause();
                              return
                      }
                      g.pause_timers();
                      old_leaderboard = g.leaderboard;
                      g = new Game();
                      g.leaderboard = old_leaderboard;
                      window.cancelAnimationFrame(anim_frame);

                      if(showing_start){
                              main_loop();
                              showing_start = false;
                      }else{
                              start_screen(g);
                              showing_start = true;
                      }
		}
	}

	function doKeyUp(e){
		keys_pressed[e.keyCode] = false;
	}

	var g = new Game();
	g.refresh_leaderboard();

	var press_enter_timer = new Interval(toggle_blink, 2, null);
	start_screen(g, true /* request username after */);
}

elina_game();
