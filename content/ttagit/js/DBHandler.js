/**
 * Este modulo mantiene las operaciones necesarias para el manejo de la base de datos.
 **/

var TtagitDBHandler = function(){
	this.twitDB = new dbSQLite("ttagitDB.sqlite",{location:'ProfD'});
	this.twitDB.execute('PRAGMA synchronous=OFF');
	this.twitDB.execute("PRAGMA default_cache_size ='10000'");
	this.position = 0;
	this.updateInfo = {
		"minVersion":"3.0",
		"availables":["3.0","3.0.1","3.0.2","3.0.3","3.0.4","3.1","3.1.1","3.1.2","3.1.3","3.1.5", "3.2", "3.2.1", "3.3", "3.3.1","3.3.2","3.3.3","3.3.4","3.3.4.1","3.3.5", "3.3.5.3", "3.3.6.1"],
		"from":{
			"3.0":{
				"to":"3.0.1",
				"to_do":[
					{"f1":"ttagit.dbttagit.truncateTable_temp_tweets","p1":null}
				]
			},
			"3.0.1":{
				"to":"3.0.2",
				"to_do":[
					{"f1":"ttagit.dbttagit.updateTable_preferences","p1":null}
				]
			},
			"3.3.4.1":{
				"to":"3.3.5",
				"to_do":[
					{"f1":"ttagit.dbttagit.add_trendtopics_tables_and_fields","p1":null}
				]
			},
			"3.3.5.3":{
				"to":"3.3.6.1",
				"to_do":[
					{"f1":"ttagit.dbttagit.add_tweetimage","p1":null}
				]
			}
		}
	};
}

TtagitDBHandler.prototype = {
	/**
	 * Realiza una consulta a la base de datos
	 **/
	query: function (query){
		return this.twitDB.execute(query);
	},

	/**
	 * Crea la base de datos de ttagit
	 **/
	create_database: function (){
		this.twitDB.createDB();
	},

	/**
	 * trunca la tabla users
	 **/
	truncateTable_users: function (){
		this.twitDB.twitDBcreateTableUsers();
	},

	/**
	 * trunca la tabla preferences
	 **/
	truncateTable_preferences: function (){
		this.twitDB.createTablePreferences();
	},


	updateTable_preferences: function (){
		var i,
		res = ttagit.dbttagit.query("SELECT *  FROM preferences WHERE 1");

		if(typeof(res[0])=="undefined"){ return false; }

		this.truncateTable_preferences();
		for(i=0; i < res.length; i++){
			ttagit.dbttagit.query("insert into preferences (keep_session, tab, reload_rate, refreshOneByOne, sidebar_position, image_uploader) values ('"+res[i].keep_session+"','"+res[i].tab+"','"+res[i].reload_rate+"','"+res[i].refreshOneByOne+"','"+res[i].sidebar_position+"','pikchur')");
		}
	},


	add_trendtopics_tables_and_fields: function (){
		ttagit.dbttagit.query("ALTER TABLE \"users\" ADD COLUMN \"woeid\" TEXT");
		this.twitDB.createTableTrendTopics();
	},

	add_tweetimage: function (){
		ttagit.dbttagit.query("ALTER TABLE tweets ADD COLUMN tweet_image TEXT DEFAULT ''; ");
		ttagit.dbttagit.query("ALTER TABLE temp_tweets ADD COLUMN tweet_image TEXT DEFAULT '';");
	},

	/**
	 * trunca la tabla temp_tweets
	 **/
	truncateTable_temp_tweets: function (){
		this.twitDB.createTableTemp_tweets();
	},

	/**
	 * trunca la tabla createTableTrendTopics
	 **/
	truncateTable_trendtopics: function (){
		this.twitDB.createTableTrendTopics();
	},


	/**
	 * trunca la tabla lists
	 **/
	truncateTable_lists: function (){
		this.twitDB.createTableLists();
	},

	/**
	 * trunca la tabla tweet_lists
	 **/
	truncateTable_tweet_Lists: function (){
		this.twitDB.createTableTweet_Lists();
	},

	/**
	 * trunca la tabla searches
	 **/
	truncateTable_searches: function (){
		this.twitDB.createTableSearches();
	},

	/**
	 * trunca la tabla tweets_search
	 **/
	truncateTable_tweets_search: function (){
		this.twitDB.createTableTweets_search();
	},

	/**
	 * trunca la tabla direct_messages
	 **/
	truncateTable_direct_messages: function (){
		this.twitDB.createTableDirect_messages();
	},

	/**
	 * trunca la tabla tweets
	 **/
	truncateTable_tweets: function (){
		this.twitDB.createTableTweets();
	},

	/**
	 * trunca la tabla cookies
	 **/
	truncateTable_cookies: function (){
		this.twitDB.createTableCookies();
	},

	/**
	 * trunca la tabla error_log
	 **/
	truncateTable_error_log: function (){
		this.twitDB.createTableErrorlog();
	},

	/**
	 * trunca la tabla ttagit
	 **/
	truncateTable_ttagit: function(){
		this.twitDB.createTableTtagit();
	},

	/**
	 * borra los tweets de time line dejando los ultimos 1000
	 **/
	goSane: function (){
		var result;

		result = ttagit.dbttagit.query(
			"SELECT  id FROM tweets " +
			"WHERE  type_tweet = 'TimeLine' " +
			"ORDER BY id DESC "
		);

		//nothing to delete
		if(typeof(result[0]) == "undefined"){
			return true;
		}

		//delete
		ttagit.dbttagit.query("DELETE  FROM tweets WHERE type_tweet='TimeLine' AND id <= " + (result[0].id - 1000));
	},


	/**
	 * Actualiza la base de datos, segun las indicaciones de this.updateInfo.
	 **/
	updateDatabase: function (currentVersion,newVersion){
		var aux_currentVersion,functionsToDo;

		num_currentVersion = parseFloat(currentVersion),
		num_newVersion = parseFloat(newVersion);

		ttagit.dbttagit.query("UPDATE ttagit SET version ='"+newVersion+"'");

		//El usuario vuelve a una version anterior.
		if(num_currentVersion > num_newVersion){ttagit.create_database(newVersion);  return true; }

		//El usuario tiene una version anterior a la minima version disponible
		if(num_currentVersion < parseFloat(this.updateInfo.minVersion)){ttagit.create_database(newVersion);  return true; }

		aux_currentVersion = currentVersion;

		while(aux_currentVersion < newVersion){
			//intenta obtener informacion que indique como actuar para actualizar a la nueva version.
			try{

				functionsToDo = ttagit.dbttagit.updateInfo.from[aux_currentVersion].to_do;

				for(var i=0;i<functionsToDo.length;i++){
					ttagit.callback.execute(functionsToDo[i]);
				}
				aux_currentVersion = this.updateInfo.from[aux_currentVersion].to;//asigno la nueva version actual.

			}catch(e){
				for(var v=this.position;v<this.updateInfo.availables.length;v++){
					if(this.updateInfo.availables[v] == aux_currentVersion){
						break
					}
				}

				if((typeof(this.updateInfo.availables[v+1]) != "undefined") && (this.updateInfo.availables[v+1] != newVersion)){
					this.position = v+1;
					ttagit.dbttagit.updateDatabase(this.updateInfo.availables[v+1], newVersion);
				}else{
					return false;
				}

			}


 		}
	},
}
