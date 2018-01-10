function play(){
	//setup
/*
	var audio = new Audio('audio_file.mp3');
	audio.play();
*/

	var c = document.getElementById("game_window");
	var ctx = c.getContext("2d");

	var floor_height = 90;
	var accel = .5;
	var velocity = 0;
	var position = 0;
	var time = 0;
	var walk_counter = 0;
	var runner_loc = 0;
	var right = false;
	var left = false;

	var runner = new Image(50, 50);
	runner.src = "bear1.png";

	var map = new Image(50, 50);
	map.src = "map.png";

	var walk_cycle = ["bear1.png", "bear2.png"];



	function render(){
		//trail at the end
		ctx.fillStyle = "rgba(255, 255, 255, .2)";
		ctx.fillRect(0, 0, c.width, c.height);

		//draw
		ctx.drawImage(map, time/10, 0, c.width, 240, 0, 0, c.width, c.height);
		ctx.drawImage(runner, 100 + runner_loc, position, 50, 50);
	}

	function stepFrame(){
		time += 20;

		// do jump physics
		velocity += accel;
		position += velocity;

		if (position >= floor_height){
			velocity = 0;
			position = floor_height;
		}


		// only run when on the ground
		if(floor_height == position){
			runner.src = walk_cycle[Math.floor(walk_counter)%2];
			walk_counter += .15;
		}

		// go right and left
		if (right){
			runner_loc += 1.5;
		}else if (left){
			runner_loc -= 1.5;
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
