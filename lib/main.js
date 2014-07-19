var data = require("sdk/self").data;
// Construct a panel, loading its content from the "text-entry.html"
// file in the "data" directory, and loading the "get-text.js" script
// into it.

var { ToggleButton } = require('sdk/ui/button/toggle');


var ttagit = require("sdk/panel").Panel({
  contentURL: data.url("text-entry.html"),
  contentScriptFile: [
	  	data.url("libs/jquery.min.js"),
	  	data.url("libs/bootstrap.min.js"),
	  	data.url("libs/oauth.js"),
	  	data.url("libs/sha1.js"),
	  	data.url("libs/underscore.min.js")
  	],
  contentStyleFile: [data.url('css/style.css'),data.url('css/font-awesome.min.css')]
});

// Create a button
var button = ToggleButton({
  id: "show-panel",
  label: "Show Panel",
  icon: {
    "16": "./images/icon-16.png",
    "32": "./images/icon-32.png",
    "64": "./images/icon-64.png"
  },
  onClick: handleClick
});

// Show the panel when the user clicks the button.
function handleClick(state) {
  ttagit.show({
      position: button
    });
}

// When the panel is displayed it generated an event called
// "show": we will listen for that event and when it happens,
// send our own "show" event to the panel's script, so the
// script can prepare the panel for display.
// ttagit.on("show", function() {
//   ttagit.port.emit("show");
// });

// Listen for messages called "text-entered" coming from
// the content script. The message payload is the text the user
// entered.
// In this implementation we'll just log the text to the console.
// ttagit.port.on("text-entered", function (text) {
//   console.log(text);
//   ttagit.hide();
// });