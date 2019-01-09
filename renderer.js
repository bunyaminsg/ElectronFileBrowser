// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const fs = require("fs");
const path = require("path");
const os = require("os");
const execSync = require('child_process').execSync;
const root = (os.platform == "win32") ? process.cwd().split(path.sep)[0] + path.sep : "/"
const $ = require("jquery");
const fileTypes = require("./fileTypes");
const {Observable, Subject} = require("rxjs")
const {take, takeUntil} = require("rxjs/operators")
const { remote } = require('electron')
const { Menu, MenuItem } = remote


let isFileNavElement;
let fileNavElement;

const menu = new Menu()
const menuItem = new MenuItem(
  // {
  //   label: 'Inspect Element',
  //   click: () => {
  //     remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y)
  //   }
  // },
    {
      label: 'Add To favourites',
      visible: false,
      click: (...args) => {
        console.log(fileNavElement)
        const fav = {id: "item-" + favourites.length,
          name: $(fileNavElement).attr("path").split(path.sep).slice(-1)[0],
          path: $(fileNavElement).attr("path"),
          icon: "star"
        };
        favourites.push(fav);
        $("#favourites .menu").append(`<a data-tooltip="${fav.path}" data-position="right center" class="item" id="fav-${fav.id}"><i class="${fav.icon} icon"></i>${fav.name}</a>`);
        //$("#favourites").dropdown();
        $(`#fav-${fav.id}`).on("click", () => { ls(fav.path, hideHidden); });
      }
    }
  )
menu.append(menuItem)
/*menu.on('menu-will-close', () => {
  isFileNavElement = false;
  fileNavElement = undefined;
})*/

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  rightClickPosition = {x: e.x, y: e.y}
  isFileNavElement = false;
  fileNavElement = undefined;
  let target = e.target;
  if ($(target).is("#file-nav *")) {
    while (target && !$(target).is("tr[path]")) {
      target = target.parentElement;
    }
    if (target) {
      isFileNavElement = true;
      fileNavElement = target;
    }
  }
  menuItem.visible = isFileNavElement;
  // console.log(e);
  menu.popup(remote.getCurrentWindow())
}, false)

// const drivelist = require('drivelist');

function keyToRegExp(key) {
  return key.replace(/\*/g, ".*").replace(/\./g, "\\.");
}

const searchWrapper = $("#search-wrapper");

function search(p, key, completed) {
  if (searchWrapper.css("display") === "none") {completed.next(); return;}
  const found = new Subject();
  const subscriptions = [];
  fs.readdir(p, (err, files) => {
    if (err) { completed.next(1); return; }
    files.filter(file => new RegExp(keyToRegExp(key), 'g').test(file)).forEach(file => found.next(file));
    (() => {
      return new Promise(resolve => {
        let _async = files.length;
        if (!_async) resolve();
        files.forEach(file => {
          fs.stat(path.join(p, file), (err, stats) => {
            if (!err && stats.isDirectory() && !/.*\.asar$/.test(file)) {
              const scomplete = new Subject();
              subscriptions.push({
//                path: path.join(p, file),
                completed: scomplete,
                subscription: search(path.join(p, file), key, scomplete).subscribe(x => found.next(x))
              });
            }
            _async--;
            if (!_async) resolve();
          });
        });
      });
    })().then(() => {
      if (!subscriptions.length) { completed.next(1); }
      else {
        subscriptions.forEach((subs, i, _subscriptions) => {
          take(1)(subs.completed.asObservable()).subscribe(() => {
            subs.subscription.unsubscribe();
            _subscriptions.splice(_subscriptions.indexOf(subs), 1);
            if (!_subscriptions.length) { completed.next(1); }
          });
        });
      }
    })
  });
  const completeSubs = completed.asObservable().subscribe((id) => {
    if (id !== 1) {
      subscriptions.forEach((subs) => {
        subs.subscription.unsubscribe();
        subs.completed.next(0);
      });
      completeSubs.unsubscribe();
    }
  });
  return found.asObservable();
}

