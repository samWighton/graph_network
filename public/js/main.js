var dataContainerRelationships;
var dataContainerVertexes;
var vertexes;

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

// Fake data
var relationships = [
	{from : 0, to : 1},
	{from : 0, to : 2},
	{from : 1, to : 2},
	{from : 0, to : 3},
	{from : 1, to : 3},
	{from : 2, to : 3},
];

function main () {
	set_up_canvas();
	const socket = new WebSocket('ws://localhost:3000');
	socket.onmessage = function(event) {
		console.log('received');
		const data = JSON.parse(event.data);
		if (data.init_data) {
			console.log(data.init_data);
		}
	}
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

	vertexes = get_unique_ids(relationships).map((id) => ({x: get_random_value(intViewportWidth), y: get_random_value(intViewportHeight), id}));

	// Create an in memory only element to use as data model for d3 compatibility
	var detachedNodeRelationships = document.createElement('relationships');
	var detachedNodeVertexes = document.createElement('vertexes');
	// Create a d3 selected of detachedNode, we wont add this to the DOM
	dataContainerRelationships = d3.select(detachedNodeRelationships);
	dataContainerVertexes = d3.select(detachedNodeVertexes);

	// Relationships
	var dataBinding = dataContainerRelationships.selectAll('relationship').data(relationships, function(d) {return d;});

	dataBinding.enter()
		.append('relationship');

	var dataBindingVertexes = dataContainerVertexes.selectAll('vertex').data(vertexes, (d) => d);
	dataBindingVertexes.enter()
		.append('vertex')
		.attr('id', (vertex) => vertex.id);

	draw_edges();
	draw_vertexes();
}

function draw_vertexes() {
	var canvas = document.getElementById('graph_canvas');
	var ctx = canvas.getContext('2d');

	var vertexes = dataContainerVertexes.selectAll('vertexes vertex');
	vertexes.each((vertex) => {
		draw_vertex(ctx, vertex);
	});
}

function draw_vertex(ctx, vertex) {
	var x = vertex.x + global_offset.x;
	var y = vertex.y + global_offset.y;

	var diamater = 50;
	
	//shadow 1
	var shadowOffset = 3;
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
	ctx.beginPath();
	ctx.arc(x+shadowOffset, y+shadowOffset, diamater + shadowOffset, 0, Math.PI * 2, true);
	ctx.fill();

	//shadow 2
	var shadowTwoOffset = shadowOffset / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
	ctx.beginPath();
	ctx.arc(x+shadowTwoOffset, y+shadowTwoOffset, diamater + shadowTwoOffset, 0, Math.PI * 2, true);
	ctx.fill();

	//fill
    ctx.fillStyle = 'rgba(255,255,255,1)';
	ctx.beginPath();
	ctx.arc(x, y, diamater, 0, Math.PI * 2, true);
	ctx.fill();

	//outline
	ctx.strokeStyle = 'rgba(30,30,30,1)';	
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.arc(x, y, diamater, 0, Math.PI * 2, true);

	//Inner text
	ctx.fillStyle = "red";
	ctx.font="20px Georgia";
	ctx.fillText(vertex.id, x, y);
}

function draw_edges(){
	var canvas = document.getElementById('graph_canvas');
	var ctx = canvas.getContext('2d');

	var relationships = dataContainerRelationships.selectAll('relationships relationship');
	relationships.each(function(relationship) {
		var start = {
			x : vertexes[relationship.from].x,
			y : vertexes[relationship.from].y,
		}
		var end = {
			x : vertexes[relationship.to].x,
			y : vertexes[relationship.to].y,
		}

		draw_edge(ctx, start, end);
	});
}

function draw_edge(ctx, start, end) {
	var vertexOffset = 75;
	ctx.strokeStyle = 'rgba(30,30,30,1)';	
	ctx.lineWidth = 4;

	start.x += global_offset.x - vertexOffset;
	start.y += global_offset.y;
	
	end.x += global_offset.x + vertexOffset;
	end.y += global_offset.y;

	ctx.beginPath();
	ctx.moveTo(start.x, start.y);
	//  bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x,   y)
	ctx.bezierCurveTo((start.x + end.x) / 2, start.y, (start.x + end.x) / 2, end.y, end.x, end.y);
	ctx.stroke();

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

	var vertexesSelection = dataContainerVertexes.selectAll('vertexes vertex');
	vertexesSelection.each((vertex, index) => {
		var dist = Math.pow(Math.pow(mouse.x - vertex.x, 2) + Math.pow(mouse.y - vertex.y, 2), 0.5);
		if (dist < result.distance) {
			result.distance = dist;
			result.vertex = index;
		}
	});
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
	draw_edges();
	draw_vertexes();
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

function get_unique_ids(relationships) {
	var allIds = relationships.map((relationship) => relationship.to )
		.concat( relationships.map(relationship => relationship.from) );

	return allIds.filter( (value, index, self) => {
		return self.indexOf(value) === index;
	});
}

function get_random_value(max) {
	return Math.random() * max;
}
