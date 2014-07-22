var data = require("sdk/self").data;
// Construct a panel, loading its content from the "text-entry.html"
// file in the "data" directory, and loading the "get-text.js" script
// into it.

var { ToggleButton } = require('sdk/ui/button/toggle');
var Request = require("sdk/request").Request;
var tabs = require("sdk/tabs");
var urls = require("sdk/url");

var ui = require("sdk/ui");

const {XMLHttpRequest} = require("sdk/net/xhr");
var myUrl = null;
var ttagit = require("sdk/panel").Panel({
  contentURL: data.url("text-entry.html"),
  contentScriptFile: [
	  	data.url("libs/jquery.min.js"),
	  	data.url("libs/bootstrap.min.js"),
	  	data.url("libs/oauth.js"),
	  	data.url("libs/sha1.js"),
	  	data.url("libs/underscore.min.js"),
	  	data.url("libs/twitter.js"),
	  	data.url("boot.js")
  	],
  contentStyleFile: [data.url('css/style.css'),data.url('css/font-awesome.min.css')]
});

// tabs.on('ready', function(tab) {
//   worker = tab.attach({

//     contentScript: [data.url("libs/jquery.min.js"),
//     				data.url("libs/oauth.js"),
//     				data.url("libs/sha1.js"),
//     				data.url("libs/underscore.min.js"),
//     				data.url("libs/twitter.js"),
//     				data.url("content_script.js")],
//     onMessage: function (message) {
//       console.log(message);
//     }
//   });

//   //worker.port.emit("alert", "Message from the add-on");

// });


tabs.on('open',function(tab){
	console.log(tab);
});


// tabs.on('ready', function(tab) {
//   console.log('tab is loaded', tab.title, tab.url);
// });

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

//initial url loading
ttagit.port.on('generateTwitterLoginUrl',function(url){
	// Be a good consumer and check for rate limiting before doing more.
	// Request({
	//   url: new String(urls.URL(url).href).toString(),
	//   overrideMimeType: "text/plain; charset=utf-8",
	//   contentType:'text/plain; charset=utf-8',
	//   anonymous:true,
	//   onComplete: function (response) {
	//   	console.log("WTF response",response);
	//   	ttagit.port.emit('generatedResult',response);
	//   },
	//   onError: function(err){
	//   	console.log("ERROR",err);
	//   }
	// }).get();

	//var oReq = new XMLHttpRequest();
	//oReq.open("GET", url, true);
	// retrieve data unprocessed as a binary string
	//oReq.overrideMimeType("text/plain; charset=x-user-defined");

	var oReq = new XMLHttpRequest();


	oReq.onload = function(e) {
	  var arraybuffer = oReq.response; // not responseText
	  console.log(arraybuffer);
	  ttagit.port.emit('generatedResult',oReq.response);
	}
	oReq.open("GET", url, true);
	oReq.send();

});



ttagit.port.on('openLoginUrl',function(url){

	var sidebar = ui.Sidebar({
	  id: 'ttagit',
	  title: 'Pin authorize',
	  url: data.url("sidebar.html"),
	  onAttach: function (worker) {
	    worker.port.on("savePin", function(pin) {
	    	ttagit.port.emit('savePin',pin);
	      
	      ttagit.port.on('pinCheck',function(isSuccess){
	      	worker.port.emit("pinSaved",isSuccess);
	      });
	    });
	  }
	});

	sidebar.show();

	myUrl = url;
	tabs.open({
		url:url,
		// onOpen: function onOpen(tab) {
		// 	console.log(tab.url,"OPEN");
		// },
		// onReady: function onOpen(tab) {
		// 	console.log(tab.url,"READY");
		// },
		// onLoad: function onOpen(tab) {
		// 	console.log(tab.url,"onLoad");
		// },
		onPageShow: function onOpen(tab) {
			console.log(tab.url,"onPageShow");
			if(tab.url == 'https://api.twitter.com/oauth/authorize')
			ttagit.port.emit('savePin',true);
		},

	});
});
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