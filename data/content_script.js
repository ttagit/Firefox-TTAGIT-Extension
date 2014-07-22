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

//jQuery(document).ready(function(){
//var pinElement = document.querySelector("div#oauth_pin > p > kbd > code");

//var pinElement = (jQuery("div#oauth_pin").find("code").text());

//console.log(pinElement);
//pinElement !== null &&
if ( document.referrer.match(/oauth_consumer_key=([^&]+)/)) {
	//regex for integer
	var intRegex = /^\d+$/;
	var pin = 0;

  if (RegExp.$1 === CONSUMER_KEY) {
  	// if( intRegex.test(parseInt(pinElement) ) ) {
  	// 	pin = parseInt(pinElement);
  	// }
  	// else
    	pin = prompt("Enter the PIN displayed by Twitter");


    getTwitterAPI().sign(pin, function(isSuccess){
      if (isSuccess === true)
        alert("Authorized, woot!");
      else
        alert("There was some problem.");
    });

  }
}

//});
