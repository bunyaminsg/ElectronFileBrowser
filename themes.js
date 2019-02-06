module.exports = [{
  id: "default",
  label: "Default",
  selected: true,
  classes: {
    add: [],
    remove: []
  },
  css: {
    add: [],
    remove: []
  }
}, {
  id: "dark",
  label: "Dark",
  selected: false,
  classes: {
    add: [[".button,.segment,.table,.menu", "inverted"]],
    remove: []
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
    remove: [],
    add: [[".button,.segment,.table,.menu", "inverted"],[".table", "custom-blue"], [".menu, .segment", "blue"]]
  },
  css: {
    add: [
      [".segment.blue", "border-color", "#59a !important"],
      [".breadcrumb .divider", "color", "white"],
      [".ui.breadcrumb .section:not(.active)", "color", "white"],
      [".ui.table.custom-blue", "background", "#5b91b9"],
      ["body", "background", "#2185d0"]
    ],
    remove: []
  }
},
/*{
  id: "pastel",
  label: "Kokoş",
  selected: false,
  classes: {
    remove: [],
    add: []
  },
  css: {
    add: [
      [".ui.segment", "background",  "#F1828D"],
      ["body,.ui.menu:not(.windowTitleBar)", "background", "#FCD0BA !important"],
      [".windowTitleBar", "background",  "#8FB9A8 !important"],
      [".ui.table thead, .ui.table thead th", "color", "white"],
      [".ui.table thead, .ui.table thead th", "background", "#765D69"],
      [".ui.table tbody", "background", "#FEFAD4"],
      [".ui.table tbody", "color", "#333"],
      ["*", "border-radius", "0 !important"],
      ["*", "border", "0 !important"]
    ],
    remove: []
  }
}
, {
    id: "forest",
    label: "Forest",
    selected: false,
    classes: {
      remove: [],
      add: [[".segment,.menu,.windowTitleBar", "inverted"],
            [".button", "inverted"],
            [".menu, .segment", "green"],
            [".table", "custom-brown"],
            [".windowTitleBar", "brown"]]
    },
    css: {
      add: [
        [".breadcrumb .divider", "color", "white"],
        [".ui.breadcrumb .section:not(.active)", "color", "white"],
        [".table.custom-brown", "background", "#966F33"],
        [".table.custom-brown thead", "background", "#6E470B"],
        [".table.custom-brown thead tr", "background", "#6E470B"],
        [".table.custom-brown thead th", "background", "#6E470B"],
        [".table.custom-brown thead th", "color", "#fec"],
        [".table.custom-brown", "color", "#fec"],
        [".table.custom-brown tbody", "background", "#AA8347"],
        ["body", "background", "#00ba4f"]
      ],
      remove: []
    }
}*/
];
