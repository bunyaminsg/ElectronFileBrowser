const $ = require("jquery");
const path = require("path");
const execSync = require("child_process").execSync;
const {promisify, showError, fileSizeToString, escapePath} = require("../util/common");
const fs = require("fs");
const breadcrumb = require("./breadcrumb");
const createRow = require("../util/common").createRow;
const getDrives = require("../util/file-operations").getDrives;
const { ipcRenderer, remote } = require( "electron" );
const { OS, getOS } = require("../util/operating-system");

function hideSearch() {
  $("#search").val("");
  $("#navigate-wrapper").css("display", "none");
  $(".breadcrumb").css("display", "");
  $("#search-wrapper").css("display", "none");
}

function hideNavigator() {
  $(this).val("");
  $("#navigate-wrapper").css("display", "none");
  $(".breadcrumb").css("display", "");
}

function showNavigator() {
  const $navigate = $("#navigate");
  $navigate.val(remote.getGlobal("current_dir"));
  $("#navigate-wrapper").css("display", "");
  $(".breadcrumb").css("display", "none");
  $navigate.focus();
}

function selectFile(elem) {
  if (!ctrlKey) return false;
  $(elem).toggleClass("ui error");
  return true;
}

async function ls(dir, hide) {
  const drives = await getDrives();
  $("#favourites").find(".menu a[id|=drive]").remove();
  drives.forEach((drive, ind) => {
    $("#favourites").find(".menu").append(`<a class="item" id="drive-${ind}"><i class="usb icon"></i>${drive.label}</a>`);
    $(`#drive-${ind}`).on("click", () => {
      ls(drive.path, remote.getGlobal("hideHidden"));
    });
  });
  hideNavigator();
  hideSearch();
  document.getElementById("back").style.visibility = dir === remote.getGlobal("root_dir") ? "hidden" : "visible";
  ipcRenderer.sendSync("setGlobal", ["current_dir", dir]);
  document.querySelector("#file-nav tbody").innerHTML = "";
  breadcrumb.init(dir, (item) => {
    ls(item.getAttribute("path"), hide);
  });
  const [rd_err, files] = await promisify(fs.readdir, [dir]);
  if (rd_err) {
    showError(rd_err);
    ls(dir.split(path.sep).slice(0, -1).join(path.sep) || remote.getGlobal("root_dir"), hide);
    return;
  }

  // console.log(files);
  document.querySelector("#file-nav tbody").innerHTML = (await Promise.all(files.filter(file => !hide || !file.split(path.sep).slice(-1)[0].startsWith("\.")).map(async function (file) {
      const [fs_err, stats] = await promisify(fs.stat, [path.join(dir, file)]);
      return [stats ? stats.isDirectory() : false, file, createRow(file, path.join(dir, file), stats ? stats.isDirectory() : false, fileSizeToString(stats ? stats.size : 0), stats ? new Date(stats.mtime).toDateString() : '')];
  }))).sort((f1,f2) => {
    if (f1[0] === f2[0]) return (f1[1].toLowerCase() < f2[1].toLowerCase()) ? -1 : 1;
    else if (f1[0]) return -1;
    else return 1;
  }).map((_, index) => _[2].replace(/^<tr/, `<tr tabIndex="${index + 1}"`)).join("");

  bindClickEvents();
}

function bindClickEvents(file) {
  document.querySelectorAll(file ? `tbody tr[path="${file}"]` : '#file-nav tbody tr[path]').forEach(elem => {
    if (elem.getAttribute("folder") === "true") {
      elem.onclick = () => ls(elem.getAttribute("path"), remote.getGlobal("hideHidden"));
    } else {
      elem.onclick = () => {
        switch (getOS())  {
          case OS.LINUX:
            execSync("xdg-open " + escapePath(elem.getAttribute("path")));
            break;
          case OS.MAC:
            execSync("open " + escapePath(elem.getAttribute("path")));
            break;
          case OS.WINDOWS:
            execSync("start \"\" " + escapePath(elem.getAttribute("path")));
            break;
          default:
            showError("Operating System Not Supported");
        }
      }
    }
  });
}

function init() {
  $("#navigate-to").on("click", () => {
    showNavigator();
  });

  $("#navigate").on("keyup", function (e) {
    e.preventDefault();
    switch(e.key.toLowerCase()) {
      case 'escape':
        hideNavigator();
        break;
      case 'enter':
        ls($(this).val(), remote.getGlobal("hideHidden"));
        break;
    }
  });
}

module.exports = {
  init: init,
  ls: ls,
  bindClickEvents: bindClickEvents
};