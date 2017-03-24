var vertexes = [];
var edges = [];

var global_offset = {
	x : 0,
	y : 0
};

var mouse_status = {
	button_is : 'up',	
	x : 0,
	y : 0,
	near : undefined
};

function main () {
	set_up_canvas();
	//draw();
	// ctx.fillStyle = 'green';
	// ctx.fillRect(10, 10, 100, 100);
}

function set_up_canvas () {
	var intViewportHeight = window.innerHeight;
	var intViewportWidth = window.innerWidth;

	var canvas = document.getElementById('graph_canvas');
	canvas.setAttribute("height", intViewportHeight - 5);
	canvas.setAttribute("width", intViewportWidth);

	var ctx = canvas.getContext('2d');


	ctx.imageSmoothingEnabled = this.checked;
	ctx.mozImageSmoothingEnabled = this.checked;
	ctx.webkitImageSmoothingEnabled = this.checked;
	ctx.msImageSmoothingEnabled = this.checked;

	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	canvas.addEventListener('mousemove', mouse_move);
	canvas.addEventListener('mousedown', mouse_down);
	canvas.addEventListener('mouseup', mouse_up);
	vertexes.push({x : 100, y : 100});
	vertexes.push({x : 100, y : 200});
	vertexes.push({x : 200, y : 200});
	vertexes.push({x : 100, y : 200});
	edges.push({from : 0, to : 1});
	edges.push({from : 0, to : 2});
	edges.push({from : 1, to : 2});
	edges.push({from : 0, to : 3});
	edges.push({from : 1, to : 3});
	edges.push({from : 2, to : 3});
	draw_edges();
	
}



function draw_edges(){
	var canvas = document.getElementById('graph_canvas');
	var ctx = canvas.getContext('2d');

	for (var e = 0; e < edges.length; e++) {
		var start = {
			x : vertexes[edges[e].from].x,
			y : vertexes[edges[e].from].y,
		}
		var end = {
			x : vertexes[edges[e].to].x,
			y : vertexes[edges[e].to].y,
		}
	
		draw_edge(ctx, start, end);
	}
}

function get_nearby_vertex(event) {
	var mouse = {
		x : event.layerX - global_offset.x,
		y : event.layerY - global_offset.y
	}

	var result = {
		vertex : undefined,
		distance : 80
	};
	for (var v = 0; v < vertexes.length; v++) {
		vertex = vertexes[v];
		var dist = Math.pow(Math.pow(mouse.x - vertex.x, 2) + Math.pow(mouse.y - vertex.y, 2), 0.5);
		if (dist < result.distance) {
			result.distance = dist;
			result.vertex = v;
		}
	}	
	return (result);
}

function mouse_move(event) {
	if ( mouse_status.button_is == 'down') {
		var near;
		if (mouse_status.near !== undefined) {
			near = mouse_status.near;
		} else {
			near = get_nearby_vertex(event).vertex;
			mouse_status.near = near;
		}
		if (near !== undefined) {
			vertexes[near].x += event.layerX - mouse_status.x;
			vertexes[near].y += event.layerY - mouse_status.y;
		} else {
			global_offset.x += event.layerX - mouse_status.x;
			global_offset.y += event.layerY - mouse_status.y;
		}
	}
	mouse_status.x = event.layerX;
	mouse_status.y = event.layerY;

	var hover_near = get_nearby_vertex(event).vertex;
	//TODO animate when near
	

	var canvas = document.getElementById('graph_canvas');

	if (!canvas.getContext) {return;}
	var ctx = canvas.getContext('2d');
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	// draw_all(event);
	draw_edges();

}

function mouse_down(event) { 
	mouse_status.button_is = 'down';
	mouse_status.x = event.layerX;
	mouse_status.y = event.layerY;
}

function mouse_up(event) { 
	mouse_status.button_is = 'up';
	mouse_status.near = undefined;
}

//deprecated
function draw_all(event) {
	var canvas = document.getElementById('graph_canvas');
	if (!canvas.getContext) {return;}
	var ctx = canvas.getContext('2d');

	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	var start = {}; 
	var	end = {};
	start.x = 50;
	start.y = 50;
	end.x = event.layerX - global_offset.x;
	end.y = event.layerY - global_offset.y;
	draw_edge(ctx, start, end);
	start.x = 500;
	start.y = 500;
	draw_edge(ctx, start, end);

}

function draw_edge(ctx, start, end) {
	
	start.x += global_offset.x;
	start.y += global_offset.y;
	
	end.x += global_offset.x;
	end.y += global_offset.y;

	ctx.beginPath();
	ctx.moveTo(start.x, start.y);
	//  bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x,   y)
	ctx.bezierCurveTo((start.x + end.x) / 2, start.y, (start.x + end.x) / 2, end.y, end.x, end.y);
	ctx.stroke();

}