/*** Usage of search
const s = new Subject();
const start = new Date();
(s.asObservable()).subscribe(() => console.log((((new Date()).getTime() - start.getTime())/1000.0)));
srch("/home/bunyamin/temp/", "temp", s);
*/

async function getDrives() {
  const drives = [];
  if (!/^linux/i.test(process.platform)) return [];
  const [rd_err, files] = await promisify(fs.readdir, [path.join('/media/', os.userInfo().username)]);
  if (!rd_err && files) {
    drives.push(...files.map(file => {
      return {
        label: file.length > 12 ? file.substring(0, 9) + '...' : file,
        path: path.join('/media/', os.userInfo().username, file)
      };
    }))
  }
  const [rd_err2, files2] = await promisify(fs.readdir, ['/mnt']);
  if (!rd_err2 && files2) {
    drives.push(...files2.map(file => {
      return {
        label: file.length > 12 ? file.substring(0, 9) + '...' : file,
        path: path.join('/mnt/', file)
      };
    }))
  }
  return drives;
  /*drivelist.list((error, drives) => {
    if (error) {
      throw error;
    }

    drives.forEach((drive) => {
      console.log(drive);
    });
  });*/
}


const favourites = [
  {id: "root", name: "Root", path: root, icon: "hdd outline"},
  {id: "home", name: "Home", path: os.homedir(), icon: "home"},
  {id: "desktop", name: "Desktop", path: path.join(os.homedir(), "Desktop"), icon: "desktop"},
  {id: "downloads", name: "Downloads", path: path.join(os.homedir(), "Downloads"), icon: "download"}
];

$("#favourites .menu").html(favourites.map(fav => `<a class="item" id="fav-${fav.id}"><i class="${fav.icon} icon"></i>${fav.name}</a>`));
//$("#favourites").dropdown();
favourites.forEach(fav => $(`#fav-${fav.id}`).on("click", () => { ls(fav.path, hideHidden); }));


function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

function escapePath(p) {
  return /^win/i.test(process.platform) ? `"${p}"` : p.replace(/ /g, "\\ ");
}

function getType(p) {
	return (fileTypes[path.extname(p).substring(1)] || '').split("\/")[0];
}

function getFileIcon(p) {
	return 'file ' + (getType(p) || '') + ' outline';
}

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}

let currentDir = root;


let hideHidden = false;

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

async function promisify(f, args) {
   return new Promise(resolve => {
       f.apply(this, args.concat([function (...rargs) {
           resolve(rargs);
       }]));
   });
}
function fileSizeToString(size) {
    let k = 0;
    const units = {
        0: "b",
        1: "kb",
        2: "mb",
        3: "gb",
        4: "tb"
    }
    while ((size > 1000) && (k < 4)) {
        size = size / 1000; k++;
    }
    return Math.round(size).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + units[k];
}

