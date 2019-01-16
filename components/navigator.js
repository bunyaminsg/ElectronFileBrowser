const $ = require("jquery");
const path = require("path");
const execSync = require("child_process").execSync;
const {promisify, showError, fileSizeToString, escapePath} = require("../util/common");
const fileTypes = require("../fileTypes");
const fs = require("fs");
const breadcrumb = require("./breadcrumb");
const hideSearch = require("./search").hideSearch;
const { ipcRenderer, remote } = require( "electron" );

function getType(p) {
  return (fileTypes[path.extname(p).substring(1)] || '').split("\/")[0];
}

function getFileIcon(p) {
  return 'file ' + (getType(p) || '') + ' outline';
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
      ls($(this).val(), hideHidden);
      break;
  }
});

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
      ls(drive.path, hideHidden);
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

  document.querySelectorAll("#file-nav tbody tr").forEach(elem => {
      if (elem.getAttribute("folder") === "true") {
          elem.onclick = () => selectFile(elem) || ls(elem.getAttribute("path"), hide);
      } else {
          elem.onclick = () => {
            if (selectFile(elem)) return;
            if (/^win/i.test(process.platform)) {
				console.log("start " + escapePath(elem.getAttribute("path")));
                execSync("start \"\" " + escapePath(elem.getAttribute("path")));
            } else if (/^darwin/i.test(process.platform)) {
                execSync("open " + escapePath(elem.getAttribute("path")));
            } else if (/^linux/i.test(process.platform)) {
                execSync("xdg-open " + escapePath(elem.getAttribute("path")));
            } else {
                showError("Operating System Not Supported");
            }
          }
      }
  });
}

let appendedIndex = 0;

async function appendToNav(file) {
  appendedIndex++;
  $("#file-nav").find("tbody").append((await (async function () {
      const [fs_err, stats] = await promisify(fs.stat, [file]);
      return [stats ? stats.isDirectory() : false, file, createRow(file.split(path.sep).slice(-1)[0], file, stats ? stats.isDirectory() : false, fileSizeToString(stats ? stats.size : 0), stats ? new Date(stats.mtime).toDateString() : '')];
  })())[2].replace(/^<tr/, `<tr tabIndex="${appendedIndex}"`));
  document.querySelectorAll(`tbody tr[path="${file}"]`).forEach(elem => {
      if (elem.getAttribute("folder") === "true") {
          elem.onclick = () => ls(elem.getAttribute("path"), hideHidden);
      } else {
          elem.onclick = () => {
            if (/^win/i.test(process.platform)) {
				console.log("start " + escapePath(elem.getAttribute("path")));
                execSync("start \"\" " + escapePath(elem.getAttribute("path")));
            } else if (/^darwin/i.test(process.platform)) {
                execSync("open " + escapePath(elem.getAttribute("path")));
            } else if (/^linux/i.test(process.platform)) {
                execSync("xdg-open " + escapePath(elem.getAttribute("path")));
            } else {
                showError("Operating System Not Supported");
            }
          }
      }
  });
  return;
}

function createRow(fileName, filePath, isFolder, fileSize, lastModified) {
    return `<tr folder="${isFolder}" path="${filePath}">
        <td>
        <i class="${isFolder ? 'folder' : getFileIcon(filePath)} icon"></i> ${fileName}
        </td>
        <td class="collapsing">${isFolder ? '' : fileSize}</td>
        <td class="right aligned">${lastModified}</td>
    </tr>`;
}

exports.ls = ls;