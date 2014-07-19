/**
 * Este modulo realiza el control sobre la vista en cuanto a que tabs o datos se deben mostrar o ocultar.
 * Incluye el modulo viewInterface por el cual tambien se indica de que forma y con que estilos mostrar la informacion.
 **/
var TtagitViewController = function(){
    this.viewInterface = new TtagitViewInterface();
	/*
	 * Indica que vista esta activa
	 */
    this.viewCurrent = "";

	/*
	 * Indica que accion se hara sobre la vista
	 * 1: Mostrar listado
	 * 2: Agregar mas elementos al final del listado
	 * 3: Hay nuevos elementos para agregar al inicio del listado
	 */
    this.viewAction = 0;

	/*
	 * Id del ultimo elemento de la vista
	 */
    this.viewFirstItem = 0;

	/*
	 * Id del ultimo elemento obtenido por un sheduler pero en espera de ser
	 * mostrado en la vista cuando se hace click en el mensaje de nuevos tweets
	 */
    this.viewFirstItemTemp = 0;

	/*
	 * Id de la lista que se esta visualizando
	 */
    this.viewTweetsOfListCurrent = 0;

	/*
	 * Id de la busqueda que se esta visualizando
	 */
    this.viewTweetsOfSearchCurrent = 0;

	/*
	 * query del trend topic que se esta visualizando
	 */
    this.viewTweetsOfTrendTopicCurrent = 0;


	/*
	 * Id del ultimo elemento de la vista
	 */
    this.viewLastItem = 0;

	/*
	 * Indica en el mensaje directo cual conversacion se esta viendo
	 */
    this.viewScreenName = "";

	/*
	 * Indica cuantos elementos se mostraran en la lista al entrar en una vista
	 */
    this.viewQuantityItems = 10;

	/*
	* Lista de usuarios muteados
	*/
    this.mutedUsers = [];
}

