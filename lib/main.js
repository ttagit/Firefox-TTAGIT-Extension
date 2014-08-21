
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
    		worker.port.emit('newTweets',{tweets:tweets,url:ss.storage.currentUrl});
    	});
    });

    worker.port.on('TweetSomething',function(data){
      Twitter.tweet(data,ss.storage.currentUrl,function(tweet){
        worker.port.emit('newTweet',tweet);
      });
    });

    
    worker.port.on('FollowSomeone',function(data){
      Twitter.follow(data,function(){
        worker.port.emit('Followed',data);
      });
    });
    


    worker.port.on('reTweet',function(data){
      Twitter.retweet(data,function(){
        worker.port.emit('reTweeted',data);
      });
    });
    
    worker.port.on('favIt',function(data){
      Twitter.favit(data,function(){
        worker.port.emit('favIted',data);
      });
    });
    
    

    


  }
});

// Listen for tab content loads.
tabs.on('ready', function(tab) {
	ss.storage.currentUrl =tab.url;
	if(currentWorker && ss.storage.loggedIn)
		currentWorker.port.emit('updatedUrl',ss.storage.currentUrl);
  //console.log('*************************************************************************tab ready*************************************************************************', tab.title, tab.url);
});

tabs.on('activate', function () {
  ss.storage.currentUrl =tabs.activeTab.url;
  if(currentWorker && ss.storage.loggedIn)
    currentWorker.port.emit('updatedUrl',ss.storage.currentUrl);
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
