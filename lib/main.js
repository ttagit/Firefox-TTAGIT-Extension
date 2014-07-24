
var data = require("sdk/self").data;

var { ToggleButton } = require('sdk/ui/button/toggle');
var Request = require("sdk/request").Request;
var tabs = require("sdk/tabs");
var urls = require("sdk/url");
//var sql = require("sqlite").connect("ttagit_database.sqlite");
var ss = require("sdk/simple-storage");
var ui = require("sdk/ui");

var Twitter = require('twitter');

console.log(Twitter)

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


//is this the first time.
if(typeof(ss.storage.sidebarActive)!== 'boolean'){
	ss.storage.loggedIn = false;
	ss.storage.sidebarActive = true;
	ss.storage.session = {};
	Twitter.login();
	//sidebar.show();
	console.log("its not boolean.");
};

//console.log(ss.storage.loggedIn);
var currentWorker = null;
var sidebar = require("sdk/ui/sidebar").Sidebar({
  id: 'my-sidebar',
  title: 'TTAGIT',
  url: ss.storage.loggedIn? data.url("index.html") : data.url("login.html"),
  onAttach: function (worker) {
  	currentWorker = worker;
    worker.port.on("ping", function() {
      console.log("add-on script got the message");
      worker.port.emit("pong");
    });

    worker.port.on('savePin',function(pin){
    	Twitter.sign(pin,function(isSuccess){
    		if(isSuccess)
    		{
    			sidebar.url = data.url("index.html");
    		}
    		else
    			worker.port.emit('pinSaved',isSuccess);
    	});
    });

    worker.port.on('getUpdatedTweets',function(){
    	Twitter.fetchTimelines(ss.storage.currentUrl,function(tweets){
    		worker.port.emit('newTweets',tweets);
    	});
    });
  }
});

// Listen for tab content loads.
tabs.on('ready', function(tab) {
	ss.storage.currentUrl =tab.url;
	if(currentWorker)
		currentWorker.port.emit('updatedUrl',ss.storage.currentUrl);
  //console.log('*************************************************************************tab ready*************************************************************************', tab.title, tab.url);
});

// Show the panel when the user clicks the button.
function handleClick(state) {
	if(ss.storage.sidebarActive && ss.storage.sidebarActive === true)
		sidebar.show();
	else
		sidebar.hide();
	console.log("Clicked");
	return ss.storage.sidebarActive = !ss.storage.sidebarActive;
	

}

if(typeof(ss.storage.sidebarActive)=== 'boolean' && ss.storage.sidebarActive == true && ss.storage.loggedIn == false){
	//Twitter.login();
	sidebar.show();
	//console.log("its not boolean.");
};

//ss.storage.myArray = [1, 1, 2, 3, 5, 8, 13];
//console.log(ss.storage.myArray);

//ss.storage.myArray.push(344);
//console.log(ss.storage.myArray);
// //SELECT name FROM sqlite_master WHERE type='table' AND name='table_name';
// sql.execute("create toggle if not exists toggle");
// sql.execute("create user_info if not exists user_info");

// //sqlite.execute("create table features(id integer primary key autoincrement, name text);");

// sql.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='table_name';")

// //sql.execute("create table features(id integer primary key autoincrement, name text);");

// //sql.execute('insert into features(name) values("hola");');

// sql.execute("select * from features;",function(result,status){
//   for(var i=0;i<result.rows;i++){
//     for(var j=0;j<result.cols;j++){
//       console.log(result.data[i][j]);
//     }
//   }
// });




// // var {Cu, components} = require("chrome");
// // var {FileUtils} = Cu.import("resource://gre/modules/FileUtils.jsm");
// // var {Services} = Cu.import("resource://gre/modules/Services.jsm");

// // //const {Cu} = require("chrome");

// // //Components.utils.import("resource://gre/modules/FileUtils.jsm");

// // //var file = new FileUtils.File("/home");

// // //var FileUtils = require('io/file')

// // var dbFile = FileUtils.getFile("ProfD", "ttagit.sqlite");
// // var alreadyExists = dbFile.exists();
// // var dbConnection = Services.storage.openDatabase(dbFile);
// // console.log("Does database exists?",dbFile.exists());

// // //if (!alreadyExists)
// // //  connection.createTable("foo", "id INTEGER PRIMARY KEY, ...");