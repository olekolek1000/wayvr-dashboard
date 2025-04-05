use clap::{CommandFactory, Parser};
use libsteamium::{GameSortMethod, Steamium};

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
	#[clap(
		long,
		help = "List installed Steam games",
		default_value_if("all", "true", Some("true"))
	)]
	list_installed_games: bool,

	#[clap(
		long,
		help = "List running Steam games",
		default_value_if("all", "true", Some("true"))
	)]
	list_running_games: bool,

	#[clap(long, help = "Launch a game with a specific AppID")]
	launch_game: Option<libsteamium::AppID>,

	#[clap(long, help = "Stop a game with a specific AppID")]
	stop_game: Option<libsteamium::AppID>,
}

fn main() {
	unsafe { std::env::set_var("RUST_LOG", "DEBUG") };
	env_logger::init();

	let args = Args::parse();

	if !args.list_installed_games
		&& args.launch_game.is_none()
		&& args.stop_game.is_none()
		&& !args.list_running_games
	{
		Args::command().print_help().unwrap();
		return;
	}

	if args.list_installed_games {
		let steamium = Steamium::new().unwrap();
		let games = steamium
			.list_installed_games(GameSortMethod::PlayDateDesc)
			.unwrap();

		println!("{}", serde_json::to_string(&games).unwrap());
	} else if args.list_running_games {
		println!(
			"{}",
			serde_json::to_string(&libsteamium::list_running_games().unwrap()).unwrap()
		);
	} else if let Some(app_id) = args.launch_game {
		libsteamium::launch(app_id).unwrap();
	} else if let Some(app_id) = args.stop_game {
		libsteamium::stop(app_id, false).unwrap();
	}
}
