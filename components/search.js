const fs = require("fs");
const path = require("path");
const {Subject} = require("rxjs")
const {take, takeUntil} = require("rxjs/operators")

const searchWrapper = $("#search-wrapper");

let searchCompleted;

function keyToRegExp(key) {
  return key.replace(/\*/g, ".*").replace(/\./g, "\\.");
}

function search (p, key, completed) {
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
  takeUntil(searchCompleted)(search(currentDir, key, searchCompleted)).subscribe(file => {
    appendToNav(file);
  });
}

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

module.exports = {
  search: search,
  showSearch: showSearch,
  hideSearch: hideSearch
};