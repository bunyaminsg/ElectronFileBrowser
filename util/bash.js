const spawn = require('child_process').spawn;
const { remote } = require('electron');
function runCommand (command, args, onData, onError, onExit) {
  ls    = spawn(command, args, {
    cwd: remote.getGlobal("current_dir")
  });

  ls.stdout.on('data', function (data) {
    onData && onData(data.toString());
  });

  ls.stderr.on('data', function (data) {
    onError && onError(data.toString());
  });

  ls.on('exit', function (code) {
    onExit && onExit(code.toString());
  });
}

exports.runCommand = runCommand;

exports.runVisual = async function (command, args, index, last) {
  console.log("Bash: ", command, args);
  return new Promise(resolve => {
    if (!index) {
      $("body").append(`<div id="bash-modal" class="ui modal"><div class="scrolling content"><pre style="white-space: pre-wrap"></pre></content></div>`);
    }
    const $outputModal = $("#bash-modal");
    const $outputPanel = $outputModal.find(".content > pre");
    if (!index) {
      $outputModal.modal({closable: false});
      $outputModal.modal('show');
    }
    $outputPanel.append(`<b>${command} ${args.join(" ")}</b><br>`);
    try {
      runCommand(command, args, (data) => {
        $outputPanel.append(`${data}<br>`);
        $outputModal.modal('refresh');
      }, (err) => {
        $outputPanel.append(`<b style="color: red">${err}</b><br>`);
        $outputModal.modal('refresh');
      }, (exitCode) => {
        $outputPanel.append(`Exited with code: ${exitCode}<br>`);
        resolve(exitCode);
        if (index === last) {
          $outputModal.append(`<div class="actions"><button id="close-bash-modal" class="ui primary button">OK</button></div>`);
          $outputModal.modal('refresh');
          $("#close-bash-modal").on("click", () => {
            $outputModal.modal("hide");
            $outputModal.remove();
          });
        }
      });
    } catch (err) {
      $outputPanel.append(`<b style="color: red">Command cannot be executed. ERROR: ${err}</b><br>`);
      if (index === last) {
        $outputModal.append(`<div class="actions"><button id="close-bash-modal" class="ui primary button">OK</button></div>`);
        $outputModal.modal('refresh');
        $("#close-bash-modal").on("click", () => {
          $outputModal.modal("hide");
          $outputModal.remove();
        });
      }
    }
  });
}
