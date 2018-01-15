$(document).ready(function() {
    var savedUsername = window.localStorage.getItem("username");
    if (savedUsername) {
    	$("#name").val(savedUsername);
    }
    updateLeaderboard();
});

// Edit HTML to display fresh leaderboard
function updateLeaderboard() {
    getLeaderboard()
    .then(scores => {
	table = $("#leaderboard");
	table.empty();
	$.each(scores, function(rowIndex, r) {
	    var row = $("<tr/>");
	    $.each(r, function(colIndex, c) {
		row.append($("<td/>").text(c));
	    });
	    table.append(row);
	});
	if (scores.length == 0) {
	    var row = $("<tr/>");
	    row.append($("<td/>").text("Empty Leaderboard"));
	    table.append(row);
	}
    });
}

// Returns Promise of list of {user, score}
function getLeaderboard() {
    return fetch(new Request("https://jesskenney.com/leaderboard/get"))
	.then(response => response.json())
	.then(json => {
	    if (json.results == null) {
	    	return [];
	    }
	    else {
	    	if (json.results.length > 10) {
	    	    json.results.slice(0, 10);
	    	}
	    	return json.results;
	    }
	});
}

// Submit current user's current score, and update leaderboard
function submitScore(score) {
    var user = $("#name").val().trim();
    if (user && score) {
    	window.localStorage.setItem("username", user);
    	submit(user, score);
    }
    updateLeaderboard();
}

// Submit a score for the user, score pair
function submit(user, score) {
    fetch(new Request("https://jesskenney.com/leaderboard/post", {
	method: "POST",
	body: JSON.stringify({user, score})}))
    //.then(response => response.json())
    //.then(json => console.log(json));
}