TtagitViewController.prototype = {

//--------------------------------------------
//	 TIME LINE
//--------------------------------------------

	//busca tweets para mostrar el tab de time line
	showTimeLineTweets: function () {
		//report
		ttagit.reports.add('Session.timeline');

		var result = ttagit.dbttagit.query(
			"SELECT *  FROM tweets " +
			"WHERE " +
				"ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
				" AND type_tweet = 'TimeLine' " +
				" AND owner_id NOT IN (" + this.listMutedUsers() + ") " +
			"ORDER BY created DESC " +
			"LIMIT " + this.viewQuantityItems
		);
		this.viewCurrent = "TimeLine";
		this.viewAction = 1;
		if(typeof(result[0]) != "undefined"){
			this.viewFirstItem = result[0].tweet_id;
			this.viewLastItem = result[(result.length - 1)].tweet_id;
		}
		this.viewInterface.showTimeLineTweets(result);
	},

	//busca tweets para apendar al final, al hacer scroll
	appendTimeLineTweets: function () {
		var result,
		created = $("#" + this.viewLastItem + " .tweetCreated").html();

		result = ttagit.dbttagit.query(
			"SELECT *  FROM tweets " +
			"WHERE " +
				"ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
				" AND created < " + created +
				" AND type_tweet = 'TimeLine' " +
				//" AND owner_id NOT IN (" + this.listMutedUsers() + ")" +
			"ORDER BY created DESC " +
			"LIMIT " + this.viewQuantityItems
		);
		this.viewCurrent = "TimeLine";
		this.viewAction = 2;
		if(typeof(result[0]) != "undefined"){
			this.viewLastItem = result[(result.length - 1)].tweet_id;
		}
		this.viewInterface.showTimeLineTweets(result);
	},

	//busca tweets para apendar como nuevos (escondidos)
	appendNewTimeLineTweets: function () {
		var result,
		created = $("#" + this.viewFirstItem + " .tweetCreated").html();

		result = ttagit.dbttagit.query(
			"SELECT *  FROM tweets " +
			"WHERE " +
				"ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
				" AND created > " + created + " AND type_tweet = 'TimeLine' " +
				" AND owner_id NOT IN (" + this.listMutedUsers() + ")" +
			"ORDER BY created DESC "
		);
		this.viewCurrent = "TimeLine";
		this.viewAction = 3;
		this.viewInterface.showTimeLineTweets(result);
	},

//--------------------------------------------
//	 MENTIONS
//--------------------------------------------

	//busca tweets para mostrar el tab de mentions
	showMentionsTweets: function () {
		//report
		ttagit.reports.add('Session.mentions');

		var result = ttagit.dbttagit.query(
			"SELECT *  FROM tweets " +
			"WHERE " +
				"ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
				"AND type_tweet = 'Mentions' " +
			"ORDER BY created DESC " +
			"LIMIT " + this.viewQuantityItems
		);
		this.viewCurrent = "Mentions";
		this.viewAction = 1;
		if(typeof(result[0]) != "undefined"){
			this.viewFirstItem = result[0].tweet_id;
			this.viewLastItem = result[(result.length - 1)].tweet_id;
		}
		this.viewInterface.showMentionsTweets(result);
	},

	//busca tweets para apendar al final, al hacer scroll
	appendMentionsTweets: function () {
		var result,
		created = $("#" + this.viewLastItem + " .tweetCreated").html();

		result = ttagit.dbttagit.query(
			"SELECT *  FROM tweets " +
			"WHERE " +
				"ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
				"AND created < " + created + " AND type_tweet = 'Mentions' " +
			"ORDER BY created DESC " +
			"LIMIT " + this.viewQuantityItems
		);
		this.viewCurrent = "Mentions";
		this.viewAction = 2;
		if(typeof(result[0]) != "undefined"){
			this.viewLastItem = result[(result.length - 1)].tweet_id;
		}
		this.viewInterface.showMentionsTweets(result);
	},

	//busca tweets para apendar como nuevos (escondidos)
	appendNewMentionsTweets: function () {
		var result,
		created = $("#" + this.viewFirstItem + " .tweetCreated").html();

		result = ttagit.dbttagit.query(
			"SELECT *  FROM tweets " +
			"WHERE " +
				"ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
				"AND created > " + created + " AND type_tweet = 'Mentions' " +
			"ORDER BY created DESC "
		);
		this.viewCurrent = "Mentions";
		this.viewAction = 3;
		this.viewInterface.showMentionsTweets(result);
	},

//--------------------------------------------
//	 FAVORITES
//--------------------------------------------

	//busca tweets para mostrar el tab de Favorite Tweets
	showFavoriteTweets: function () {
		//report
		ttagit.reports.add('Session.favorites');

		var result = ttagit.dbttagit.query(
			"SELECT * FROM tweets " +
			"WHERE " +
				"ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
				"AND favorited = 1 " +
			"GROUP BY tweet_id ORDER BY created DESC " +
			"LIMIT " + this.viewQuantityItems
		);

		this.viewCurrent = "Favorite";
		this.viewAction = 1;
		if(typeof(result[0]) != "undefined"){
			this.viewFirstItem = result[0].tweet_id;
			this.viewLastItem = result[(result.length - 1)].tweet_id;
		}
		this.viewInterface.showFavoriteTweets(result);
	},

	//busca tweets para apendar al final, al hacer scroll
	appendFavoriteTweets: function () {

		var result,
		created = $("#" + this.viewLastItem + " .tweetCreated").html();

		result = ttagit.dbttagit.query(
			"SELECT * FROM tweets " +
			"WHERE " +
				"ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
				"AND created < " + created + " AND favorited = 1 " +
			"ORDER BY created DESC " +
			"LIMIT " + this.viewQuantityItems
		);
		this.viewCurrent = "Favorite";
		this.viewAction = 2;
		if(typeof(result[0]) != "undefined"){
			this.viewLastItem = result[(result.length - 1)].tweet_id;
		}
		this.viewInterface.showFavoriteTweets(result);
	},

	//busca tweets para apendar como nuevos (escondidos)
	appendNewFavoriteTweets: function () {

		var result,
		created = $("#" + this.viewFirstItem + " .tweetCreated").html();

		result = ttagit.dbttagit.query(
			"SELECT * FROM tweets " +
			"WHERE " +
				"ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
				"AND created > " + created + " AND favorited = 1 " +
			"ORDER BY created DESC "
		);
		this.viewCurrent = "Favorite";
		this.viewAction = 3;
		this.viewInterface.showFavoriteTweets(result);
	},

//--------------------------------------------
//	 DM
//--------------------------------------------

	//busca tweets para mostrar el tab de DM (lista de conversaciones)
	showDirectMessages: function ()
	{
		//report
		ttagit.reports.add('Session.messages');

		var result = ttagit.dbttagit.query(
			"SELECT * FROM " +
				"(SELECT *, sender_screen_name as conversation " +
				"FROM direct_messages " +
				"WHERE sender_screen_name != '" + ttagit.getLoggedUserName() + "' " +
				" AND ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
				"UNION " +

				"SELECT *, recipient_screen_name as conversation " +
				"FROM direct_messages " +
				"WHERE recipient_screen_name != '" + ttagit.getLoggedUserName() + "' " +
				" AND ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
				"ORDER BY created ASC ) " +

			"GROUP BY conversation " +
			"ORDER BY created DESC "
		);

		this.viewCurrent = "direct_messages";
		this.viewAction = 1;
		if(typeof(result[0]) != "undefined"){
			this.viewFirstItem = result[0].direct_message_id;
			this.viewLastItem = result[(result.length - 1)].direct_message_id;
		}
		this.viewInterface.showDirectMessages(result);
	},

	//busca tweets para apendar como nuevos (escondidos)
	appendNewDirectMessages: function () {
		var result = ttagit.dbttagit.query(
			"SELECT *  FROM direct_messages " +
			"WHERE ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
			"AND created > " + $("#" + this.viewFirstItem + " .tweetCreated").html() + " " +
			"ORDER BY created ASC "
		);

		this.viewCurrent = "direct_messages";
		this.viewAction = 3;
		if(typeof(result[0]) != "undefined"){
			this.viewFirstItem = result[0].direct_message_id;
		}
		this.viewInterface.showDirectMessages(result);
	},


	//busca tweets para mostrar el tab de DM (una conversaciones)
	showConversationDirectMessages: function (screen_name)
	{
		this.viewScreenName = screen_name;
		var result = ttagit.dbttagit.query(
			"SELECT * FROM direct_messages " +
			"WHERE (sender_screen_name = '" + screen_name + "' " +
			"OR recipient_screen_name = '" + screen_name + "') " +
			" AND ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
			"ORDER BY created DESC "
		);

		this.viewCurrent = "direct_messages_conversation";
		this.viewAction = 1;
		if(typeof(result[0]) != "undefined"){
			this.viewFirstItem = result[0].direct_message_id;
			this.viewLastItem = result[(result.length - 1)].direct_message_id;
		}

		this.viewInterface.showConversationDirectMessages(result);
	},

	//busca tweets para apendar como nuevos (escondidos)
	appendNewConversationDirectMessages: function (screen_name)
	{
		var result = ttagit.dbttagit.query(
			"SELECT * FROM direct_messages " +
			"WHERE (sender_screen_name = '" + screen_name + "' " +
			"OR recipient_screen_name = '" + screen_name + "') " +
			" AND ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
			" AND created > " + $("#" + this.viewFirstItem + " .tweetCreated").html() + " " +
			"ORDER BY created DESC "
		);

		this.viewCurrent = "direct_messages_conversation";
		this.viewAction = 3;
		if(typeof(result[0]) != "undefined"){
			this.viewFirstItem = result[0].direct_message_id;
		}
		this.viewInterface.showConversationDirectMessages(result);
	},

	//Calcula cuantos mensajes directos tiene una conversacion
	countDirectMessages: function (screen_name)
	{
		var result1 = ttagit.dbttagit.query(
			"SELECT COUNT(*) as count FROM direct_messages " +
			"WHERE sender_screen_name = '" + ttagit.getLoggedUserName() + "' AND recipient_screen_name = '" + screen_name + "' "
		),
		result2 = ttagit.dbttagit.query(
			"SELECT COUNT(*) as count FROM direct_messages " +
			"WHERE recipient_screen_name = '" + ttagit.getLoggedUserName() + "' AND sender_screen_name = '" + screen_name + "' "
		);

		return result1[0].count + result2[0].count;
	},

	directMessagesSearchUser: function (search){
	    var result = ttagit.dbttagit.query(
            "SELECT owner_id, owner_screen_name FROM tweets " +
            "WHERE owner_screen_name LIKE '%" + search + "%' " +
            " AND owner_screen_name != '" + ttagit.getLoggedUserName() + "' " +
            " AND ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
            " GROUP BY owner_screen_name ORDER BY owner_screen_name ASC LIMIT 5 "
        );

        this.viewInterface.showDirectMessagesSearchUser(result);
	},


//--------------------------------------------
//	 TREND TOPICS
//--------------------------------------------
	showTrendTopics: function () {
		//report
		//ttagit.reports.add('Session.trends');

		var result = ttagit.dbttagit.query(
			"SELECT * FROM trendtopics " +
			"WHERE ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
			"ORDER BY id ASC "
		);

		this.viewCurrent = "TrendTopics";
		this.viewAction = 1;

		if(typeof(result[0]) != "undefined"){
			this.viewFirstItem = result[0].id;
		}

		this.viewInterface.showTrendTopics(result);
	},

	//busca tweets de una busqueda temporal hecha para mostrar el tab de searches
	showTrendTopicsTweets: function (query)
	{
		var result = ttagit.dbttagit.query(
			"SELECT * FROM temp_tweets " +
			"WHERE ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
			"AND type_tweet = 'TweetTrendTopic' " +
			"ORDER BY created DESC " +
			" LIMIT " + this.viewQuantityItems
		);

		this.viewCurrent = "TweetsTrendTopics";

		if(typeof(query) != "undefined"){
			this.viewTweetsOfTrendTopicCurrent = query;
		}

		this.viewAction = 1;
		if(typeof(result[0]) != "undefined"){
			this.viewFirstItem = result[0].tweet_id;
			this.viewLastItem = result[(result.length - 1)].tweet_id;
		}

		this.viewInterface.showTrendTopicsTweets(result);
	},

	//busca tweets para apendar como nuevos (escondidos)
	appendNewTrendTopicTweets: function ()
	{
		created = $("#" + this.viewFirstItem + " .tweetCreated").html();

		var result = ttagit.dbttagit.query(
			"SELECT *  FROM temp_tweets " +
			"WHERE ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
			"AND created > " + created + " " +
			" GROUP BY tweet_id ORDER BY created DESC " +
			" LIMIT " + this.viewQuantityItems
		);

        this.viewCurrent = "TweetsTrendTopics";
        this.viewAction = 2;
		if(typeof(result[0]) != "undefined"){
			this.viewFirstItem = result[0].tweet_id;
			this.viewLastItem = result[(result.length - 1)].tweet_id;
		}

		this.viewInterface.showTrendTopicsTweets(result);
	},

	appendOldTweetsTrendTopics: function ()
	{
		var result,
		created = $("#" + this.viewLastItem + " .tweetCreated").html();

		result = ttagit.dbttagit.query(
			"SELECT *  FROM temp_tweets " +
			"WHERE ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
			"AND created < " + created + " " +
			" GROUP BY tweet_id ORDER BY created DESC " +
			" LIMIT " + this.viewQuantityItems
		);

		this.viewCurrent = "TweetsTrendTopics";
		this.viewAction = 3;
		if(typeof(result[0]) != "undefined"){
			this.viewLastItem = result[(result.length - 1)].tweet_id;
		}

		this.viewInterface.refreshDataTime();
		this.viewInterface.showTrendTopicsTweets(result);
	},

//--------------------------------------------
//	 LISTS
//--------------------------------------------

	//busca las listas para mostrar el tab de listas
	showAllList: function () {
		//report
		ttagit.reports.add('Session.lists');

		var result = ttagit.dbttagit.query(
			"SELECT * FROM lists " +
			"WHERE ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
			"ORDER BY id ASC "
		);
		this.viewCurrent = "List";
		this.viewAction = 1;

		if(typeof(result[0]) != "undefined"){
			this.viewFirstItem = result[0].id;
		}

		this.viewInterface.showAllList(result);
	},

	//busca las para apendar al final, al hacer scroll (lists)
	appendAllList: function () {
		var result = ttagit.dbttagit.query(
			"SELECT * FROM lists " +
			"WHERE ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
			"AND id > " + this.viewLastItem + " " +
			"ORDER BY id ASC "
		);

		this.viewCurrent = "List";
		this.viewAction = 2;
		if(typeof(result[0]) != "undefined"){
			this.viewLastItem = result[(result.length - 1)].id;
		}
		this.viewInterface.showAllList(result);
	},

	//busca tweets de una lista particular listas para mostrar el tab de listas
	showTweetsOfLists: function (idList)
	{
		if( this.viewCurrent != 'List' && this.viewCurrent != 'list_tweets' ){
			return false;
		}
		var result = ttagit.dbttagit.query(
			"SELECT T.* FROM tweet_lists L, tweets T " +
			"WHERE L.ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
			"AND L.list_id = '" + idList + "' " +
			"AND T.type_tweet = 'TweetList' " +
			"AND T.ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
			"AND L.tweet_id = T.tweet_id " +
			"ORDER BY T.created DESC " +
			"LIMIT " + this.viewQuantityItems
		);

		this.viewCurrent = "list_tweets";
		this.viewAction = 1;

		if(typeof(result[0]) != "undefined"){
			this.viewFirstItem = result[0].tweet_id;
			this.viewLastItem = result[(result.length - 1)].tweet_id;
		}

		this.viewInterface.showTweetsOfLists(idList, result);
	},

	//busca las para apendar al final, al hacer scroll (tweets)
	appendTweetsOfLists: function (idList)
	{
		var result,
		created = $("#" + this.viewLastItem + " .tweetCreated").html();

		result = ttagit.dbttagit.query(
			" SELECT T.* FROM tweet_lists L, tweets T " +
			" WHERE L.ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
				"AND L.list_id = '" + idList + "' " +
				"AND T.type_tweet = 'TweetList' " +
				"AND T.ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
				"AND L.tweet_id = T.tweet_id " +
				"AND T.created < " + created +
			" ORDER BY T.created DESC " +
			" LIMIT " + this.viewQuantityItems
		);

		this.viewCurrent = "list_tweets";
		this.viewAction = 2;
		if(typeof(result[0]) != "undefined"){
			this.viewLastItem = result[(result.length - 1)].tweet_id;
		}

		this.viewInterface.showTweetsOfLists(idList, result);
	},

	//busca las nuevos para apendar al inicio (tweets)
    appendNewTweetsOfLists: function (idList)
    {
        var result,
		created = $("#" + this.viewFirstItem + " .tweetCreated").html();

        result = ttagit.dbttagit.query(
            " SELECT T.* FROM tweet_lists L, tweets T " +
            " WHERE L.ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
                "AND L.list_id = '" + idList + "' " +
                "AND T.type_tweet = 'TweetList' " +
                "AND T.ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
                "AND L.tweet_id = T.tweet_id " +
                "AND T.created > " + created +
            " ORDER BY T.created DESC "
        );

        this.viewCurrent = "list_tweets";
        this.viewAction = 4;
        if(typeof(result[0]) != "undefined"){
            this.viewFirstItem = result[0].tweet_id;
        }

        this.viewInterface.refreshDataTime();
        this.viewInterface.showTweetsOfLists(idList, result);
    },

//--------------------------------------------
//	 SEARCHES
//--------------------------------------------

	//busca las busquedas guardadas para mostrar el tab de searches
	showSearches: function ()
	{
		//report
		ttagit.reports.add('Session.searches');

		var result = ttagit.dbttagit.query(
			"SELECT * FROM searches " +
			"WHERE ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
			"ORDER BY query ASC "
		);
		this.viewCurrent = "searches";
		this.viewAction = 1;

		this.viewInterface.showSearches(result);
	},

	//busca tweets de una busqueda temporal hecha para mostrar el tab de searches
	showTempSearchTweets: function ()
	{
		var result = ttagit.dbttagit.query(
			"SELECT * FROM temp_tweets " +
			"WHERE ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
			"AND type_tweet = 'TweetSearch' " +
			"ORDER BY created DESC "
		);

		this.viewInterface.showTempTweetsOfSearches(result);
	},

	//busca tweets de una busqueda guardada para mostrar el tab de searches
	showTweetsOfSearches: function (searchID)
	{
		if( this.viewCurrent != 'searches' && this.viewCurrent != 'search_tweets'){
			return false;
		}

		var q, result;

		q = "SELECT T.* FROM tweets_search S, tweets T " +
			"WHERE S.search_id = '" + searchID + "' " +
			"AND T.type_tweet = 'TweetSearch' " +
			"AND T.ttagit_user_screen_name = '" + ttagit.getLoggedUserName() + "' " +
			"AND T.tweet_id = S.tweet_id " +
			"GROUP BY T.tweet_id ORDER BY T.created DESC " +
			" LIMIT " + this.viewQuantityItems;

		result = ttagit.dbttagit.query( q );

		this.viewCurrent = "search_tweets";
		this.viewAction = 1;
		if(typeof(result[0]) != "undefined"){
			this.viewFirstItem = result[0].tweet_id;
			this.viewLastItem = result[(result.length - 1)].tweet_id;
		}

		this.viewInterface.showTweetsOfSearches(searchID, result);
	},

	//busca las para apendar al final, al hacer scroll (tweets)
	appendTweetsOfSearches: function (searchID)
	{
		var result,
		created = $("#" + this.viewLastItem + " .tweetCreated").html();

		result = ttagit.dbttagit.query(
			"SELECT T.* FROM tweets_search S, tweets T " +
			"WHERE S.search_id = '" + searchID + "' " +
			" AND T.type_tweet = 'TweetSearch' " +
			" AND T.tweet_id = S.tweet_id " +
			" AND T.created < " + created +
			" GROUP BY T.tweet_id ORDER BY T.created DESC " +
			" LIMIT " + this.viewQuantityItems
		);

		this.viewCurrent = "search_tweets";
		this.viewAction = 2;
		if(typeof(result[0]) != "undefined"){
			this.viewLastItem = result[(result.length - 1)].tweet_id;
		}

		this.viewInterface.showTweetsOfSearches(searchID, result);
	},

	//busca las nuevos para apendar al inicio (tweets)
    appendNewTweetsOfSearches: function (searchID)
    {
        var result,
		created = $("#" + this.viewFirstItem + " .tweetCreated").html();

        result = ttagit.dbttagit.query(
            "SELECT T.* FROM tweets_search S, tweets T " +
            "WHERE S.search_id = '" + searchID + "' " +
            " AND T.type_tweet = 'TweetSearch' " +
            " AND T.tweet_id = S.tweet_id " +
            " AND T.created > " + created +
            " GROUP BY T.tweet_id ORDER BY T.created DESC "
        );

        this.viewCurrent = "search_tweets";
        this.viewAction = 4;
        if(typeof(result[0]) != "undefined"){
            this.viewFirstItem = result[0].tweet_id;
        }

        this.viewInterface.refreshDataTime();
        this.viewInterface.showTweetsOfSearches(searchID, result);
    },

	//agrega el boton de la busqueda recien guardada
	addNewSearch: function (search_id, query)
	{
		var obj,
		search = new Array();

		this.viewTweetsOfSearchCurrent = search_id;

		obj = new function(){
			this.query = query;
			this.search_id = search_id;
		};

		search[0] = obj;
		this.viewInterface.addNewSearch(search);
	},

//--------------------------------------------
//	 MISC
//--------------------------------------------

	//llama a refrescar una vista en particular
	refresh: function (sheduler, newItem){

		switch(sheduler){

			case 'TimeLine':
				if(this.viewCurrent == 'TimeLine'){
					this.appendNewTimeLineTweets();
					this.viewInterface.refreshDataTime();
				}
				else if ( newItem > 0) {
					this.viewInterface.setMenuNewItem( $("#navTimeLine") );
				}
			break;

			case 'Mentions':
				if(this.viewCurrent == 'Mentions'){
					this.appendNewMentionsTweets();
					this.viewInterface.refreshDataTime();
				}
				else if ( newItem > 0){
					this.viewInterface.setMenuNewItem( $("#navMention") );
				}
			break;

			case 'Favorite':
				if(this.viewCurrent == 'Favorite'){
					this.appendNewFavoriteTweets();
					this.viewInterface.refreshDataTime();
				}
			break;

			case 'DM':
				if(this.viewCurrent == 'direct_messages'){
					this.appendNewDirectMessages();
					this.viewInterface.refreshDataTime();
				}
				else if(this.viewCurrent == 'direct_messages_conversation'){
					this.appendNewConversationDirectMessages(this.viewScreenName);
					this.viewInterface.refreshDataTime();
				}
				else if(this.viewCurrent == 'direct_messages_sent'){
					this.appendNewDirectMessagesSent();
					this.viewInterface.refreshDataTime();
				}
				else if( newItem > 0){
					this.viewInterface.setMenuNewItem( $("#navDM") );
				}
			break;

			case 'ListTweets':
			    this.viewInterface.refreshDataTime();
			break;

			case 'TweetsTrendTopics':
				if(this.viewCurrent == 'TweetsTrendTopics'){
					this.viewInterface.refreshDataTime();
					this.appendNewTrendTopicTweets();
				}
			break;
		}
	},

	//abre el tab elegido
	openTab: function (obj)
	{
		switch(obj.attr('id'))
		{
			case "navTimeLine":
				ttagit.viewController.showTimeLineTweets();
			break;

			case "navMention":
				ttagit.viewController.showMentionsTweets();
			break;

			case "navDM":
				ttagit.viewController.showDirectMessages();
			break;

			case "navFavorites":
				ttagit.viewController.showFavoriteTweets();
			break;

			case "navList":
				ttagit.viewController.showAllList();
			break;

			case "navSearch":
				ttagit.viewController.showSearches();
			break;

			case "navTrends":
				ttagit.viewController.showTrendTopics();
			break;
		}
		// Borrar los sheduler para no pasar el limite de pedidos a twitter
		ttagit.taskScheduler.remove({"f1":"ttagit.loadTweetsOfList","p1":[ttagit.viewController.viewTweetsOfListCurrent]});
		ttagit.taskScheduler.remove({"f1":"ttagit.loadTweetsOfSavedSearch","p1":[ttagit.viewController.viewTweetsOfSearchCurrent]});
	},

	//apenda los tweets (escondidos) a la vista correspondiente
	appendNewItem: function (divUpdate){
		$(divUpdate).prepend( $(this.viewInterface.boxNewItems).html() );
		this.viewFirstItem = this.viewFirstItemTemp;
		$(this.viewInterface.boxNewItems).html("");
		this.viewInterface.notificationArea('hide');
		this.viewInterface.ResetTtagitButton();
		this.viewInterface.refreshDataTime();
	},


	addMuteUser: function(user_screen_name, user_id){
		if (!this.isMuted(user_id)) {
			this.mutedUsers = this.mutedUsers.concat([user_id]);
		}
	},

	isMuted: function (user_id) {
		return $.inArray(user_id ,this.mutedUsers) > -1;
	},

	removeMutedUser: function (user_id) {
		var 	index = $.inArray(user_id ,this.mutedUsers);

		if (index < 0) { return true; }

		this.mutedUsers.splice(index, 1);
	},

	listMutedUsers: function () {
		return "'"+ this.mutedUsers.join("','") + "'";
	},

	cleanMutedUsers: function () {
		this.mutedUsers = [];
	},
}
