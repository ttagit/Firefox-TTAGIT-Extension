/*
 *Este modulo realiza toda la comunicacion con twitter.
 *La forma de utilizacion de este modulo es siempre a traves de la funcion callHandler. La idea es llamar a la funcion callHandler perteneciente
 *al modulo Util indicando que funcion de este modulo se requiere, junto a sus parametros y que funcion ejecutar luego de obtener los resultados de twitter (Esta funcion
 *puede pertenecer a otro modulo, pero debe especificarse correctamente a que objeto pertenece para poder referenciarla).
 *Ejemplo: ttagit.utils.callHandler("Auth",['username','pass'],"ttagit.pepito");
 *con esto logramos ejecutar la funcion  Auth que nos autentificará en twitter, con los parametros pasados dentro de un arreglo y luego se
 *ejecutara la funcion pepito del modulo ttagit.
 */

var TtagitTwitter = function(){
	this.oauth = new TtagitOauth("TtlbwX8bHy6rpoNQEeBvTjzCe","HfRum6ObKlcgiZyLXXgLXKzLGaxESxwJFMieXpgaYHuLr8z7hH");

	this.LoggedUser = null;// this object contains the info of authentication of user. If this token is null, then the user is unloged.

	this.version = '3.3.5.3'

	this.apiVersion = '1.1';

	this.confirmedFrendishipDM= [];
}

