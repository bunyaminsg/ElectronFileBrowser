const fs = require("fs");
const path = require("path");
const {Subject} = require("rxjs");
const {take, takeUntil} = require("rxjs/operators");
const {remote} = require("electron");
const fileSizeToString = require("../util/common").fileSizeToString;
const createRow = require("../util/common").createRow;
const promisify = require("../util/common").promisify;
const bindClickEvents = require("./navigator").bindClickEvents;

let searchCompleted;

let appendedIndex = 0;

function keyToRegExp(key) {
  return key.replace(/\*/g, ".*").replace(/\./g, "\\.");
}

function search (p, key, completed) {
  const searchWrapper = $("#search-wrapper");
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
              const obs = search(path.join(p, file), key, scomplete);
              subscriptions.push({
//                path: path.join(p, file),
                completed: scomplete,
                subscription: obs && obs.subscribe(x => found.next(x))
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
        subscriptions.filter(sub => sub.subscription).forEach((subs, i, _subscriptions) => {
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
      subscriptions.filter(sub => sub.subscription).forEach((subs) => {
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

function listFound() {
  appendedIndex = 0;
  const key = $("#search").val();
  $("#file-nav tbody").html("");
  takeUntil(searchCompleted)(search(remote.getGlobal("current_dir"), key, searchCompleted)).subscribe(file => {
    appendToNav(file);
  });
}

async function appendToNav(file) {
  appendedIndex++;
  $("#file-nav").find("tbody").append((await (async function () {
    const [fs_err, stats] = await promisify(fs.stat, [file]);
    return [stats ? stats.isDirectory() : false, file, createRow(file.split(path.sep).slice(-1)[0], file, stats ? stats.isDirectory() : false, fileSizeToString(stats ? stats.size : 0), stats ? new Date(stats.mtime).toDateString() : '')];
  })())[2].replace(/^<tr/, `<tr tabIndex="${appendedIndex}"`));
  bindClickEvents(file);
}

function init() {
  $("#search").on("keyup", function (e) {
    e.preventDefault();
    switch(e.key.toLowerCase()) {
      case 'escape':
        hideSearch();
        ls(remote.getGlobal("current_dir"), remote.getGlobal("hideHidden"));
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
      ls(remote.getGlobal("current_dir"), remote.getGlobal("hideHidden"));
    }
  });
}

module.exports = {
  search: search,
  showSearch: showSearch,
  hideSearch: hideSearch,
  init: init
};
