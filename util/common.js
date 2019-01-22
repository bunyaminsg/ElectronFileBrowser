exports.escapeHtml = function(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

exports.escapePath = function(p) {
  return /^win/i.test(process.platform) ? `"${p}"` : p.replace(/ /g, "\\ ");
}

exports.promisify = async function(f, args) {
   return new Promise(resolve => {
       f.apply(this, args.concat([function (...rargs) {
           resolve(rargs);
       }]));
   });
}

exports.fileSizeToString = function(size) {
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

exports.showError = function(err) {
    const msg = document.createElement("div");
    msg.innerHTML = err;
    msg.className = "ui error message";
    document.querySelector(".messages").appendChild(msg);
    setTimeout(() => {
        document.querySelector(".messages > .message:first-child").remove();
    }, 3000);
}

exports.promptUser = function(title, msg, options) {
    return new Promise(resolve => {
      const $modal = $("#prompt-modal");
      $modal.find(".header").html(title);
      $modal.find(".content").html(msg);
      $modal.find(".extra").html((options || ['OK']).map((option, i) =>
        `<button class="ui button" prompt-option="${i}">${option}</button>`
      ).join(''));
      $modal.modal("show");
      $modal.modal("settings", "onHide", function () {
        resolve(undefined);
        $modal.find(".header").html("");
        $modal.find(".content").html("");
        $modal.find(".extra").html("");
      });
      $modal.find(".extra button").on("click", function() {
          resolve($(this).attr("prompt-option"));
          $modal.modal("hide");
      });
    });
}

const fileTypes = require("../fileTypes");
const path = require("path");

function getType(p) {
  return (fileTypes[path.extname(p).substring(1)] || '').split("\/")[0];
}

function getFileIcon(p) {
  return 'file ' + (getType(p) || '') + ' outline';
}

exports.createRow = function(fileName, filePath, isFolder, fileSize, lastModified) {
  return `<tr folder="${isFolder}" path="${filePath}">
        <td>
        <i class="${isFolder ? 'folder' : getFileIcon(filePath)} icon"></i> ${fileName}
        </td>
        <td class="collapsing">${isFolder ? '' : fileSize}</td>
        <td class="right aligned">${lastModified}</td>
    </tr>`;
}