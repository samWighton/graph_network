// receive data
// parse request
// get table name (deployment and mysql table)
// binary search to find first element
// read in all rows
// format data ready for response
// send response
//
// benchmark results : 
// with 100,000 objects in db
// Sharing 50,000,000 edges
// 75,709,901 edges traversed per second
// 0.000006604156 seconds to find the (approx) 250 related objects of a random starting object

// 0.003475303 seconds to traverse 250,000 relationships (with 100,000,000 relationships in db)

extern crate rand;

use std::cmp::Ordering;
use std::time::Instant;

fn main() {
	use std::net::UdpSocket;
	use std::str;

	println!("Program Start");

	let mut tables : Vec<String> = Vec::new();
	let mut deployments : Vec<String> = Vec::new();

	let mut edges : Vec<Edge> = Vec::new();

	mock_data_setup(&mut edges, &mut tables, &mut deployments);

	let socket = UdpSocket::bind("127.0.0.1:34254").expect("couldn't bind to address");
	let mut buf = [0; 100];

	loop {
		let (number_of_bytes, src_addr) = socket
			.recv_from(&mut buf)
			.expect("Didn't receive data");
		println!("number_of_bytes : {}\nsrc_addr : {}", number_of_bytes, src_addr);

		//TODO send back the data
		parse_received(&edges, &buf);

        socket.send_to(&buf, &src_addr);





		// let first_order_links = get_all_links(&mut edges, (20, 10));
		// let benchmark_start = Instant::now();
		// for f in 0 .. first_order_links.len() {
			// let second_order_links = get_all_links(&mut edges, first_order_links[f]);	
			// // println!("number_of_links : {}", second_order_links.len());
		// }
		// println!("benchmark = {} seconds {} nanoseconds", benchmark_start.elapsed().as_secs(), benchmark_start.elapsed().subsec_nanos());
	}
	return
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

fn parse_received(edges: &Vec<Edge>, buf: & [u8]) -> Option<(Vec<(u32, u32)>)> {

	let mut temp_string = String::from_utf8_lossy(buf);
	let mut split = temp_string.split(" ");
	let mut words : Vec<&str> = Vec::new();
	
	for s in split {
	    words.push(s);
		println!("{}", s)
	}

    // String::from(s)

	if words.len() == 0 {
	    return None;
	}


    // String::from("get_edges")
    // String::from("get_all_edges")
	match words[0] {
	    "get_all_edges"  => return Some( get_all_links(edges, (0, 0)) ),
	    "get_some_edges" => return None,
	    _                => return None,
	}
	
	None
}

fn get_all_links( 
		edges: &Vec<Edge>, 
		(subject_table, subject_id) : (u32, u32) 
	) -> Vec<(u32, u32)> {
	
	let search_edge = Edge {
		deployment:    0,
		subject_table: subject_table,
		subject_id:    subject_id,
		object_table:  0,
		object_id:     0,
		link_type:     0,
	};
	let mut search_start : usize = 0;
	let mut search_end : usize = edges.len();
	let mut jump_amount : usize = edges.len() / 2;
	loop {
		// println!("search_start = {}", search_start);
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
		// println!("search_end = {}", search_end);
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

	let mut ret_val : Vec<(u32, u32)> = Vec::new();
	for x in search_start + 1 .. search_end {
		ret_val.push(
			(edges[x].object_table, edges[x].object_id)	
		);
		// println!("s id = {}", edges[x].subject_id);
		// println!("s table = {}", edges[x].subject_table);
		// println!("o id = {}", edges[x].object_id);
		// println!("o table = {}", edges[x].object_table);
		// println!("-------------------------------------");
		
	}
	ret_val
}

fn mock_data_setup(
	edges: &mut Vec<Edge>, 
	tables: &mut Vec<String>,
	deployments: &mut Vec<String>) {
	use rand::distributions::{IndependentSample, Range};
	let mut rng = rand::thread_rng();
	let object_range = Range::new(0, 100);
	let table_range = Range::new(0, 2000);

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

