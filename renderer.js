// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const path = require("path");
const os = require("os");
const root = (os.platform == "win32") ? process.cwd().split(path.sep)[0] + path.sep : "/"
const $ = require("jquery");

const { ipcRenderer, remote } = require( "electron" );

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}

let currentDir = root;
let hideHidden = false;

ipcRenderer.sendSync("setGlobal", ["current_dir", currentDir]);

if (/^linux/i.test(process.platform)) {
  hideHidden = true;
  $("#toggle_hidden").html("Show Hidden Files");
  $("#toggle_hidden").on("click", () => {
    hideHidden = !hideHidden;
    $("#toggle_hidden").html(hideHidden ? "Show Hidden Files" : "Hide Hidden Files");
    ls(currentDir, hideHidden);
  });
} else {
  $("#toggle_hidden").remove();
}

function createBreadcrumbItems(dir) {
    const subpath = dir.split(path.sep);
    let content = '';
    (subpath && subpath.length ? subpath : [root]).forEach((spath, index) => {
        console.log(subpath, index);
        if (index === 0 && !spath.length) {
            content += `<a path="${root}" class="section"><i class = "hdd outline icon"></i></a>`;
            content += `<div class="divider">${escapeHtml(path.sep)}</div>`
        } else if (index === (((subpath && subpath.length) ? subpath.length : 1) - 1)) {
            content += `<div class="active section">${escapeHtml(spath)}</div>`;
        } else {
            content += `<a path="${path.join(root, path.join(...subpath.slice(1, index+1)))}" class="section">${escapeHtml(spath)}</a>`;
            content += `<div class="divider">${escapeHtml(path.sep)}</div>`
        }
    });
    return content;
}

async function main() {
    ls(os.homedir(), hideHidden);
}

document.getElementById("back").onclick = function() {
    if (currentDir !== root) {
        console.log(currentDir.split(path.sep).slice(0, -1).join(path.sep));
        ls(currentDir.split(path.sep).slice(0, -1).join(path.sep) || root, hideHidden);
    }
}

document.getElementById("home").onclick = function() {
    ls(os.homedir(), hideHidden);
}

document.getElementById("refresh").onclick = function() {
    ls(currentDir, hideHidden);
}

main();

if ($(window).width() < 1024) {
  $("#sidenav").css("display", "none");
  $("#main-browser").removeClass("twelve wide column").addClass("sixteen wide column");
}
