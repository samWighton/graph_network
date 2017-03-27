var vertexes = {};

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

var edges = [  
   {  
      "deployment":0,
      "subject_table":"staff",
      "subject_id":1000,
      "object_table":"job",
      "object_id":2127,
      "link_type":"manages"
   },
   {  
      "deployment":0,
      "subject_table":"staff",
      "subject_id":1000,
      "object_table":"contract",
      "object_id":6,
      "link_type":"manages"
   },
   {  
      "deployment":0,
      "subject_table":"staff",
      "subject_id":1000,
      "object_table":"prospect",
      "object_id":4196,
      "link_type":"manages"
   }
];

var _svgAliases = {
	// Modules
	company: 'clients-custom',
	affiliation: 'users2',
	contact: 'users2',
	staff: 'users2',
	campaign: 'campaign-custom',
	prospect: 'funnel',
	job: 'projects-custom',
	job_signoff: 'register',
	milestone: 'milestone-custom',
	issue: 'tags',
	contract: 'retainers-custom',
	contract_period: 'retainer-period-custom',
	account_invoice: 'invoices-custom',
	expense: 'receipt',
	asset: 'cube',
	report: 'document2',
	deployment: 'planet',
	task: 'clipboard-empty',
	quote: 'quotes-custom',
	activity: 'activities-custom',
	request: 'requests-custom',
	site: 'sites',
	note: 'note',
	email: 'envelope-centered',
	meeting: 'group-work',
	call: 'telephone',
	postal: 'envelope-open',
	sms: 'bubbles',
	twitter: 'twitter',
	comment: 'bubble-text',
	event_log: 'calendar-full',
	time_external: 'calendar-insert',
	campaign_action: 'campaign-custom',
	material: 'bag2',
	materials: 'bag2',
	schedule: 'calendar-empty',

	// Misc
	plus: 'linear-plus',
	circled_plus: 'plus-circle',
	prohibited: 'prohibited',
	edit: 'pencil',
	delete: 'trash',
	save: 'save',
	location: 'map-marker',
	star: 'star',
	star_filled: 'star-filled',
	play: 'play-fill',
	pause: 'pause-fill',
	clock: 'clock3',
	timer: 'timer',
	compose: 'compose',
	logtime: 'log-time',
	search: 'magnifier',
	refresh: 'sync',
	view: 'magnifier',
	tick: 'check-bold',
	cross: 'close-bold',
	split_task: 'split-task-16px',
	disable: 'cross',
	preview: 'magnifier',
	attachment: 'paperclip',
	reimbursable: 'email-receipt',
	// TODO job-upgrade - update non billable with icon found in design, waiting on jack for this one
	non_billable: 'cross',
	assigned_to_budget: 'wallet',
	billing_needed: 'warning',
	fixed_budget: 'lock',
	calculated_budget: 'calculator2',
};

// Create an in memory only element to use as data model for d3 compatibility
var detachedNodeRelationships = document.createElement('relationships');
var detachedNodeVertexes = document.createElement('vertexes');
// Create a d3 selected of detachedNode, we wont add this to the DOM
var dataContainerRelationships = d3.select(detachedNodeRelationships);
var dataContainerVertexes = d3.select(detachedNodeVertexes);

var objectMetaData;

function main () {
	const socket = new WebSocket('ws://localhost:3000');
	socket.onmessage = function(event) {
		const data = JSON.parse(event.data);
		if (data.init_data) {
			objectMetaData = data.init_data;
		}
		set_up_canvas();
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

	update();
}

function update() {
	// Relationships
	var toFrom = edges.map( (edge) => ({
		to: edge.subject_table + '_' + edge.subject_id,
		from: edge.object_table + '_' + edge.object_id
	}));
	var dataBinding = dataContainerRelationships.selectAll('relationship').data(toFrom);

	var vertexArray = get_unique_ids(toFrom).map((id) => ({x: get_random_value(window.innerWidth), y: get_random_value(window.innerHeight), id}));

	vertexArray.forEach( (objectData) => {
		vertexes[objectData.id] = objectData;
	});

	dataBinding.enter()
		.append('relationship');

	var dataBindingVertexes = dataContainerVertexes.selectAll('vertex').data(vertexArray, (d) => d);
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

	var diamater = 15;
	var strokeSize = 10;
	
	//shadow 1
	var strokeSize = 3;

	//stroke
    ctx.fillStyle = 'rgb(51,153,255)';
	ctx.beginPath();
	ctx.arc(x+strokeSize, y+strokeSize, diamater + strokeSize, 0, Math.PI * 2, true);
	ctx.fill();

	//fill
    ctx.fillStyle = 'rgba(255,255,255,1)';
	ctx.beginPath();
	ctx.arc(x + strokeSize, y + strokeSize, diamater, 0, Math.PI * 2, true);
	ctx.fill();

	var splitId = vertex.id.split('_');
	var type = splitId[0];
	var id = splitId[1];

	var metaDataDisplayOffset = 30;
	var vertexMetaData = objectMetaData[type][id];

	//Inner text
	ctx.fillStyle = "black";
	ctx.font="16px Arial";
	ctx.fillText(vertexMetaData.title || vertexMetaData.name, x + metaDataDisplayOffset, y);

	// Image
	var myImage = new Image(100, 200);
	myImage.src = (function() {
		if (vertexMetaData.md5) {
			return 'https://www.gravatar.com/avatar/' + vertexMetaData.md5 + '?d=blank';
		} else {
			var alias = _svgAliases[type];
			return '/single-original-svgs/' + alias + '.svg';
		}
	})();

	ctx.drawImage(myImage, x + metaDataDisplayOffset, y + 10);
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
	var vertexOffset = 0;
	ctx.strokeStyle = 'rgba(30,30,30,0.4)';	
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
			result.vertex = vertex.id;
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
