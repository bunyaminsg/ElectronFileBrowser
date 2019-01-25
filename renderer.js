// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const path = require("path");
const { remote } = require("electron");
const os = require("os");
const root = (os.platform == "win32") ? process.cwd().split(path.sep)[0] + path.sep : "/";
const breadcrumb = require("./components/breadcrumb");
const contextMenu = require("./components/context-menu");
const search = require("./components/search");
const navigator = require("./components/navigator");
const favourites = require("./components/favourites");
const ls = require("./components/navigator").ls;
const keyHandler = require('./util/key-handler');
const {runVisual} = require("./util/bash");
// console.log(favourites);

const { ipcRenderer } = require( "electron" );

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
};

ipcRenderer.sendSync("setGlobal", ["root_dir", root]);
ipcRenderer.sendSync("setGlobal", ["current_dir", root]);
remote.getGlobal("providers").favourites = favourites;
console.log(remote.getGlobal("providers"));

const $toggleHidden = $("#toggle_hidden");

if (/^linux/i.test(process.platform)) {
  ipcRenderer.sendSync("setGlobal", ["hideHidden", true]);
  $toggleHidden.html("Show Hidden Files");
  $toggleHidden.on("click", () => {
    const hideHidden = !remote.getGlobal("hideHidden");
    ipcRenderer.send("setGlobal", ["hideHidden", hideHidden]);
    $toggleHidden.html(hideHidden ? "Show Hidden Files" : "Hide Hidden Files");
    ls(remote.getGlobal("current_dir"), hideHidden);
  });
} else {
  ipcRenderer.sendSync("setGlobal", ["hideHidden", false]);
  $toggleHidden.remove();
}

async function main() {
  initDOM();
  navigator.init();
  favourites.init();
  contextMenu.init();
  search.init();
  keyHandler.init();
  ls(os.homedir(), remote.getGlobal("hideHidden"));
}

async function prompt(msg) {
  const $pDimmer = $("#prompt-dimmer");
  const $pInput = $("#prompt-input");
  $pDimmer.dimmer("show");
  $pDimmer.find("label").html(msg);
  $pInput.focus();
  return new Promise(resolve => {
    $pInput.on("keyup", (e) => {
      if ((e.key.toLowerCase() === "enter") || (e.key.toLowerCase() === "escape")) {
        resolve((e.key.toLowerCase() === "enter") ? $pInput.val() : undefined);
        $pDimmer.dimmer("hide");
        $pDimmer.find("label").html("");
        $pInput.val("");
        $pInput.off("keyup");
      }
    });
  });
}

function initDOM() {
  $("#run_cmd").on("click", async () => {
    const cmds = (await prompt("Command:")).split("&&").map(_ =>  _.trim());
    for (let i = 0; i < cmds.length; i++) {
      await runVisual(cmds[i].split(" ")[0], cmds[i].split(" ").slice(1), i, cmds.length - 1);
    }
  });
}

document.getElementById("back").onclick = function() {
  const currentDir = remote.getGlobal("current_dir");
  if (currentDir !== root) {
      ls(currentDir.split(path.sep).slice(0, -1).join(path.sep) || root, remote.getGlobal("hideHidden"));
  }
};

document.getElementById("home").onclick = function() {
    ls(os.homedir(), remote.getGlobal("hideHidden"));
};

document.getElementById("refresh").onclick = function() {
    ls(remote.getGlobal("current_dir"), remote.getGlobal("hideHidden"));
};

main();

if ($(window).width() < 1024) {
  $("#sidenav").css("display", "none");
  $("#main-browser").removeClass("twelve wide column").addClass("sixteen wide column");
}
