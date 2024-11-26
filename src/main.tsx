import { render } from "preact";
import { Dashboard } from "./dashboard";

function Main({ }: {}) {
  return <Dashboard />
}

render(<Main />, document.getElementById("root")!);
