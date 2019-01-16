// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const path = require("path");
const os = require("os");
const root = (os.platform == "win32") ? process.cwd().split(path.sep)[0] + path.sep : "/";
const $ = require("jquery");
const ls = require("./components/navigator").ls;

const { ipcRenderer, remote } = require( "electron" );

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
};

let currentDir = root;
let hideHidden = false;

ipcRenderer.sendSync("setGlobal", ["root_dir", root]);
ipcRenderer.sendSync("setGlobal", ["current_dir", currentDir]);

const $toggleHidden = $("#toggle_hidden");

if (/^linux/i.test(process.platform)) {
  hideHidden = true;
  $toggleHidden.html("Show Hidden Files");
  $toggleHidden.on("click", () => {
    hideHidden = !hideHidden;
    $toggleHidden.html(hideHidden ? "Show Hidden Files" : "Hide Hidden Files");
    ls(currentDir, hideHidden);
  });
} else {
  $toggleHidden.remove();
}

async function main() {
    ls(os.homedir(), hideHidden);
}

document.getElementById("back").onclick = function() {
    if (currentDir !== root) {
        console.log(currentDir.split(path.sep).slice(0, -1).join(path.sep));
        ls(currentDir.split(path.sep).slice(0, -1).join(path.sep) || root, hideHidden);
    }
};

document.getElementById("home").onclick = function() {
    ls(os.homedir(), hideHidden);
};

document.getElementById("refresh").onclick = function() {
    ls(currentDir, hideHidden);
};

main();

if ($(window).width() < 1024) {
  $("#sidenav").css("display", "none");
  $("#main-browser").removeClass("twelve wide column").addClass("sixteen wide column");
}
