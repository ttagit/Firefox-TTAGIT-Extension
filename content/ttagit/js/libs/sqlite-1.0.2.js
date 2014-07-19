/*
 * sqlite 1.0.0
 *
 * Copyright (c) 2009 Arash Karimzadeh (arashkarimzadeh.com)
 * Licensed under the MIT (MIT-LICENSE.txt)
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: June 27 2009

 * Adaptation for Ttagit: Nadia Tortarolo (ntortarolo@hotmail.com) developer of Infinimedia. Inc (http://www.infinimedia.com)
 * Date: Oct 2009
 */


var dbSQLite = function(db,options){
	var defaults = {
		location: "AChrom"
	}

	for(var i in options)
		defaults[i] = options[i];
	var file = Components
					.classes["@mozilla.org/file/directory_service;1"]
					.getService(Components.interfaces.nsIProperties)
					.get(defaults.location, Components.interfaces.nsIFile);
	file.append(db);
	var storageService = Components
							.classes["@mozilla.org/storage/service;1"]
							.getService(Components.interfaces.mozIStorageService);
	this.conObject = storageService.openDatabase(file);

	return this;

}

dbSQLite.prototype = {

    createDB: function createDB(){
			this.createTableUsers();
			this.createTablePreferences();
			this.createTableTrendTopics();
			this.createTableLists();
			this.createTableTweet_Lists();
			this.createTableSearches();
			this.createTableTweets_search();
			this.createTableDirect_messages();
			this.createTableTweets();
			this.createTableTemp_tweets();
			this.createTableCookies();
			this.createTableErrorlog();
			this.createTableTtagit();
		},


		/* table users
		* id
		* name
		* twitter_id
		* access_token
		* secret_token
		* user_preferences
		*/
    createTableUsers: function createTableUsers(){
			try{
				this.execute("DROP TABLE main.users");
				this.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, name TEXT NOT NULL, profile_image TEXT NOT NULL, twitter_id TEXT NOT NULL, access_token TEXT, secret_token TEXT, user_preferences INTEGER , password TEXT, woeid TEXT, FOREIGN KEY(user_preferences) REFERENCES preferences(id))");
			}
			catch (e) {
				this.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, name TEXT NOT NULL, profile_image TEXT NOT NULL, twitter_id TEXT NOT NULL, access_token TEXT, secret_token TEXT, user_preferences INTEGER , password TEXT, woeid TEXT, FOREIGN KEY(user_preferences) REFERENCES preferences(id))");
			}
		},

		/* table preferences
		* id
		* keep_session
		* tab
		* reload_rate
		* refresh_one_by_one
		* sidebar_position
		*/
    createTablePreferences: function createTablePreferences(){
			try{
				this.execute("DROP TABLE main.preferences");
				this.execute("CREATE TABLE IF NOT EXISTS preferences (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, keep_session Bool, tab TEXT, reload_rate INTEGER, refreshOneByOne BOOL, sidebar_position TEXT, image_uploader TEXT)");
			}
			catch (e) {
				this.execute("CREATE TABLE IF NOT EXISTS preferences (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, keep_session Bool, tab TEXT, reload_rate INTEGER, refreshOneByOne BOOL, sidebar_position TEXT, image_uploader TEXT)");
			}
		},

		/*
		 * id
		 * ttagit_user_screen_name
		 * name
		 * promoted_content
		 * query
		 * url
		 * events
		*/
    createTableTrendTopics: function createTableTrendTopics(){
		try{
			this.execute("DROP TABLE main.trendtopics");
			this.execute("CREATE TABLE IF NOT EXISTS trendtopics (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, name TEXT NOT NULL, promoted_content TEXT NULL, query TEXT NOT NULL, url TEXT NOT NULL, events TEXT)");
		}
		catch (e) {
			this.execute("CREATE TABLE IF NOT EXISTS trendtopics (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, name TEXT NOT NULL, promoted_content TEXT NULL, query TEXT NOT NULL, url TEXT NOT NULL, events TEXT)");
		}
	},

		/* table lists
		* id
		* ttagit_user_screen_name
		* list_id
		* name
		* owner_screen_name
		* owner_id
		*/
    createTableLists: function createTableLists(){
		try{
				this.execute("DROP TABLE main.lists");
				this.execute("CREATE TABLE IF NOT EXISTS lists (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, list_id TEXT NOT NULL, name TEXT NOT NULL, owner_screen_name TEXT NOT NULL, owner_id TEXT NOT NULL)");
		}
		catch (e) {
				this.execute("CREATE TABLE IF NOT EXISTS lists (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, list_id TEXT NOT NULL, name TEXT NOT NULL, owner_screen_name TEXT NOT NULL, owner_id TEXT NOT NULL)");
		}
	},

	/* table tweet_lists
	* id
	* ttagit_user_screen_name
	* list_id
	* tweet_id
	*/
	createTableTweet_Lists: function createTableTweet_Lists(){
		try{
				this.execute("DROP TABLE main.tweet_lists");
				this.execute("CREATE TABLE IF NOT EXISTS tweet_lists (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, list_id TEXT NOT NULL,  tweet_id TEXT NOT NULL)");
		}
		catch (e) {
				this.execute("CREATE TABLE IF NOT EXISTS tweet_lists (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, list_id TEXT NOT NULL,  tweet_id TEXT NOT NULL)");
		}
	},

	/* table searches
	* id
	* ttagit_user_screen_name
	* search_id
	* name
	* query
	*/
	createTableSearches: function createTableSearches(){
		try{
				this.execute("DROP TABLE main.searches");
				this.execute("CREATE TABLE IF NOT EXISTS searches (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, search_id TEXT NOT NULL, name TEXT NOT NULL, query TEXT NOT NULL)");
		}
		catch (e) {
				this.execute("CREATE TABLE IF NOT EXISTS searches (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, search_id TEXT NOT NULL, name TEXT NOT NULL, query TEXT NOT NULL)");
		}
	},

	/* table tweets_search
	* id
	* ttagit_user_screen_name
	* search_id
	* tweet_id
	*/
	createTableTweets_search: function createTableTweets_search(){
		try{
				this.execute("DROP TABLE main.tweets_search");
				this.execute("CREATE TABLE IF NOT EXISTS tweets_search (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, search_id TEXT NOT NULL,  tweet_id TEXT NOT NULL)");
		}
		catch (e) {
				this.execute("CREATE TABLE IF NOT EXISTS tweets_search (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, search_id TEXT NOT NULL,  tweet_id TEXT NOT NULL)");
		}
	},

	/* table direct_messages
	* id
	* ttagit_user_screen_name
	* direct_message_id
	* created
	* text
	* sender_id
	* sender_screen_name
	* sender_image
	* sender_url
	* recipient_id
	* recipient_screen_name
	* recipient_image
	* recipient_url
	*/
	createTableDirect_messages: function createTableDirect_messages(){
		try{
				this.execute("DROP TABLE main.direct_messages");
				this.execute("CREATE TABLE IF NOT EXISTS direct_messages (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, direct_message_id TEXT NOT NULL, created DATETIME NOT NULL, text TEXT NOT NULL, sender_id TEXT NOT NULL, sender_screen_name TEXT NOT NULL, sender_image TEXT NOT NULL , sender_url TEXT, recipient_id TEXT NOT NULL, recipient_screen_name TEXT NOT NULL, recipient_image TEXT NOT NULL , recipient_url TEXT)");
		}
		catch (e) {
				this.execute("CREATE TABLE IF NOT EXISTS direct_messages (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, direct_message_id TEXT NOT NULL, created DATETIME NOT NULL, text TEXT NOT NULL, sender_id TEXT NOT NULL, sender_screen_name TEXT NOT NULL, sender_image TEXT NOT NULL , sender_url TEXT, recipient_id TEXT NOT NULL, recipient_screen_name TEXT NOT NULL, recipient_image TEXT NOT NULL , recipient_url TEXT)");
		}
	},

	/* table tweets
	* id
	* ttagit_user_screen_name
	* tweet_id
	* created
	* text
	* source
	* favorited
	* owner_id
	* owner_screen_name
	* image
	* url
	* in_reply_to_status_id
	* in_reply_to_screen_name
	* type_tweet
	* user_ttagit_account_id
	*/
	createTableTweets: function createTableTweets(){
		try{
				this.execute("DROP TABLE main.tweets");
				this.execute("CREATE TABLE IF NOT EXISTS tweets (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, tweet_id TEXT NOT NULL, created DATETIME NOT NULL, text TEXT NOT NULL, source TEXT, favorited INTEGER, owner_id TEXT NOT NULL, owner_screen_name TEXT NOT NULL, retweeted_by TEXT, retweet_id TEXT, image TEXT NOT NULL , url TEXT, in_reply_to_status_id TEXT, in_reply_to_screen_name TEXT, tweet_image TEXT, type_tweet TEXT NOT NULL)");
		}
		catch (e) {
				this.execute("CREATE TABLE IF NOT EXISTS tweets (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, tweet_id TEXT NOT NULL, created DATETIME NOT NULL, text TEXT NOT NULL, source TEXT, favorited INTEGER, owner_id TEXT NOT NULL, owner_screen_name TEXT NOT NULL, retweeted_by TEXT, retweet_id TEXT, image TEXT NOT NULL , url TEXT, in_reply_to_status_id TEXT, in_reply_to_screen_name TEXT, tweet_image TEXT, type_tweet TEXT NOT NULL)");
		}
	},
	/* table temp_tweets
	* id
	* ttagit_user_screen_name
	* tweet_id
	* created
	* text
	* source
	* favorited
	* owner_id
	* owner_screen_name
	* image
	* url
	* in_reply_to_status_id
	* in_reply_to_screen_name
	* type_tweet
	* user_ttagit_account_id
	*/
	createTableTemp_tweets: function createTableTemp_tweets(){
		try{
				this.execute("DROP TABLE main.temp_tweets");
				this.execute("CREATE TABLE IF NOT EXISTS temp_tweets (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, tweet_id TEXT NOT NULL, created DATETIME NOT NULL, text TEXT NOT NULL, source TEXT, favorited INTEGER, owner_id TEXT NOT NULL, owner_screen_name TEXT NOT NULL, retweeted_by TEXT, retweet_id TEXT, image TEXT NOT NULL , url TEXT, in_reply_to_status_id TEXT, in_reply_to_screen_name TEXT, tweet_image TEXT, type_tweet TEXT NOT NULL)");
		}
		catch (e) {
				this.execute("CREATE TABLE IF NOT EXISTS temp_tweets (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, tweet_id TEXT NOT NULL, created DATETIME NOT NULL, text TEXT NOT NULL, source TEXT, favorited INTEGER, owner_id TEXT NOT NULL, owner_screen_name TEXT NOT NULL, retweeted_by TEXT, retweet_id TEXT, image TEXT NOT NULL , url TEXT, in_reply_to_status_id TEXT, in_reply_to_screen_name TEXT, tweet_image TEXT, type_tweet TEXT NOT NULL)");
		}
	},

	/* table cookies
	* id
	* ttagit_user_screen_name
	* name
	* value
	*/
	createTableCookies: function createTableCookies(){
		try{
				this.execute("DROP TABLE main.cookies");
				this.execute("CREATE TABLE IF NOT EXISTS cookies (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, name TEXT NOT NULL, value TEXT NOT NULL)");
		}
		catch (e) {
				this.execute("CREATE TABLE IF NOT EXISTS cookies (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, ttagit_user_screen_name TEXT NOT NULL, name TEXT NOT NULL, value TEXT NOT NULL)");
		}
	},

	/* table errorlog
	* id
	* error_code
	* text
	*/
	createTableErrorlog: function createTableErrorlog(){
		try{
				this.execute("DROP TABLE main.errorlog");
				this.execute("CREATE TABLE IF NOT EXISTS errorlog (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, twitter_id TEXT NOT NULL, username TEXT NOT NULL, created DATETIME NOT NULL, error_code TEXT NOT NULL, text TEXT NOT NULL)");
		}
		catch (e) {
				this.execute("CREATE TABLE IF NOT EXISTS errorlog (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, twitter_id TEXT NOT NULL, username TEXT NOT NULL, created DATETIME NOT NULL, error_code TEXT NOT NULL, text TEXT NOT NULL)");
		}
	},

	/* table ttagit
	* id
	* version
	*/
	createTableTtagit: function createTableTtagit(){
		try{
				this.execute("DROP TABLE main.ttagit");
				this.execute("CREATE TABLE IF NOT EXISTS ttagit (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, version TEXT NOT NULL, last_sidebar_position TEXT)");
		}
		catch (e) {
				this.execute("CREATE TABLE IF NOT EXISTS ttagit (id INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL, version TEXT NOT NULL, last_sidebar_position TEXT)");
		}
    },

	execute1: function execute(cmd){

       // this.conObject.beginTransaction();

		try { var statement = this.conObject.createStatement(cmd); }
		catch (e){
			console.trace();
			console.log(e);
			console.log(cmd);
		}

		var cols = statement.columnCount,
			rows = [],
			rowsr = [],
			colNames = [],
			colTypes = [];
		if (cols>0) {
           statement.executeAsync({
                empty: true,
                handleResult: function(aResultSet) {
                 this.empty=false;
                 var row = aResultSet.getNextRow();
                 var rowAux = {};
                 while (row)
                 {
                     //alert(row.getResultByName("id_msg"));
                      // CODE FOR HANDLING THE RESULTS

                     for(col=0;col<cols;col++){
    					if(colNames[col]==undefined){
    						colNames[col]=statement.getColumnName(col);
    					}
                        rowAux[colNames[col]] = row.getResultByName(colNames[col]);
                     }
                     rows.push(rowAux);
                     row = aResultSet.getNextRow();
                     //alert(colNames);
                  }


                },
                handleError: function(aError) {
                  // CODE FOR HANDLING THE ERRORS
                },
                handleCompletion: function(aReason) {
                  if (this.empty) {alert("empty");}

                  /*if(rows.length>0)
        		  {  alert(rows[0].id);
                          alert(rows.length); return rows;}  */
                  // CODE FOR WHEN STATEMENT EXECUTION IS FINISHED
                }
              });
		}else{
			statement.executeAsync();
		}

        //statement.reset();

        if(rows.length>0)
        		  {  /*alert(rows[0].id);
                          alert(rows.length); */return rows;}
		return this.conObject.lastInsertRowID;
	},

	execute: function execute(cmd){

       // this.conObject.beginTransaction();
		//var statement = this.conObject.createStatement(cmd);

		try { var statement = this.conObject.createStatement(cmd); }
		catch (e){
			console.trace();
			console.log(e);
			console.log(cmd);
		}
		var cols = statement.columnCount,
			rows = [],
			colNames = [],
			colTypes = [];
		if (cols>0) {
			while(statement.executeStep()){
				var row = {};
				for(col=0;col<cols;col++){
					if(colNames[col]==undefined){
						colNames[col]=statement.getColumnName(col);
						colTypes[col]=statement.getTypeOfIndex(col);
					}
					switch (colTypes[col]){
						case 0:
							value = null; break;
						case 1:
							value = statement.getInt64(col); break;
						case 2:
							value = statement.getDouble(col); break;
						case 3:
							value = statement.getUTF8String(col); break;
						case 4:
							value = statement.getBlob(col); break;
					}
					row[colNames[col]] = value;
				}
				rows.push(row);
			}
		}else{
		   	statement.execute();
			//statement.execute();
		}

        statement.reset();
        //this.conObject.commitTransaction();

		if(rows.length>0)
			return rows;
		return this.conObject.lastInsertRowID;
	},

	createMethod: function createMethod(command){
		var query = command;
		return function(params){
					var cmd = query;
					for(var i in params)
						cmd = cmd.replace('{'+i+'}',params[i]);
					return this.execute(cmd);
				}
	},
	extend: function extend(commands){
		for(var i in commands)
			commands[i] = this.createMethod(commands[i]);
		for(var i in commands)
			this[i] = commands[i];
	},

    parse:function parse(str){
      str=str.replace(/\'/g,"--m--");
      str=str.replace(/\"/g,"--n---");
      return str;
    },

	unparse: function unparse (str){
       str=str.replace(/\--m--/g,'\'');
       str=str.replace(/\--n---/g,'"');
       return str;
    },
}
