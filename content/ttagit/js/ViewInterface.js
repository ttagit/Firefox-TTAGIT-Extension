/**
 * Este modulo se encarga de mostrar y ocultar la informacion provista por ttagit, es en si el modulo encargado de los cambios en la
 * vista.
 **/
var TtagitViewInterface = function(){
    this.boxNewItems = "#boxNewItems";
    this.boxMessageNewTweet = "#newtweets";
    this.functionConfirm = "";

    this.boxViewTimeLine = "#timelinetweets";
    this.boxViewMention = "#mentiontweets";
    this.boxViewFavorite = "#favoriteTweets";
    this.boxViewDM = "#dmtweets";
    this.boxViewDMConversation = "#conversationtweets";
    this.boxViewList = "#listtweets";
    this.boxViewListTweets = "#listfilteredtweets";
    this.boxViewTrendTopics = "#trendtopics";
    this.boxViewTrendTopicsTweets = "#listTrendtweets";
    this.boxViewSearchLeft = "#searchtweetsLeft";
    this.boxViewSearchRight = "#searchtweetsRight";
    this.boxViewSearchTweets = "#searchtweets";

	this.separatorOn = null;
}

TtagitViewInterface.prototype = {

//--------------------------------------------
//	 TWEETS Format html
//--------------------------------------------

	//Formato para vizualizar los tweets / listas /busquedas / mensajes directos

	removeSeparator: function (tweet_id){
		$("#"+tweet_id).removeClass("separator");
		this.separatorOn = null;
	},

	viewFormatTweets: function (tweet,chk_mention,mark){
		var mention = '';
		var news = '';

		if(typeof(mark)!="undefined" && mark == 'mark'){
			if(this.separatorOn != null){
				this.removeSeparator(this.separatorOn);
			}
			this.separatorOn = tweet.tweet_id;
		}

		if(this.separatorOn == tweet.tweet_id){
			news = 'separator';
		}

		if(typeof(chk_mention)!="undefined"){
			if(chk_mention == true && this.haveUserMention(ttagit.encript.rawDecode(tweet.text))){
				mention = 'mention';
			}
		}

		var viewFormat ='<li id="' + tweet.tweet_id + '" class="clearfix '+mention+' '+news+'">'+
						'<div class="info">'+
							'<span class="author"><a class="tweetlink" href="https://twitter.com/#!/'+tweet.owner_screen_name+'">'+tweet.owner_screen_name+'</a> </span>'+
							'<span class="username">' + tweet.owner_screen_name + '</span> '+
							this.checkRetweetedBy(tweet.retweeted_by)+
							'<p>' + this.parseTweet(ttagit.encript.rawDecode(tweet.text)) + '</p>'+
							this.parseMedia(tweet) +
							'<span class="infoBar">'+
								'<div class="from_app"> via '+this.parseSource(tweet.source)+'</div>'+
								this.checkInReplyTo(tweet)+
								'<a href="https://twitter.com/#!/'+tweet.owner_screen_name+'/status/'+ tweet.tweet_id +'" class="date tweetlink">' + this.formatTimeTweets(tweet.created) + '</a>'+
								'<span class="actions">'+
									this.viewFormatActions(tweet)+
								'</span>'+
							'</span>'+
							'<span class="tweetID">' + tweet.tweet_id + '</span>'+
							'<span class="tweetCreated">' + tweet.created + '</span>'+
						'</div>'+
						'<img src="' + tweet.image + '" alt="Avatar" width="48" height="48" />'+
					'</li>';

		return viewFormat;
	},

	viewFormatDirectMessages: function (tweet){
		var image,viewFormat,
		screen_name = "";
		if(tweet.sender_screen_name == ttagit.getLoggedUserName()){
			screen_name = tweet.recipient_screen_name;
			image = tweet.recipient_image;
		}else{
			screen_name = tweet.sender_screen_name;
			image = tweet.sender_image;
		}

		viewFormat = '<li id="' + tweet.direct_message_id + '" class="clearfix tweetsDM">' +
					'<div class="info">' +
						'<span class="simpleDate">' + this.formatTimeTweets(tweet.created) + '</span>' +
						'<span class="author"><a class="tweetlink" href="https://twitter.com/#!/' + screen_name + '">' + screen_name + '</a></span>' +
						/*'<p>' + this.parseTweet(ttagit.encript.rawDecode(tweet.text)) + '</p>' +*/
						'<p>' + ttagit.viewController.countDirectMessages(screen_name) + '</p>' +
						'<span class="conversationID">' + tweet.direct_message_id + '</span>' +
						'<span class="tweetCreated">' + tweet.created + '</span>' +
					'</div>' +
					'<img src="' + image + '" alt="Avatar" width="48" height="48" />' +
				'</li>';

		return viewFormat;

	},

	viewFormatConversationDirectMessages: function (tweet){
		var viewFormat,
		classMessageNoMe = "";

		if( tweet.sender_screen_name != ttagit.getLoggedUserName() ){
			classMessageNoMe = "messageNotMe";
		}

		viewFormat = '<li id="' + tweet.direct_message_id + '" class="clearfix ' + classMessageNoMe + '">' +
					'<div class="info">' +
						'<span class="simpleDate">' + this.formatTimeTweets(tweet.created) + '</span>' +
						'<span class="author" rel="hola"><a class="tweetlink" href="https://twitter.com/#!/' + tweet.sender_screen_name + '">' + tweet.sender_screen_name + '</a></span>' +
						'<p>' + this.parseTweet(ttagit.encript.rawDecode(tweet.text)) + '</p>' +
						'<span class="infoBar">'+
								'<a href="https://twitter.com/#!/'+tweet.sender_screen_name+'" class="date tweetlink">' + this.formatTimeTweets(tweet.created) + '</a>'+
								'<span class="actions">'+
									this.viewDMFormatActions(tweet)+
								'</span>'+
							'</span>'+
						'<span class="tweetCreated">' + tweet.created + '</span>' +
					'</div>' +
					'<img src="' + tweet.sender_image + '" alt="Avatar"  width="48" height="48" />' +
				'</li>';
		return viewFormat;
	},

	viewFormatSearch: function  (search){
		return '<li>' +
			'<a href="#">' + search.query + ' <span class="close"></span></a>' +
			'<span class="searchID">' + search.search_id + '</span>' +
		'</li>';
	},

	viewFormatList: function  (list){
		return '<li class="clearfix list">' +
			'<div class="info">' +
				'<span class="author">' + list.owner_screen_name + '</span>' +
				'<p>' + list.name + '</a></p>' +
			'</div>' +
			'<span class="listID">' + list.list_id + '</span>' +
		'</li>';
	},

	viewFormatTrendTopic: function  (trend){
		return '<li class="clearfix trend">' +
			'<div class="info">' +
				'<span class="trendName">' + trend.name + '</span>' +
			'</div>' +
			'<span class="trendQuery">' + trend.query + '</span>' +
		'</li>';
	},

	//Funciones usadas por viewformat

	checkRetweetedBy: function (retweeted_by){
		if(retweeted_by == "null"){ return ''; }

		if( retweeted_by != "protected" ){
			return '<span class="retweetedby">'+retweeted_by+'</span>';
		}
		return '<span class=""><img  src="img/candado.png" alt="Protected" class="img-protected"/></span>';
	},

	checkInReplyTo: function (tweet){
		if(tweet.in_reply_to_status_id == "null"){ return ''; }

		return '<a href="https://twitter.com/#!/'+tweet.owner_screen_name+'/status/'+ tweet.tweet_id +'" class="conv tweetlink" title="View conversation">&nbsp;</a>';
	},

	parseMedia: function (tweet){
		if(tweet.tweet_image == ""){ return ''; }

		return '<p><img src="'+tweet.tweet_image+'"></p>';
	},

	parseTweet: function (tweet){
		var auxTweet, regex, url, mention, user_tag, hashtags, hashtagquery,
		newTweet = tweet;

		regex = new RegExp('\\x3F','gi');
		newTweet = newTweet.replace(regex,'allyouneedislove_question');
		auxTweet = newTweet;

		//obtengo y reemplazo todas las urls
		url = this.haveUrl(auxTweet);
		while(typeof(url) != "boolean"){

			//saca la url del tweet auxiliar para no volver a encontrala
			regex = new RegExp(url, "gi");
			auxTweet = auxTweet.replace(regex,'');

			//reemplazo la url encontrada por lo que nosotros queremos en el tweet original
			url = url.replace('allyouneedislove_question','?');
			newTweet = newTweet.replace(regex,'<a class="tweetlink" href="'+url+'">'+url+'</a>');

			//busco una nueva url del tweet auxiliar
			url = this.haveUrl(auxTweet);
		}

		//obtengo y reemplazo todas las mensiones
		mention = this.haveMention(auxTweet);
		while(typeof(mention) != "boolean"){

				auxTweet = auxTweet.replace(mention,'');
				user_tag = mention.replace('@','');

				regex =new RegExp(mention, "gi");
				newTweet = newTweet.replace(regex,'<a class="tweetlink" href="https://twitter.com/#!/'+user_tag+'">'+mention+'</a>');

				mention = this.haveMention(auxTweet);
		}

		//obtengo y reemplazo todos los hashtags
		hashtags= this.haveHashTag(auxTweet);
		while(typeof(hashtags) != "boolean"){

				auxTweet = auxTweet.replace(hashtags,'');
				hashtagquery = hashtags.replace('#','');

				regex =new RegExp(hashtags, "gi");
				newTweet = newTweet.replace(regex,'<a class="hashtaglink" href="'+hashtagquery+'">'+hashtags+'</a>');

				hashtags = this.haveHashTag(auxTweet);
		}

		regex = new RegExp('allyouneedislove_question','gi');
		newTweet = newTweet.replace(regex,'?');
		return newTweet;
	},

	haveUrl: function (tweet){
		var j,
		match = tweet.match(/\(?(?:(http|https|ftp):\/\/)?(?:((?:[^\W\s]|\.|-|[:]{1})+)@{1})?((?:www.)?(?:[^\W\s]|\.|-)+[\.][^\W\s]{2,4}|localhost(?=\/)|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d*))?([\/]?[^\s\?]*[\/]{1})*(?:\/?([^\s\n\?\[\]\{\}\#]*(?:(?=\.)){1}|[^\s\n\?\[\]\{\}\.\#]*)?([\.]{1}[^\s\?\#]*)?)?(?:\?{1}([^\s\n\#\[\]]*))?([\#][^\s\n]*)?\)?/gi);


		if(match == null){ return false; }//no hay urls en el tweet

		for( j in match){//busco todas las urls del tweet
			return match[j];
		}
		return false;// no habian urls
	},

	haveMention: function (tweet){
		var j,
		match = tweet.match(/\B@[a-zA-Z-0-9_]+/gi);

		if(match == null){ return false; }// no habian mensiones

		for( j in match){//busco todas las mensiones del tweet
			return match[j];//si encuentro una mension
		}
		return false;//no hay mensiones en el tweet
	},

	haveUserMention: function (tweet){
		var j;
		var user_screen_name = '@'+ttagit.getLoggedUserName();
		var patt = new RegExp(user_screen_name,'gi');
		match = tweet.match(patt);

		if(match == null){ return false; }// no habian mensiones

		for( j in match){//busco todas las mensiones del tweet
			return true;//si encuentro una mension
		}
		return false;//no hay mensiones en el tweet
	},

	haveHashTag: function (tweet){
		var j,
		match = tweet.match(/\B#[a-zA-Z-0-9_áéíóúñÑ]+/gi);

		if(match == null){ return false; }//no hay urls en el tweet

		for(j in match){//busco entre todas las urls del tweet una que no este acortada
			return  match[j];//si encuentro una url no acortada entonces la retorno
		}
		return false;// no habian urls no acortadas
	},

	parseSource: function (asource){
		var amatch = asource.match(/<a /gi),
		amatch2 = asource.match(/&lt;a/gi);

		if (amatch == null && amatch2 == null) { return asource; }

		asource = asource.replace(/&lt;/gi,'<');
		asource = asource.replace(/&gt;/gi,'>');
		asource = asource.replace(/&quot;/gi,'"');
		return asource.replace('<a ','<a class="tweetlink" ');
	},

	viewFormatActions: function (tweet){

		var actions,
		user_screen_name = ttagit.getLoggedUserName();
		//El siguiente codigo esta identado para facilitar la lectura del codigo html.
		actions = '<span class="default"><div class="relativeMe">';

		if(!tweet.favorited){
			actions += '<a href="#" class="favorite" title="favorite" ></a>';
		}
		if((tweet.retweeted_by != 'protected')&&(tweet.owner_screen_name != user_screen_name)){
			actions +='<a href="#" class="reply" title="Reply"></a>';
			actions +='<a href="#" class="replyAll" title="Reply to All"></a>';
			if((user_screen_name != tweet.retweeted_by)||(tweet.retweeted_by == 'null') ){
				actions += '<a href="#" class="retweet" title="Retweet" ></a>';
				actions += '<a href="#" class="retweetComment" title="RT with Comments"></a>';
			}
		}
		else{
			actions +='<a href="#" class="reply moreLeft" title="Reply"></a>';
			actions +='<a href="#" class="replyAll moreLeft" title="Reply to All"></a>';
		}

		actions += '</div></span>'+'<span class="selected"><div class="relativeMe">';

		if(tweet.favorited){
			actions += '<a href="#" class="favorite active"></a>';
		}
		if((tweet.retweeted_by != 'protected')&&(tweet.owner_screen_name != user_screen_name)){
			if((user_screen_name == tweet.retweeted_by)&&(tweet.retweeted_by != 'null') ){
				actions += '<a href="#" class="retweet retweeted"></a>';
			}
		}
		actions += '</div></span>';

		return actions;
	},

	viewDMFormatActions: function (directMsg){

		var actions,
		user_screen_name = ttagit.getLoggedUserName();
		//El siguiente codigo esta identado para facilitar la lectura del codigo html.
		actions = '<span class="default"><div class="relativeMe">';

		actions += '<a href="#" class="deleteDM" title="delete message" ></a>';

		actions += '</div></span>'+'<span class="selected"><div class="relativeMe">';

		// No active actions

		actions += '</div></span>';

		return actions;
	},

	formatTimeTweets: function (time){
		var timeElapsed,numberRound,timeHtml,
		time = parseInt(time),
		date = new Date();

		timeElapsed = date.getTime() - time;

		// Si es mayor igual a 7 dias mostramos la fecha de publicacion
		if(timeElapsed >= 604800000){
			return this.formatDateTweets(time);
		}

		// Si es menor a 7 dias y mayor igual a 1 dia mostramos los dias transcurridos
		if(timeElapsed < 604800000 && timeElapsed >= 86400000 ){
			numberRound = this.roundNumber(timeElapsed / 86400000);
			timeHtml = numberRound + " days";
			if( numberRound == 1){
				timeHtml = numberRound + " day";
			}
			return timeHtml;
		}

		// Si es menor a 1 dia y mayor a 1 hora, mostramos las horas transcurridas
		if( timeElapsed < 86400000 && timeElapsed >= 3600000){
			numberRound = this.roundNumber(timeElapsed / 3600000);
			timeHtml = numberRound + " hours";
			if( numberRound == 1){
				timeHtml = numberRound + " hour";
			}
			return timeHtml;
		}

		// Si es menor a 1 hora y mayor igual 1 minuto, mostramos los minutos transcurridos
		if(timeElapsed < 3600000 && timeElapsed >= 60000){
			numberRound = this.roundNumber(timeElapsed / 1000 / 60);
			timeHtml = numberRound + " min";
			if( numberRound == 1){
				timeHtml = numberRound + " min";
			}
			return timeHtml;
		}

		// Si es menor a un minuto, mostramos los segundos trascurridos
		if(timeElapsed < 60000){
			timeHtml = "1 sec";
			if(timeElapsed <= 1000){
				numberRound = this.roundNumber(timeElapsed / 1000);
				timeHtml = numberRound + " sec";
			}
			return timeHtml;
		}
	},

	formatDateTweets: function (time){
		var hour,am_pm,
		monthNames = new Array( "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ),
		d = new Date(time);

		// validacion am o pm
		hour = d.getHours()
		am_pm = "a.m.";
		if(d.getHours() > 12){
			hour = (d.getHours() - 12);
			am_pm = "p.m.";
		}

		//return hour + ":" + d.getMinutes() + " " + am_pm + " " + d.getDate() + " " +  monthNames[d.getMonth()] + " " + d.getFullYear();
		return d.getDate() + " " +  monthNames[d.getMonth()] ;
	},

	roundNumber: function (number) {

		return Math.floor(parseFloat(number));
	},

//--------------------------------------------
//	 SHOW
//--------------------------------------------

	showPublicTweets: function   (tweets){
		var i;

		// Verificamos que Accion tomar en la vista
		switch(ttagit.viewController.viewAction){

			case 1: //1: Mostrar listado
				$(this.boxNewItems).html("");

				if(typeof(tweets[0]) =="undefined"){
					//TODO mensaje o algo
					return false;
				}

				for(i=0; i<tweets.length; i++){ $(this.boxViewTimeLine).append( this.viewFormatTweets(tweets[i]) ); }
			break;
		}
	},

	showTimeLineTweets: function (tweets){
		var i;

		// Verificamos que Accion tomar en la vista
		switch(ttagit.viewController.viewAction){

			case 1://1: Mostrar listado
				$(this.boxNewItems).html('');
				this.cleanAllTimeLines();

				if(typeof(tweets[0]) !="undefined"){
					for(i=0;i<tweets.length;i++){
						$(this.boxViewTimeLine).append(
							this.viewFormatTweets(tweets[i], true)
						);
					}
				}

				this.openView($('#navTimeLine'));
				this.waitPage('hide');
			break;

			case 2: //2: Agregar mas elementos al final del listado
				if(typeof(tweets[0]) !="undefined"){
					for(i=0; i<tweets.length; i++){
						$(this.boxViewTimeLine).append(
							this.viewFormatTweets(tweets[i], true)
						);
					}
				}

			break;

			case 3: //3: Agregar elementos nuevos al listado
				if(typeof(tweets[0])!="undefined"){
					$(this.boxNewItems).html('');

 					for(i=0; i<tweets.length; i++){
						if(i == tweets.length-1){
							$(this.boxNewItems).append(
								this.viewFormatTweets(tweets[i], true, 'mark')
							);
						}else{
							$(this.boxNewItems).append(
								this.viewFormatTweets(tweets[i], true)
							);
						}
					}

					this.notificationArea('show', 'general', "View new Tweets (" + tweets.length + ")");
					this.addEventClickMessageNewTweet();
					this.SetNewTweetsOnTtagitButton( tweets.length );
					ttagit.viewController.viewFirstItemTemp = tweets[0].tweet_id;
				}
			break;
		}
	},

	showMentionsTweets: function (tweets){
		var i;

		// Verificamos que Accion tomar en la vista
		switch(ttagit.viewController.viewAction){

			case 1: //1: Mostrar listado
				$(this.boxNewItems).html("");
				this.cleanAllTimeLines();

				if(typeof(tweets[0])=="undefined"){
					//TODO: Esta validacion para saber si no hay menciones se quita o se muestra un mensaje
					if ($.trim($(this.boxViewMention).html()) == '')
					{
						$(this.boxViewMention).html(
							'<li class="noTweetsToShow">' +
								'<p>You have no mentions</p>' +
							'</li>'
						);
					}
				}else{
					for(i=0;i<tweets.length;i++){
						$(this.boxViewMention).append(
							this.viewFormatTweets(tweets[i])
						);
					}
				}
				this.openView($('#navMention'));
			break;

			case 2: //2: Agregar mas elementos al final del listado
				if(typeof(tweets[0]) !="undefined"){
					for(i=0; i<tweets.length; i++){
						$(this.boxViewMention).append(
							this.viewFormatTweets(tweets[i])
						);
					}
				}
			break;

			case 3: //3: Agregar elementos nuevos al listado
				if(typeof(tweets[0])!="undefined"){
					$(this.boxNewItems).html('');
					for(i=0; i<tweets.length; i++){
						$(this.boxNewItems).append(
							this.viewFormatTweets(tweets[i])
						);
					}

					this.notificationArea('show', 'general', "View new Tweets (" + tweets.length + ")");
					this.addEventClickMessageNewTweet();
					this.SetNewTweetsOnTtagitButton( tweets.length );
					ttagit.viewController.viewFirstItemTemp = tweets[0].tweet_id;
				}
			break;
		}
	},

	showFavoriteTweets: function(tweets){
		var i;

		// Verificamos que Accion tomar en la vista
		switch(ttagit.viewController.viewAction){

			case 1://1: Mostrar listado
				$(this.boxNewItems).html("");
				this.cleanAllTimeLines();

				if(typeof(tweets[0])=="undefined"){
					if ($.trim($(this.boxViewFavorite).html()) == '')
					{
						$(this.boxViewFavorite).html(
							'<li class="noTweetsToShow">' +
								'<p>You have no favorites</p>' +
							'</li>'
						);
					}
				}else{
					for(i=0;i<tweets.length;i++){
						$(this.boxViewFavorite).append(
							this.viewFormatTweets(tweets[i])
						);
					}
				}
				this.openView($('#navFavorites'));
			break;

			case 2://2: Agregar mas elementos al final del listado
				if(typeof(tweets[0]) !="undefined"){
					for(i=0; i<tweets.length; i++){
						$(this.boxViewFavorite).append(
							this.viewFormatTweets(tweets[i])
						);
					}
				}
			break;

			case 3://3: Agregar elementos nuevos al listado
				if(typeof(tweets[0])!="undefined"){

					$(this.boxNewItems).html('');

					for(i=0; i<tweets.length; i++){
						$(this.boxNewItems).append(
							this.viewFormatTweets(tweets[i])
						);
					}

					this.notificationArea('show', 'general', "View new Tweets (" + tweets.length + ")");
					this.addEventClickMessageNewTweet();
					this.SetNewTweetsOnTtagitButton( tweets.length );
					ttagit.viewController.viewFirstItemTemp = tweets[0].tweet_id;
				}
			break;
		}
	},

	//------------

	showDirectMessages: function  (tweets){
		var i,respond,screen_name;

		// Verificamos que Accion tomar en la vista
		switch(ttagit.viewController.viewAction){

			case 1: //1: Mostrar listado
				$(this.boxNewItems).html('');
				this.cleanAllTimeLines();
				$(this.boxViewDM).html(
                    '<li class="WriteNewMessage">'+
                        '<a href="#">Send new message</a>'+
                    '</li>'
                );

				if(typeof(tweets[0])=="undefined"){
					if ($.trim($(this.boxViewDM).html()) == '')
					{
						$(this.boxViewDM).html(
							'<li class="noTweetsToShow">' +
								'<p>You have no Direct Messages</p>' +
							'</li>'
						);
					}
				}else{
					for(i=0;i<tweets.length;i++){
						$(this.boxViewDM).append(
							this.viewFormatDirectMessages(tweets[i])
						);
					}
				}

				this.openView($('#navDM'));
				$("#conversation").fadeOut();
			break;

			case 3: //3: Agregar elementos nuevos al listado
				if(typeof(tweets[0])!="undefined"){
					for(i=0; i<tweets.length; i++){

						respond = 0;
						screen_name = tweets[i].sender_screen_name;
						if(tweets[i].sender_screen_name == ttagit.getLoggedUserName()){
							screen_name = tweets[i].recipient_screen_name;
						}

						$("#dmtweets li").each(function(){
							if( $(this).find(".author a").html() == screen_name ){
								//TODO: existe una conversacion con esta persona actualizar el ultimo mensaje
								$("#" + this.id).replaceWith( ttagit.viewController.viewInterface.viewFormatDirectMessages(tweets[i]) );

								respond = 1;
								return false;
							}
						});

						if(respond == 0){
							$("#dmtweets .WriteNewMessage").insertAfter( this.viewFormatDirectMessages(tweets[i]) );
						}
					}
				}
			break;
		}
	},

	showDirectMessagesSearchUser: function (users){
		var i;

	    $("#resultUser").html('');
	    for(i=0; i<users.length; i++){
	        $("#resultUser").append("<a href='#'><span class='user_screen_name'>" + ttagit.utils.escapeHTML(users[i].owner_screen_name) + "</span><span class='user_id'>" + ttagit.utils.escapeHTML(users[i].owner_id) + "</span></a>");
	    }
	},

	showConversationDirectMessages: function  (tweets) {
		var i;

		// Verificamos que Accion tomar en la vista
		switch(ttagit.viewController.viewAction){

			case 1: //1: Mostrar listado
				$(this.boxNewItems).html("");
				$(this.boxViewDMConversation).html(
					'<li class="goBackToMain">' +
						'<a class="backConversation" href="#">Back to messages</a>' +
					'</li>'+
					'<li class="WriteNewMessage">'+
						'<a href="#">Send new message</a>'+
					'</li>'
				);

				for(i=0;i<tweets.length;i++){
					$(this.boxViewDMConversation).append(
						this.viewFormatConversationDirectMessages(tweets[i])
					);
				}

				// Show the conversation timeline
				$(".tab_content").hide();
				$("#conversation").fadeIn();
			break;

			case 3: //3: Agregar nuevos mensajes directos
				for(i=0;i<tweets.length;i++){
					$(this.boxViewDMConversation + " .WriteNewMessage").replaceWith(
						'<li class="WriteNewMessage">'+
							'<a href="#">Send new message</a>'+
						'</li>' +
						this.viewFormatConversationDirectMessages(tweets[i])
					);
				}
			break;
		}
	},

	//------------

	showTrendTopics: function (trends){
		var i;

		// Verificamos que Accion tomar en la vista
		switch(ttagit.viewController.viewAction){

			case 1: //1: Mostrar listado
				$(this.boxNewItems).html("");
				this.cleanAllTimeLines();

				if(typeof(trends[0])=="undefined"){
					if ($.trim($(this.boxViewTrendTopics).html()) == '')
					{
						$(this.boxViewTrendTopics).html(
							'<li class="noTweetsToShow">' +
								'<p>No trending topics at this time</p>' +
							'</li>'
						);
					}
				}else{
					$(this.boxViewTrendTopics).append(
						'<li class="trendtopicTitle">' +
							'<span href="#">Trending Topics</span>' +
						'</li>'
					);
					for(i=0;i<trends.length;i++){
						$(this.boxViewTrendTopics).append(
							this.viewFormatTrendTopic(trends[i])
						);
					}
				}

				$("#trendsTweets").fadeOut();
				this.openView($('#navTrends'));
				ttagit.viewController.viewInterface.waitPage('hide');
			break;

		}
	},

	showTrendTopicsTweets: function (tweets){
		var i;
		// Verificamos que Accion tomar en la vista
		switch(ttagit.viewController.viewAction){

			case 1://1: Mostrar tweets del listado
				$(this.boxNewItems).html("");
				$(this.boxViewSearchTweets).html("");

				$(this.boxViewTrendTopicsTweets).html(
					 '<li class="clearfix trendtopicTitle">' +
						'<span href="#">Trending Topics</span>' +
					'</li>' +
					 '<li class="clearfix goBackToTrendMain">' +
						'<a href="#">Back to Trending topics</a>' +
					'</li>'

				);

				if(typeof(tweets[0]) =="undefined"){
					if ($.trim($(this.boxViewTrendTopicsTweets).html()) == '')
					{
						$(this.boxViewTrendTopicsTweets).html(
							'<li class="noTweetsToShow">' +
								'<p>No recent tweets</p>' +
							'</li>'
						);
					}
				}else{
					for(i=0;i<tweets.length;i++){
						$(this.boxViewTrendTopicsTweets).append(
							this.viewFormatTweets(tweets[i])
						);
					}
				}

				this.addScrollEvent();

				$(".tab_content").hide();
				$("#trendsTweets").fadeIn();
				ttagit.viewController.viewInterface.waitPage('hide');
			break;

			case 2: //2: Agregar mas elementos al inicio del listado
				$(this.boxNewItems).html("");
				$(this.boxViewSearchTweets).html("");

				$(this.boxViewTrendTopicsTweets).html(
					 '<li class="clearfix trendtopicTitle">' +
						'<span href="#">Trending Topics</span>' +
					'</li>' +
					 '<li class="clearfix goBackToTrendMain">' +
						'<a href="#">Back to Trending topics</a>' +
					'</li>'

				);

				if(typeof(tweets[0]) != "undefined"){
					for(i=0; i<tweets.length; i++){
						$(this.boxViewTrendTopicsTweets).append(
							this.viewFormatTweets(tweets[i])
						);
					}
				}

				this.addScrollEvent();

			break;

			case 3: //2: Agregar mas elementos al final del listado
				if(typeof(tweets[0]) != "undefined"){
					for(i=0; i<tweets.length; i++){
						$(this.boxViewTrendTopicsTweets).append(
							this.viewFormatTweets(tweets[i])
						);
					}
				}
			break;
		}

	},
	//------------

	showAllList: function (lists){
		var i;

		// Verificamos que Accion tomar en la vista
		switch(ttagit.viewController.viewAction){

			case 1: //1: Mostrar listado
				$(this.boxNewItems).html("");
				this.cleanAllTimeLines();

				if(typeof(lists[0])=="undefined"){
					if ($.trim($(this.boxViewList).html()) == '')
					{
						$(this.boxViewList).html(
							'<li class="noTweetsToShow">' +
								'<p>You are not following a list</p>' +
							'</li>'
						);
					}
				}else{
					for(i=0;i<lists.length;i++){
						$(this.boxViewList).append(
							this.viewFormatList(lists[i])
						);
					}
				}

				$("#listsFiltered").fadeOut();
				this.openView($('#navList'));
			break;

		}
	},

	showTweetsOfLists: function  (idList, tweets){
		var i;

		// Verificamos que Accion tomar en la vista
		switch(ttagit.viewController.viewAction){

			case 1://1: Mostrar tweets del listado

				ttagit.viewController.viewTweetsOfListCurrent = idList;

				$(this.boxNewItems).html("");
				$(this.boxViewListTweets).html(
					 '<li class="goBackToMain">' +
						'<a href="#">Back to list</a>' +
					'</li>'
				);

				if(typeof(tweets[0]) =="undefined"){
					if ($.trim($(this.boxViewListTweets).html()) == '')
					{
						$(this.boxViewListTweets).html(
							'<li class="noTweetsToShow">' +
								'<p>No recent tweets on this list</p>' +
							'</li>'
						);
					}
				}else{
					for(i=0;i<tweets.length;i++){
						$(this.boxViewListTweets).append(
							this.viewFormatTweets(tweets[i])
						);
					}
				}

				this.addScrollEvent();

				$(".tab_content").hide();
				$("#listsFiltered").fadeIn();
				ttagit.viewController.viewInterface.waitPage('hide');
			break;

			case 2://2: Agregar mas elementos al final del listado
				if(typeof(tweets[0]) !="undefined"){
					for(i=0; i<tweets.length; i++){
						$(this.boxViewListTweets).append(
							this.viewFormatTweets(tweets[i])
						);
					}
				}
			break;

			case 4: //4: Agregar mas elementos al inicio del listado
                if(typeof(tweets[0]) != "undefined"){
                    for(i=0; i<tweets.length; i++){
                        $(this.boxViewListTweets + " .goBackToMain").after(
                            this.viewFormatTweets(tweets[i])
                        );
                    }
                }
            break;
		}
	},

	//------------

	showSearches: function (searches){
		var i;

		// Verificamos que Accion tomar en la vista
		switch(ttagit.viewController.viewAction){

			case 1: //1: Mostrar listado
				$(this.boxNewItems).html("");
				$(this.boxViewSearchLeft).html("");
				$(this.boxViewSearchRight).html("");
				this.cleanAllTimeLines();

				if(typeof(searches[0]) !="undefined"){
					for(i=0;i<searches.length;i++){
						if( (i+1) % 2 == 0){
							$(this.boxViewSearchRight).append(
								this.viewFormatSearch(searches[i])
							);
						}else{
							$(this.boxViewSearchLeft).append(
								this.viewFormatSearch(searches[i])
							);
						}
					}
				}
				this.openView($('#navSearch'));
				$("#searchtweets").show();
			break;
		}
	},

	showTempTweetsOfSearches: function (searches){
		var i;

		// Verificamos que Accion tomar en la vista
		switch(ttagit.viewController.viewAction){

			case 1: //1: Mostrar tweets del listado
				$(this.boxNewItems).html("");
				$(this.boxViewSearchTweets).html("");

				if(typeof(searches[0])=="undefined"){
					if ($.trim($(this.boxViewSearchTweets).html()) == '')
					{
						$(this.boxViewSearchTweets).html(
							'<li class="noTweetsToShow">' +
								'<p>No recent tweets for this Search</p>' +
							'</li>'
						);
					}
				}else{
					for(i=0;i<searches.length;i++){
						$(this.boxViewSearchTweets).append(
							this.viewFormatTweets(searches[i])
						);
					}
				}

				//muestro los resultados en ese tab
				$("#search .timeline").fadeIn();

				// cierro la lista de searches guardados
				if (!$(".savedSearches .title").hasClass("opened")) {
					$(".savedSearches .title").toggleClass("opened").parent().find(".searchesColumns").slideToggle();
				}

				//cambio el boton de Go -> Save Search
				$('.searchExpanded .action.singleline').removeClass("singleline").addClass("saveSearch").html("Save search");

				//si se hizo una busqueda desde afuera
				//agruego un nombre para que a la busqueda para que se pueda guardar
				if (ttagit.cookie.exist('search_query_name'))
				{
					$("#searchinput").val(ttagit.cookie.read('search_query_name'));
					ttagit.cookie.remove('search_query_name');
				}
				else if (ttagit.cookie.exist('search_query_name', true)) {
					$("#searchinput").val(ttagit.cookie.read('search_query_name', true));
					ttagit.cookie.remove('search_query_name', true);
				}
				this.waitPage('hide');
			break;

		}
	},

	showTweetsOfSearches: function  (searchID, tweets){
		var i;

		// Verificamos que Accion tomar en la vista
		switch(ttagit.viewController.viewAction){

			case 1: //1: Mostrar tweets del listado

				ttagit.viewController.viewTweetsOfSearchCurrent = searchID;

				$(this.boxNewItems).html("");
				$(this.boxViewSearchTweets).html("");

				if(typeof(tweets[0])=="undefined"){
					if ($.trim($(this.boxViewSearchTweets).html()) == '')
					{
						$(this.boxViewSearchTweets).html(
							'<li class="noTweetsToShow">' +
								'<p>No recent tweets for this Search</p>' +
							'</li>'
						);
					}
				}else{
					for(i=0;i<tweets.length;i++){
						$(this.boxViewSearchTweets).append(
							this.viewFormatTweets(tweets[i])
						);
					}
				}

				//Reiniciar opciones de busqueda
				$("#searchinput").val("What are you looking for?");
				$(".searchExpanded .action.saveSearch").removeClass("saveSearch").addClass("singleline").html("GO");

				this.addScrollEvent();

				$("#search .timeline").fadeIn();
				if (!$(".savedSearches .title").hasClass("opened")) {
					$(".savedSearches .title").toggleClass("opened").parent().find(".searchesColumns").slideToggle();
				}
				ttagit.viewController.viewInterface.waitPage('hide');
			break;

			case 2: //2: Agregar mas elementos al final del listado
				if(typeof(tweets[0]) != "undefined"){
					for(i=0; i<tweets.length; i++){
						$(this.boxViewSearchTweets).append(
							this.viewFormatTweets(tweets[i])
						);
					}
				}
			break;

			case 4: //2: Agregar mas elementos al inicio del listado
                if(typeof(tweets[0]) != "undefined"){
                    for(i=0; i<tweets.length; i++){
                        $(this.boxViewSearchTweets).prepend(
                            this.viewFormatTweets(tweets[i])
                        );
                    }
                }
                if (!$(".savedSearches .title").hasClass("opened")) {
                    $(".savedSearches .title").toggleClass("opened").parent().find(".searchesColumns").slideToggle();
                }
                ttagit.viewController.viewInterface.waitPage('hide');
            break;
		}
	},

//--------------------------------------------
//	 MISC
//--------------------------------------------

	//Actualizamos la fecha y el tiempo del listado de tweets en la vista activa
	refreshDataTime: function  (){
		var boxUl,datetime;

		switch(ttagit.viewController.viewCurrent){
			case 'TimeLine':
				boxUl = this.boxViewTimeLine + " li";
				break;

			case 'Mentions':
				boxUl = this.boxViewMention + " li";
				break;

			case 'Favorite':
				boxUl = this.boxViewFavorite + " li";
				break;

			case 'direct_messages':
				boxUl = this.boxViewDM + " li";
				break;

			case 'direct_messages_conversation':
				boxUl = this.boxViewDMConversation + " li";
				break;

			case 'list_tweets':
                boxUl = this.boxViewListTweets + " li.clearfix";
                break;

            case 'search_tweets':
                boxUl = this.boxViewSearchTweets + " li";
                break;

             case 'TweetsTrendTopics':
                boxUl = this.boxViewTrendTopicsTweets + " li.clearfix";
                break;
		}

		$( boxUl ).each(function(i){
			if(typeof($(this).attr('id')) != "undefined"){

				if( ttagit.viewController.viewCurrent != "direct_messages" &&  ttagit.viewController.viewCurrent != "direct_messages_conversation" ){
					datetime = $("#" + this.id + " .tweetCreated").html();

					$("#" + this.id + " .date").html(ttagit.utils.escapeHTML(
						ttagit.viewController.viewInterface.formatTimeTweets(datetime)
					));
				}else{
					datetime = $("#" + this.id + " .tweetCreated").html();

					$("#" + this.id + " .simpleDate").html(ttagit.utils.escapeHTML(
						ttagit.viewController.viewInterface.formatTimeTweets(datetime)
					));
				}
			}
		});

		$(this.boxNewItems + " li").each(function(){
			datetime = $("#" + this.id + " .tweetCreated").html();

			$("#" + this.id + " .date").html(ttagit.utils.escapeHTML(
				ttagit.viewController.viewInterface.formatTimeTweets(datetime)
			));

		});
	},

	//agrega el evento de scroll a la lista de tweets correspondiente
	addScrollEvent: function ()
	{
		$(".scrollEvent").unbind("scroll");
		switch(ttagit.viewController.viewCurrent){

			case 'Favorite':
				 $(this.boxViewFavorite).scroll(function() {
					if ($(this)[0].scrollHeight - $(this).scrollTop() + 6 == $(this).outerHeight()) {
						ttagit.viewController.appendFavoriteTweets();
					}
				 });
				 break;

			case 'TimeLine':
				 $(this.boxViewTimeLine).scroll(function() {
					if ($(this)[0].scrollHeight - $(this).scrollTop() + 6 == $(this).outerHeight()) {
						ttagit.viewController.appendTimeLineTweets();
					}
				 });
				 break;

			case 'Mentions':
				 $(this.boxViewMention).scroll(function() {
					if ($(this)[0].scrollHeight - $(this).scrollTop() + 6 == $(this).outerHeight()) {
						ttagit.viewController.appendMentionsTweets();
					}
				 });
				 break;

			case 'list_tweets':
				 $(this.boxViewListTweets).scroll(function() {
					if ($(this)[0].scrollHeight - $(this).scrollTop() + 6 == $(this).outerHeight()) {
						ttagit.viewController.appendTweetsOfLists(ttagit.viewController.viewTweetsOfListCurrent);
					}
				 });
				 break;

			case 'search_tweets':
				 $(this.boxViewSearchTweets).scroll(function() {
					if ($(this)[0].scrollHeight - $(this).scrollTop() + 6 == $(this).outerHeight()) {
						ttagit.viewController.appendTweetsOfSearches(ttagit.viewController.viewTweetsOfSearchCurrent);
					}
				 });
				 break;
			case 'TweetsTrendTopics':
				 $(this.boxViewTrendTopicsTweets).scroll(function() {
					if ($(this)[0].scrollHeight - $(this).scrollTop() + 6 == $(this).outerHeight()) {
						ttagit.viewController.appendOldTweetsTrendTopics();
					}
				 });
				 break;
		 }
	},

	//muestra un tab
	openView: function ( obj ){
		var activeTab,currentTab;

		$(".mainWindow .paddingForMenu").hide();
		$(ttagit.viewController.viewInterface.boxNewItems).html("");
		ttagit.viewController.viewInterface.ResetTtagitButton();
		this.notificationArea('hide');
		this.deleteMenuNewItem(obj);

		this.addScrollEvent();

		activeTab = obj.attr("href");
		currentTab = $("#navPrincipal a.active").attr("href");
		if (activeTab != currentTab){
			$("#navPrincipal a").removeClass("active");
			obj.addClass("active");

			$(".tab_content").hide();

			$(activeTab).fadeIn();

			if(activeTab != "#trends" && currentTab == "#trends"){
				ttagit.taskScheduler.remove({"f1":"ttagit.loadTweetsTrendTopic","p1":[ttagit.viewController.viewTweetsOfTrendTopicCurrent]});
			}

			if(activeTab == '#search'){
				//Reiniciar opciones de busqueda
				$("#searchinput").val("What are you looking for?");
				$(".searchExpanded .action.saveSearch").removeClass("saveSearch").addClass("singleline").html("GO");
			}
		}

		if( activeTab == "#lists" || activeTab == "#dms" || activeTab == "#trends"){
			if(activeTab == "#trends"){
				ttagit.taskScheduler.remove({"f1":"ttagit.loadTweetsTrendTopic","p1":[ttagit.viewController.viewTweetsOfTrendTopicCurrent]});
			}

		    $(activeTab).fadeIn();
		}

		if( ttagit.cookie.exist('textNewTeets') )
        {
            ttagit.cookie.remove('textNewTeets');
        }

		return false;
	},

	//limpia todos los time lines (para que o queden id repetidos en el html)
	cleanAllTimeLines: function () {
		$("#timelinetweets").html('');
		$("#mentiontweets").html('');
		$("#dmtweets").html('');
		$("#conversationtweets").html('');
		$("#favoriteTweets").html('');
		$("#trendtopics").html('');
		$("#listTrendtweets").html('');
		$("#listtweets").html('');
		$("#listfilteredtweets").html('');
		$("#searchtweets").html('');
	},

	//add a new saved search button on the list of saved searches
	addNewSearch: function  (search){
		var i = $(this.boxViewSearchRight + " li").length + $(this.boxViewSearchLeft + " li").length;
		if( (i+1) % 2 == 0){
			$(this.boxViewSearchRight).append(
				this.viewFormatSearch(search[0])
			);
		}else{
			$(this.boxViewSearchLeft).append(
				this.viewFormatSearch(search[0])
			);
		}
	},

	setSearchButton: function ( type ){
		if(type = 'go'){
			$('.searchExpanded .action.saveSearch').removeClass("saveSearch").addClass("singleline").html("GO");
		} else {
			$('.searchExpanded .action.singleline').removeClass("singleline").addClass("saveSearch").html("Save search");
		}
	},

	setSearchText: function ( text ){
		$("#searchinput").val(text);
	},

	//------------

	// saca el tweet de la lista al borrarlo
	deleteBoxTweet: function (id){
		$("#"+id).fadeOut(400);
	},

	//------------

	//show indicator of new tweets on nav tab
	setMenuNewItem: function ( obj ){
		obj.html('<span class="newitems"></span>');
	},

	//esconde la notificacion de nuevos tweets (punto amarillo)
	deleteMenuNewItem: function ( obj ){
		obj.html('');
	},

	//set inactive ttagit icon
	SetInactiveIcon: function (count){
		$("#ttagit-button",top.document).attr('active', 'no');
	},

	//set active ttagit icon
	SetActiveIcon: function (count){
		$("#ttagit-button",top.document).attr('active', 'yes');
	},

	initTweetsNotificationOnTtagitButton: function(){
		$("#ttagit-button-text",top.document).val(0).show();
		$("#ttagit-button-text",top.document).val('').hide();
	},

	//show new tweets on ttagit icon
	SetNewTweetsOnTtagitButton: function (count){
		$("#ttagit-button-text",top.document).val(count).show();
	},

	//hide new tweets on ttagit icon
	ResetTtagitButton: function (){
		$("#ttagit-button-text",top.document).val('').hide();
	},

	//muestra el area de notificacion
	notificationArea: function (action, type, text){
		var notificationDiv;

		if(action == 'hide' ){

			try{
				notificationDiv = $("#newtweets, #notification").css('display').toLowerCase();
			}catch(e){
				notificationDiv = 'none';
			}
			if( $.inArray( notificationDiv, ['block', 'inline']) > -1) {
				$("#newtweets, #notification").html("");
				$("#newtweets, #notification").css('display', 'none');
				$(".notification ul.timeline").animate({ marginTop: '-=38',}, 400, function() {});
			}

			if( ttagit.cookie.exist('textNewTeets') )
            {
                $("#notification").attr('id', 'newtweets');
                this.addEventClickMessageNewTweet();
                $("#newtweets").html( ttagit.utils.escapeHTML( ttagit.cookie.read('textNewTeets') ));
                if( $("#newtweets, #notification").css('display') == 'none'){
                    $(".notification ul.timeline").animate({ marginTop: '+=38',}, 400, function() {});
                    $("#newtweets").css('display', 'block');
                }
                ttagit.cookie.remove('textNewTeets');
            }
		}
		else{
			if (type == 'info') {
			    if( $("#newtweets").html() != "null" || $("#newtweets").html() == "" )
			    {
			        ttagit.cookie.create('textNewTeets', $("#newtweets").html());
			    }
				$("#newtweets, #notification").attr('id', 'notification');
				$("#notification").unbind('click');
				setTimeout(function(){ttagit.viewController.viewInterface.notificationArea('hide');},5000);
			}
			else{
				$("#newtweets, #notification").attr('id', 'newtweets');
				this.addEventClickMessageNewTweet();
			}
			$("#newtweets, #notification").html("<span></span>" + ttagit.utils.escapeHTML(text));
			if( $("#newtweets, #notification").css('display') == 'none'){
				$(".notification ul.timeline").animate({ marginTop: '+=38',}, 400, function() {});
				$("#newtweets, #notification").css('display', 'block');
			}
		}

	},

	notificationOnDM: function (action,msg){
		if(action == "show"){
			$("#directMessage p.upload_error").html(ttagit.utils.escapeHTML(msg));
			$("#directMessage p.upload_error").show();
		}else{
			$("#directMessage p.upload_error").html("");
			$("#directMessage p.upload_error").hide();
		}
	},

	messageForLogin: function (action){
		if(action == "show"){
			$('.modalBox p.twitter_communication_problem').show("fast");
		}else{
			$('.modalBox p.twitter_communication_problem').hide();
		}
	},

	//agrega el evento al area de notificacion (newtweets)
	addEventClickMessageNewTweet: function ( ){

		$(this.boxMessageNewTweet).unbind('click');
		$(this.boxMessageNewTweet).bind('click', function() {
		    var divUpdate = "";
		    switch(ttagit.viewController.viewCurrent)
		    {
		        case 'TimeLine':
		          divUpdate = ttagit.viewController.viewInterface.boxViewTimeLine;
		          break;

	            case 'Mentions':
                  divUpdate = ttagit.viewController.viewInterface.boxViewMention;
                  break;

                case 'Favorite':
                  divUpdate = ttagit.viewController.viewInterface.boxViewFavorite;
                  break;
		    }
			ttagit.viewController.appendNewItem( divUpdate );
		});
	},

	//------------
	openTweetTextarea: function (){
		// If it isn't opened
		if($("#searchbox textarea").hasClass("opened")) { return false; }

		// Animations and text of opened state
		if($("#searchbox textarea").val() == "Share something, " + ttagit.getLoggedUserName()) {
			$("#searchbox textarea").val('');
		}

		$("#searchbox textarea").animate({
			height: '+=30',
			paddingBottom: '+=22'
			}, 500, function() {}
		);

		$(".timeline").animate({
			/*arregla un todo*/
			marginTop: '+=82',
			}, 400, function() {}
		);

		$(".secondStep").fadeSliderToggle({
			speed:400,
			easing : "swing"
		});

		$("#searchbox textarea").addClass("opened");
	},

	tweetAreaItsOpen: function (){
		return $("#searchbox textarea").hasClass("opened");
	},

	//cierra el box de new Tweet
	cancelTweet: function (){
		if(!$("#searchbox textarea").hasClass("opened")) {
			return false;
		}

		// Animations and text on default state
		$("#searchbox textarea").animate({
			height: '-=30',
			paddingBottom: '-=22'
			}, 500, function() {}
		);

		$(".timeline").animate({
			marginTop: '-=82',
			}, 400, function() {}
		);

		$("#searchbox textarea").val('Share something, '+ ttagit.getLoggedUserName()).removeClass("opened").blur();

		$(".secondStep").fadeSliderToggle({
			speed:400,
			easing : "swing"
		});

		// Reset input file
		$("#photo").attr({ value: '' });
		$(".file-wrapper .button").text("Attach a picture");
		ttagit.viewController.viewInterface.setInputFile("enabled");//habilito la opcion de que se puedan agregar las imagenes

		$('.secondStep .counter').html(140);//reseteo los caracteres restantes.

		//elimina todas las posibles cookies de tweet
		ttagit.removeTweetsCookies();
		return false;
	},

	//cierra el box de mensajes directos
	cancelDM: function (){
		$("#overlay, #directMessage, #directMessageFromAny").fadeOut();

		// Reset input file
		$("#photo").attr({ value: '' });
		$(".file-wrapper .button").text("Attach a picture");
		$(".directMessageTextarea").val("");
		ttagit.cookie.remove('DM_recipient_id');
		ttagit.cookie.remove('DM_recipient_name');
		return false;
	},

	//abre el box de mensajes directos
	openDM: function (){
		this.notificationOnDM("hide","");
		$("#overlay, #directMessage").fadeIn();
	},

	//cierra el box de mensajes directos listado de usuarios
    cancelDMUser: function (){
        $("#overlay, #directMessageUser").hide();
        return false;
    },

	//abre el box de mensajes directos listado de usuarios
	openDMUser: function (){
        $("#overlay, #directMessageUser").fadeIn();
        $("#direct_message_from").focus();
    },

	//------------

	setImageUploader: function (uploader){

		if(uploader == "twitter"){
			$("#form").html(
				"<input type=\"file\" value=\"\" name=\"media[]\" id=\"photo\"/>"+
				"<input style=\"width: 0; height:0;\" type=\"text\" value=\"\" name=\"status\" id=\"twitter_status\" />"+
				"<input style=\"width: 0; height:0;\" type=\"text\" value=\"\" name=\"in_reply_to_status_id\" id=\"twitter_reply\" />"
			);
		}else if(uploader == "pikchur"){
			$("#form").html(
				"<input type=\"file\" value=\"\" name=\"media\" id=\"photo\">"+
				"<input type=\"hidden\" name=\"api_key\" value=\"QFmFCEkt1ZwWsC2Dcorw4A\" id=\"api_key\"/>"+
				"<input type=\"hidden\" name=\"source\" value=\"MTk1\" id=\"source\"/>"+
				"<input type=\"hidden\" name=\"private\" value=\"NO\" id=\"public\"/>"
			);
		}
	},

	//setea el mensaje del del text area de Tweets
	setTweetTextarea: function (text){
		$("#searchbox textarea").val(text);
	},
	//obtiene el mensaje del del text area de Tweets
	getTweetTextarea: function (){
		var tweet = $("#searchbox textarea").val();
		return tweet;
	},

	//obtiene el mensaje del del text area de DM
	getDMTextarea: function (){
		var dm = $("#directMessageTextarea").val();
		return dm;
	},

	//setea el mensaje del del text area de DM
	setDMTextarea: function (text){
		$("#directMessageTextarea").val(text);
	},

	hideTweetDropdownMenu: function (){
		$('.mainWindow .paddingForMenu').hide();
	},

	//------------

	//abre la pantalla de logueo
	init: function () {

		this.notificationArea('hide');

		// Check if user closed without logout Ttagit
		if(ttagit.cookie.exist('keep_login_user','system')){
			var user = ttagit.cookie.read('keep_login_user','system');

			// Log User
			ttagit.LogUser(parseInt(user));
		}else{
			this.InsertUsersToLoginForm();

			// ocultar todos los tabs y mostrar el primero
			$(".tab_content").hide();
			$("#navPrincipal a").removeClass("active");
			$("#navPrincipal a:first").addClass("active");
			$(".tab_content:first").show();
			$("#timelinetweets").html('');

			//resetar valores
			$('#secureaccount').hide();
			$("#addNewUserWhait").hide();
			$('#userslist').show();
			$(".addNewAccount").show();

			// Start welcome screen
			$('#userslist').css('display', 'block');
			$("#overlay, #welcomeMessage").fadeIn();
		}


	},

	//carga los usduarios en la pantalla de logueo
	InsertUsersToLoginForm: function (){
		var i,
		users = ttagit.getUsers();

		if(users){
			$("#usersOnTheSystem").html('');
			for(i=0;i<users.length;i++){
				$("#usersOnTheSystem").append(
					'<li id="'+ttagit.utils.escapeHTML(users[i].id)+'|'+ttagit.utils.escapeHTML(users[i].name)+'">'+
						'<img src="'+ttagit.utils.escapeHTML(users[i].profile_image)+'" alt="'+ttagit.utils.escapeHTML(users[i].name)+'" />'+
						'<div class="username">@'+ttagit.utils.escapeHTML(users[i].name)+'</div>'+
						'<a href="#" class="close"></a>'+
						'<div class="hiddenConfirmation">'+
							'<span class="message">Are you sure you want to unlink this account?</span>'+
							'<div class="actions">'+
								'<a href="#" class="cancel">Cancel</a>'+
								'<a href="#" class="confirm">Unlink</a>'+
							'</div>'+
						'</div>'+
					'</li>'
				);
			}
		}
	},

	//abre/oculta la pantalla ingresar contraseña
	loginPaswordForm: function (action) {
		if (action == 'show') {
			$('#userslist').css('display', 'none');
			$('#secureaccount').fadeIn();
		}else{
			$("#secureaccount #login_userpass").val('');
			$("#secureaccount p.password_error").hide('fast');
			$('#secureaccount').css('display', 'none');
			$('#userslist').fadeIn();
		}
	},

	//abre/oculta la pantalla de nuevo usuario
	AddUserForm: function (action) {
		if (action == 'show') {
			$("#welcomeMessage").hide();
			$("#addNewUser").fadeIn();
			$(".twitterValidation li input:first").focus();
		}else{
			$(".twitterValidation input").val('');
			$("#addNewUser p.password_error").hide('fast');
			$("#addNewUser p.pin_error_incomplete").hide('fast');
			$("#addNewUser p.pin_error_novalid").hide('fast');
			$("#addNewUser p.permit_access_first").hide('fast');
			this.resetAddNewAccountFields();//resetea los campos y esconde las opciones desplegadas.
			$("#addNewUser").hide();
			$("#addNewUserWhait").hide();
			$(".addNewAccount").show();
			$("#welcomeMessage").fadeIn();
		}
	},

	//abre/oculta la pantalla de nuevo usuario
	HideUserForm: function (action) {
		$(".twitterValidation input").val('');
		$("#addNewUser p.password_error").hide('fast');
		$("#addNewUser p.pin_error_incomplete").hide('fast');
		$("#addNewUser p.pin_error_novalid").hide('fast');
		$("#addNewUser p.permit_access_first").hide('fast');
		this.resetAddNewAccountFields();//resetea los campos y esconde las opciones desplegadas.
		$("#addNewUser").hide();
		$("#addNewUserWhait").hide();
	},

	//resetea los campos de la pantalla de ingreso de PIN, y esconde las opciones desplegadas
	resetAddNewAccountFields: function (){
		var i;

		for (i=1; i<8 ;i++ ) {
			$("#pin-"+i).val("");
		}

		$('#remember').attr('checked','true');
		$("#securecheckbox").removeAttr('disabled');
		$('#securecheckbox').attr('checked', false);//elimino el check
		$("#pass").val('');//seteo a vacio los campos
		$("#pass_confirm").val('');//seteo a vacio los campos
		$("#addNewUser .secureIt").hide();//lo cierro
	},


	//resetea los campos de la pantalla de ingreso de PIN, y esconde las opciones desplegadas
	SetPIN_OnFields: function (PIN){
		var i;

		for (i=1; i<8 ;i++ ) {
			$("#pin-"+i).val(PIN.slice(i-1,i));
		}
	},

	//abre/oculta la pantalla de espera
	confirmationPage: function (title, text, functionConfirm) {
    	$("#welcomeMessage").css('display', 'none');
    	$("#directMessage").css('display', 'none');
    	$("#addNewUser").css('display', 'none');
    	$("#Preferences").css('display', 'none');

    	this.functionConfirm = functionConfirm;
    	$("#ConfirmationPage .title").html(ttagit.utils.escapeHTML(title));
    	$("#ConfirmationPage .textMessage").html(ttagit.utils.escapeHTML(text));
    	$("#overlay, #ConfirmationPage").fadeIn();
	},

	clickConfirm: function () {
		ttagit.callback.execute(this.functionConfirm);
	    $("#overlay, #ConfirmationPage").fadeOut();
	},

	clickConfirmCancel: function () {
        $("#overlay, #ConfirmationPage").fadeOut();
    },

	//abre/oculta la pantalla de espera
    waitPage: function (action) {
        if (action == 'show'){
            $("#welcomeMessage").css('display', 'none');
            $("#directMessage").css('display', 'none');
            $("#addNewUser").css('display', 'none');
            $("#Preferences").css('display', 'none');
            $("#overlay, #PleaseWait").fadeIn();
        }else{
            $("#overlay, #PleaseWait").fadeOut();
        }
    },

    unlockPage: function (action) {
        if (action == 'show'){
            $("#welcomeMessage").css('display', 'none');
            $("#directMessage").css('display', 'none');
            $("#addNewUser").css('display', 'none');
            $("#Preferences").css('display', 'none');
            $("#Preferences").css('display', 'none');
            $("#transparency, #UnlockPage, #UnlockMsg").fadeIn();
        }else{
            $("#transparency, #UnlockPage, #UnlockMsg").fadeOut();
        }
    },

	//abre la pantalla de preferencias
	showPreferences: function (){
		var user_screen_name = ttagit.getLoggedUserName(),res,res1;
		res = ttagit.dbttagit.query("SELECT user_preferences, password FROM users WHERE (name = '"+user_screen_name+"')");
		res1 = ttagit.dbttagit.query("SELECT reload_rate, sidebar_position, image_uploader FROM preferences WHERE(id = '"+res[0].user_preferences+"')");

		if(res1[0].sidebar_position == "left"){
			$('#left_sidebar').attr('checked',true);
			$('#right_sidebar').removeAttr('checked');
		}else if(res1[0].sidebar_position == "right"){
			$('#left_sidebar').removeAttr('checked');
			$('#right_sidebar').attr('checked',true);
		}

		if(res1[0].image_uploader == "pikchur"){
			$('#pikchur_uploader').attr('checked',true);
			$('#twitter_uploader').removeAttr('checked');
		}else if(res1[0].image_uploader == "twitter"){
			$('#pikchur_uploader').removeAttr('checked');
			$('#twitter_uploader').attr('checked',true);
		}

		$("#reload_rate").val(res1[0].reload_rate);
		if((res[0].password != "")&&(res[0].password != null)){
			$("#pass_pref").val("****");
			$("#pass_confirm_pref").val("****");
			$('#securecheckbox_pref').attr('checked',true);
			$("#Preferences .secureIt").slideToggle();
		}else{
			$("#pass_pref").val("");
			$("#pass_confirm_pref").val("");
			$('#securecheckbox_pref').removeAttr('checked');
		}

		ttagit.cookie.create("password_on_pref","falsePass");

		$("#overlay, #Preferences").fadeIn();
	},

	//oculta la pantalla de preferencias
	hidePreferences: function (){
		$("#overlay, #Preferences").fadeOut();
		$("#Preferences .secureIt .password_error").hide();
	},


	//abre la pantalla de preferencias
	showMutedUsersList: function (){
		var res;
		res = ttagit.dbttagit.query(
			"SELECT owner_id, owner_screen_name, image "+
			"FROM tweets "+
			"WHERE owner_id IN (" + ttagit.viewController.listMutedUsers() + ") "+
			"GROUP BY owner_id"
		);

		$("#mutedUsers .genericError").hide();

		if(typeof(res[0]) == "undefined"){
			$("#mutedUsers .genericError").show();
			$("#overlay, #mutedUsers").fadeIn();
			return true;
		}

		$("#mutedUserList").html('');
		for(i=0; i<res.length; i++){
			$("#mutedUserList").append(
				'<li id="'+ttagit.utils.escapeHTML(res[i].owner_id)+'|'+ttagit.utils.escapeHTML(res[i].owner_screen_name)+'">'+
					'<img src="'+ttagit.utils.escapeHTML(res[i].image)+'" alt="'+ttagit.utils.escapeHTML(res[i].owner_screen_name)+'" />'+
					'<div class="username">@'+ttagit.utils.escapeHTML(res[i].owner_screen_name)+'</div>'+
					'<a href="#" class="close"></a>'+
					'<div class="hiddenConfirmation">'+
						'<span class="message">Remove this user from the muted list?</span>'+
						'<div class="actions">'+
							'<a href="#" class="confirm">Remove</a>'+
							'<a href="#" class="cancel">Cancel</a>'+
						'</div>'+
					'</div>'+
				'</li>'
			);
		}
		$("#overlay, #mutedUsers").fadeIn();
	},

	//oculta la pantalla de muted users
	hideMutedUsersList: function (){
		$("#overlay, #mutedUsers").fadeOut();
	},



	setStatusSubmit: function (status){
		if(status == "disabled"){
			$("#searchbox .secondStep input[type=submit]").attr("disabled", "true");//deshabilita el boton "Tweet"
			$("#searchbox .secondStep input[type=submit]").css("background", "#deddd7");//cambia el color del boton "Tweet" a gris
			return true;
		}
		//case: enabled
		$("#searchbox .secondStep input[type=submit]").removeAttr("disabled");//habilita el boton "Tweet"
		//cambia el color del boton "Tweet" a amarillo
		$("#searchbox .secondStep input[type=submit]").css('background','#f3eea8');
		$("#searchbox .secondStep input[type=submit]").css('background','-moz-linear-gradient(top, #f3eea8 0%, #eade39 100%)');
		$("#searchbox .secondStep input[type=submit]").css('background','-webkit-gradient(linear, left top, left bottom, color-stop(0%,#f3eea8), color-stop(100%,#eade39))');
		$("#searchbox .secondStep input[type=submit]").css('background','-webkit-linear-gradient(top, #f3eea8 0%,#eade39 100%)');
		$("#searchbox .secondStep input[type=submit]").css('background','linear-gradient(top, #f3eea8 0%,#eade39 100%)');
		return true;
	},

	setDMSubmit: function (status){
		if(status == "disabled"){
			$("#directMessage input[type=submit]").attr("disabled", "true");//deshabilita el boton "Send"
			$("#directMessage input[type=submit]").css("background", "#deddd7");//cambia el color del boton "Send" a gris
			return true;
		}
		//case: enabled
		$("#directMessage input[type=submit]").removeAttr("disabled");//habilita el boton "Send"
		$("#directMessage input[type=submit]").css('background','#f3eea8');
		$("#directMessage input[type=submit]").css('background','-moz-linear-gradient(top, #f3eea8 0%, #eade39 100%)');
		$("#directMessage input[type=submit]").css('background','-webkit-gradient(linear, left top, left bottom, color-stop(0%,#f3eea8), color-stop(100%,#eade39))');
		$("#directMessage input[type=submit]").css('background','-webkit-linear-gradient(top, #f3eea8 0%,#eade39 100%)');
		$("#directMessage input[type=submit]").css('background','linear-gradient(top, #f3eea8 0%,#eade39 100%)');
		return true;
	},

	setInputFile: function (status){
		if(status == "disabled"){
			$(".secondStep .positionMe .file-wrapper  input[type='file']").attr('disabled', 'disabled');
		}else if(status == "enabled"){
			$(".secondStep .positionMe .file-wrapper  input[type='file']").removeAttr('disabled');
		}
	},

	calculateCharacters: function (){
		$("#searchbox textarea").keyup();
	},


}
