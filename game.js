function Asset(type, name, src, x_anchor, y_anchor){
	this.type = type;
	this.name = name;
	this.images = [];
	this.frame = 0;
	
function play(){
	//setup
/*
	var audio = new Audio('audio_file.mp3');
	audio.play();
*/
	var c = document.getElementById("game_window");
	var ctx = c.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	ctx.font = "15px game";

	var bear1 = new Image();
	bear1.src = "bear1.png";

	var bear2 = new Image();
	bear2.src = "bear2.png";
	
	var bear_crouch = new Image();
	bear_crouch.src = "crouch.png";

	var bear_celeb = new Image();
	bear_celeb.src = "bang.png";

	var bear = bear1;

	var map = new Image();
	map.src = "skymap.png";

	var carrot = new Image();
	carrot.src = "carrot3.png";

	var walk_cycle = [bear1, bear2];

	var paused = false;
	var pause_color = "rgba(20, 20, 20, .7)";

	var start = true;
	var blink_time = 150;

	var floor_height = 85;

	var dirt_level = 115;

	var crouch = false;
	var start_crouch = Date.now();
	var crouch_time = 300;

	var celeb = false;
	var start_celeb = Date.now();
	var celeb_time = 300;

	// jump physics
	var accel = .5;
	var velocity = 0;
	var bear_y_pos = floor_height;

	var time = 0;
	var walk_cycle_counter = 0;
	var bear_x_pos = 50;
	var map_pos = 0;
	var right = false;
	var left = false;
	var speed = 3;
	var last_carrot = Date.now();
	var carrot_frequency = (Math.random()*5000) + 500;
	var wobble = .5;
	var last_wobble = Date.now();

	var fire_color = "rgba(" + Math.random() * 255 + ", " + Math.random() * 255 + ", " + Math.random() * 255 + ", .3)";
	var last_fire = Date.now();
	var fire_frequency = 800;
	var min_fire_frequency = 100;

	var max_jumps = 2;
	var jumps = 0;

	var carrot_list = [];
	var carrot_count = 0;

	function reset(){
		paused = false;
		pause_color = "rgba(20, 20, 20, .7)";

		bear_y_pos = floor_height;

		time = 0;
		walk_cycle_counter = 0;
		if(start){
			bear_x_pos = -100;
		}else{
			bear_x_pos = 50;
		}
		map_pos = 0;
		right = false;
		left = false;
		speed = 3;
		last_carrot = Date.now();
		last_wobble = Date.now();

		fire_color = "rgba(" + Math.random() * 255 + ", " + Math.random() * 255 + ", " + Math.random() * 255 + ", .3)";
		last_fire = Date.now();
		fire_frequency = 800;

		jumps = 0;

		carrot_list = [];
		carrot_count = 0;
		if (start) {
			var start_carrots = (Math.random() * 5) + 4
			for( var i = 0; i < start_carrots; i++){
				addCarrot();
			}
		}
	}
	reset();

	function addCarrot() {
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
