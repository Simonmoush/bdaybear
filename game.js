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

	var bear = new Image();
	bear.src = "bear1.png";

	var map = new Image();
	map.src = "skymap.png";

	var carrot = new Image();
	carrot.src = "carrot3.png";

	var walk_cycle = ["bear1.png", "bear2.png"];

	var paused = false;
	var pause_color = "rgba(20, 20, 20, .7)";
	$(document).ready(function() {
	    $("#name").focus(function() {
	    	paused = true;
	    });
	});

	var start = true;
	var blink_time = 150;

	var floor_height = 85;

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
	var fire_frequency = 500;
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
		fire_frequency = 500;

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
		crt.y_pos = Math.random()*(c.height - 100);
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

		//bear
		ctx.drawImage(bear, bear_x_pos, bear_y_pos, bear.width, bear.height);
		
		for (var i = 0; i < carrot_list.length; i++){
			crt = carrot_list[i];
			ctx.drawImage(carrot, crt.x_pos, crt.y_pos+wobble, carrot.width, carrot.height);
		}

		ctx.fillStyle = "white";
		ctx.font = "30px game";
		ctx.textAlign = "center"
		ctx.fillText("Elina    Bear", c.width/2, c.height/3);
		if (time % blink_time > blink_time/2){
			ctx.font = "20px game";
			ctx.fillText("press    enter", c.width/2, c.height/2);
			ctx.textAlign = "left";
		}
	}


	function render(){
		//map
		ctx.drawImage(map, map_pos, 0, c.width*2, 600, 0, 0, c.width, c.height);
		if(carrot_count >= 60){
			ctx.fillStyle = fire_color;
			ctx.fillRect(0, 0, c.width, c.height);
		}
		//bear
		ctx.drawImage(bear, bear_x_pos, bear_y_pos, bear.width, bear.height);
		
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
					carrot_list.splice(i, 1);
					carrot_count += 1;
					submitScore(carrot_count);
					if(carrot_count % 10 == 0){
						fire_frequency = Math.max(min_fire_frequency, fire_frequency*.5);
					}
					speed += .1;
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
			bear.src = walk_cycle[Math.floor(walk_cycle_counter)%2];
			walk_cycle_counter += .15;
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
	    if ($("#name").is(":focus")) {
	    	return;
	    }
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
	    if ($("#name").is(":focus")) {
	    	return;
	    }
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
		}
	}
	
	window.addEventListener("keydown", doKeyDown, true);
	window.addEventListener("keyup", doKeyUp, true);
	window.requestAnimationFrame(update);
}

play();
