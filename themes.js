module.exports = [{
  id: "default",
  label: "Default",
  selected: true,
  classes: {
    add: [],
    remove: [[".button,.segment,.table,.menu", "inverted"]]
  },
  css: {
    add: [],
    remove: [
      [".breadcrumb .divider", "color"],
      ["body", "background"]
    ]
  }
}, {
  id: "dark",
  label: "Dark",
  selected: false,
  classes: {
    add: [[".button,.segment,.table,.menu", "inverted"]],
    remove: [[".button,.segment,.table,.menu", "inverted blue"]]
  },
  css: {
    add: [
      [".breadcrumb .divider", "color", "white"],
      ["body", "background", "#1b1c1d"]
    ],
    remove: []
  }
}, {
  id: "blue",
  label: "Blue",
  selected: false,
  classes: {
    remove: [[".button,.segment,.table,.menu", "inverted"]],
    add: [[".button,.segment,.table,.menu", "inverted"],[".table", "custom-blue"], [".menu, .segment", "blue"]]
  },
  css: {
    add: [
      [".breadcrumb .divider", "color", "white"],
      [".ui.breadcrumb .section:not(.active)", "color", "white"],
      [".ui.table.custom-blue", "background", "#5b91b9"],
      ["body", "background", "#2185d0"]
    ],
    remove: []
  }
}];
