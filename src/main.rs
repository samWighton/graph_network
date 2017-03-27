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
extern crate rustc_serialize;

use std::cmp::Ordering;
use std::time::Instant;
use std::collections::BTreeMap;
use rustc_serialize::json;
use rustc_serialize::json::{Json, ToJson};
use std::fs::File;
use std::io::Read;
use std::borrow::ToOwned;

fn table_to_id<'a, 'b> (table_names: &'a mut Vec<&'b str>, given_table_name: &'b str) -> usize {
// fn table_to_id (table_names: &mut Vec<&str>, given_table_name: &str) -> usize {
	for (t, table_name) in table_names.iter().enumerate() {	
		if &given_table_name == table_name {
			return t;
		}
	}
	
	table_names.push(given_table_name);
	return table_names.len() - 1;
}

fn id_to_table<'a,'b> (table_names: &'a Vec<&'b str>, table_index: usize) -> & 'b str {
	return table_names[table_index];
}

fn element_to_u32 (element: &rustc_serialize::json::Json, wanted_field: &str) -> u32 {
    element.as_object().unwrap().get(wanted_field).unwrap().as_string().unwrap().parse::<u32>().unwrap()
}

fn element_to_str<'a> (element: &'a rustc_serialize::json::Json, wanted_field: &'a str) -> &'a str {
    element.as_object().unwrap().get(wanted_field).unwrap().as_string().unwrap()
}

