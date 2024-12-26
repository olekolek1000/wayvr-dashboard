use bytes::BufMut;
use interprocess::local_socket::{self, traits::Stream, ToNsName};

use crate::wlx_client_ipc::ipc;

pub struct WayVRClient {}

fn send_packet<T: Stream>(conn: &mut T, data: &[u8]) -> anyhow::Result<()> {
	let mut bytes = bytes::BytesMut::new();

	// packet size
	bytes.put_u32(data.len() as u32);

	// packet data
	bytes.put_slice(data);

	conn.write_all(&bytes)?;

	Ok(())
}

fn send_handshake<T: Stream>(conn: &mut T) -> anyhow::Result<()> {
	let handshake = ipc::Handshake::new();

	let vec = Vec::new();
	let binary = postcard::to_extend(&handshake, vec)?;

	send_packet(conn, &binary)?;

	Ok(())
}

impl WayVRClient {
	pub fn new() -> anyhow::Result<Self> {
		let printname = "wlx_dashboard_ipc.sock";
		let name = printname.to_ns_name::<local_socket::GenericNamespaced>()?;

		let mut conn = local_socket::Stream::connect(name)?;

		send_handshake(&mut conn)?;

		Ok(Self {})
	}
}
