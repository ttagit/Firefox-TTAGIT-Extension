const CONSUMER_KEY = "5Xq8DNluLF0rZ4zXaTkBgaMG1";
const CONSUMER_SECRET = "mdaOi4eFw3jUXmWTbX2oyBbpiXZ74sHuufrgoKEB1nIJ03AcGG";
const ACCESS_TOKEN_STORAGE_KEY = "ttagitStorage";
const ACCESS_TOKEN_SECRET_STORAGE_KEY = "67ityughjgtyugjhgtye5467";
const TWITTER_USER_ID_STORAGE_KEY = "userid";
const {XMLHttpRequest} = require("sdk/net/xhr");
var OAuth = require('oauth');
var tabs = require("sdk/tabs");
var _ = require('underscore');
var ss = require("sdk/simple-storage");

var Twitter = function() {};
	


Twitter.getAccessToken = function() {
  var accessToken = ss.storage.session.ACCESS_TOKEN_STORAGE_KEY;

  return _.isString(accessToken) ? accessToken : null;
};
Twitter.getAccessTokenSecret = function() {
  var accessTokenSecret = ss.storage.session.ACCESS_TOKEN_SECRET_STORAGE_KEY;

  return _.isString(accessTokenSecret) ? accessTokenSecret : null;
};
Twitter.getUserID = function() {
  var userid = Number(ss.storage.session.TWITTER_USER_ID_STORAGE_KEY);

  return (_.isNumber(userid) && !_.isNaN(userid)) ? userid : null;
};

Twitter.parseToken = function(data) {
  if (_.isString(data)) {
    var parsedToken = {};

    data.split('&').forEach(function(token) {
      var kv = token.split('=');

      parsedToken[kv[0]] = kv[1];
    });

    return parsedToken;
  }

  return null;
};


Twitter.authorize = function(data){
	var that = this;
	var params = that.parseToken(data);
	var token = params.oauth_token;
	var secret = params.oauth_token_secret;

	console.log("authorize params",params);
	var message = {
	    "method": "GET",
	    "action": "https://api.twitter.com/oauth/authorize",
	    "parameters": {
	      "oauth_consumer_key": CONSUMER_KEY,
	      "oauth_token" : token,
	      "oauth_signature_method": "HMAC-SHA1"
	    }
	};
	var accessor = {
		"consumerSecret": CONSUMER_SECRET,
		"oauth_token_secret" : secret
	};
	OAuth.setTimestampAndNonce(message);
	OAuth.SignatureMethod.sign(message, accessor);

	this.request_token = token;
    this.request_token_secret = secret;

	tabs.open(OAuth.addToURL(message.action, message.parameters));
};


Twitter.login = function(){
	var that = this;
	var message = {
		"method": "GET",
		"action": "https://api.twitter.com/oauth/request_token",
		"parameters": {
			"oauth_consumer_key": CONSUMER_KEY,
			"oauth_signature_method": "HMAC-SHA1"
		}
	  };
	var accessor = {
		"consumerSecret": CONSUMER_SECRET
	};
	OAuth.setTimestampAndNonce(message);
	OAuth.SignatureMethod.sign(message, accessor);

	var oReq = new XMLHttpRequest();


	oReq.onload = function(e) {
		console.log(oReq.response,OAuth.addToURL(message.action, message.parameters));
	  that.authorize(oReq.response);
	};
	oReq.open("GET", OAuth.addToURL(message.action, message.parameters), true);
	oReq.send();
};

Twitter.sign = function(pin, cb) {
	var that = this;
	var requestToken = this.request_token;
	var requestTokenSecret = this.request_token_secret;

  delete this.request_token;
  delete this.request_token_secret;

  var message = {
    "method": "GET",
    "action": "https://api.twitter.com/oauth/access_token",
    "parameters": {
      "oauth_consumer_key": CONSUMER_KEY,
      "oauth_signature_method": "HMAC-SHA1",
      "oauth_token": requestToken,
      "oauth_verifier": pin
    }
  };

  var accessor = {
    "consumerSecret": CONSUMER_SECRET,
    "tokenSecret": requestTokenSecret
  };



  OAuth.setTimestampAndNonce(message);
  OAuth.SignatureMethod.sign(message, accessor);



  	var handleResponse = function (status, response) {
	   if (status === 200) {
	  	var params = that.parseToken(response);
	  	that.save(params.oauth_token, params.oauth_token_secret, params.user_id);
	  	console.log("SENDING CALL BACK");
	  	return cb(true);
	  }
	  else
	  	return cb(false);
	}
	var handleStateChange = function () {
	   switch (oReq.readyState) {
	      case 0 : // UNINITIALIZED
	      case 1 : // LOADING
	      case 2 : // LOADED
	      case 3 : // INTERACTIVE
	      break;
	      case 4 : // COMPLETED
	      handleResponse(oReq.status, oReq.responseText);
	      break;
	      default: alert("error");
	   }
	}

  var oReq = new XMLHttpRequest();
  oReq.onreadystatechange=handleStateChange;
  oReq.open("GET", OAuth.addToURL(message.action, message.parameters), true);
  oReq.send(null);


  
};

Twitter.save = function(accessToken, accessTokenSecret, userid) {
  ss.storage.session.ACCESS_TOKEN_STORAGE_KEY = accessToken;
  ss.storage.session.ACCESS_TOKEN_SECRET_STORAGE_KEY = accessTokenSecret;
  ss.storage.session.TWITTER_USER_ID_STORAGE_KEY = userid;
  ss.storage.loggedIn = true;
};



Twitter.fetchTimelines = function(url,cb){
	var accessToken = this.getAccessToken();
  var accessTokenSecret = this.getAccessTokenSecret();

  var q = encodeURIComponent(url).replace(/'/g,"%27").replace(/"/g,"%22");

  var message = {
    "method": "GET",
    "action": "https://api.twitter.com/1.1/search/tweets.json?q="+q,
    "parameters": {
      "oauth_consumer_key": CONSUMER_KEY,
      "oauth_signature_method": "HMAC-SHA1",
      "oauth_token": accessToken,
      "count": 10
    }
  };

  var accessor = {
    "consumerSecret": CONSUMER_SECRET,
    "tokenSecret": accessTokenSecret
  };

  OAuth.setTimestampAndNonce(message);
  OAuth.SignatureMethod.sign(message, accessor);




  var handleResponse = function (status, response) {
	   if (status === 200) {
	  	return cb(JSON.parse(response));
	  }
	  else
	  	return cb({});
	}
	var handleStateChange = function () {
	   switch (oReq.readyState) {
	      case 0 : // UNINITIALIZED
	      case 1 : // LOADING
	      case 2 : // LOADED
	      case 3 : // INTERACTIVE
	      break;
	      case 4 : // COMPLETED
	      handleResponse(oReq.status, oReq.responseText);
	      break;
	      default: alert("error");
	   }
	}

  var oReq = new XMLHttpRequest();
  oReq.overrideMimeType("application/json"); 
  oReq.onreadystatechange=handleStateChange;
  oReq.open("GET", OAuth.addToURL(message.action, message.parameters), true);
  oReq.send(null);


};


module.exports= Twitter;