TtagitTwitter.prototype = {

//--------------------------------------------
//	 MISC
//--------------------------------------------

	setLoggedUser: function (TwitterResponse){
		this.LoggedUser = {'user_id':TwitterResponse.user_id, 'screen_name':TwitterResponse.screen_name};
	},

	createTokenAuthJson: function (datos){
		//ttagit.errorLog.setLog("Create token of user Authentication");
		datos = datos.split("&");
		var i,hhh,
		myEst="{";

		for(i=0; i< datos.length; i++)
		{
			hhh=datos[i];
			hhh=hhh.split("=");
			myEst=myEst + '"' + hhh[0]+ '"';
			myEst=myEst +': "' + hhh[1] +'"';
			if ((i + 1) != datos.length) { myEst= myEst + ', ';}
		}
		myEst=myEst + "}";

		return myEst;
	},

	confirmFDM: function (friend) {
		if ($.inArray(friend ,this.confirmedFrendishipDM) == -1) {
			this.confirmedFrendishipDM = this.confirmedFrendishipDM.concat([friend]);
		}
	},

	isConfirmedFDM: function (friend) {
		return $.inArray(friend ,this.confirmedFrendishipDM) > -1;
	},

	removeConfirmedFDM: function (friend) {
		var 	index = $.inArray(friend ,this.confirmedFrendishipDM);

		if (index < 0) { return true; }

		this.confirmedFrendishipDM.splice(index, 1);
	},

//--------------------------------------------
//	 API CALLs HELPERS
//--------------------------------------------

	/*
	 *Esta funcion termina de hacer todos los seteos del header para enviar la solicitud a la API de twitter.
	*/
	preSent: function(url, auth_header, connectionId){
		ttagit.xhr.setURL(url, connectionId);
		ttagit.xhr.setHeader("Authorization", auth_header, connectionId);
	},

//--------------------------------------------
//	 AUTHENTICATION oAuth 1.0a
//--------------------------------------------

	/**
	 *
	 */
	requestToken: function  ( functionToEval, paramsTofunc ){
		var url, connectionId, returnHandler;

		url = "https://api.twitter.com/oauth/request_token";

		this.oauth.initValues();

		this.oauth.setValues('oauth_callback', 'oob');

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url , this.oauth.makeHeader() , connectionId );

		ttagit.xhr.setPost("", connectionId);

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			if (datos.indexOf("&") == -1) {
				//hubo un error al loguear.
				var responseJSON = "{\"request\":\"\/oauth\/request_token\",\"error\":\""+datos+"\"}";
				returnHandler(functionToEval,paramsTofunc,responseJSON);
			} else{
				returnHandler(functionToEval,paramsTofunc,ttagit.twitter.createTokenAuthJson(datos),'twitter');
			}
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/**
	 *
	 */
	Auth: function ( pin, oauth_token, oauth_token_secret, functionToEval, paramsTofunc ){

		var connectionId, returnHandler,responseJSON,
		url = "https://api.twitter.com/oauth/access_token";

		//set temporal tokens for this call
		this.oauth.setTokens(oauth_token, oauth_token_secret);

		this.oauth.initValues();

		this.oauth.setValues('oauth_verifier', pin);

		this.oauth.setValues('oauth_signature',  this.oauth.calcSignature("POST", url) );

		//remove temporal tokens for this call
		this.oauth.setTokens(null, null);

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url, this.oauth.makeHeader(), connectionId );

		ttagit.xhr.setPost( '', connectionId);

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			if (datos.indexOf("&") == -1) {
				responseJSON = "{\"request\":\"\/oauth\/access_token\",\"error\":\"Wrong PIN\"}";
				returnHandler(functionToEval,paramsTofunc,responseJSON);
			}
			else {
				//arma el json con los datos traidos: ot, ots, user_id, etc
				returnHandler(functionToEval,paramsTofunc,ttagit.twitter.createTokenAuthJson(datos),'twitter');
			}
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

//--------------------------------------------
//	 MISC API CALLS
//--------------------------------------------

	verifyCredentials: function( functionToEval, paramsTofunc ){

		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/account/verify_credentials.json";

		this.oauth.initValues();

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url, this.oauth.makeHeader(), connectionId );

		//set callback
		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	getConfiguration: function( functionToEval, paramsTofunc ){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/help/configuration.json";

		this.oauth.initValues();

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url, this.oauth.makeHeader(), connectionId );

		//set callback
		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

//--------------------------------------------
//	 TWEETS FEEDS
//--------------------------------------------
	/*
	 * Returns the 200 most recent statuses, including retweets if they exist, posted by the authenticating user and the user's they follow.
	 *URL:http://dev.twitter.com/doc/get/statuses/home_timeline
	 */
	getTimeLineTweets: function ( since_id, functionToEval, paramsTofunc ){
		var connectionId, returnHandler,
		count = 200,
		url="https://api.twitter.com/"+this.apiVersion+"/statuses/home_timeline.json";

		ttagit.errorLog.setLog("call to function 'twitter.getTimeLineTweets'");

		this.oauth.initValues();

		this.oauth.setParams('count', count);
		url += "?count="+count;

		if( !ttagit.utils.isNull( since_id ) ) {
			this.oauth.setParams('since_id', since_id);
			url += "&since_id="+since_id;
		}

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url, this.oauth.makeHeader(), connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler( functionToEval, paramsTofunc, datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 * Returns the top 10 trending topics for a specific WOEID, if trending information is available for it.
	 * URL:https://dev.twitter.com/docs/api/1.1/get/trends/place
	 */
	getTrendTopics: function (woeid,functionToEval,paramsTofunc){
		url="https://api.twitter.com/"+this.apiVersion+"/trends/place.json"

		ttagit.errorLog.setLog("call to 'twitter.getTrendTopics'");

		this.oauth.initValues();

		this.oauth.setParams('id', woeid);
		url += "?id="+woeid;

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url));

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url, this.oauth.makeHeader(), connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler( functionToEval , paramsTofunc , datos , 'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},



	/*
	 * Returns the 200 most recent mentions (status containing @username) for the authenticating user.
	 * The timeline returned is the equivalent of the one seen when you view your mentions on twitter.com.
	 * URL:https://dev.twitter.com/docs/api/1/get/statuses/mentions_timeline
	 */
	getMentions: function (since_id,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		count = 200,
		url="https://api.twitter.com/"+this.apiVersion+"/statuses/mentions_timeline.json";

		ttagit.errorLog.setLog("call to 'twitter.getMentions'");

		this.oauth.initValues();

		this.oauth.setParams('count', count);
		url += "?count="+count;

		if( !ttagit.utils.isNull( since_id ) ) {
			this.oauth.setParams('since_id', since_id);
			url += "&since_id="+since_id;
		}

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url));

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url, this.oauth.makeHeader(), connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler( functionToEval , paramsTofunc , datos , 'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 * Returns the 200 most recent direct messages sent to the authenticating user.
	 *URL:http://dev.twitter.com/doc/get/direct_messages
	 */
	getDirectMessages: function ( since_id, functionToEval, paramsTofunc ){
		var connectionId, returnHandler,
		count = 200,
		url = "https://api.twitter.com/"+this.apiVersion+"/direct_messages.json";

		ttagit.errorLog.setLog("call to 'twitter.getDirectMessages'");

		this.oauth.initValues();

		this.oauth.setParams('count', count);
		url += "?count="+count;

		if( !ttagit.utils.isNull( since_id ) ) {
			this.oauth.setParams('since_id', since_id);
			url += "&since_id="+since_id;
		}

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 * Returns the 200 most recent direct messages sent by the authenticating user.
	 *URL:http://dev.twitter.com/doc/get/direct_messages/sent
	 */
	getDirectMessagesSent: function(since_id,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		count = 200,
		url = "https://api.twitter.com/"+this.apiVersion+"/direct_messages/sent.json";

		ttagit.errorLog.setLog("call to 'twitter.getDirectMessagesSent'");

		this.oauth.initValues();

		this.oauth.setParams('count', count);
		url += "?count="+count;

		if( !ttagit.utils.isNull( since_id ) ) {
			this.oauth.setParams('since_id', since_id);
			url += "&since_id="+since_id;
		}

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 * Returns the 20 most recent favorite statuses for the authenticating user or user specified by the ID parameter in the requested format.
	 * URL: https://dev.twitter.com/docs/api/1.1/get/favorites/list
	 */
	getFavorites: function ( functionToEval, paramsTofunc ){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/favorites/list.json";
		var count = 200;

		ttagit.errorLog.setLog("call to 'twitter.getFavorites'");

		this.oauth.initValues();

		this.oauth.setParams('count', count);
		url += "?count="+count;

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

//--------------------------------------------
//	 TWEET ACTIONS
//--------------------------------------------

	/*
	 * Updates the authenticating user's status. A status update with text identical to the authenticating
	 * user's text identical to the authenticating user's current status will be ignored to prevent duplicates.
	 *URL:http://dev.twitter.com/doc/post/statuses/update
	 */
	newPost: function (tweet, in_reply_to_status_id, functionToEval, paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/statuses/update.json";

		ttagit.errorLog.setLog("call to 'twitter.newPost'");

		if( ttagit.utils.isNull( tweet )) {
			ttagit.debug.showMessage("falta el parametro tweet en la llamada a la funcion twitter.newPost.");
			ttagit.message.set('error','103',['Please write something.','missing parameter \'tweet\' in function twitter.newPost']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('status', tweet);

		if( !ttagit.utils.isNull( in_reply_to_status_id ) ){
			this.oauth.setParams('in_reply_to_status_id', in_reply_to_status_id);
		}

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		ttagit.xhr.setPost( this.oauth.getBody(), connectionId);

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},


	newPostWithMedia: function (postdata,functionToEval, paramsTofunc){
		var connectionId, returnHandler, headers, contentType,
		url = "https://api.twitter.com/"+this.apiVersion+"/statuses/update_with_media.json";

		ttagit.errorLog.setLog("call to 'twitter.newPost'");

		this.oauth.initValues();

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();
		headers = this.oauth.makeHeader();
		this.preSent(url, headers, connectionId );

		ttagit.xhr.setHeader("Content-Length", postdata.length, connectionId);
		contentType = "multipart/form-data; boundary=" + ttagit.mediaUploader.boundary;
		ttagit.xhr.setHeader("Content-Type", contentType, connectionId);

		ttagit.xhr.setPost( postdata, connectionId);

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.setAsBinary(connectionId);//le indico al modulo de comunicacion que voy a enviar los datos como binarios.
		ttagit.xhr.send(connectionId);
	},

	/*
	 * Retweets a tweet. Returns the original tweet with retweet details embedded.
	 * URL:https://dev.twitter.com/docs/api/1.1/post/statuses/retweet/%3Aid
	 */
	retweet: function (tweet_id,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/statuses/retweet/"+tweet_id+".json";

		ttagit.errorLog.setLog("call to 'twitter.retweet'");

		if( ttagit.utils.isNull( tweet_id )) {
			ttagit.debug.showMessage("falta el parametro tweet_id en la llamada a la funcion twitter.retweet.");
			ttagit.message.set('error','103',['Tweet id is not valid.','missing parameter \'tweet_id\' in function twitter.retweet']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('id', tweet_id);

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		ttagit.xhr.setPost(this.oauth.getBody(),connectionId);

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 *Destroys the status specified by the required ID parameter.
	 *URL:http://dev.twitter.com/doc/post/statuses/destroy/:id
	 */
	deleteTweet: function (tweet_id,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/statuses/destroy/"+tweet_id+".json";

		ttagit.errorLog.setLog("call to 'twitter.deleteTweet'");

		if( ttagit.utils.isNull( tweet_id )) {
			ttagit.debug.showMessage("falta el parametro tweet_id en la llamada a la funcion twitter.deleteTweet.");
			ttagit.message.set('error','103',['Error deleting the tweet.','missing parameter \'tweet_id\' in function twitter.deleteTweet']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('id', tweet_id);

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		ttagit.xhr.setPost(this.oauth.getBody(),connectionId);

		returnHandler = ttagit.utils.returnHandler;

		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 * Favorites the status specified in the ID parameter as the authenticating user.
	 * Returns the favorite status when successful.
	 * URL:http://dev.twitter.com/doc/post/favorites/create
	 */
	addToFavorites: function (tweet_id,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/favorites/create.json";

		ttagit.errorLog.setLog("call to 'twitter.addToFavorites'");

		if( ttagit.utils.isNull( tweet_id )) {
			ttagit.debug.showMessage("falta el parametro tweet_id en la llamada a la funcion twitter.addToFavorites.");
			ttagit.message.set('error','103',['Error trying to set as to favorites.','missing parameter \'tweet_id\' in function twitter.addToFavorites']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('id', tweet_id);

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		ttagit.xhr.setPost(this.oauth.getBody(),connectionId);

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 *Un-favorites the status specified in the ID parameter as the authenticating user.
	 *Returns the un-favorited status in the requested format when successful.
	 *URL:http://dev.twitter.com/doc/post/favorites/destroy
	 */
	removeOfFavorites: function (tweet_id,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/favorites/destroy.json";

		ttagit.errorLog.setLog("call to 'twitter.removeOfFavorites'");

		if( ttagit.utils.isNull( tweet_id )) {
			ttagit.debug.showMessage("falta el parametro tweet_id en la llamada a la funcion twitter.removeOfFavorites.");
			ttagit.message.set('error','103',['Error trying to delete of favorites.' ,'missing parameter \'tweet_id\' in function twitter.removeOfFavorites']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('id', tweet_id);

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		ttagit.xhr.setPost(this.oauth.getBody(),connectionId);

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

//--------------------------------------------
//	 DIRECT MESSAGE
//--------------------------------------------

	/*
	 * Sends a new direct message to the specified user from the authenticating user.
	 * Requires both the user and text parameters and must be a POST. Returns the sent message in the requested format if successful.
	 *URL:http://dev.twitter.com/doc/post/direct_messages/new
	 */
	sendDirectMessage: function (to_user_name, to_user_id, message,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/direct_messages/new.json";

		ttagit.errorLog.setLog("call to 'twitter.sendDirectMessage'");

		if( ttagit.utils.isNull( to_user_name ) || ttagit.utils.isNull( to_user_id ) || ttagit.utils.isNull( message ) ) {
			ttagit.debug.showMessage("faltan parametros en la llamada a la funcion twitter.sendDirectMessage.");
			ttagit.message.set('error','103',['Error sending message.','missing parameter in function twitter.sendDirectMessage']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('screen_name', to_user_name);
		this.oauth.setParams('user_id', to_user_id);
		this.oauth.setParams('text', message);

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		ttagit.xhr.setPost(this.oauth.getBody() ,connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);

	},

	/*
	 *Destroys the direct message specified in the required ID parameter.
	 *The authenticating user must be the recipient of the specified direct message
	 *URL:http://dev.twitter.com/doc/post/direct_messages/destroy
	 */
	deleteDirectMessage: function (message_id,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/direct_messages/destroy.json";

		ttagit.errorLog.setLog("call to 'twitter.sendDirectMessage'");

		if( ttagit.utils.isNull( message_id ) ) {
			ttagit.debug.showMessage("falta el parametro message_id en la llamada a la funcion twitter.deleteDirectMessage.");
			ttagit.message.set('error','103',['Error delete direct message.','missing parameter \'message_id\' in function twitter.deleteDirectMessage']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('id', message_id);

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		ttagit.xhr.setPost(this.oauth.getBody() ,connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

//--------------------------------------------
//	 USER ACTIONS
//--------------------------------------------

	/*
	 * Returns extended information of a given user, specified by ID or screen name as per the required id parameter.
	 * The author's most recent status will be returned inline.
	 * URL:http://dev.twitter.com/doc/get/users/show
	 */
	getUserInformation: function ( screen_name, functionToEval, paramsTofunc ){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/users/show.json"

		ttagit.errorLog.setLog("call to 'twitter.getUserInformation'");

		this.oauth.initValues();

		this.oauth.setParams('screen_name', screen_name);
		url += "?screen_name="+screen_name;

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url, this.oauth.makeHeader(), connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 * Updates the authenticating user's settings.
	 * URL:https://dev.twitter.com/docs/api/1.1/post/account/settings
	 */
	getAccountSetttings: function ( functionToEval, paramsTofunc ){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/account/settings.json"

		ttagit.errorLog.setLog("call to 'twitter.getAccountSetttings'");

		this.oauth.initValues();

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url, this.oauth.makeHeader(), connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 *	Test for the existence of friendship between two users. Will return true if user_a follows user_b, otherwise will return false.

	 *	URL: https://dev.twitter.com/docs/api/1.1/get/friendships/show
	 */
	hasFriendship: function(source_screen_name,target_screen_name,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/friendships/show.json";

		ttagit.errorLog.setLog("call to 'twitter.hasFriendship'");

		if( ttagit.utils.isNull( source_screen_name ) || ttagit.utils.isNull( target_screen_name ) ) {
			ttagit.debug.showMessage("faltan parametros en la llamada a la funcion twitter.hasFriendship.");
			ttagit.message.set('error','103',['Test for the existence of friendship between two users.','missing parameter in function twitter.hasFriendship']);
			return false;
		}

		this.oauth.initValues();

		url +="?source_screen_name="+source_screen_name;
		this.oauth.setParams('source_screen_name', source_screen_name);

		url +="&target_screen_name="+target_screen_name;
		this.oauth.setParams('target_screen_name', target_screen_name);

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url, this.oauth.makeHeader(), connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 *Allows the authenticating users to follow the user specified in the ID parameter.
	 *Returns the befriended user in the requested format when successful. Returns a string describing the failure condition when unsuccessful. If you are already friends with the user an HTTP 403 will be returned.
	 *URL: http://dev.twitter.com/doc/post/friendships/create
	 */
	followUser: function (user_id,user_screen_name,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/friendships/create.json";

		ttagit.errorLog.setLog("call to 'twitter.followUser'");

		if( ttagit.utils.isNull( user_id ) || ttagit.utils.isNull( user_screen_name ) ) {
			ttagit.debug.showMessage("faltan parametros en la llamada a la funcion twitter.followUser.");
			ttagit.message.set('error','103',['Error to mark user as follow.','missing parameter in function twitter.followUser']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('user_id', user_id);
		this.oauth.setParams('screen_name', user_screen_name);
		this.oauth.setParams('follow', 'true');

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		ttagit.xhr.setPost(this.oauth.getBody() ,connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 *Allows the authenticating users to unfollow the user specified in the ID parameter.
	 *Returns the unfollowed user in the requested format when successful. Returns a string describing the failure condition when unsuccessful..
	 *URL: http://dev.twitter.com/doc/post/friendships/destroy
	 */
	unfollowUser: function (user_id,user_screen_name,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/friendships/destroy.json";

		ttagit.errorLog.setLog("call to 'twitter.unfollowUser'");

		if( ttagit.utils.isNull( user_id ) || ttagit.utils.isNull( user_screen_name ) ) {
			ttagit.debug.showMessage("faltan parametros en la llamada a la funcion twitter.unfollowUser.");
			ttagit.message.set('error','103',['Error to mark user as unfollow.','missing parameter in function twitter.unfollowUser']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('user_id', user_id);
		this.oauth.setParams('screen_name', user_screen_name);

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		ttagit.xhr.setPost(this.oauth.getBody() ,connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 *Blocks the user specified in the ID parameter as the authenticating user.
	 *Destroys a friendship to the blocked user if it exists. Returns the blocked user in the requested format when successful.
	 *URL: http://dev.twitter.com/doc/post/blocks/create
	 */
	blockUser: function (user_id,user_screen_name,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/blocks/create.json";

		ttagit.errorLog.setLog("call to 'twitter.blockUser'");

		if( ttagit.utils.isNull( user_id ) || ttagit.utils.isNull( user_screen_name ) ) {
			ttagit.debug.showMessage("faltan parametros en la llamada a la funcion twitter.blockUser.");
			ttagit.message.set('error','103',['Error to mark user as blocked.','missing parameter in function twitter.blockUser']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('user_id', user_id);
		this.oauth.setParams('screen_name', user_screen_name);

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		ttagit.xhr.setPost(this.oauth.getBody() ,connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 *The user specified in the id is blocked by the authenticated user and reported as a spammer.
	 *URL: http://dev.twitter.com/doc/post/report_spam
	 */
	reportSpam: function (user_id,user_screen_name,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/report_spam.json";

		ttagit.errorLog.setLog("Report a user as spammer - call to function 'twitter.reportSpam'");

		if( ttagit.utils.isNull( user_id ) || ttagit.utils.isNull( user_screen_name ) ) {
			ttagit.debug.showMessage("faltan parametros en la llamada a la funcion twitter.reportSpam.");
			ttagit.message.set('error','103',['Error to mark user as spammer.','missing parameter in function twitter.reportSpam']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('user_id', user_id);
		this.oauth.setParams('screen_name', user_screen_name);

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		ttagit.xhr.setPost(this.oauth.getBody() ,connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

//--------------------------------------------
//	 LISTS FUNCTIONS
//--------------------------------------------

	/*
	 * Returns all lists the authenticating or specified user subscribes to, including their own.
	 * The user is specified using the user_id or screen_name parameters. If no user is given, the authenticating user is used.
	 * URL:https://dev.twitter.com/docs/api/1/get/lists/all
	 */
	getLists: function (user_screen_name,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/lists/list.json";

		ttagit.errorLog.setLog("call to 'twitter.getLists'");

		if( ttagit.utils.isNull( user_screen_name ) ) {
			ttagit.debug.showMessage("faltan parametros en la llamada a la funcion twitter.getLists.");
			ttagit.message.set('error','103',['Error to obtain all lists of user.','missing parameter in function twitter.getLists']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('screen_name', user_screen_name);
		url += "?screen_name="+user_screen_name;

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url, this.oauth.makeHeader(), connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');//se referencia a traves de ttagit.twitter porque esta funcion no conoce a xhr
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 * Show tweet timeline for members of the specified list.
	 *URL:http://http://dev.twitter.com/doc/get/lists/statuses
	 */
	getListTweets: function (list_id,since_id,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/lists/statuses.json";

		ttagit.errorLog.setLog("call to 'twitter.getListTweets'");

		if( ttagit.utils.isNull( list_id ) ) {
			ttagit.debug.showMessage("faltan parametros en la llamada a la funcion twitter.getListTweets.");
			ttagit.message.set('error','103',['Error obtain your lists.','missing parameter in function twitter.getListTweets']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('list_id', list_id);
		url += "?list_id="+list_id;

		if(!ttagit.utils.isNull(since_id)){
			this.oauth.setParams('since_id', since_id);
			url += "&since_id="+since_id;
		}

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url, this.oauth.makeHeader(), connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

//--------------------------------------------
//	 SEARCH FUNCTIONS
//--------------------------------------------
	/*
	 * Returns tweets that match a specified query.
	 *URL:https://dev.twitter.com/docs/api/1.1/get/search/tweets
	 */
	search: function (query,since_id,functionToEval,paramsTofunc){

		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/search/tweets.json"
		var count = 50;
		ttagit.errorLog.setLog("call to 'twitter.search'");

		if( ttagit.utils.isNull( query ) ) {
			ttagit.debug.showMessage("falta el parametro query en la llamada a la funcion twitter.search.");
			ttagit.message.set('error','103',['Error search.','missing parameter \'query\' in function twitter.search']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('q', query);
		url +='?'+this.oauth.getBody();

		this.oauth.setParams('count', count);
		url += "&count="+count;

		if(!ttagit.utils.isNull(since_id)){
			this.oauth.setParams('since_id', since_id);
			url += "&since_id="+since_id;
		}

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url, this.oauth.makeHeader(), connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 * Creates a saved search for the authenticated user.
	 *URL:https://dev.twitter.com/docs/api/1.1/post/saved_searches/create
	 */
	saveSearch: function (query,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/saved_searches/create.json";

		ttagit.errorLog.setLog("call to 'twitter.saveSearch'");

		if( ttagit.utils.isNull( query ) ) {
			ttagit.debug.showMessage("falta el parametro query en la llamada a la funcion twitter.saveSearch.");
			ttagit.message.set('error','103',['Error save search.','missing parameter \'query\' in function twitter.saveSearch']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('query', query);

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		ttagit.xhr.setPost( this.oauth.getBody(), connectionId);

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 * Destroys a saved search for the authenticated user. The search specified by id must be owned by the authenticating user.
	 *URL:http://dev.twitter.com/doc/post/saved_searches/destroy/:id
	 */
	deleteSearch: function(id,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/saved_searches/destroy/"+id+".json";

		ttagit.errorLog.setLog("call to 'twitter.deleteSearch'");

		if( ttagit.utils.isNull( id ) ) {
			ttagit.debug.showMessage("falta el parametro id en la llamada a la funcion twitter.deleteSearch.");
			ttagit.message.set('error','103',['Error delete saved search.','missing parameter \'id\' in function twitter.deleteSearch']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('id', id);

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("POST", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent(url, this.oauth.makeHeader(), connectionId );

		ttagit.xhr.setPost( this.oauth.getBody(), connectionId);

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 * Retrieve the data for a saved search owned by the authenticating user specified by the given id.
	 *URL:http://dev.twitter.com/doc/get/saved_searches/show/:id
	 */
	showSavedSearch: function(id,functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/saved_searches/show/"+id+".json";

		ttagit.errorLog.setLog("call to 'twitter.showSavedSearch'");

		if( ttagit.utils.isNull( id ) ) {
			ttagit.debug.showMessage("falta el parametro id en la llamada a la funcion twitter.showSavedSearch.");
			ttagit.message.set('error','103',['Error to show saved search.','missing parameter \'id\' in function twitter.showSavedSearch']);
			return false;
		}

		this.oauth.initValues();

		this.oauth.setParams('id', id);

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url, this.oauth.makeHeader(), connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	/*
	 * Returns the authenticated user's saved search queries.
	 *URL:http://dev.twitter.com/doc/get/saved_searches
	 */
	getSavedSearch: function (functionToEval,paramsTofunc){
		var connectionId, returnHandler,
		url = "https://api.twitter.com/"+this.apiVersion+"/saved_searches/list.json";

		ttagit.errorLog.setLog("call to 'twitter.getSavedSearch'");

		this.oauth.initValues();

		this.oauth.setValues('oauth_signature', this.oauth.calcSignature("GET", url) );

		connectionId = ttagit.xhr.getConnetion();

		this.preSent( url, this.oauth.makeHeader(), connectionId );

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){
			returnHandler(functionToEval,paramsTofunc,datos,'twitter');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},
}
var BitLy = function(){ }
BitLy.prototype = {
	init: function (){
		//var random = "kjashdfsdfkjahs" + Math.random();
		//$("#banner").remove();
		//$("#container").append("<div id='banner'><a href='http://d1.openx.org/ck.php?oaparams=2__bannerid=TWITBINA__zoneid=222785__OXLCA=TWITBINB__cb="+random+"__r_id=TWITBINC__r_ts=D__oadest=TWITBINE'  class='tweetlinkb'><img src='http://d1.openx.org/avw.php?zoneid=222785&amp;cb="+random+"' border='0' alt='' /></a></div>");
		//setTimeout(function(){ttagit.bitly.init();}, 5 * 60 * 1000);
	},
}
