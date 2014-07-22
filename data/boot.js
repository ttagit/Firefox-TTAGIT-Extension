// // When the user hits return, send the "text-entered"
// // message to main.js.
// // The message payload is the contents of the edit box.
// var textArea = document.getElementById("edit-box");
// textArea.addEventListener('keyup', function onkeyup(event) {
//   if (event.keyCode == 13) {
//     // Remove the newline.
//     text = textArea.value.replace(/(\r\n|\n|\r)/gm,"");
//     self.port.emit("text-entered", text);
//     textArea.value = '';
//   }
// }, false);
// // Listen for the "show" event being sent from the
// // main add-on code. It means that the panel's about
// // to be shown.
// //
// // Set the focus to the text area so the user can
// // just start typing.
// self.port.on("show", function onShow() {
//   textArea.focus();
// });
const CONSUMER_KEY = "5Xq8DNluLF0rZ4zXaTkBgaMG1";
const CONSUMER_SECRET = "mdaOi4eFw3jUXmWTbX2oyBbpiXZ74sHuufrgoKEB1nIJ03AcGG";
const ACCESS_TOKEN_STORAGE_KEY = "ttagitStorage";
const ACCESS_TOKEN_SECRET_STORAGE_KEY = "67ityughjgtyugjhgtye5467";

var api = null;

function getTwitterAPI() {
  if (api === null) {
    api = new Twitter();
  }

  return api;
}


//console.log("HITESHJOSHIISTHEBEST",document.referrer.match(/oauth_consumer_key=([^&]+)/));

(function(undefined) {
  var twitter = getTwitterAPI();

  var loginFormElement = document.querySelector("#twitter-login");
  loginFormElement.addEventListener("click", function() {
    $("#loading").addClass('show').removeClass('hide');
    $("#loading > #loadingInformation").html("Redirecting you to twitter autentication");
    twitter.login();
  });

  $("#loading").addClass('hide').removeClass('show');

  if (twitter.isAuthenticated()) {
    loginFormElement.style.display = "none";

    $("#welcome").addClass('hide').removeClass('show');
    
    var root = document.querySelector("#content");
    
    var input = document.querySelector("#input");

    var loading = document.querySelector("#loading");
    
    

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

      $("#loading").addClass('show').removeClass('hide');
      twitter.fetchTimelines(root,input,loading,tabs[0].url);

    });

  } else {
    $("#welcome").addClass('show').removeClass('hide');
    loginFormElement.style.display = "block";
  }

  $("#twitterLogin").click(function(){
  	//twitter.login();
  	//console.log("CLICKED",twitter,twitter.login);
  })
})();
