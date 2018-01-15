function play(){
	//setup
/*
	var audio = new Audio('audio_file.mp3');
	audio.play();
*/
	var c = document.getElementById("game_window");
	var ctx = c.getContext("2d");
	ctx.imageSmoothingEnabled = false;

	var paused = false;
	var pause_color = "rgba(20, 20, 20, .7)";

	var floor_height = 85;

	// jump physics
	var accel = .5;
	var velocity = 0;
	var bear_y_pos = 0;

	var time = 0;
	var walk_cycle_counter = 0;
	var bear_x_pos = 100;
	var map_pos = 0;
	var right = false;
	var left = false;
	var speed = 3;
	var last_carrot = Date.now();
	var carrot_frequency = 1000;
	var wobble = .5;
	var last_wobble = Date.now();

	var max_jumps = 2;
	var jumps = 0;

	var carrot_list = [];
	var carrot_count = 0;

	function addCarrot() {
		var carrot = {burried: false, y_pos: 100, x_pos: c.width, creation_pos: map_pos};
		carrot.y_pos = Math.random()*(c.height - 80);
		carrot_list.push(carrot);
	}

	var bear = new Image();
	bear.src = "bear1.png";

	var map = new Image();
	map.src = "skymap.png";

	var carrot = new Image();
	carrot.src = "carrot3.png";

	var walk_cycle = ["bear1.png", "bear2.png"];

	function render(){



		//draw
		ctx.drawImage(map, map_pos, 0, c.width*2, 600, 0, 0, c.width, c.height);
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
			ctx.fillText("Paused", c.width/2, c.height/2);
			
		}
		
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

		if (now - last_carrot > (Math.random()*5000) + 600){
			addCarrot();
			last_carrot = Date.now();
		}

		map_pos = (time*2)%2000;

		//all items
		for (var i = 0; i < carrot_list.length; i++){
			crt = carrot_list[i];

			// move
			crt.x_pos -= speed;

			// collisions
			if (crt.x_pos <= bear_x_pos + bear.width && crt.x_pos > bear_x_pos - carrot.width){ // horizontal overlap
				if (crt.y_pos <= bear_y_pos + bear.height && crt.y_pos > bear_y_pos - carrot.height){ // vertical collision
					carrot_list.splice(i, 1);
					carrot_count += 1;
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

		// go right and left
		if (right){
			bear_x_pos += 1.5;
		}else if (left){
			bear_x_pos -= 1.5;
		}
		bear_x_pos = Math.max(Math.min(bear_x_pos, c.width - bear.width), 0)
	}

	function update(){
		if (!paused){
			stepFrame();
		}
		render();
		window.requestAnimationFrame(update);
	}

	function doKeyDown(e){
		if (e.keyCode == 39){
			//39 is right
			right = true;
			left = false;
		}else if (e.keyCode == 37){
			//37 is left
			left = true;
			right = false;
		}else if (e.keyCode == 80){
			// pause
			paused = !paused;
			pause_color = "rgba(" + Math.random() * 35 + ", " + Math.random() * 35 + ", " + Math.random() * 35 + ", .7)";
		}else if(e.keyCode == 32){
			if(jumps < max_jumps){
				velocity = -8.5;
				jumps += 1;
			}

		}
	}

	function doKeyUp(e){
		if (e.keyCode == 39){
			//39 is right
			right = false;
		}else if (e.keyCode == 37){
			//37 is left
			left = false;
		}
	}
	
	window.addEventListener("keydown", doKeyDown, true);
	window.addEventListener("keyup", doKeyUp, true);
	window.requestAnimationFrame(update);
}

play();
