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

	let mut tables : Vec<String> = Vec::new();
	let mut deployments : Vec<String> = Vec::new();

	let mut mock_data = vec![Edge {
		deployment:    0,
		subject_table: 0,
		subject_id:    0,
		object_table:  0,
		object_id:     0,
		link_type:     0,
	} ; 1000000];

	mock_data_setup(&mut mock_data, &mut tables, &mut deployments);
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

fn parse_received(buf: & [u8]) {
	let mut temp_string = String::from_utf8_lossy(buf);
	let mut split = temp_string.split(" ");
	for s in split {
		println!("{}", s)
	}
	
	
}

fn mock_data_setup(
	mock_data: &mut Vec<Edge>, 
	tables: &mut Vec<String>,
	deployments: &mut Vec<String>) {

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


	use rand::Rng;
	let mut rng = rand::thread_rng();

	for n in 0 .. mock_data.len() {
		if mock_data[n].subject_table == 1 {
			println!("{}", mock_data[n].subject_table);
		}
	}

}