function showError(err) {
    const msg = document.createElement("div");
    msg.innerHTML = err;
    msg.className = "ui error message";
    document.querySelector(".messages").appendChild(msg);
    setTimeout(() => {
        document.querySelector(".messages > .message:first-child").remove();
    }, 3000);
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

function createRow(fileName, filePath, isFolder, fileSize, lastModified) {
    return `<tr folder="${isFolder}" path="${filePath}">
        <td>
        <i class="${isFolder ? 'folder' : getFileIcon(filePath)} icon"></i> ${fileName}
        </td>
        <td class="collapsing">${isFolder ? '' : fileSize}</td>
        <td class="right aligned">${lastModified}</td>
    </tr>`;
}
async function ls(dir, hide) {
  const drives = await getDrives();
  $("#favourites .menu a[id|=drive]").remove();
  drives.forEach((drive, ind) => {
    $("#favourites .menu").append(`<a class="item" id="drive-${ind}"><i class="usb icon"></i>${drive.label}</a>`);
    $(`#drive-${ind}`).on("click", () => {
      ls(drive.path, hideHidden);
    });
  });
  hideNavigator();
  hideSearch();
  document.getElementById("back").style.visibility = dir === root ? "hidden" : "visible";
  currentDir = dir;
  document.querySelector("#file-nav tbody").innerHTML = "";
  document.getElementById("title").innerHTML = createBreadcrumbItems(dir);
  document.querySelectorAll(".breadcrumb a[path]").forEach(item => item.onclick = function() {
      console.log(item);
      ls(item.getAttribute("path"), hide);
  });
  const [rd_err, files] = await promisify(fs.readdir, [dir]);
  if (rd_err) {
    showError(rd_err);
    ls(dir.split(path.sep).slice(0, -1).join(path.sep) || root, hide);
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
  document.querySelectorAll("tbody tr").forEach(elem => {
      if (elem.getAttribute("folder") === "true") {
          elem.onclick = () => ls(elem.getAttribute("path"), hide);
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

let appendedIndex = 0;

async function appendToNav(file) {
  appendedIndex++;
  $("#file-nav tbody").append((await (async function () {
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

async function main() {
    ls(os.homedir(), hideHidden);
}

let ctrlKey = false, shiftKey = false, altKey = false;

$(window).on("keydown", (e) => {
  if (e.key.toLowerCase() === "control") {
    ctrlKey = true;
  } else if (e.key.toLowerCase() === "alt") {
    altKey = true;
  } else if (e.key.toLowerCase() === "shift") {
    shiftKey = true;
  } else if (e.key.toLowerCase() === "backspace" && !$("input:focus").length) {
    ls(currentDir.split(path.sep).slice(0, -1).join(path.sep) || root, hideHidden);
  }
});

function trStartsWithKey(elem, key) {
	return elem.children[0].innerHTML.split("</i>")[1].trim().toLowerCase().startsWith(key.toLowerCase());
}

$(window).on("keyup", (e) => {
  if (ctrlKey && e.key.toLowerCase() === "h") {
    hideHidden = !hideHidden;
    ls(currentDir, hideHidden);
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
  } else if (!ctrlKey && !altKey && !shiftKey && e.key.length === 1 && !$("input:focus").length) {
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


document.getElementById("back").onclick = function() {
    if (currentDir !== root) {
        console.log(currentDir.split(path.sep).slice(0, -1).join(path.sep));
        ls(currentDir.split(path.sep).slice(0, -1).join(path.sep) || root, hideHidden);
    }
}

document.getElementById("home").onclick = function() {
    ls(os.homedir(), hideHidden);
}

main();

if ($(window).width() < 1024) {
  $("#sidenav").css("display", "none");
  $("#main-browser").removeClass("twelve wide column").addClass("sixteen wide column");
}

function hideNavigator() {
  $(this).val("");
  $("#navigate-wrapper").css("display", "none");
  $(".breadcrumb").css("display", "");
}

function showNavigator() {
  $("#navigate").val(currentDir);
  $("#navigate-wrapper").css("display", "");
  $(".breadcrumb").css("display", "none");
  $("#navigate").focus();
}

function showSearch() {
  searchCompleted = new Subject();
  $("#navigate-wrapper").css("display", "none");
  $(".breadcrumb").css("display", "none");
  $("#search-wrapper").css("display", "");
  $("#search").focus();
}

function hideSearch() {
  $("#search").val("");
  $("#navigate-wrapper").css("display", "none");
  $(".breadcrumb").css("display", "");
  $("#search-wrapper").css("display", "none");
  if (searchCompleted) {
    searchCompleted.next(0);
  }
}

let searchCompleted;

function listFound() {
  appendedIndex = 0;
  const key = $("#search").val();
  $("#file-nav tbody").html("");
  takeUntil(searchCompleted)(search(currentDir, key, searchCompleted)).subscribe(file => {
    appendToNav(file);
  });
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

$("#search").on("keyup", function (e) {
  e.preventDefault();
  switch(e.key.toLowerCase()) {
    case 'escape':
      hideSearch();
      ls(currentDir, hideHidden);
      break;
    case 'enter':
      if ($("#search").val()) listFound();
      else hideSearch();
      break;
  }
});

$("#search-button").on("click", function() {
  if ($("#search-wrapper").css("display") === "none") {
    showSearch();
  } else {
    hideSearch();
    ls(currentDir, hideHidden);
  }
});
