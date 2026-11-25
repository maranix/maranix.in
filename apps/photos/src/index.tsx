import { render } from "@solidjs/web";
import { App } from "./App";
import "./styles/gallery.css";

const root = document.getElementById("app");
if (root) {
  render(() => <App />, root);
}
