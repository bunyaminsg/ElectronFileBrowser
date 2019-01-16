const path = require("path");
const ls = require("../components/navigator").ls;
const {remote} = require("electron");
let ctrlKey = false, shiftKey = false, altKey = false;

$(window).on("keydown", (e) => {
  if (e.key.toLowerCase() === "control") {
    ctrlKey = true;
  } else if (e.key.toLowerCase() === "alt") {
    altKey = true;
  } else if (e.key.toLowerCase() === "shift") {
    shiftKey = true;
  } else if (e.key.toLowerCase() === "backspace" && !$("input:focus, *[contentEditable]:focus").length) {
    ls(remote.getGlobal("current_dir").split(path.sep).slice(0, -1).join(path.sep) || remote.getGlobal("root_dir"), hideHidden);
  }
});

function trStartsWithKey(elem, key) {
	return elem.children[0].innerHTML.split("</i>")[1].trim().toLowerCase().startsWith(key.toLowerCase());
}

$(window).on("keyup", (e) => {
  if (ctrlKey && e.key.toLowerCase() === "h") {
    hideHidden = !hideHidden;
    ls(remote.getGlobal("current_dir"), hideHidden);
  } else if (ctrlKey && e.key.toLowerCase() === 'f') {
    showSearch();
  } else if (e.key.toLowerCase() === "control") {
    ctrlKey = false;
  } else if (e.key.toLowerCase() === "alt") {
    altKey = false;
  } else if (e.key.toLowerCase() === "shift") {
    shiftKey = false;
  } else if (e.key.toLowerCase() === 'enter') {
	  if (document.querySelector("tr:focus")) {
	    document.querySelector("tr:focus").onclick();
	  }
  } else if (!ctrlKey && !altKey && !shiftKey && e.key.length === 1 && !$("input:focus, *[contentEditable]:focus").length) {
  	let i = 0;
  	const focused = document.querySelector("tr[path][tabIndex]:focus");
  	const startsWithKey = Array.from(document.querySelectorAll("tr[path][tabIndex]")).filter((elem) => trStartsWithKey(elem, e.key) );
  	if (!startsWithKey.length) return;
  	console.log(focused, startsWithKey);
  	if (focused && trStartsWithKey(focused, e.key) && (focused.getAttribute("tabIndex") !== startsWithKey[startsWithKey.length - 1].getAttribute("tabIndex"))) {
  	  i = startsWithKey.indexOf(focused) + 1;
  	}
  	let selected = false;
  	startsWithKey[i].focus();
  }
});
