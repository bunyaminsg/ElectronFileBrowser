const {remote} = require("electron");
const path = require("path");
const escapeHtml = require("../util/common").escapeHtml;
const $ = require("jquery");

function createBreadcrumbItems(dir) {
  const subpath = dir.split(path.sep);
  let content = '';
  (subpath && subpath.length ? subpath : [remote.getGlobal("root_dir")]).forEach((spath, index) => {
    if (index === 0 && !spath.length) {
      content += `<a path="${remote.getGlobal("root_dir")}" class="section"><i class = "hdd outline icon"></i></a>`;
      content += `<div class="divider">${escapeHtml(path.sep)}</div>`
    } else if (index === (((subpath && subpath.length) ? subpath.length : 1) - 1)) {
      content += `<div class="active section">${escapeHtml(spath)}</div>`;
    } else {
      content += `<a path="${path.join(remote.getGlobal("root_dir"), path.join(...subpath.slice(1, index+1)))}" class="section">${escapeHtml(spath)}</a>`;
      content += `<div class="divider">${escapeHtml(path.sep)}</div>`
    }
  });
  return content;
}

function init(dir, onclick) {
  $("#title").html(createBreadcrumbItems(dir));
  document.querySelectorAll(".breadcrumb a[path]").forEach(item => item.onclick = function() {
    onclick(item);
  });
}

module.exports = {
  init: init
};