fn main() {
	use std::net::UdpSocket;
	use std::str;

	println!("Program Start");


	let mut tables : Vec<String> = Vec::new();
	// let mut deployments : Vec<String> = Vec::new();

	let mut edges : Vec<Edge> = Vec::new();
	

    let mut file = File::open("resources/relationships.json").unwrap();
    let mut data = String::new();
    file.read_to_string(&mut data).unwrap();
    let json_all = Json::from_str(&data).unwrap();
    println!("array? {}", json_all.is_array());

    let json_array = json_all.as_array().unwrap();

    println!("length =  {}", json_array.len());
    
	let mut table_names : Vec<&str> = Vec::new();

	for e in 0 .. json_array.len() {
        let element = json_array.get(e).unwrap();
        // let temp_arg = element_to_str(element, "subject_type");
	    // println!("element = {}", element);
	    // println!("subject_type = {}", table_to_id(&mut table_names, &(element_to_str(element, "object_type") )) as u32);
        edges.push( 
			Edge {
				// deployment:    0,
				subject_type: table_to_id(&mut table_names, &(element_to_str(element, "subject_type") )) as u32,
				subject_id:    element_to_u32(element, "subject_id"),
				object_type:  table_to_id(&mut table_names,  &(element_to_str(element, "object_type") )) as u32,
				object_id:     element_to_u32(element, "object_id"),
				relationship:  table_to_id(&mut table_names,  &(element_to_str(element, "relationship") )) as u32, 
			} 

		);

	}

	

    // let mut decoded : Vec<Edge_string> = json::decode(&data).unwrap();


	// table_to_id(&mut table_names, "hi");
	// table_to_id(&mut table_names, "hello");

	// println!("ref of hello = {}", table_to_id(&mut table_names, "hello"));

	// static NAME: &'static str = "Steve"; 
	mock_data_setup(&mut edges, &mut tables);

	let socket = UdpSocket::bind("127.0.0.1:34254").expect("couldn't bind to address");
	let mut buf = [0; 100];

	loop {
		let (number_of_bytes, src_addr) = socket
			.recv_from(&mut buf)
			.expect("Didn't receive data");
		println!("number_of_bytes : {}\nsrc_addr : {}", number_of_bytes, src_addr);

		//TODO send back the data
		let edges_to_return = parse_received(&mut table_names, &edges, buf).unwrap();

		let mut vec_to_return = Vec::new();
	    for e in 0 .. edges_to_return.len() {
	        // println!("edge = {}", edges_to_return[e].subject_id);

	        // subject_type: String,
	        // subject_id:    u32,
	        // object_type:  String,
	        // object_id:     u32,
	        // relationship:  String,

	        let mut o = BTreeMap::new();
	        o.insert("subject_type".to_string(), String::from(id_to_table(&mut table_names, edges_to_return[e].subject_type as usize)).to_json());
	        o.insert("subject_id".to_string(), edges_to_return[e].subject_id.to_json());
	        o.insert("object_type".to_string(), String::from(id_to_table(&mut table_names, edges_to_return[e].object_type as usize)).to_json());
	        o.insert("object_id".to_string(), edges_to_return[e].object_id.to_json());
	        o.insert("relationship".to_string(), String::from(id_to_table(&mut table_names, edges_to_return[e].relationship as usize)).to_json());

	        vec_to_return.push(Json::Object(o));
	    }


		let json_to_return = json::encode(&vec_to_return).unwrap();




		let temp_reply_message = String::from(json_to_return);
		socket.send_to(&temp_reply_message.as_bytes(), &src_addr);





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

#[derive(Debug, Copy, Clone, Eq, RustcDecodable, RustcEncodable)]
struct Edge {
	//deployment:    u32,
	subject_type: u32,
	subject_id:    u32,
	object_type:  u32,
	object_id:     u32,
	relationship:  u32,
}

impl Ord for Edge {
	fn cmp(&self, other: &Edge) -> Ordering {
		// if self.deployment != other.deployment {
			// return self.deployment.cmp(& other.deployment);
		// }
		if self.subject_type != other.subject_type {
			return self.subject_type.cmp(& other.subject_type);
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
		return self.subject_type == other.subject_type &&
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

fn parse_received(table_names: &mut Vec<&str>, edges: &Vec<Edge>, buf: [u8;100]) ->  Option <(Vec<(Edge)>)> {

	let temp_string = String::from_utf8_lossy(&buf);
	let mut split = temp_string.split(" ");
	let mut words : Vec<&str> = Vec::new();
	
	for s in split {
		words.push(s);
		println!("{}", s)
	}

	// String::from(s)

	if words.len() < 3 {
		return None;
	}


	// String::from("get_edges")
	// String::from("get_all_edges")
	match words[0] {
        "get_all_edges"  => return Some( 
            get_all_links(
                edges, 
                (
                    1 as u32,
                    1065 as u32,
                )
            ) 
        ),
		"get_some_edges" => return None,
		_                => return None,
	}
	
	None
}

fn get_all_links( 
		edges: &Vec<Edge>, 
		(subject_type, subject_id) : (u32, u32) 
	) -> Vec<(Edge)> {
	
	let search_edge = Edge {
		//deployment:    0,
		subject_type: subject_type,
		subject_id:    subject_id,
		object_type:  0,
		object_id:     0,
		relationship:  0,
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

	let mut ret_val : Vec<(Edge)> = Vec::new();
	for x in search_start + 1 .. search_end {
		ret_val.push(
			// (edges[x].object_type, edges[x].object_id)	
			edges[x]
		);
		// println!("s id = {}", edges[x].subject_id);
		// println!("s table = {}", edges[x].subject_type);
		// println!("o id = {}", edges[x].object_id);
		// println!("o table = {}", edges[x].object_type);
		// println!("-------------------------------------");
	}
	ret_val
}

// deployments: &mut Vec<String>
fn mock_data_setup(
	edges: &mut Vec<Edge>, 
	tables: &mut Vec<String>) {
	use rand::distributions::{IndependentSample, Range};
	let mut rng = rand::thread_rng();
	let object_range = Range::new(0, 100);
	let table_range = Range::new(0, 2000);

	let num_of_edges : usize = 1000000;
	for e in 0 .. num_of_edges {
		edges.push( 
			Edge {
				// deployment:    0,
				subject_type: table_range.ind_sample(&mut rng),
				subject_id:    object_range.ind_sample(&mut rng),
				object_type:  table_range.ind_sample(&mut rng),
				object_id:     object_range.ind_sample(&mut rng),
				relationship:     0,
			} 
		);
	}

	edges.sort();

	let num_of_tables : usize = 50;
	for t in 0 .. num_of_tables {
		tables.push( String::from("bad_table") );
	}
	tables[10] = String::from("contributor");

	// let num_of_deployments : usize = 50;
	// for d in 0 .. num_of_deployments {
		// deployments.push( String::from("bad_deployment") );
	// }
	// tables[10] = String::from("hiive_hiive");



	// for n in 0 .. edges.len() {
	// 	if edges[n].subject_type == edges[n].object_type && 
	// 		edges[n].subject_id == edges[n].object_id {
	// 		println!("self");
	// 	}
	// }


	// for n in 0 .. 5 {
	// 	println!("{}", edges[n].subject_id);
	// }

}

