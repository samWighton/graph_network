// receive data
// parse request
// get table name (deployment and mysql table)
// binary search to find first element
// read in all rows
// format data ready for response
// send response

extern crate rand;

use std::cmp::Ordering;

fn main() {
	use std::net::UdpSocket;
	use std::str;

	println!("Program Start");

	let mut tables : Vec<String> = Vec::new();
	let mut deployments : Vec<String> = Vec::new();

	let mut edges : Vec<Edge> = Vec::new();

	mock_data_setup(&mut edges, &mut tables, &mut deployments);
	get_all_links(&mut edges);
	let socket = UdpSocket::bind("127.0.0.1:34254").expect("couldn't bind to address");
	let mut buf = [0; 100];

	loop {
		let (number_of_bytes, src_addr) = socket
			.recv_from(&mut buf)
			.expect("Didn't receive data");
		parse_received(&buf);
		println!("number_of_bytes : {}\nsrc_addr : {}", number_of_bytes, src_addr);
	}
}

#[derive(Debug, Copy, Clone, Eq)]
struct Edge {
	deployment:    u32,
	subject_table: u32,
	subject_id:    u32,
	object_table:  u32,
	object_id:     u32,
	link_type:     u32,
}

impl Ord for Edge {
	fn cmp(&self, other: &Edge) -> Ordering {
		if self.deployment != other.deployment {
			return self.deployment.cmp(& other.deployment);
		}
		if self.subject_table != other.subject_table {
			return self.subject_table.cmp(& other.subject_table);
		}
		
		return self.subject_id.cmp(& other.subject_id);
	}
}

impl PartialOrd for Edge {
	fn partial_cmp(&self, other: &Edge) -> Option<Ordering> {
		Some(self.cmp(other))
	}
}

impl PartialEq for Edge {
	fn eq(&self, other: &Edge) -> bool {
		return self.deployment == other.deployment &&
			self.subject_table == other.subject_table &&
			self.subject_id == other.subject_id;
	}
}
// #[derive(Debug, Clone)]
// struct Table {
	// mysql_table: String,
	// id:          u32,
// }

// #[derive(Debug, Clone)]
// struct Deployment {
	// deployment:  String,
	// id:          u32,
// }

fn parse_received(buf: & [u8]) -> Option<(String, String, u32)> {
	let mut temp_string = String::from_utf8_lossy(buf);
	let mut split = temp_string.split(" ");
	for s in split {
		println!("{}", s)
	}
	
	None
}

fn get_all_links( edges: &mut Vec<Edge> ){
	let search_edge = Edge {
		deployment:    0,
		subject_table: 20,
		subject_id:    10,
		object_table:  0,
		object_id:     0,
		link_type:     0,
	};
	let mut search_start : usize = 0;
	let mut search_end : usize = edges.len();
	let mut jump_amount : usize = edges.len() / 2;
	loop {
		println!("search_start = {}", search_start);
		if jump_amount == 0 {
			break;	
		}
		match search_edge.cmp(&edges[search_start + jump_amount]) {
			Ordering::Greater => {
				search_start += jump_amount;
			},
			_ => {
				
			},
		}
		if jump_amount > 4 {
			jump_amount += 1;
		}
		jump_amount = jump_amount / 2;
	}
	
	jump_amount = (edges.len() - search_start) / 2;
	loop {
		println!("search_end = {}", search_end);
		if jump_amount == 0 {
			break;	
		}
		match search_edge.cmp(&edges[search_end - jump_amount]) {
			Ordering::Less => {
				search_end -= jump_amount;
			},
			_ => {
				
			},
		}
		if jump_amount > 4 {
			jump_amount += 1;
		}
		jump_amount = jump_amount / 2;
	}

	for x in search_start + 1 .. search_end {
		println!("{}", edges[x].subject_id);
	}

}

fn mock_data_setup(
	edges: &mut Vec<Edge>, 
	tables: &mut Vec<String>,
	deployments: &mut Vec<String>) {
	use rand::distributions::{IndependentSample, Range};
	let mut rng = rand::thread_rng();
	let object_range = Range::new(0, 500);
	let table_range = Range::new(0, 200);

	let num_of_edges : usize = 1000000;
	for e in 0 .. num_of_edges {
		edges.push( 
			Edge {
				deployment:    0,
				subject_table: table_range.ind_sample(&mut rng),
				subject_id:    object_range.ind_sample(&mut rng),
				object_table:  table_range.ind_sample(&mut rng),
				object_id:     object_range.ind_sample(&mut rng),
				link_type:     0,
			} 
		);
	}

	edges.sort();

	let num_of_tables : usize = 50;
	for t in 0 .. num_of_tables {
		tables.push( String::from("bad_table") );
	}
	tables[10] = String::from("contributor");

	let num_of_deployments : usize = 50;
	for d in 0 .. num_of_deployments {
		deployments.push( String::from("bad_deployment") );
	}
	tables[10] = String::from("hiive_hiive");



	// for n in 0 .. edges.len() {
	// 	if edges[n].subject_table == edges[n].object_table && 
	// 		edges[n].subject_id == edges[n].object_id {
	// 		println!("self");
	// 	}
	// }


	// for n in 0 .. 5 {
	// 	println!("{}", edges[n].subject_id);
	// }

}

