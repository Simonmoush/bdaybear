function play(){
	//setup
/*
	var audio = new Audio('audio_file.mp3');
	audio.play();
*/
	var c = document.getElementById("game_window");
	var ctx = c.getContext("2d");
	ctx.imageSmoothingEnabled = false;

	var floor_height = 85;
	var accel = .5;
	var velocity = 0;
	var bear_y_pos = 0;
	var time = 0;
	var walk_cycle_counter = 0;
	var bear_x_pos = 0;
	var map_pos = 0;
	var right = false;
	var left = false;
	var speed = 3;
	var last_carrot = Date.now();
	var carrot_frequency = 1000;
	var wobble = .5;
	var last_wobble = Date.now();

	var carrot_size = 20;
	var carrot_list = [];

	function addCarrot() {
		var carrot = {burried: false, y_pos: 100, x_pos: c.width, creation_pos: map_pos};
		carrot.y_pos = Math.random()*(c.height - 80);
		carrot_list.push(carrot);
	}

	var bear = new Image(50, 50);
	bear.src = "bear1.png";

	var map = new Image(50, 50);
	map.src = "skymap.png";

	var carrot = new Image(50, 50);
	carrot.src = "carrot.png";

	var walk_cycle = ["bear1.png", "bear2.png"];

	function render(){
		//draw
		ctx.drawImage(map, map_pos, 0, c.width*2, 600, 0, 0, c.width, c.height);
		ctx.drawImage(bear, 100 + bear_x_pos, bear_y_pos, 45, 50);
		
		for (var i = 0; i < carrot_list.length; i++){
			crt = carrot_list[i];
			ctx.drawImage(carrot, crt.x_pos, crt.y_pos+wobble, 0.7*carrot_size, carrot_size);
		}
	}

	function stepFrame(){
		var now = Date.now();
		time += speed;
		speed += .001;

		if (now - last_wobble > (40)){
			wobble *= -1;
			last_wobble = Date.now();
		}

		if (now - last_carrot > (Math.random()*5000) + 600){
			addCarrot();
			last_carrot = Date.now();
		}

		//move all items
		map_pos = (time*2)%2000;

		for (var i = 0; i < carrot_list.length; i++){
			crt = carrot_list[i];
			crt.x_pos -= speed;

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
	}

	function update(){
		stepFrame();
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
		}else if(e.keyCode == 32){
			velocity = -8.5;
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
