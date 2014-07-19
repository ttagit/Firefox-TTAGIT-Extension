/**
 * MODULO QUE ENVIA LOS DATOS ESTADISTICOS AL SERVIDOR DE TWITBIN.
 */

//TODO write a commen about each function


var TtagitReports = function(){
	this.statistics = null;
	this.startTime = null;
	this.sent = true;
}

TtagitReports.prototype = {

	init: function(){
		var sessionDate,
		user_screen_name = ttagit.getLoggedUserName(),
		user_twitter_id = ttagit.getLoggedUserId(),
		user_time_zone = ttagit.logedUser.time_zone;
		ttagit_version = ttagit.dbttagit.query("SELECT version FROM ttagit");

		this.sent = false;
		//marco la hora de comienzo
		this.startTime = new Date();

		sessionDate = this.startTime.toUTCString()

		//trunco la tabla de error_log para comenzar desde cero
		ttagit.dbttagit.truncateTable_error_log();

		this.statistics = {
			"username":user_screen_name,
			"id":user_twitter_id,
			"Session":{
				"date":sessionDate,
				"minutes":0,
				"timeline":0,//cuantas veces miro el tab
				"mentions":0,//cuantas veces miro el tab
				"messages":0,//cuantas veces miro el tab
				"favorites":0,//cuantas veces miro el tab
				"public":0,//cuantas veces miro el tab
				"lists":0,//cuantas veces miro el tab
				"searches":0,//cuantas veces miro el tab
				"saved_searches":0,//cuantas busquedas guardo
				"posts":0,//cuantos post hizo
				"replies":0,
				"retweets":0,//cuantos retweets hizo
				"sent_messages":0,//cuantos mensajes envio
				"deleted_messages":0,//cuantos mensajes borro
				"deleted_tweets":0,//cuantos tweets borro
				"tweets_added_to_favorites":0,//cuantos favoritos agrego
				"users_follow_unfollow":0,//cuantos usuario comenzo o dejo de seguir
				"users_blocked":0,//cuantos usuarios bloqueo
				"users_reported_as_spamer":0,//cuantos usuarios marco como spam
				"tweet_this_page":0,
				"tweets_about_this_page":0,
				"pictures":0,
				"links":0
			},
			"browser_version":navigator.appCodeName+" v"+navigator.appVersion,
			"time_zone":user_time_zone,
			"plataform":navigator.platform,
			"ttagit_version":ttagit_version[0].version,
			"error_log":[],
		};
	},

	setTimeZone: function(timezone){
		if (timezone == null){
			timezone = 'unknown';
		}
		this.statistics.time_zone = timezone;
	},

	add: function(action){

		return true;

		if(this.statistics == null){ return false; }

		switch(action){
			case "Session.timeline":
				this.statistics.Session.timeline = this.statistics.Session.timeline +1;
			break;
			case "Session.mentions": //2: Agregar mas elementos al final del listado
				this.statistics.Session.mentions = this.statistics.Session.mentions +1;
			break;
			case "Session.messages": //3: Agregar elementos nuevos al listado
				this.statistics.Session.messages = this.statistics.Session.messages +1;;
			break;
			case "Session.favorites":
				this.statistics.Session.favorites = this.statistics.Session.favorites +1;;
			break;
			case "Session.public":
				this.statistics.Session.public = this.statistics.Session.public +1;;
			break;
			case "Session.lists":
				this.statistics.Session.lists = this.statistics.Session.lists +1;;
			break;
			case "Session.searches":
				this.statistics.Session.searches = this.statistics.Session.searches +1;;
			break;
			case "Session.saved_searches":
				this.statistics.Session.saved_searches = this.statistics.Session.saved_searches +1;;
			break;
			case "Session.posts":
				this.statistics.Session.posts = this.statistics.Session.posts +1;;
			break;
			case "Session.replies":
				this.statistics.Session.replies = this.statistics.Session.replies +1;;
			break;
			case "Session.retweets":
				this.statistics.Session.retweets = this.statistics.Session.retweets +1;;
			break;
			case "Session.sent_messages":
				this.statistics.Session.sent_messages = this.statistics.Session.sent_messages +1;;
			break;
			case "Session.deleted_messages":
				this.statistics.Session.deleted_messages = this.statistics.Session.deleted_messages +1;;
			break;
			case "Session.deleted_tweets":
				this.statistics.Session.deleted_tweets = this.statistics.Session.deleted_tweets +1;;
			break;
			case "Session.tweets_added_to_favorites":
				this.statistics.Session.tweets_added_to_favorites = this.statistics.Session.tweets_added_to_favorites +1;;
			break;
			case "Session.users_follow_unfollow":
				this.statistics.Session.users_follow_unfollow = this.statistics.Session.users_follow_unfollow +1;;
			break;
			case "Session.users_blocked":
				this.statistics.Session.users_blocked = this.statistics.Session.users_blocked +1;;
			break;
			case "Session.users_reported_as_spamer":
				this.statistics.Session.users_reported_as_spamer = this.statistics.Session.users_reported_as_spamer +1;;
			break;
			case "Session.links":
				this.statistics.Session.links = this.statistics.Session.links +1;;
			break;
			case "Session.pictures":
				this.statistics.Session.pictures = this.statistics.Session.pictures +1;;
			break;
			case "Session.tweet_this_page":
				this.statistics.Session.tweet_this_page = this.statistics.Session.tweet_this_page +1;;
			break;
			case "Session.tweets_about_this_page":
				this.statistics.Session.tweets_about_this_page = this.statistics.Session.tweets_about_this_page +1;;
			break;
		}
	},

	collectErrorInformation: function(){
		var i,errors,startDate,finishTime,minutes,
		user_screen_name =ttagit.getLoggedUserName();

		errors = ttagit.dbttagit.query("SELECT * FROM errorlog WHERE (username ='"+user_screen_name+"')");

		if(typeof(errors[0])!="undefined"){
			for(i=0;i<errors.length;i++){
				this.statistics.error_log.push({"date":errors[i].created,"error_code":errors[i].error_code,"text":errors[i].text});
			}
		}

		startDate = this.startTime;
		finishTime = new Date();

		//obtengo la cantidad de minutos que el usuario estuvo logueado
		minutes = this.roundNumber((finishTime.getTime() - this.startTime.getTime())/1000/60);
		this.statistics.Session.minutes = minutes;
	},

	roundNumber: function(number) {
		return Math.floor(parseFloat(number));
	},

	send: function(){
		/*
		if(this.sent){ return false; }

		var jsonToSend,paritybits,paramsToSend,
		connectionId = ttagit.xhr.getConnetion();

		this.sent = true;

		ttagit.xhr.setURL("http://ttagit.com/s/api/get",connectionId);

		this.collectErrorInformation();
		jsonToSend = ttagit.debug.jsonToString(this.statistics);
		paritybits = ttagit.encript.md5.hex_md5(ttagit.debug.jsonToString(this.statistics));
		paramsToSend = "data[stats]="+encodeURI(jsonToSend)+"&data[parity]="+encodeURI(paritybits);

		ttagit.xhr.setPost(paramsToSend,connectionId);

		ttagit.xhr.setOnLoadFunction (function(data){
			ttagit.reports.statistics = null;
		},connectionId);

		ttagit.xhr.send(connectionId);
		*/
	},
}//of prototype
