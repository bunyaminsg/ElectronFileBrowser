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
