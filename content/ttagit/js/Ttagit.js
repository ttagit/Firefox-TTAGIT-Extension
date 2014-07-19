var Ttagit= function(){
	this.dbttagit = new TtagitDBHandler();
	this.xhr = new TtagitCommunication();
	this.twitter = new TtagitTwitter();
	this.callback = new TtagitCallBack();
	this.encript = new TtagitEncript();
	this.errorLog = new TtagitErrorLog();
	this.taskScheduler = new TtagitTaskScheduler();
	this.shortenUrl = new TtagitShortenUrl();
	this.cookie = new TtagitCookie();
	this.debug = new TtagitDebug();
	this.utils = new TtagitUtil();
	this.mediaUploader = new TtagitMediaUpload(document.getElementById('form'));
	this.viewController = new TtagitViewController();
	this.reports = new TtagitReports();
	this.message = new TtagitMessage();

	//this.debug.activate();
	this.logedUser = null;
	this.http_short_url_length = 25;
	this.maxTweetOfSearches = 100;
	this.maxTweetOfLists = 100;
	this.maxTweetOfTrendTopics = 400;
	this.mainWindow= Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");
	this.gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
	this.onStart = true;
	this.onInitSession = true;
	this.correctLogin = false;
}

Ttagit.prototype = {


//--------------------------------------------
//	 INIT: admintrative functions
//--------------------------------------------

	init: function(){
		//obtain the current version of ttagit
		Components.utils.import("resource://gre/modules/AddonManager.jsm");
		AddonManager.getAddonByID("ntortarolo@hotmail.com", function(addon) {
			var version = addon.version+'';
			ttagit.check_database(version);
			ttagit.start();
		});
	},

	check_database: function (version){
		try{
			var mainWindow, res = ttagit.dbttagit.query("SELECT version FROM ttagit");
			// no tenia ese campo
			if(typeof(res[0]) == "undefined"){ttagit.create_database(version);  return true; }

			//Existe la base de datos
			if(res[0].version != version){
 				ttagit.openUrl('http://ttagit.com/welcome?v='+version);
 				ttagit.dbttagit.updateDatabase(res[0].version,version);

				//agrego el icono en el top nav
				mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIWebNavigation)
				.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
				.rootTreeItem
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIDOMWindow);

				mainWindow.ttagitOver.addIconToNavBar();
			}

			ttagit.dbttagit.goSane();
		}catch(e){
			//la crea de nuevo porque la tabla no existe
 			ttagit.create_database(version);
			ttagit.openUrl('http://ttagit.com/welcome?v='+version);
		}
	},

	create_database: function (version){
		ttagit.dbttagit.create_database();
		ttagit.dbttagit.query("insert into ttagit (version,last_sidebar_position) values ('"+version+"','left')");
	},

//--------------------------------------------
//	 INIT: Starting ...
//--------------------------------------------

	start: function  (){

		ttagit.startBarPosition();

		//Comienza la ejecucion del task scheduler.
		ttagit.taskScheduler.init();

		//muestra pantalla de login
		ttagit.viewController.viewInterface.init();

		//vaciar la tabla de tweets temporales
		ttagit.dbttagit.truncateTable_temp_tweets();

		//obtener longitud reservada para las urls acortadas
		ttagit.getConfiguration();

		//firefox 19 is calling windows.unload when the sidebar is open at FF startup
		//the handler for that function put the icon as inactive, and this patch will put back the icon as active
		ttagit.viewController.viewInterface.SetActiveIcon();

	},

	startBarPosition: function (position) {

		var position,
		res = ttagit.dbttagit.query("SELECT last_sidebar_position FROM ttagit");
		position = res[0].last_sidebar_position;

		if (position == "right") {
			top.document.getElementById("browser").style.MozBoxDirection ="reverse";
			return true;
		}

		top.document.getElementById("browser").style.MozBoxDirection ="normal";
		return true;
	},

//--------------------------------------------
//	 DELETE USER
//--------------------------------------------

	deleteUserIfExist: function (username){
		var res1,
		res = ttagit.dbttagit.query("SELECT user_preferences FROM users WHERE name = '"+username+"'");
		if(typeof(res[0])!="undefined"){
			res1 = ttagit.dbttagit.query("DELETE FROM users WHERE ( name = '"+username+"')");
			res1 = ttagit.dbttagit.query("DELETE FROM preferences WHERE ( id = '"+res[0].user_preferences+"')");
			res1 = ttagit.dbttagit.query("DELETE FROM cookies WHERE (  ttagit_user_screen_name = '"+username+"')");
			res1 = ttagit.dbttagit.query("DELETE FROM direct_messages WHERE (  ttagit_user_screen_name = '"+username+"')");
			res1 = ttagit.dbttagit.query("DELETE FROM lists WHERE (  ttagit_user_screen_name = '"+username+"')");
			res1 = ttagit.dbttagit.query("DELETE FROM searches WHERE (  ttagit_user_screen_name = '"+username+"')");
			res1 = ttagit.dbttagit.query("DELETE FROM temp_tweets WHERE (  ttagit_user_screen_name = '"+username+"')");
			res1 = ttagit.dbttagit.query("DELETE FROM tweets WHERE (  ttagit_user_screen_name = '"+username+"')");
			res1 = ttagit.dbttagit.query("DELETE FROM tweets_search WHERE (  ttagit_user_screen_name = '"+username+"')");
		}
	},

//--------------------------------------------
//	 REGISTER USER && AND LOGIN HIM
//--------------------------------------------

	//called from add New account click event
	requestPin: function  (){
		ttagit.utils.callHandler({"f1":"requestToken","p1":null,"f2":"ttagit.afterRequestPin","p2":null},'twitter');
	},

	afterRequestPin: function (response) {
		if(typeof(response.oauth_token) == "undefined"){
			//TODO: volver a mostrar pantalla de add user/login
		 }
		this.cookie.create("pin_auth_token",response.oauth_token);
		this.cookie.create("pin_auth_token_secret",response.oauth_token_secret);
		this.openAuthorizeUrl('https://api.twitter.com/oauth/authorize?force_login=true&oauth_token=' + response.oauth_token);
		ttagit.viewController.viewInterface.AddUserForm('show');
	},

	//called from create account click event
	authorize: function (action,userPass, pin){

		var auth_token = this.cookie.read("pin_auth_token"),
		auth_token_secret = this.cookie.read("pin_auth_token_secret"),
		userPassword = null;

		this.cookie.remove("pin_auth_token");
		this.cookie.remove("pin_auth_token_secret");
		if(userPass != ""){ userPassword = userPass; }

		ttagit.utils.callHandler({"f1":"Auth","p1":[pin,auth_token, auth_token_secret],"f2":"ttagit.afterAuthorize","p2":[action,userPassword]},'twitter');
	},

	afterAuthorize: function (action,userPass,response){

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			ttagit.closeTwitterPinPage();//cierro la pagina de twitter
			ttagit.viewController.viewInterface.resetAddNewAccountFields();//reseteo los campos del pin
			ttagit.twitter.oauth.tokens = null;//seteo a null los tokens de OAuth
			ttagit.requestPin();//vuevo a pedir el pin
			$("#addNewUserWhait").fadeIn();
			$("#addNewUser p.pin_error_novalid").show('fast');//aviso que el pin ingresado es invalido
			return false;
		}

		ttagit.viewController.viewInterface.HideUserForm();
		ttagit.closeTwitterPinPage();

		ttagit.twitter.tokenAuth = response; //guardo el token para guardar el logueo.
		ttagit.twitter.oauth.setTokens(response.oauth_token,response.oauth_token_secret);
		ttagit.logedUser = {"twitter_id":response.user_id, "screen_name":response.screen_name, "profile_image":null};
		ttagit.twitter.setLoggedUser(response);

		if(action == 'remember'){
			//obtiene los datos del usuario (imagen), guarda el usuario y luego lo loguea.
			ttagit.utils.callHandler({"f1":"getUserInformation","p1":[response.screen_name],"f2":"ttagit.saveUserAndInitSession","p2":[userPass]},'twitter');
		}else if(action == 'Notremember'){
			ttagit.logTempUser(response);
		}
	},

	saveUserAndInitSession: function (userPass,user_info){

		if(typeof(user_info.error)!="undefined" || typeof(user_info.errors)!="undefined") {
			ttagit.viewController.viewInterface.waitPage("hide");
			ttagit.viewController.viewInterface.messageForLogin('show');
			ttagit.logOut();
			return false;
		}

		var res,id_preferences,
		user = {"screen_name":ttagit.logedUser.screen_name, "profile_image":user_info.profile_image_url ,"user_id":ttagit.logedUser.twitter_id ,"oauth_token":ttagit.twitter.oauth.tokens.oauth_token ,"oauth_token_secret":ttagit.twitter.oauth.tokens.oauth_token_secret};

		if(userPass == null){ userPass = '';}

		//actualizo el usuario logueado en ttagit con la imagen
		ttagit.logedUser = {"twitter_id":user.user_id, "screen_name":user.screen_name, "profile_image":user.profile_image,"time_zone":user_info.time_zone};

		//Si el usuario existe lo elimino junto con sus preferencias
		ttagit.deleteUserIfExist(user.screen_name);
		//guardo las preferencias por defecto y el usuario en la DB.
		this.dbttagit.query("insert into preferences (keep_session, tab, reload_rate, refreshOneByOne, sidebar_position, image_uploader) values (0,'friends',1,1,'left','twitter')");
		res = this.dbttagit.query("Select last_insert_rowid() as id");
		id_preferences = res[0].id;
		//guardo el usuario
		this.dbttagit.query("insert into users (name, profile_image, twitter_id, access_token, secret_token, user_preferences, password)values ('"+user.screen_name+"', '"+user.profile_image+"', '"+user.user_id+"', '"+user.oauth_token+"', '"+user.oauth_token_secret+"','"+id_preferences+"','"+userPass+"')");

		//actualiza los datos de la cuenta del usuario usuario (Woeid) antes de loguear
		ttagit.utils.callHandler({"f1":"getAccountSetttings","p1":null,"f2":"ttagit.aftergetAccountSetttings","p2":[user.screen_name]},'twitter');

	},

	logTempUser: function (user_info){
		var user = {"screen_name":ttagit.logedUser.screen_name, "profile_image":user_info.profile_image_url ,"user_id":ttagit.logedUser.twitter_id ,"oauth_token":ttagit.twitter.oauth.tokens.oauth_token ,"oauth_token_secret":ttagit.twitter.oauth.tokens.oauth_token_secret};

		//actualizo el usuario logueado en ttagit con la imagen
		ttagit.logedUser = {"twitter_id":user.user_id, "screen_name":user.screen_name, "profile_image":user.profile_image,"time_zone":user_info.time_zone};

		//inicio la sesion
		ttagit.pre_init_session(user.screen_name);
	},

//--------------------------------------------
//	 LOGIN USER
//--------------------------------------------

	//called from click on a user event
	LogUser: function (id){
		var user = this.getUser(id);

		if(user){
			ttagit.twitter.oauth.setTokens(user[0].access_token,user[0].secret_token);
			ttagit.logedUser = {"twitter_id":user[0].twitter_id, "screen_name":user[0].name};
			ttagit.twitter.LoggedUser = {'user_id':user[0].twitter_id, 'screen_name':user[0].name};

			//actualiza los datos del usuario (imagen) antes de loguear
			ttagit.utils.callHandler({"f1":"getUserInformation","p1":[user[0].name],"f2":"ttagit.afterLogUser","p2":null},'twitter');
		}

		if(ttagit.cookie.exist('keep_login_user','system')){
			ttagit.cookie.remove('keep_login_user','system');
		}
		ttagit.cookie.create('keep_login_user_step1',id, 'system');
	},

	afterLogUser: function (user_info){

		if(typeof(user_info.error)!="undefined" || typeof(user_info.errors)!="undefined"){
			ttagit.viewController.viewInterface.waitPage("hide");
			ttagit.viewController.viewInterface.unlockPage('hide');
			ttagit.viewController.viewInterface.messageForLogin('show');
			ttagit.logOut();
			return false;
		}

		//actualizo el usuario logueado en ttagit con la imagen
		var res,
		user = {"screen_name":ttagit.logedUser.screen_name, "profile_image":user_info.profile_image_url ,"user_id":ttagit.logedUser.twitter_id ,"oauth_token":ttagit.twitter.oauth.tokens.oauth_token ,"oauth_token_secret":ttagit.twitter.oauth.tokens.oauth_token_secret};

		ttagit.logedUser = {"twitter_id":user.user_id, "screen_name":user.screen_name, "profile_image":user.profile_image,"time_zone":user_info.time_zone};
		res = ttagit.dbttagit.query("UPDATE users SET profile_image='"+user_info.profile_image_url+"' WHERE (name='"+user.screen_name+"')");

		if(ttagit.cookie.exist('keep_login_user_step1','system')){
			var user_id = ttagit.cookie.read('keep_login_user_step1','system');
			ttagit.cookie.remove('keep_login_user_step1','system');
			ttagit.cookie.create('keep_login_user',user_id, 'system');
		}

		//actualiza los datos de la cuenta del usuario usuario (Woeid) antes de loguear
		ttagit.utils.callHandler({"f1":"getAccountSetttings","p1":null,"f2":"ttagit.aftergetAccountSetttings","p2":[user.screen_name]},'twitter');
	},

	aftergetAccountSetttings: function (screen_name, response){
		var woeid = '';

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			ttagit.viewController.viewInterface.waitPage("hide");
			ttagit.viewController.viewInterface.messageForLogin('show');
			ttagit.logOut();
			return false;
		}

		if(typeof(response.trend_location) !="undefined" ){
			woeid = response.trend_location[0].woeid;
		}
		ttagit.dbttagit.query("UPDATE users SET woeid='"+woeid+"' WHERE (name='"+screen_name+"')");

		//inicio la sesion
		ttagit.pre_init_session(screen_name);
	},

	logOut: function (){
		//dejar el box de tweet cerrado y limpio
		ttagit.viewController.viewInterface.cancelTweet();

		//borrar la lista de usuario muteados
		ttagit.viewController.cleanMutedUsers();

		//terminr con  las tareas programadas
		ttagit.taskScheduler.finish();

		if(ttagit.cookie.exist('keep_login_user','system')){
			ttagit.cookie.remove('keep_login_user','system');
		}

		//enviar los reportes
		//ttagit.reports.send();  -- se bloqueo el envio de reportes al server. CUIDADO :la funcion send tambien esta comentada dentro del codigo del modulo.

		//borrar al usuario logueado de la session
		ttagit.twitter.oauth.tokens = null;
		ttagit.logedUser = null;
		ttagit.twitter.LoggedUser = null;
		ttagit.cookie.clear();

		//simular el inicio nuevamente
		ttagit.onInitSession = true;
		this.onStart = true;
		ttagit.start();
		ttagit.correctLogin = false;
	},

//--------------------------------------------
//	 INIT SESSION
//--------------------------------------------

	pre_init_session: function (user_screen_name) {
		//show whait page
		ttagit.viewController.viewInterface.waitPage('show');

		//cargo las preferencias del usuario
		ttagit.loadPreferences(user_screen_name);

		//inicio la sesion
		ttagit.init_session();
	},

	loadPreferences: function (user_screen_name){

		if(!ttagit.userLogged()){ return false; }

		var res,
		q = "SELECT P.reload_rate reload_rate, P.sidebar_position sidebar_position, P.image_uploader image_uploader, P.tab tab FROM (SELECT user_preferences FROM users WHERE (name = '"+user_screen_name+"')) U , (SELECT * FROM preferences WHERE 1) P WHERE P.id = U.user_preferences";
		res = ttagit.dbttagit.query(q);

		if(typeof(res[0])=="undefined"){ return false; }

		ttagit.setImageUploader(res[0].image_uploader);
		ttagit.taskScheduler.defaultTime = parseInt(res[0].reload_rate);

		if(res[0].sidebar_position == 'right'){
			ttagit.updateBarPosition('right');
			res = ttagit.dbttagit.query("UPDATE ttagit SET last_sidebar_position='right'");
		}else{
			ttagit.updateBarPosition('left');
			res = ttagit.dbttagit.query("UPDATE ttagit SET last_sidebar_position='left'");
		}
	},

	setImageUploader: function (uploader){
		ttagit.mediaUploader.setMediaUploader(uploader);
		ttagit.viewController.viewInterface.setImageUploader(uploader);
	},

	updateBarPosition: function (position) {

		if (position == "right") {
			top.document.getElementById("browser").style.MozBoxDirection ="reverse";
			return true;
		}

		top.document.getElementById("browser").style.MozBoxDirection ="normal";
		return true;
	},

	init_session: function (){

		//ttagit.reports.init();

		//obtengo todos los tweets favoritos y retwweted desde twitter para lograr consistencia.
		ttagit.synchronizeFavorites();
		ttagit.synchronizeSearches();

		ttagit.taskScheduler.add({"f1":"ttagit.loadAllList","p1":null},'15',true);//obtener todas las listas del usuario
		ttagit.taskScheduler.add({"f1":"ttagit.LoadDirectMessages","p1":null},ttagit.taskScheduler.defaultTime);//obtener nuevos mensajes directos recibidos
		ttagit.taskScheduler.add({"f1":"ttagit.LoadDirectMessagesSent","p1":null},ttagit.taskScheduler.defaultTime);//obtener nuevos mensajes directos enviados
		ttagit.taskScheduler.add({"f1":"ttagit.LoadTrendTopics","p1":null},ttagit.taskScheduler.defaultTime);//obtener nuevos trendtopics para el area del usuario

		ttagit.correctLogin = false;

		//este es el que va a mostrar el timeline al iniciar session
		ttagit.taskScheduler.add({"f1":"ttagit.loadTimeLineTweets","p1":null},ttagit.taskScheduler.defaultTime);//obtener nuevos tweets de home timeline
		ttagit.taskScheduler.setUniqueExecutionFunction({"f1":"ttagit.checkLogin","p1":null},15000);//checkea que el login del usuario se haya hecho correctamente.
		ttagit.taskScheduler.add({"f1":"ttagit.loadMentionsTweets","p1":null},ttagit.taskScheduler.defaultTime);//obtener nuevas mensiones sobre el usuario

		//seteo el nombre del usuario en los lugares corerspondientes de la vista

		if(!ttagit.cookie.exist('Setedurl', 'global')){
			$("#searchbox textarea").val('Share something, '+ ttagit.getLoggedUserName());
		}else{
			ttagit.cookie.remove('Setedurl', 'global');
		}
		$("#signOutTtagit a").html('Sign out '+ ttagit.utils.escapeHTML(ttagit.getLoggedUserName()));

		//ejecuta todas las funciones previamente cargadas
		ttagit.functionsToExecuteOnInit();

		//Set a value and then reset that value to have access to the button in the future
		ttagit.viewController.viewInterface.initTweetsNotificationOnTtagitButton();

		ttagit.unlockCheck();
	},

	checkLogin: function (){
		if(!ttagit.correctLogin){
			ttagit.viewController.viewInterface.waitPage("hide");
			ttagit.viewController.viewInterface.messageForLogin('show');
			ttagit.logOut();
			return false;
		}
		return true;
	},

//--------------------------------------------
//	 TWITTER USER ACTIONS
//--------------------------------------------

	follow_unfollow: function (target_screen_name,user_id){
		if(!ttagit.userLogged()){ return false; }

		var source_screen_name = this.getLoggedUserName();
		ttagit.utils.callHandler({"f1":"hasFriendship","p1":[source_screen_name,target_screen_name],"f2":"ttagit.afterFollow_unfollow","p2":[target_screen_name,user_id]},'twitter');
	},

	afterFollow_unfollow: function (screen_name,user_id,response){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			if( response.error.match(/permission/) ){
				ttagit.sendFollowRequestUser(screen_name,user_id);
				return true;
			}

			this.showErrorMessage(response.error);
			return false;
		}

		if(response.relationship.source.following){
			ttagit.unfollowUser(screen_name,user_id);
			return true;
		}

		ttagit.followUser(screen_name,user_id);
		return true;
	},

	//------------

	unfollowUser: function (user_screen_name,user_id){
		if(!ttagit.userLogged()){ return false; }

		//report
		ttagit.reports.add('Session.users_follow_unfollow');

		ttagit.utils.callHandler({"f1":"unfollowUser","p1":[user_id,user_screen_name],"f2":"ttagit.afterUnfollowUser","p2":[user_screen_name]},'twitter');
	},

	afterUnfollowUser: function (user_screen_name,response){
		//--????-- para que se pasa user_screen_name

		if(!ttagit.userLogged()){ return false; }

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			//Esta es una opcion para el mensaje de error.
			//this.showErrorMessage("could not unfollow the user, try again");

			this.showErrorMessage(response.error);
			return false;
		}

		//muestro el mensaje que indica que se ha dejado de seguir al usuario.
		this.showErrorMessage("you stop follow the user "+response.screen_name);
	},

	//------------

	followUser: function (user_screen_name,user_id){
		if(!ttagit.userLogged()){ return false; }

		//report
		ttagit.reports.add('Session.users_follow_unfollow');

		ttagit.utils.callHandler({"f1":"followUser","p1":[user_id,user_screen_name],"f2":"ttagit.afterFollowUser","p2":[user_screen_name]},'twitter');
	},

	afterFollowUser: function (user_screen_name,response){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			//Esta es una opcion para el mensaje de error.
			//this.showErrorMessage("could not begin to follow the user, try again");
			this.showErrorMessage(response.error);
			return false;
		}

		this.showErrorMessage("started to follow the user "+user_screen_name);
	},

	//------------

	sendFollowRequestUser: function (user_screen_name,user_id){
		if(!ttagit.userLogged()){ return false; }

		ttagit.utils.callHandler({"f1":"followUser","p1":[user_id,user_screen_name],"f2":"ttagit.afterSendFollowRequestUser","p2":[user_screen_name]},'twitter');
	},

	afterSendFollowRequestUser: function (user_screen_name,response){
		if(!ttagit.userLogged()){ return false; }

		var amatch;

		if(typeof(response.error) != "undefined"){
			/*
			controlo, si el mensaje comienza con Could not follow user. En el caso de que sea asi
			entonces el mensaje es demaciado largo para mostrarlo, asi que solo muestro la segunda parte
			*/
			amatch = response.error.match(/Could not follow user: /);
			if(amatch){
				this.showErrorMessage( response.error.replace(amatch,'') );
				return false;
			}

			this.showErrorMessage(response.error);
			return false;
		}

		this.showErrorMessage("Your follow request has been sent to "+user_screen_name);
	},

	//------------

	blockUser: function (user_screen_name,user_id){
		if(!ttagit.userLogged()){ return false; }

		//report
		ttagit.reports.add('Session.users_blocked');

		ttagit.utils.callHandler({"f1":"blockUser","p1":[user_id,user_screen_name],"f2":"ttagit.afterBlockUser","p2":null},'twitter');
	},

	afterBlockUser: function (response){
		if(!ttagit.userLogged()){ return false; }

		var user_screen_name;

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			this.showErrorMessage(response.error);
			return false;
		}
		user_screen_name = this.getLoggedUserName();
		ttagit.dbttagit.query("DELETE FROM tweets WHERE ( ttagit_user_screen_name = '"+user_screen_name+"' AND  owner_screen_name ='"+response.screen_name+"')");
		this.showErrorMessage("the user "+response.screen_name+" has been blocked ");
	},

	//------------

	muteUser: function (user_screen_name, user_id){
		if(!ttagit.userLogged()){ return false; }

		ttagit.viewController.addMuteUser(user_screen_name, user_id);
	},

	//------------

	reportUserAsSpamer: function (user_screen_name,user_id){
		if(!ttagit.userLogged()){ return false; }

		//report
		ttagit.reports.add('Session.users_reported_as_spamer');

		ttagit.utils.callHandler({"f1":"reportSpam","p1":[user_id,user_screen_name],"f2":"ttagit.afterReportUserAsSpamer","p2":null},'twitter');
	},

	afterReportUserAsSpamer: function (response){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			this.showErrorMessage(response.error);
			return false;
		}
		this.showErrorMessage("has set the user "+response.screen_name+" as a spammer");
	},

//--------------------------------------------
//	 TWEETS ACTIONS
//--------------------------------------------

	//------------

	updateStatus: function (tweet){
		if(!ttagit.userLogged()){ return false; }

		var in_reply_to_status_id = '';

		if(ttagit.cookie.exist('in_reply_to_status_id')){
			in_reply_to_status_id = ttagit.cookie.read('in_reply_to_status_id');
			ttagit.reports.add('Session.replies');
			ttagit.cookie.remove('in_reply_to_status_id');
		}else{
			//report
			ttagit.reports.add('Session.posts');
		}

		ttagit.utils.callHandler({"f1":"newPost","p1":[tweet,in_reply_to_status_id],"f2":"ttagit.afterUpdateStatus","p2":null},'twitter');
	},

	afterUpdateStatus: function (response){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			ttagit.showErrorMessage(response.error);
			return false;
		}

		ttagit.loadTimeLineTweets();
	},

	//------------

	deleteStatus: function (tweet_id){
		if(!ttagit.userLogged()){ return false; }

		//report
		ttagit.reports.add('Session.deleted_tweets');

		ttagit.viewController.viewInterface.deleteBoxTweet(tweet_id);
		ttagit.utils.callHandler({"f1":"deleteTweet","p1":[tweet_id],"f2":"ttagit.afterDeleteStatus","p2":[tweet_id]},'twitter');
	},

	afterDeleteStatus: function (tweet_id,response){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			this.showErrorMessage(response.error);
		}

		var user_screen_name = ttagit.getLoggedUserName();
		ttagit.dbttagit.query("DELETE FROM tweets WHERE ( ttagit_user_screen_name = '"+user_screen_name+"' AND tweet_id ='"+tweet_id+"')");
		return true;
	},

	//--------------------------------------------
	//	  RETWEETS
	//--------------------------------------------
	retweetStatus: function (tweet_id){
		if(!ttagit.userLogged()){ return false; }

		//report
		ttagit.reports.add('Session.retweets');

		//TODO: Esto debe ir en una funcion en viewInterface. JUSTO debajo de la funcion que oculta el box
		$("#"+tweet_id).find(".actions .default .relativeMe a.retweet").addClass("retweeted");
		$("#"+tweet_id).find(".actions .default .relativeMe a.retweet").appendTo($("#"+tweet_id).find(".selected .relativeMe"));

		ttagit.utils.callHandler({"f1":"retweet","p1":[tweet_id],"f2":"ttagit.afterRetweetStatus","p2":[tweet_id]},'twitter');
	},

	afterRetweetStatus: function (tweet_id,response){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			this.showErrorMessage(response.error);
			return false;
		}

		var retweet_id = response.id_str;
		ttagit.updateTweetAsRetweetedByMe(tweet_id,retweet_id);
	},

	updateTweetAsRetweetedByMe: function (tweet_id,retweet_id){
		if(!ttagit.userLogged()){ return false; }

		var res,
		user_screen_name = this.getLoggedUserName();

		res = ttagit.dbttagit.query("UPDATE tweets SET retweeted_by='"+user_screen_name+"' WHERE (tweet_id='"+tweet_id+"' and ttagit_user_screen_name='"+user_screen_name+"')");
		res = ttagit.dbttagit.query("UPDATE tweets SET retweet_id ='"+retweet_id+"' WHERE (tweet_id='"+tweet_id+"' and ttagit_user_screen_name='"+user_screen_name+"')");
	},

	retweetWithComments: function (tweet_id){
		var tweet = ttagit.getTweet(tweet_id);
		ttagit.viewController.viewInterface.openTweetTextarea();
		ttagit.viewController.viewInterface.setTweetTextarea("RT @"+tweet.owner_screen_name+" "+ttagit.encript.rawDecode(tweet.text));
		ttagit.viewController.viewInterface.calculateCharacters();
	},

	//----------------------------------------

	replyToAll: function (tweet_id){
		var tweet,mentions;
		tweet = ttagit.getTweet(tweet_id);
		mentions = this.obtainAllMentions(ttagit.encript.rawDecode(tweet.text));
		ttagit.viewController.viewInterface.openTweetTextarea();

		ttagit.viewController.viewInterface.setTweetTextarea("@"+tweet.owner_screen_name+" "+mentions);
		ttagit.cookie.create('in_reply_to_status_id',tweet_id);
		ttagit.viewController.viewInterface.calculateCharacters();
	},

	obtainAllMentions: function (tweet_text){
		var mention,mentions,tweet;

		tweet = tweet_text;
		mentions = '';
		//obtengo y reemplazo todas las mensiones
		mention = ttagit.viewController.viewInterface.haveMention(tweet);
		while(typeof(mention) != "boolean"){

				tweet = tweet.replace(mention,'');

				if (mentions == ''){
					mentions += mention;
				}else{
					mentions += ' '+mention;
				}

				mention = ttagit.viewController.viewInterface.haveMention(tweet);
		}
		return mentions;
	},
	//------------

	removeRetweet: function (tweetId){
		if(!ttagit.userLogged()){ return false; }

		var res,
		user_screen_name = this.getLoggedUserName();

		res = ttagit.dbttagit.query("SELECT retweet_id FROM tweets WHERE (ttagit_user_screen_name='"+user_screen_name+"' and retweeted_by='"+user_screen_name+"' and tweet_id= '"+tweetId+"')");
		if(typeof(res[0])=="undefined"){// si es indefinido, entonces el tweet no existe, por lo tanto se muestra el mensaje
			this.showErrorMessage("could not remove the retweet");
			return false;
		}
		ttagit.deleteStatus(res[0].retweet_id);//elimino el retweet
		ttagit.updateTweetAsNotRetweeted(tweetId);
	},

	updateTweetAsNotRetweeted: function (tweet_id){
		if(!ttagit.userLogged()){ return false; }

		var res,
		user_screen_name = this.getLoggedUserName();

		res = ttagit.dbttagit.query("UPDATE tweets SET retweeted_by='null' WHERE (tweet_id='"+tweet_id+"' and ttagit_user_screen_name='"+user_screen_name+"')");
		res = ttagit.dbttagit.query("UPDATE tweets SET retweet_id='null' WHERE (tweet_id='"+tweet_id+"' and ttagit_user_screen_name='"+user_screen_name+"')");
	},

	//-----------

	addTweetToFavorites: function (tweet_id){
		if(!ttagit.userLogged()){ return false; }

		//report
		ttagit.reports.add('Session.tweets_added_to_favorites');

		ttagit.utils.callHandler({"f1":"addToFavorites","p1":[tweet_id],"f2":"ttagit.updateTweetAsFavorite","p2":[tweet_id]},'twitter');
	},

	updateTweetAsFavorite: function (tweet_id){
		if(!ttagit.userLogged()){ return false; }

		var res,
		user_screen_name = this.getLoggedUserName();

		res = ttagit.dbttagit.query("UPDATE tweets SET favorited=1 WHERE (tweet_id='"+tweet_id+"' and ttagit_user_screen_name='"+user_screen_name+"')");
		res = ttagit.dbttagit.query("UPDATE temp_tweets SET favorited=1 WHERE (tweet_id='"+tweet_id+"' and ttagit_user_screen_name='"+user_screen_name+"')");
	},

	//-----------

	remTweetOfFavorites: function (tweet_id){
		if(!ttagit.userLogged()){ return false; }

		if (ttagit.viewController.viewCurrent == 'Favorite') {
			ttagit.viewController.viewInterface.deleteBoxTweet(tweet_id);
		}
		ttagit.utils.callHandler({"f1":"removeOfFavorites","p1":[tweet_id],"f2":"ttagit.updateTweetAsNotFavorite","p2":[tweet_id]},'twitter');
	},

	updateTweetAsNotFavorite: function (tweet_id){
		if(!ttagit.userLogged()){ return false; }

		var res,
		user_screen_name = this.getLoggedUserName();

		res = ttagit.dbttagit.query("UPDATE tweets SET favorited=0 WHERE (tweet_id='"+tweet_id+"' and ttagit_user_screen_name='"+user_screen_name+"')");
		res = ttagit.dbttagit.query("UPDATE temp_tweets SET favorited=0 WHERE (tweet_id='"+tweet_id+"' and ttagit_user_screen_name='"+user_screen_name+"')");

		//TODO: verificar que si se esta viendo el tab de favoritos lo elimine de la lista
	},

	//-----------

	copyToClipboard: function (text){
		if(!ttagit.userLogged()){ return false; }

		ttagit.gClipboardHelper.copyString(text);
	},

	pasteClipboard: function (){
        if(!ttagit.userLogged()){ return false; }

		var clip,trans,str,strLength;
        clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
        if (!clip) return false;

        trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
        if (!trans) return false;
        if ('init' in trans) {
			trans.init(null);
		}

        trans.addDataFlavor("text/unicode");

        clip.getData(trans, clip.kGlobalClipboard);

        str = new Object();
        strLength = new Object();

        trans.getTransferData("text/unicode", str, strLength);
        if (str) {
          str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
          pastetext = str.data.substring(0, strLength.value / 2);
          return pastetext;
        }

        return false;
    },

    insertAtCursor: function (myField, myValue) {

        if (document.getElementById(myField).selectionStart || document.getElementById(myField).selectionStart == '0') {
            var startPos = document.getElementById(myField).selectionStart,
            endPos = document.getElementById(myField).selectionEnd;
            document.getElementById(myField).value = document.getElementById(myField).value.substring(0, startPos)
            + myValue
            + document.getElementById(myField).value.substring(endPos, document.getElementById(myField).value.length);
        } else {
            $("#" + myField).val( $("#" + myField).val() + myValue );
        }
    },
//--------------------------------------------
//	  TIMELINE && MENTIONS
//--------------------------------------------

	loadTimeLineTweets: function (){
		if(!ttagit.userLogged()){ return false; }

		var last_tweet_id = this.getLastTweetId('TimeLine');
		if(last_tweet_id == false){ last_tweet_id = ''; }

		ttagit.utils.callHandler({"f1":"getTimeLineTweets","p1":[last_tweet_id],"f2":"ttagit.saveAndShowTweets","p2":['TimeLine']},'twitter');
	},

	loadMentionsTweets: function (){
		if(!ttagit.userLogged()){ return false; }

		var last_tweet_id = this.getLastTweetId('Mentions');
		if(last_tweet_id == false){ last_tweet_id = ''; }

		ttagit.utils.callHandler({"f1":"getMentions","p1":[last_tweet_id],"f2":"ttagit.saveAndShowTweets","p2":['Mentions']},'twitter');
	},

	saveAndShowTweets: function (type, tweets){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(tweets.error)!="undefined" || typeof(tweets.errors)!="undefined"){
			ttagit.viewController.viewInterface.waitPage("hide");
			if(type == 'TimeLine' && ttagit.onInitSession ){
				ttagit.viewController.viewInterface.messageForLogin('show');
				ttagit.logOut();
			}
			return false;
		}

		ttagit.correctLogin = true;

		//save Twits on DB
		this.saveTweets(type, tweets);

		//Show time line or refresh view
		if(type == 'TimeLine' && ttagit.onInitSession ){
			ttagit.viewController.showTimeLineTweets();
			ttagit.onInitSession = false;//se indica que ya se inicio la sesion
		}else if (type == 'TimeLine'){
			ttagit.viewController.refresh('TimeLine',tweets.length);
		}else if(type == 'Mentions'){
			ttagit.viewController.refresh('Mentions',tweets.length);
		}
	},

	saveTweets: function (type, tweets){
		if(!ttagit.userLogged()){ return false; }

		var i,url,d,fav,retweeted_by,user_screen_name,RT,tweetimage;

		user_screen_name = this.getLoggedUserName();

		for(i=0;i<tweets.length;i++){

			tweetimage='';
			if(typeof(tweets[i].entities.media) != "undefined" && tweets[i].entities.media[0].type=='photo'){
				tweetimage= tweets[i].entities.media[0].media_url_https+':small';
			 }

			RT = tweets[i].retweeted_status;
			if(typeof(RT)!="undefined"){//En el caso de que sea un RT
				url = "http://twitter.com/#!/"+tweets[i].retweeted_status.user.screen_name+"/status/"+tweets[i].id_str;
				d= Date.parse(tweets[i].created_at);
				fav = 0;
				if(tweets[i].retweeted_status.favorited){
					fav = 1;
				}
				this.dbttagit.query("insert into tweets (tweet_id, ttagit_user_screen_name, created, text, source, favorited, retweeted_by, retweet_id, owner_id, owner_screen_name, image , url, in_reply_to_status_id, in_reply_to_screen_name, tweet_image, type_tweet) values ('"+tweets[i].retweeted_status.id_str+"','"+user_screen_name+"','"+d+"','"+ttagit.encript.rawEncode(tweets[i].retweeted_status.text)+"','"+tweets[i].retweeted_status.source+"','"+fav+"','"+tweets[i].user.screen_name+"', '"+tweets[i].id_str+"','"+tweets[i].retweeted_status.user.id_str+"','"+tweets[i].retweeted_status.user.screen_name+"','"+tweets[i].retweeted_status.user.profile_image_url+"','"+url+"','"+tweets[i].retweeted_status.in_reply_to_status_id_str+"','"+tweets[i].retweeted_status.in_reply_to_screen_name+"','"+tweetimage+"','"+type+"')");
			}else{
				//en el caso de que no sea un RT
				url = "http://twitter.com/#!/"+tweets[i].user.screen_name+"/status/"+tweets[i].id_str;
				d= Date.parse(tweets[i].created_at);
				fav = 0;
				if(tweets[i].favorited){
					fav = 1;
				}
				retweeted_by = 'null';
				if(tweets[i].user['protected']){
					retweeted_by = 'protected';
				}
				this.dbttagit.query("insert into tweets (tweet_id, ttagit_user_screen_name, created, text, source, favorited, retweeted_by, retweet_id, owner_id, owner_screen_name, image , url, in_reply_to_status_id, in_reply_to_screen_name, tweet_image, type_tweet) values ('"+tweets[i].id_str+"','"+user_screen_name+"','"+d+"','"+ttagit.encript.rawEncode(tweets[i].text)+"','"+tweets[i].source.replace("'","&#39;")+"','"+fav+"','"+retweeted_by+"','null','"+tweets[i].user.id_str+"','"+tweets[i].user.screen_name+"','"+tweets[i].user.profile_image_url+"','"+url+"','"+tweets[i].in_reply_to_status_id_str+"','"+tweets[i].in_reply_to_screen_name+"','"+tweetimage +"','"+type+"')");
			}
		}
	},

	getLastTweetId: function (type_tweet){
		if(!ttagit.userLogged()){ return false; }

		var res,tweet_id,
		user_screen_name = this.getLoggedUserName();

		res = ttagit.dbttagit.query("SELECT tweet_id,retweeted_by,retweet_id  FROM tweets WHERE ( type_tweet = '"+type_tweet+"' and ttagit_user_screen_name = '"+user_screen_name+"') ORDER BY created DESC LIMIT 1");

		if(typeof(res[0])=="undefined"){ return false; }

		if((res[0].retweeted_by != 'null')&&(res[0].retweeted_by != 'protected')){
			//si es un retweet entonces retorno el id del retweet
			tweet_id = res[0].retweet_id;
		}else{
			//si no es un retweet entonces retorno el id del tweet
			tweet_id = res[0].tweet_id;
		}
		return tweet_id;
	},

//--------------------------------------------
//	 FAVORITES
//--------------------------------------------

	//synchronize with twitter my favorited twees

	synchronizeFavorites: function (){
		if(!ttagit.userLogged()){ return false; }

		//busco los tweets favoritos para poder marcarlos como no favoritos
		var res,
		user_screen_name = this.getLoggedUserName();

		res = ttagit.dbttagit.query("SELECT tweet_id FROM tweets WHERE (favorited = 1 and ttagit_user_screen_name='"+user_screen_name+"')");
		if(typeof(res[0])!="undefined"){
			ttagit.markAsNotFavorite(res);
		}

		//ahora pido a twitter todos los favoritos para marcarlos en la DB.
		ttagit.loadFavoriteTweets(1);//comienzo a pedir desde la pagina 1
	},

	markAsNotFavorite: function (tweets){
		if(!ttagit.userLogged()){ return false; }

		var i;

		for(i=0;i<tweets.length;i++){
			ttagit.updateTweetAsNotFavorite(tweets[i].tweet_id);
		}
	},

	loadFavoriteTweets: function (page){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(page)!="undefined"){
			ttagit.utils.callHandler({"f1":"getFavorites","p1":[parseInt(page)],"f2":"ttagit.saveFavoritesTweets"},'twitter');
		}
	},

	saveFavoritesTweets: function (tweets){
		if(!ttagit.userLogged()){ return false; }

		var i;

		for(i=0;i<tweets.length;i++){
			ttagit.updateTweetAsFavorite(tweets[i].id_str)
		}
	},

//--------------------------------------------
//	 DM
//--------------------------------------------

	//--------

	directMessages_allows: function (target_screen_name,recipient_id){
		if(!ttagit.userLogged()){ return false; }

		var source_screen_name;

		if ( ttagit.twitter.isConfirmedFDM(recipient_id)) {
			ttagit.afterDirectMessages_allows(target_screen_name, recipient_id, true);
		} else{
			source_screen_name = this.getLoggedUserName();
			ttagit.utils.callHandler({"f1":"hasFriendship","p1":[source_screen_name,target_screen_name],"f2":"ttagit.afterDirectMessages_allows","p2":[target_screen_name,recipient_id]},'twitter');
		}
	},

	afterDirectMessages_allows: function (recipient_name,recipient_id,response){

		if(!ttagit.userLogged()){ return false; }

		//go back if wrong response
		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			ttagit.viewController.viewInterface.cancelDMUser();
			this.showErrorMessage(response.error);
			return false;
		}

		//go back if wrong response
		if(!response){
			ttagit.viewController.viewInterface.cancelDMUser();
			this.showErrorMessage("You can't send direct messages to this user");
			return false;
		}

		//go back if user can't send direct msgs.
		if( typeof(response.relationship) != "undefined" && !response.relationship.source.can_dm){
			ttagit.viewController.viewInterface.cancelDMUser();
			this.showErrorMessage("You can't send direct messages to this user");
			return false;
		}

		//guardo el usuario como ya verificado en esta session
		ttagit.twitter.confirmFDM(recipient_id);

		//muestro el textarea para enviar el mensaje directo
		ttagit.cookie.create('DM_recipient_id',recipient_id);
		ttagit.cookie.create('DM_recipient_name',recipient_name);
		ttagit.viewController.viewInterface.cancelDMUser();
		ttagit.viewController.viewInterface.openDM();
	},

	//--------

	LoadDirectMessages: function (){
		if(!ttagit.userLogged()){ return false; }

		var last_dm_id = this.getLastDirectMessageId('receive');

		if(last_dm_id == false){
			ttagit.utils.callHandler({"f1":"getDirectMessages","p1":[""],"f2":"ttagit.saveAndShowDirectMessages","p2":null},'twitter');
		}else{
			ttagit.utils.callHandler({"f1":"getDirectMessages","p1":[last_dm_id],"f2":"ttagit.saveAndShowDirectMessages","p2":null},'twitter');
		}
	},

	LoadDirectMessagesSent: function (){
		if(!ttagit.userLogged()){ return false; }

		var last_dm_id = this.getLastDirectMessageId('sent');

		if(last_dm_id == false){
			ttagit.utils.callHandler({"f1":"getDirectMessagesSent","p1":[""],"f2":"ttagit.saveAndShowDirectMessages","p2":null},'twitter');
		}else{
			ttagit.utils.callHandler({"f1":"getDirectMessagesSent","p1":[last_dm_id],"f2":"ttagit.saveAndShowDirectMessages","p2":null},'twitter');
		}
	},

	saveAndShowDirectMessages: function (direct_messages){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(direct_messages.error)!="undefined" || typeof(direct_messages.errors)!="undefined"){
			//this.showErrorMessage(direct_messages.error);
			return false;
		}

		this.saveDirectMessages(direct_messages);
		ttagit.viewController.refresh('DM',direct_messages.length);
	},

	saveDirectMessages: function (direct_messages){
		if(!ttagit.userLogged()){ return false; }

		var i,d,
		user_screen_name = this.getLoggedUserName();

		if(typeof(direct_messages.error)!="undefined" || typeof(direct_messages.errors)!="undefined"){
			//this.showErrorMessage(direct_messages.error);
			return false;
		}

		for(i=0;i<direct_messages.length;i++){
			d = Date.parse(direct_messages[i].created_at);
			this.dbttagit.query("insert into direct_messages (direct_message_id,ttagit_user_screen_name, created, text, sender_id, sender_screen_name, sender_image, sender_url, recipient_id, recipient_screen_name, recipient_image, recipient_url) values ('"+direct_messages[i].id_str+"','"+user_screen_name+"','"+d+"','"+ttagit.encript.rawEncode(direct_messages[i].text)+"','"+direct_messages[i].sender.id_str+"','"+direct_messages[i].sender.screen_name+"','"+direct_messages[i].sender.profile_image_url+"','"+direct_messages[i].sender.url+"','"+direct_messages[i].recipient.id_str+"','"+direct_messages[i].recipient.screen_name+"','"+direct_messages[i].recipient.profile_image_url+"','"+direct_messages[i].recipient.url+"')");
		}
	},

	//--------

	sendDirectMessage: function (recipient_name,recipient_id,msg){
		if(!ttagit.userLogged()){ return false; }

		//report
		ttagit.reports.add('Session.sent_messages');

		ttagit.utils.callHandler({"f1":"sendDirectMessage","p1":[recipient_name,recipient_id,msg],"f2":"ttagit.afterSendDirectMessage","p2":[recipient_id]},'twitter');
	},

	afterSendDirectMessage: function (recipient_id, response){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			//quito el usuario como ya verificado en esta session
			ttagit.twitter.removeConfirmedFDM(recipient_id);

			this.showErrorMessage(response.error);
			return false;
		}

		this.showErrorMessage("the message was sent");
		setTimeout(function(){ttagit.LoadDirectMessagesSent();}, 1500);
	},

	//--------

	deleteDirectMessage: function (DM_id){
		if(!ttagit.userLogged()){ return false; }

		ttagit.utils.callHandler({"f1":"deleteDirectMessage","p1":[DM_id],"f2":"ttagit.afterDeleteDirectMessage","p2":[DM_id]},'twitter');
	},

	afterDeleteDirectMessage: function (DM_id,response){
		if(!ttagit.userLogged()){ return false; }

		var user = ttagit.getLoggedUserName();

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			this.showErrorMessage(response.errors[0]['message']);
			ttagit.dbttagit.query("DELETE FROM direct_messages WHERE ( ttagit_user_screen_name = '"+user+"' AND direct_message_id ='"+DM_id+"')");
		}else{
			// delete DM tweet from database
			ttagit.dbttagit.query("DELETE FROM direct_messages WHERE ( ttagit_user_screen_name = '"+user+"' AND direct_message_id ='"+response.id_str+"')");
		}
		// reload conversation
		ttagit.viewController.showConversationDirectMessages(ttagit.viewController.viewScreenName);
	},

	//--------

	getLastDirectMessageId: function (user){
		if(!ttagit.userLogged()){ return false; }

		var res,
		user_screen_name = this.getLoggedUserName();

		res = ttagit.dbttagit.query("SELECT direct_message_id  FROM direct_messages WHERE (recipient_id = '"+this.logedUser.twitter_id+"' and ttagit_user_screen_name = '"+user_screen_name+"') ORDER BY created DESC LIMIT 1");
		if(user === 'sent'){
			res = ttagit.dbttagit.query("SELECT direct_message_id  FROM direct_messages WHERE (sender_id = '"+this.logedUser.twitter_id+"' and ttagit_user_screen_name = '"+user_screen_name+"') ORDER BY created DESC LIMIT 1");
		}

		if(typeof(res[0])=="undefined"){ return false; }

		return res[0].direct_message_id;
	},

//--------------------------------------------
//	 TREND TOPICS
//--------------------------------------------


	LoadTrendTopics: function (){
		if(!ttagit.userLogged()){ return false; }

		var source_screen_name = this.getLoggedUserName();
		var user_woeid = ttagit.dbttagit.query("SELECT woeid FROM users WHERE name = '"+source_screen_name+"'");
		user_woeid = user_woeid[0]['woeid'];

		if(user_woeid != ''){
			var user_id = ttagit.getLoggedUserId();
			ttagit.utils.callHandler({"f1":"getTrendTopics","p1":[user_woeid],"f2":"ttagit.aftergetTrendTopics","p2":[user_id]},'twitter');
		}
	},

	aftergetTrendTopics: function (user_id, response){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			return true;
		}

		var source_screen_name = this.getLoggedUserName();

		var trends = response[0].trends;

		ttagit.dbttagit.truncateTable_trendtopics();

		for(var i=0; i < trends.length; i++){
			this.dbttagit.query("insert into trendtopics ( ttagit_user_screen_name, name, promoted_content, query, url, events) values ('"+source_screen_name+"','"+trends[i].name+"','"+trends[i].promoted_content+"','"+trends[i].query+"','"+trends[i].url+"','"+trends[i].events+"')");
		}

	},

	loadTweetsTrendTopic: function (query){
		if(!ttagit.userLogged()){ return false; }

		var last_tweet_id = ttagit.getLastTweetTrendTopic();

		if(last_tweet_id == false){ last_tweet_id = ''; }

		ttagit.utils.callHandler({"f1":"search","p1":[query,last_tweet_id],"f2":"ttagit.saveAndShowTweetsOfTrendTopics","p2":[query]},'twitter');
	},

	saveAndShowTweetsOfTrendTopics: function (query, tweets){

		if(!ttagit.userLogged()){ return false; }

		if(typeof(tweets.error)!="undefined" || typeof(tweets.errors)!="undefined"){
			this.viewController.viewInterface.waitPage('hide');
			this.showErrorMessage('Twitter isn\'t responding');
			return false;
		}

		if(ttagit.viewController.viewTweetsOfTrendTopicCurrent != query){
			user_screen_name = this.getLoggedUserName();

			ttagit.dbttagit.query("DELETE FROM temp_tweets WHERE ( ttagit_user_screen_name = '"+user_screen_name+"' AND type_tweet = 'TweetTrendTopic')");
		}

		ttagit.saveTweetsOfTrendTopicsInTemp(tweets);

		if(ttagit.viewController.viewCurrent != 'TweetsTrendTopics') {
			ttagit.viewController.showTrendTopicsTweets(query);
		}else{
			ttagit.viewController.refresh('TweetsTrendTopics',tweets.length);
		}

	},

	saveTweetsOfTrendTopicsInTemp: function (founds){
		if(!ttagit.userLogged()){ return false; }

		var tweets,url,d,tweetimage,
		user_screen_name = this.getLoggedUserName();

		tweets = founds.statuses;
		for(var i=0;i<tweets.length;i++){

			tweetimage='';
			if(typeof(tweets[i].entities.media) != "undefined" && tweets[i].entities.media[0].type=='photo'){
				tweetimage= tweets[i].entities.media[0].media_url_https+':small';
			}

			url = "http://twitter.com/#!/"+tweets[i].from_user+"/status/"+tweets[i].id_str;
			d= Date.parse(tweets[i].created_at);
			try{
				this.dbttagit.query("insert into temp_tweets (tweet_id, ttagit_user_screen_name, created, text, source, favorited, retweeted_by, retweet_id, owner_id, owner_screen_name, image , url, in_reply_to_status_id, in_reply_to_screen_name, tweet_image, type_tweet) values ('"+tweets[i].id_str+"','"+user_screen_name+"','"+d+"','"+ttagit.encript.rawEncode(tweets[i].text)+"','"+tweets[i].source.replace("'","&#39;")+"','0','null','null','"+tweets[i].user.id_str+"','"+tweets[i].user.screen_name+"','"+tweets[i].user.profile_image_url+"','"+url+"','"+tweets[i].in_reply_to_status_id_str+"','null', '"+tweetimage+"', 'TweetTrendTopic')");
			}catch(e){
			}
		}

		ttagit.removeMostOldsOfTrendTopicsTweets(ttagit.maxTweetOfTrendTopics);
	},

	removeMostOldsOfTrendTopicsTweets: function (x_last){

		if(!ttagit.userLogged()){ return false; }

		var res,cant_tweets,cant,q,ids_tweets,
		user = ttagit.getLoggedUserName();

		res = ttagit.dbttagit.query("SELECT count(*) as cant_tweets FROM temp_tweets WHERE  ttagit_user_screen_name = '"+user+"'  AND type_tweet = 'TweetTrendTopic'");

		if(typeof(res[0]) =="undefined"){ return false; }

		cant_tweets = res[0].cant_tweets;

		if(cant_tweets <= x_last) { return false; }

		cant = cant_tweets - x_last;
		q = "SELECT tweet_id FROM temp_tweets WHERE  (ttagit_user_screen_name = '"+user+"'  AND type_tweet = 'TweetTrendTopic') ORDER BY created ASC LIMIT "+cant;
		res = ttagit.dbttagit.query(q);

		ids_tweets = "('";
		for(var i=0;i<res.length;i++){
			if(i!=0){
				ids_tweets += "','"+res[i].tweet_id;
			}else{
				ids_tweets += res[i].tweet_id;
			}
		}
		ids_tweets +="')";

		ttagit.dbttagit.query("DELETE FROM temp_tweets WHERE ( ttagit_user_screen_name = '"+user+"' AND tweet_id IN "+ids_tweets+")");
	},


	getLastTweetTrendTopic: function (){
		if(!ttagit.userLogged()){ return false; }

		var q,res,
		user_screen_name = this.getLoggedUserName();

		q = "SELECT tweet_id FROM temp_tweets WHERE (type_tweet = 'TweetTrendTopic' AND ttagit_user_screen_name = '"+user_screen_name+"') ORDER BY created DESC LIMIT 1";
		res = ttagit.dbttagit.query(q);

		if(typeof(res[0])=="undefined"){ return false; }

		return res[0].tweet_id;
	},

//--------------------------------------------
//	 LISTS ( refresh && show )
//--------------------------------------------

	//busca las listas guardadas en twitter
	// para actualizar los datos de nuestra DB
	// se realiza mediante scheduled job

	loadAllList: function (){
		if(!ttagit.userLogged()){ return false; }

		var user_screen_name = this.getLoggedUserName();

		ttagit.utils.callHandler({"f1":"getLists","p1":[user_screen_name],"f2":"ttagit.saveAndShowLists","p2":null},'twitter');
	},

	saveAndShowLists: function (response){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			//this.showErrorMessage(response.error);
			return false;
		}

		this.saveLists(response);
	},

	saveLists: function (lists){
		if(!ttagit.userLogged()){ return false; }

		var i,
		user_screen_name = this.getLoggedUserName();

		ttagit.deleteLists();
		for(i=0; i<lists.length;i++){
			ttagit.dbttagit.query("insert into lists (list_id,ttagit_user_screen_name, name, owner_screen_name, owner_id) values ('"+lists[i].id_str+"','"+user_screen_name+"','"+lists[i].full_name+"','"+lists[i].user.screen_name+"','"+lists[i].user.id_str+"')");
		}
	},

	// busca y carga nuevos twits de una lista en particular
	// luego se mustran en pantalla

	loadTweetsOfList: function (list_id){
		if(!ttagit.userLogged()){ return false; }

		var last_tweet_id = this.getLastTweetListId(list_id);

		if(last_tweet_id == false){ last_tweet_id = ''; }

		ttagit.utils.callHandler({"f1":"getListTweets","p1":[list_id,last_tweet_id],"f2":"ttagit.saveAndShowTweetsList","p2":[list_id]},'twitter');
	},

	saveAndShowTweetsList: function (list_id, tweets){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(tweets.error)!="undefined" || typeof(tweets.errors)!="undefined") {
			this.viewController.viewInterface.waitPage('hide');
			this.showErrorMessage('Twitter isn\'t responding');
			return false;
		}

		ttagit.saveTweetsList(list_id, tweets);
		ttagit.removeMostOldsOfLists(list_id,ttagit.maxTweetOfLists);
		if(ttagit.viewController.viewCurrent != 'list_tweets'  || ttagit.viewController.viewTweetsOfListCurrent != list_id) {
            ttagit.viewController.showTweetsOfLists(list_id);
        }else{
            ttagit.viewController.appendNewTweetsOfLists(list_id);
        }
	},

	saveTweetsList: function (list_id, tweets){
		if(!ttagit.userLogged()){ return false; }

		var i,user_screen_name,RT,url,d,fav,retweeted_by, tweetimage;

		user_screen_name = this.getLoggedUserName();

		for(i=0;i<tweets.length;i++){

			tweetimage='';
			if(typeof(tweets[i].entities.media) != "undefined" && tweets[i].entities.media[0].type=='photo'){
				tweetimage= tweets[i].entities.media[0].media_url_https+':small';
			 }

			RT = tweets[i].retweeted_status;
			if(typeof(RT)!="undefined"){
				//En el caso de que sea un RT
				url = "http://twitter.com/#!/"+tweets[i].retweeted_status.user.screen_name+"/status/"+tweets[i].id_str;
				d = Date.parse(tweets[i].created_at);
				fav=0;
				if(tweets[i].retweeted_status.favorited){ fav = 1; }
				this.dbttagit.query("insert into tweets (tweet_id, ttagit_user_screen_name, created, text, source, favorited, retweeted_by, retweet_id, owner_id, owner_screen_name, image , url, in_reply_to_status_id, in_reply_to_screen_name, tweet_image, type_tweet) values ('"+tweets[i].retweeted_status.id_str+"','"+user_screen_name+"','"+d+"','"+ttagit.encript.rawEncode(tweets[i].retweeted_status.text)+"','"+tweets[i].retweeted_status.source+"','"+fav+"','"+tweets[i].user.screen_name+"', '"+tweets[i].id_str+"','"+tweets[i].retweeted_status.user.id_str+"','"+tweets[i].retweeted_status.user.screen_name+"','"+tweets[i].retweeted_status.user.profile_image_url+"','"+url+"','"+tweets[i].retweeted_status.in_reply_to_status_id_str+"','"+tweets[i].retweeted_status.in_reply_to_screen_name+"','"+tweetimage+"','TweetList')");
				this.dbttagit.query("insert into tweet_lists (ttagit_user_screen_name, list_id, tweet_id) values ('"+user_screen_name+"','"+list_id+"','"+tweets[i].retweeted_status.id_str+"')");
			}else{
				//en el caso de que no sea un RT
				url = "http://twitter.com/#!/"+tweets[i].user.screen_name+"/status/"+tweets[i].id_str;
				d = Date.parse(tweets[i].created_at);
				fav=0;
				if(tweets[i].favorited){ fav = 1; }
				retweeted_by='null';
				if(tweets[i].user['protected']){ retweeted_by = 'protected'; }
				this.dbttagit.query("insert into tweets (tweet_id, ttagit_user_screen_name, created, text, source, favorited, retweeted_by, retweet_id, owner_id, owner_screen_name, image , url, in_reply_to_status_id, in_reply_to_screen_name, tweet_image, type_tweet) values ('"+tweets[i].id_str+"','"+user_screen_name+"','"+d+"','"+ttagit.encript.rawEncode(tweets[i].text)+"','"+tweets[i].source.replace("'","&#39;")+"','"+fav+"','"+retweeted_by+"','null','"+tweets[i].user.id_str+"','"+tweets[i].user.screen_name+"','"+tweets[i].user.profile_image_url+"','"+url+"','"+tweets[i].in_reply_to_status_id_str+"','"+tweets[i].in_reply_to_screen_name+"','"+tweetimage+"','TweetList')");
				this.dbttagit.query("insert into tweet_lists (ttagit_user_screen_name, list_id, tweet_id) values ('"+user_screen_name+"','"+list_id+"','"+tweets[i].id_str+"')");
			}
		}
	},

	removeMostOldsOfLists: function (list_id,x_last){
		if(!ttagit.userLogged()){ return false; }

		var res,cant_tweets,cant,q,ids_tweets,
		user = ttagit.getLoggedUserName();

		res = ttagit.dbttagit.query("SELECT count(*) as cant_tweets FROM tweet_lists WHERE (ttagit_user_screen_name = '"+user+"'  AND list_id = '"+list_id+"')");
		if(typeof(res[0]) =="undefined"){ return false; }

		cant_tweets = res[0].cant_tweets;
		if(cant_tweets <= x_last) { return false; }

		cant = cant_tweets - x_last;
		q = "SELECT T.tweet_id tweet_id FROM (SELECT tweet_id FROM tweet_lists WHERE (ttagit_user_screen_name = '"+user+"'  AND list_id = '"+list_id+"')) L, (SELECT * FROM tweets WHERE (type_tweet = 'TweetList')) T WHERE T.tweet_id = L.tweet_id ORDER BY T.created ASC LIMIT "+cant;
		res = ttagit.dbttagit.query(q);

		ids_tweets = "('";
		for(var i=0;i<res.length;i++){
			if(i!=0){
				ids_tweets += "','"+res[i].tweet_id;
			}else{
				ids_tweets += res[i].tweet_id;
			}
		}
		ids_tweets +="')";

		ttagit.dbttagit.query("DELETE FROM tweets WHERE ( ttagit_user_screen_name = '"+user+"' AND tweet_id IN "+ids_tweets+")");
		ttagit.dbttagit.query("DELETE FROM tweet_lists WHERE ( ttagit_user_screen_name = '"+user+"' AND tweet_id IN "+ids_tweets+")");
	},

	//borra todas las listas de un usuario
	//cuando se borra un usuario || cuando se actualizan las listas

	deleteLists: function (){
		if(!ttagit.userLogged()){ return false; }

		var user_screen_name = ttagit.getLoggedUserName();

		ttagit.dbttagit.query("delete from lists where ttagit_user_screen_name = '"+user_screen_name+"'");
	},

	//Obtiene el id del ultimo twit guardado para una lista

	getLastTweetListId: function (list_id){
		if(!ttagit.userLogged()){ return false; }

		var q,res,tweet_id,
		user_screen_name = this.getLoggedUserName();

		q = "SELECT T.tweet_id tweet_id, T.retweeted_by retweeted_by, T.retweet_id retweet_id FROM (SELECT tweet_id FROM tweet_lists WHERE (ttagit_user_screen_name = '"+user_screen_name+"' and list_id='"+list_id+"')) L, (SELECT * FROM tweets WHERE (type_tweet = 'TweetList')) T WHERE T.tweet_id = L.tweet_id ORDER BY T.created DESC LIMIT 1";
		res = ttagit.dbttagit.query(q);
		if(typeof(res[0]) =="undefined"){ return false; }

		if((res[0].retweeted_by != 'null')&&(res[0].retweeted_by != 'protected')){
			//si es un retweet entonces retorno el id del retweet
			tweet_id = res[0].retweet_id;
		}else{
			//si no es un retweet entonces retorno el id del tweet
			tweet_id = res[0].tweet_id;
		}

		return tweet_id;
	},

//--------------------------------------------
//	 SEARCHES ( refresh && show )
//--------------------------------------------

	//busca los searches guardados en twitter
	// para actualizar los datos de nuestra DB
	// se realiza mediante scheduled job
	synchronizeSearches: function (){
		if(!ttagit.userLogged()){ return false; }

		ttagit.utils.callHandler({"f1":"getSavedSearch","p1":null,"f2":"ttagit.saveAndShowSearches","p2":null},'twitter');
	},

	loadAllSearches: function (){
		if(!ttagit.userLogged()){ return false; }

		ttagit.utils.callHandler({"f1":"getSavedSearch","p1":null,"f2":"ttagit.saveAndShowSearches","p2":null},'twitter');
	},

	saveAndShowSearches: function (searches){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(searches.error)!="undefined" || typeof(searches.errors)!="undefined"){
			return false;
			//ESTO ES INTERNO Y NO DEBERIA INFORMAR ERRORES
			//this.showErrorMessage(searches.error);
		}

		this.saveSearches(searches);
	},

	saveSearches: function (searches){
		if(!ttagit.userLogged()){ return false; }

		var i,
		user_screen_name = this.getLoggedUserName();

		ttagit.deleteSearches();
		for(i=0; i<searches.length;i++){
			ttagit.dbttagit.query("insert into searches (ttagit_user_screen_name, search_id, name, query) values ('"+user_screen_name+"','"+searches[i].id_str+"','"+searches[i].name+"','"+searches[i].query+"')");
		}
	},

	//busca los twits de una busqueda guardada,
	//desde el ultimo registrado en la db o todos
	// en caso de que no haya ninguno guardado

	loadTweetsOfSavedSearch: function (search_id){
		if(!ttagit.userLogged()){ return false; }

		var q,res,
		last_tweet_id = this.getLastTweetSearchId(search_id);

		if(last_tweet_id == false){ last_tweet_id = '';}

		q = "SELECT * FROM searches WHERE (search_id = '"+search_id+"')";

		res = ttagit.dbttagit.query(q);

		ttagit.utils.callHandler({"f1":"search","p1":[ttagit.encript.rawEncode(res[0].query),last_tweet_id],"f2":"ttagit.saveAndShowTweetsOfsavedSearch","p2":[search_id]},'twitter');
	},

	saveAndShowTweetsOfsavedSearch: function (search_id, tweets){

		if(!ttagit.userLogged()){ return false; }

		if(typeof(tweets.error)!="undefined" || typeof(tweets.errors)!="undefined"){
			this.viewController.viewInterface.waitPage('hide');
			this.showErrorMessage('Twitter isn\'t responding');
			return false;
		}

		ttagit.saveTweetsOfSavedSearch(search_id, tweets);
		ttagit.removeMostOldsOfSearch(search_id,ttagit.maxTweetOfSearches);

		if(ttagit.viewController.viewCurrent != 'search_tweets'  || ttagit.viewController.viewTweetsOfSearchCurrent != search_id) {
		    ttagit.viewController.showTweetsOfSearches(search_id);
		}else{
		    ttagit.viewController.appendNewTweetsOfSearches(search_id);
		}
	},

	saveTweetsOfSavedSearch: function (search_id, founds){
		if(!ttagit.userLogged()){ return false; }

		var user_screen_name,url,d,tweetimage,
		tweets = founds.statuses,
		fav=0,
		retweeted_by='null';

		user_screen_name = this.getLoggedUserName();

		for(var i=0;i<tweets.length;i++){
			tweetimage='';
			if(typeof(tweets[i].entities.media) != "undefined" && tweets[i].entities.media[0].type=='photo'){
				tweetimage= tweets[i].entities.media[0].media_url_https+':small';
			 }

			url = "http://twitter.com/#!/"+tweets[i].from_user+"/status/"+tweets[i].id_str;
			d = Date.parse(tweets[i].created_at);
			this.dbttagit.query("insert into tweets (tweet_id, ttagit_user_screen_name, created, text, source, favorited, retweeted_by, retweet_id, owner_id, owner_screen_name, image , url, in_reply_to_status_id, in_reply_to_screen_name, tweet_image, type_tweet) values ('"+tweets[i].id_str+"','"+user_screen_name+"','"+d+"','"+ttagit.encript.rawEncode(tweets[i].text)+"','"+tweets[i].source.replace("'","&#39;")+"','"+fav+"','"+retweeted_by+"','null','"+tweets[i].user.id_str+"','"+tweets[i].user.screen_name+"','"+tweets[i].user.profile_image_url+"','"+url+"','"+tweets[i].in_reply_to_status_id_str+"','null','"+tweetimage+"','TweetSearch')");
			this.dbttagit.query("insert into tweets_search (ttagit_user_screen_name, search_id, tweet_id) values ('"+user_screen_name+"','"+search_id+"','"+tweets[i].id_str+"')");
		}
	},

	removeMostOldsOfSearch: function (search_id,x_last){
		if(!ttagit.userLogged()){ return false; }

		var res,cant_tweets,cant,q,ids_tweets,
		user = ttagit.getLoggedUserName();

		res = ttagit.dbttagit.query("SELECT count(*) as cant_tweets FROM tweets_search WHERE (ttagit_user_screen_name = '"+user+"'  AND search_id = '"+search_id+"')");
		if(typeof(res[0]) =="undefined"){ return false; }

		cant_tweets = res[0].cant_tweets;
		if(cant_tweets <= x_last) { return false; }

		cant = cant_tweets - x_last;
		q = "SELECT T.tweet_id tweet_id FROM (SELECT tweet_id FROM tweets_search WHERE (ttagit_user_screen_name = '"+user+"'  AND search_id = '"+search_id+"')) S, (SELECT * FROM tweets WHERE (type_tweet = 'TweetSearch')) T WHERE T.tweet_id = S.tweet_id ORDER BY T.created ASC LIMIT "+cant;
		res = ttagit.dbttagit.query(q);

		ids_tweets = "('";
		for(var i=0;i<res.length;i++){
			if(i == 0){ ids_tweets += res[i].tweet_id; } else { ids_tweets += "','"+res[i].tweet_id; }
		}
		ids_tweets +="')";

		ttagit.dbttagit.query("DELETE FROM tweets WHERE ( ttagit_user_screen_name = '"+user+"' AND tweet_id IN "+ids_tweets+")");
		ttagit.dbttagit.query("DELETE FROM tweets_search WHERE ( ttagit_user_screen_name = '"+user+"' AND tweet_id IN "+ids_tweets+")");
	},

	//realiza una busqueda temporal
	//guarda los twits en una tabla temporal

	startTempSearch: function (query) {
		if(!ttagit.userLogged()){ return false; }

		if ($.trim(query) == '') { return false; }

		this.viewController.viewInterface.waitPage('show');
		this.loadTweetsOfSearch(query);
	},

	loadTweetsOfSearch: function (query){
		if(!ttagit.userLogged()){ return false; }

		ttagit.utils.callHandler({"f1":"search","p1":[ttagit.encript.rawEncode(query),''],"f2":"ttagit.saveAndShowTweetsOfSearch","p2":null},'twitter');
	},

	saveAndShowTweetsOfSearch: function (tweets){

		if(!ttagit.userLogged()){ return false; }

		if(typeof(tweets.error)!="undefined" || typeof(tweets.errors)!="undefined"){
			this.viewController.viewInterface.waitPage('hide');
			this.showErrorMessage('Twitter isn\'t responding');
			return false;
		}

		this.saveTweetsOfSearchInTemp(tweets);

		this.viewController.showSearches();
		this.viewController.showTempSearchTweets();
	},

	saveTweetsOfSearchInTemp: function (founds){
		if(!ttagit.userLogged()){ return false; }

		var tweets,url,d,tweetimage,
		user_screen_name = this.getLoggedUserName();

		ttagit.dbttagit.query("DELETE FROM temp_tweets WHERE ( ttagit_user_screen_name = '"+user_screen_name+"' AND type_tweet = 'TweetSearch')");

		tweets = founds.statuses;
		for(var i=0;i<tweets.length;i++){

			tweetimage='';
			if(typeof(tweets[i].entities.media) != "undefined" && tweets[i].entities.media[0].type=='photo'){
				tweetimage= tweets[i].entities.media[0].media_url_https+':small';
			}

			url = "http://twitter.com/#!/"+tweets[i].from_user+"/status/"+tweets[i].id_str;
			d= Date.parse(tweets[i].created_at);
			try{
				this.dbttagit.query("insert into temp_tweets (tweet_id, ttagit_user_screen_name, created, text, source, favorited, retweeted_by, retweet_id, owner_id, owner_screen_name, image , url, in_reply_to_status_id, in_reply_to_screen_name, tweet_image, type_tweet) values ('"+tweets[i].id_str+"','"+user_screen_name+"','"+d+"','"+ttagit.encript.rawEncode(tweets[i].text)+"','"+tweets[i].source.replace("'","&#39;")+"','0','null','null','"+tweets[i].user.id_str+"','"+tweets[i].user.screen_name+"','"+tweets[i].user.profile_image_url+"','"+url+"','"+tweets[i].in_reply_to_status_id_str+"','null', '"+tweetimage+"', 'TweetSearch')");
			}catch(e){
			}
		}
	},

	//Guarda una busqueda temporal

	saveTempSearch: function (query, name){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(name) =="undefined"){
			name = query;
		}

		//report
		ttagit.reports.add('Session.saved_searches');

		ttagit.utils.callHandler({"f1":"saveSearch","p1":[query],"f2":"ttagit.afterSaveTempSearch","p2":[name]},'twitter');
	},

	afterSaveTempSearch: function (name, search){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(search.errors)!="undefined"){
			this.showErrorMessage(search.errors[0]['message']);
			ttagit.viewController.viewInterface.setSearchButton('save search');
			ttagit.viewController.viewInterface.setSearchText(name);
			return false;
		}

		var respond,tweets,i,asearch,
		user_screen_name = this.getLoggedUserName();

		respond = ttagit.dbttagit.query("insert into searches (ttagit_user_screen_name, search_id, name, query) values ('"+user_screen_name+"','"+search.id_str+"','"+name+"','"+search.query+"')");
		tweets = this.dbttagit.query("SELECT * FROM temp_tweets WHERE (ttagit_user_screen_name = '"+user_screen_name+"' AND type_tweet = 'TweetSearch')");

		for(i=0;i<tweets.length;i++){
			this.dbttagit.query("insert into tweets (tweet_id, ttagit_user_screen_name, created, text, source, favorited, retweeted_by, retweet_id, owner_id, owner_screen_name, image , url, in_reply_to_status_id, in_reply_to_screen_name, tweet_image, type_tweet) values ('"+tweets[i].tweet_id+"','"+tweets[i].ttagit_user_screen_name+"','"+tweets[i].created+"','"+tweets[i].text+"','"+tweets[i].source.replace("'","&#39;")+"','"+tweets[i].favorited+"','"+tweets[i].retweeted_by+"', '"+tweets[i].retweet_id+"','"+tweets[i].owner_id+"','"+tweets[i].owner_screen_name+"','"+tweets[i].image+"','"+tweets[i].url+"','"+tweets[i].in_reply_to_status_id+"','"+tweets[i].in_reply_to_screen_name+"','"+tweets[i].tweet_image+"','TweetSearch')");
			this.dbttagit.query("insert into tweets_search (ttagit_user_screen_name, search_id, tweet_id) values ('"+user_screen_name+"','"+search.id_str+"','"+tweets[i].tweet_id+"')");
		}

		asearch = this.dbttagit.query("SELECT * FROM searches WHERE id = " + respond + " LIMIT 1");

		ttagit.viewController.addNewSearch( asearch[0].search_id, asearch[0].name );

		ttagit.taskScheduler.add({"f1":"ttagit.loadTweetsOfSavedSearch","p1":[asearch[0].search_id]},1);
	},

	//borra una busqueda en particular

	deleteSearch: function (search_id){
		if(!ttagit.userLogged()){ return false; }

		ttagit.utils.callHandler({"f1":"deleteSearch","p1":[search_id],"f2":"ttagit.afterDeleteSearch","p2":null},'twitter');
	},

	afterDeleteSearch: function (response){
		if(!ttagit.userLogged()){ return false; }

		if(typeof(response.error)!="undefined" || typeof(response.errors)!="undefined"){
			//	this.showErrorMessage(response.error);
			return false;
		}

		var q,res,ids_tweets,
		user_screen_name = this.getLoggedUserName();

		q = "SELECT T.tweet_id tweet_id FROM (SELECT tweet_id FROM tweets_search WHERE (ttagit_user_screen_name = '"+user_screen_name+"' and search_id='"+response.id_str+"')) S, (SELECT * FROM tweets WHERE (type_tweet = 'TweetSearch')) T WHERE T.tweet_id = S.tweet_id ORDER BY T.tweet_id";
		res = ttagit.dbttagit.query(q);

		ids_tweets = "('";
		for(var i=0;i<res.length;i++){
			if(i!=0){
				ids_tweets += "','"+res[i].tweet_id;
			}else{
				ids_tweets += res[i].tweet_id;
			}
		}
		ids_tweets +="')";

		ttagit.dbttagit.query("DELETE FROM tweets WHERE ( ttagit_user_screen_name = '"+user_screen_name+"' AND tweet_id IN "+ids_tweets+")");
		ttagit.dbttagit.query("DELETE FROM searches WHERE ( ttagit_user_screen_name = '"+user_screen_name+"' AND search_id ='"+response.id_str+"')");
		ttagit.dbttagit.query("DELETE FROM tweets_search WHERE ( ttagit_user_screen_name = '"+user_screen_name+"' AND search_id ='"+response.id_str+"')");
	},

	//borra todas las busquedas
	//cuando se borra un usuario || cuando se actualizan las busquedas

	deleteSearches: function (){
		if(!ttagit.userLogged()){ return false; }

		var user_screen_name = ttagit.getLoggedUserName();

		ttagit.dbttagit.query("DELETE FROM searches WHERE ttagit_user_screen_name = '"+user_screen_name+"'");
	},

	// obtiene el id del ultimo twit guardado

	getLastTweetSearchId: function (search_id){
		if(!ttagit.userLogged()){ return false; }

		var q,res,
		user_screen_name = this.getLoggedUserName();

		q = "SELECT T.tweet_id tweet_id FROM (SELECT tweet_id FROM tweets_search WHERE (ttagit_user_screen_name = '"+user_screen_name+"' and search_id='"+search_id+"')) S, (SELECT * FROM tweets WHERE (type_tweet = 'TweetSearch')) T WHERE T.tweet_id = S.tweet_id ORDER BY T.created DESC LIMIT 1";
		res = ttagit.dbttagit.query(q);

		if(typeof(res[0])=="undefined"){ return false; }

		return res[0].tweet_id;
	},

	// checkea si el query pasado ya es una busqueda guardada

	is_a_savedSearch: function (query, query_is_id){
		if(!ttagit.userLogged()){ return false; }

		var res,
		user_screen_name = this.getLoggedUserName();

		if (query_is_id){
			res = ttagit.dbttagit.query("SELECT query FROM searches WHERE search_id='"+query+"' AND ttagit_user_screen_name='"+user_screen_name+"'");
		}else{
			res = ttagit.dbttagit.query("SELECT query FROM searches WHERE query='"+query+"' AND ttagit_user_screen_name='"+user_screen_name+"'");
		}

		if(typeof(res[0])!="undefined"){ return false; }

		return true;
	},

//--------------------------------------------
//	 SHORT URL
//--------------------------------------------

	ShortenURL: function (tweet,url,action){
		if(!ttagit.userLogged()){ return false; }

		ttagit.reports.add('Session.links');
		ttagit.utils.callHandler({"f1":"short","p1":[url],"f2":"ttagit.afterShortenURL","p2":[tweet,url,action]},'shortenUrl');
	},

	afterShortenURL: function (tweet,url,action,response){
		if(!ttagit.userLogged()){ return false; }

		var DM,image_url,msg,DM_recipient_name,DM_recipient_id;

		if(action == 'change'){
			tweet = ttagit.viewController.viewInterface.getTweetTextarea();
			ttagit.viewController.viewInterface.setTweetTextarea(tweet.replace(url,response));
		}else if(action == 'changeDM'){
			DM = ttagit.viewController.viewInterface.getDMTextarea();
			ttagit.viewController.viewInterface.setDMTextarea(DM.replace(url,response));
		}else if(action == 'post'){
			tweet = tweet.replace(url,response);

			if(ttagit.cookie.exist("image_attached")){//si hay una imagen cargada
				if(ttagit.mediaUploader.uploader != "pikchur"){
					//vuelvo a setear el tweet para que postphoto lo tome.
					ttagit.viewController.viewInterface.setTweetTextarea(tweet);
					//si la imagen se envia por twitter
					ttagit.postPhoto();//hago el tweet por medio de la funcion postPhoto.
					ttagit.viewController.viewInterface.cancelTweet();//contrae el textarea y elimina las cookies
				}else{
					//si la imagen se envia por pikchur. entonces la imagen ya se envio y solo queda concatenar la imagen
					image_url = ttagit.cookie.read("image_attached");//leo la url de la imagen.
					tweet = tweet+" "+image_url;//concateno la imagen al tweet.
					ttagit.updateStatus(tweet);//hago el tweet.
					ttagit.viewController.viewInterface.cancelTweet();//contrae el textarea y elimina las cookies
				}
			}else{
				ttagit.updateStatus(tweet);//hago el tweet.
				ttagit.viewController.viewInterface.cancelTweet();//contrae el textarea y elimina las cookies
			}

		}else if(action == 'sendDM'){
			DM_recipient_id = ttagit.cookie.read('DM_recipient_id');
			DM_recipient_name = ttagit.cookie.read('DM_recipient_name');
			msg = ttagit.cookie.read('DM_msg');

			ttagit.sendDirectMessage(DM_recipient_name,DM_recipient_id,msg.replace(url,response));
			ttagit.cookie.remove('DM_recipient_id');
			ttagit.cookie.remove('DM_recipient_name');
			ttagit.cookie.remove('DM_msg');
			ttagit.viewController.viewInterface.cancelDM();
		}
	},

//--------------------------------------------
//	 POSTS IMAGE
//--------------------------------------------

	postPhoto: function (){
		if(!ttagit.userLogged()){ return false; }

		if(ttagit.mediaUploader.uploader == "pikchur"){
			ttagit.viewController.viewInterface.waitPage("show");
			ttagit.viewController.viewInterface.setStatusSubmit("disabled");
			ttagit.showErrorMessage("wait until we load the image");

		}
		//ttagit.viewController.viewInterface.setInputFile("enabled");

		ttagit.mediaUploader.setForm(document.getElementById('form'));//seteo el form de tweets
		ttagit.reports.add('Session.pictures');

		if(ttagit.mediaUploader.uploader == "twitter"){//Si se envia la imagen por twitter
			//copio el texto del tweet al input text del form antes de enviar

			//si se esta haciendo un reply entonces tengo que obtener el id del tweet.
			if(ttagit.cookie.exist('in_reply_to_status_id')){
				var in_reply_to_status_id = '';
				in_reply_to_status_id = ttagit.cookie.read('in_reply_to_status_id');
				ttagit.reports.add('Session.replies');
				ttagit.cookie.remove('in_reply_to_status_id');
				$("#twitter_reply").val(in_reply_to_status_id);
			}
			$("#twitter_status").val(ttagit.viewController.viewInterface.getTweetTextarea());
		}

		ttagit.utils.callHandler({"f1":"sharePhoto","p1":["tweet"],"f2":"ttagit.afterPostPhoto","p2":null},'mediaUploader');
	},

	afterPostPhoto: function (response){
		if(!ttagit.userLogged()){
			//oculto la pantalla de wait
			ttagit.viewController.viewInterface.waitPage("hide");
			return false;
		}
		//oculto la pantalla de wait
		ttagit.viewController.viewInterface.waitPage("hide");

		if(ttagit.mediaUploader.uploader == "pikchur"){
			if(response.status=="fail"){
				this.showErrorMessage("Sorry, we had trouble loading the image");
				return false;
			}

			ttagit.cookie.create("image_attached",response.mediaurl);
		}else{//si se envio la imagen a twitter.
			//recargo el timeline
			ttagit.loadTimeLineTweets();
		}
		ttagit.viewController.viewInterface.setStatusSubmit("enabled");
	},

	postPhotoDM: function (){
		if(!ttagit.userLogged()){ return false; }

		ttagit.mediaUploader.setForm(document.getElementById('formDM'));//seteo el form de mensajes directos
		ttagit.utils.callHandler({"f1":"sharePhoto","p1":["DM"],"f2":"ttagit.afterPostPhotoDM","p2":null},'mediaUploader');
		ttagit.viewController.viewInterface.setDMSubmit("disabled");
		ttagit.viewController.viewInterface.notificationOnDM("show","wait until we load the image");
	},

	afterPostPhotoDM: function (response){
		if(!ttagit.userLogged()){ return false; }

		var tweet;

		if(response.status=="fail"){
			ttagit.viewController.viewInterface.notificationOnDM("show","Sorry, we had trouble loading the image");
			return false;
		}

		ttagit.viewController.viewInterface.notificationOnDM("hide","");
		tweet = ttagit.viewController.viewInterface.getDMTextarea();
		tweet += ' '+response.mediaurl + ' ';
		ttagit.viewController.viewInterface.setDMTextarea(tweet);
		ttagit.viewController.viewInterface.setDMSubmit("enabled");
	},

//--------------------------------------------
//	 MISC
//--------------------------------------------
	getConfiguration: function (){
		ttagit.utils.callHandler({"f1":"getConfiguration","p1":null,"f2":"ttagit.afterGetConfiguration","p2":null},'twitter');
	},

	afterGetConfiguration: function (response){
		ttagit.http_short_url_length = response.short_url_length;
	},

	getPrefTimeRateOfUser: function (){
		var q,res,
		user_screen_name = this.getLoggedUserName();

		q = "SELECT P.reload_rate reload_rate FROM (SELECT user_preferences FROM users WHERE (name = '"+user_screen_name+"')) U , (SELECT * FROM preferences WHERE 1) P WHERE P.id = U.user_preferences";
		res = ttagit.dbttagit.query(q);

		if(typeof(res[0])=="undefined"){ return false; }

		return parseInt(res[0].reload_rate);
	},

	getCurrentDateTime: function (){
		var month,day,year,hours,minutes,seconds,date,
		currentTime = new Date();

		month = currentTime.getMonth() + 1;
		day = currentTime.getDate();
		year = currentTime.getFullYear();
		hours = currentTime.getHours();
		minutes = currentTime.getMinutes();
		seconds = currentTime.getSeconds();
		date = year +"-"+month +"-"+day+" "+hours+":"+minutes+":"+seconds;
		return date;
	},

	userLogged: function (){
		if(ttagit.logedUser == null){ return false; }
		return true;
	},

	/**
	 * Return the username of authenticated user
	 *
	 * @param ---
	 * @access public
	 */
	getLoggedUserName: function (){
		var user_screen_name = "anonymous";
		if(ttagit.logedUser != null){
			user_screen_name = ttagit.logedUser.screen_name;
		}
		return user_screen_name;
	},

	getLoggedUserId: function (){
		var user_id = false;
		if(ttagit.logedUser != null){
			user_id = ttagit.logedUser.twitter_id;
		}
		return user_id;
	},

	/**
	 * Return a user
	 *
	 * @param id of Ttagit user
	 * @access public
	 */
	getUser: function (id){
		var res = this.dbttagit.query("select * FROM users WHERE id='"+id+"'");

		if(typeof(res[0])!="undefined"){ return res; }

		return false;
	},

	/**
	 * Return a user
	 *
	 * @param id of Ttagit user
	 * @access public
	 */
	getUsers: function (){
		var res = this.dbttagit.query("select name, id, profile_image FROM users");
		if(typeof(res[0])!="undefined"){
			return res;
		}
		return false;
	},

	getTweet: function (tweet_id){
		if(!ttagit.userLogged()){ return false; }

		var res,res_temp,
		user_screen_name = this.getLoggedUserName();

		res = ttagit.dbttagit.query("SELECT * FROM tweets WHERE (  ttagit_user_screen_name = '"+user_screen_name+"' and tweet_id='"+tweet_id+"')");
		res_temp = ttagit.dbttagit.query("SELECT * FROM temp_tweets WHERE (  ttagit_user_screen_name = '"+user_screen_name+"' and tweet_id='"+tweet_id+"')");
		if(typeof(res[0])!="undefined"){
			return res[0];
		}else if(typeof(res_temp[0])!="undefined"){
			return res_temp[0];
		}
		return false;
	},

	getDM: function (dm_id){
		if(!ttagit.userLogged()){ return false; }

		var res,
		user_screen_name = this.getLoggedUserName();

		res = ttagit.dbttagit.query("SELECT * FROM direct_messages WHERE (  ttagit_user_screen_name = '"+user_screen_name+"' and direct_message_id='"+dm_id+"')");
		if(typeof(res[0])!="undefined"){
			return res[0];
		}
		return false;
	},

	functionsToExecuteOnInit: function (){
		if(!ttagit.cookie.exist("functions_on_init",'global')){ return true; }

		var functions,jsonFunction,paramsString,params,i,j,
		functions_string = ttagit.cookie.read("functions_on_init",'global');

		ttagit.cookie.remove("functions_on_init",'global');

		functions = functions_string.split("||");

		for(i=0;i<functions.length;i++){
			jsonFunction = jQuery.parseJSON(functions[i]);

			//armo el arreglo de parametros nuevamente, porque me llega como un string
			paramsString = jsonFunction.p1.split(",");
			params = [];

			for(j=0;j<paramsString.length;j++){
				params.push(paramsString[j].toString());
			}

			//vuelvo a setear el arreglo de parametros bien formado
			jsonFunction.p1 = params;
			//llamo a la funcion
			ttagit.callback.execute(jsonFunction);
		}

		ttagit.onInitSession = false;
	},

	setFunctionToExecuteOnInit: function (functionToExec,params){

		//esta funcion deberia recibir un string con la funcion a ejecutar y ademas un arreglo con los parametros para la funcion.
		var functions,
		stringJSON = "{\"f1\":\""+functionToExec+"\",\"p1\":\""+params.toString()+"\"}";

		if(ttagit.cookie.exist("functions_on_init",'global')){//en el caso de que ya haya otras funciones cargadas
			functions = ttagit.cookie.read("functions_on_init",'global');
			ttagit.cookie.remove("functions_on_init",'global');

			//aca en lugar de concatenar la funcion. lo que se deberia hacer es crear un json pero en forma de string y luego concatenarlo.
			functions += "||"+stringJSON;
		}else{
			functions = stringJSON;
		}

		ttagit.cookie.create("functions_on_init",functions);
	},

	savePreferences: function (sidebar_position,image_uploader,reload_rate,secure,password){
		if(!ttagit.userLogged()){ return false; }

		var res,res1,
		user_screen_name = this.getLoggedUserName();

		res = ttagit.dbttagit.query("SELECT user_preferences, password FROM users WHERE (name = '"+user_screen_name+"')");
		if(typeof(res[0])=="undefined"){ return false; }

// 				ttagit.setImageUploader(image_uploader);
		res1 = ttagit.dbttagit.query("UPDATE users SET password = '' WHERE (name = '"+user_screen_name+"')");
		if(secure){//el usuario esta guardando una cuenta segura.
			if(ttagit.cookie.exist("password_on_pref")){
				password = res[0].password;
				ttagit.cookie.remove("password_on_pref");
			}
			res1 = ttagit.dbttagit.query("UPDATE users SET password = '"+password+"' WHERE (name = '"+user_screen_name+"')");
		}
		res = ttagit.dbttagit.query("UPDATE preferences SET reload_rate="+reload_rate+", sidebar_position ='"+sidebar_position+"', image_uploader ='"+image_uploader+"' WHERE(id = '"+res[0].user_preferences+"')");
		ttagit.loadPreferences(user_screen_name);
		ttagit.taskScheduler.setRateTime(reload_rate);
		ttagit.viewController.viewInterface.hidePreferences();
	},

	removeTweetsCookies: function (){
		//si existe la cookie para reply entonces la borro
		if(ttagit.cookie.exist('in_reply_to_status_id')){
			ttagit.cookie.remove('in_reply_to_status_id');
		}
		if(ttagit.cookie.exist('image_attached')){
			ttagit.cookie.remove('image_attached');
		}
	},

	haveUrl: function (tweet){
		var j,matching,
		match = tweet.match(/\(?(?:(http|https|ftp):\/\/)?(?:((?:[^\W\s]|\.|-|[:]{1})+)@{1})?((?:www.)?(?:[^\W\s]|\.|-)+[\.][^\W\s]{2,4}|localhost(?=\/)|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d*))?([\/]?[^\s\?]*[\/]{1})*(?:\/?([^\s\n\?\[\]\{\}\#]*(?:(?=\.)){1}|[^\s\n\?\[\]\{\}\.\#]*)?([\.]{1}[^\s\?\#]*)?)?(?:\?{1}([^\s\n\#\[\]]*))?([\#][^\s\n]*)?\)?/gi);

		if(!match){ return false; }//no hay urls en el tweet

		for(j in match){//busco entre todas las urls del tweet una que no este acortada
			matching = match[j];
			if(matching.length > 20){// solo busco las urls que tienen mas de 20 caracteres para acortarlas
				return matching;//si encuentro una url no acortada entonces la retorno
			}
		}
		return false;// no habian urls no acortadas
	},

	openUrl: function (url) {
		var gBrowser=this.mainWindow.getBrowser();

		gBrowser.selectedTab = gBrowser.addTab(url);
	},

	openAuthorizeUrl: function (url) {
		var newTabBrowser,html_obtained,matches,PIN_aux,PIN,
		gBrowser=this.mainWindow.getBrowser();

		gBrowser.selectedTab = gBrowser.addTab(url);
		newTabBrowser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
		newTabBrowser.addEventListener("load", function () {
			if(ttagit.permitedAccessForTtagit()){
				html_obtained = newTabBrowser.contentDocument.body.innerHTML;
				matches = html_obtained.match(/<code>[0-9a-zA-Z]*<\/code>/g);
				if(matches != null) {
					PIN_aux = matches[0].replace("<code>","");
					PIN = PIN_aux.replace("</code>","");
					ttagit.viewController.viewInterface.SetPIN_OnFields(PIN);
				}
			}
		}, true);
	},

	openUrlBAN: function (url) {
		var uri,cookieSvc,cookie,aux,obj,c_value,exdate,i,j,x,y,ARRcookies,
		gBrowser=this.mainWindow.getBrowser(),
		ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

		uri = ios.newURI("http://d1.openx.org/", null, null);
		cookieSvc = Components.classes["@mozilla.org/cookieService;1"].getService(Components.interfaces.nsICookieService);
		cookie = cookieSvc.getCookieString(uri, null);
		ARRcookies=cookie.split(";");

		for (i=0;i<ARRcookies.length;i++)
		{
			x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
			y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
			x=x.replace(/^\s+|\s+$/g,"");
			if ( x == 'OAVARS[default]')
			{
					y=decodeURIComponent(y);
					y= y.replace(/a:[0-9]*\:\{/g, '');
					y= y.replace(/s:[0-9]*\:/g, '');
					y= y.replace(/\i\:/g, '');
					y= y.replace(/\"/g, '');
					y= y.replace(/\}/g, '');
					y=y.split(';');
					obj='{';
					for (j=0; j < y.length -1; j++ )
					{
						obj+= '"' +y[j]+ '": "' + y[j+1]+ '"';
						if ((j + 2) !=  (y.length -1) ) { obj+= ','; }
						j++;
					}
					obj += "}";
					aux = $.parseJSON (obj);
					url=url.replace(/TWITBINA/i, aux.bannerid)
						.replace(/TWITBINA/i, aux.bannerid)
						.replace(/TWITBINB/i, aux.OXLCA)
						.replace(/TWITBINC/i, aux.r_id)
						.replace(/TWITBIND/i, aux.r_ts)
						.replace(/TWITBINE/i, aux.oadest);
					break;
			}
		}

		gBrowser=this.mainWindow.getBrowser();
		gBrowser.selectedTab = gBrowser.addTab(url);
	},

	permitedAccessForTtagit: function () {
		var gBrowser=this.mainWindow.getBrowser();
		if (gBrowser.contentDocument.location == 'https://api.twitter.com/oauth/authorize') {
			return true;
		}
		return false;
	},

	closeTwitterPinPage: function () {
		var gBrowser=this.mainWindow.getBrowser();
		gBrowser.removeCurrentTab();
	},

//--------------------------------------------
//	 TO SORT
//--------------------------------------------

	//llmara directamente a view interface
	showErrorMessage: function (msg){
		if((msg == null) || (msg == 'null')){return true;}
		ttagit.viewController.viewInterface.notificationArea("show","info",msg);
	},

	/**
	 * UNLOCK TWITBIN FUNCTIONS
	 **/
	unlockCheck: function (){

		var jsonToSend = '{"twitter_user":"'+ttagit.twitter.LoggedUser.screen_name+'"}',
		connectionId = ttagit.xhr.getConnetion();

		ttagit.xhr.setURL("http://ttagit.com/s/api/v1/status/check",connectionId);

		//jsonToSend = ttagit.debug.jsonToString(this.statistics);
		paramsToSend = "data[info]="+encodeURI(jsonToSend);

		ttagit.xhr.setPost(paramsToSend,connectionId);

		ttagit.xhr.setOnLoadFunction (function(data){
			var response = jQuery.parseJSON(data);

			ttagit.taskScheduler.remove("ttagit.unlockCheck");

			if(response.status == 'ok'){
				ttagit.viewController.viewInterface.unlockPage('hide');
			}else if(response.status == 'fail'){
				ttagit.viewController.viewInterface.unlockPage('show');
			}
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

	unlockApp: function(time){

		switch(time)
		{
			case 'one year':
				var usersToSend = "",
				users = ttagit.dbttagit.query("SELECT name FROM users");

				for(var i=0; i<users.length;i++){
					if(i>0){
						usersToSend += ",";
					}
					usersToSend += users[i].name;
				}

				var url = "http://ttagit.com/s/"+ttagit.encript.base64.encode(usersToSend);
				ttagit.openUrl(url);
				ttagit.taskScheduler.notExecuteInmediatly();// this only work for the next add.
				ttagit.taskScheduler.add({"f1":"ttagit.unlockCheck","p1":null},'15');
				ttagit.viewController.viewInterface.unlockPage('hide');
			break;

			case 'two days':
				var jsonToSend = '{"twitter_user":"'+ttagit.twitter.LoggedUser.screen_name+'"}',
				connectionId = ttagit.xhr.getConnetion();

				ttagit.xhr.setURL("http://ttagit.com/s/api/v1/status/update",connectionId);

				//jsonToSend = ttagit.debug.jsonToString(this.statistics);
				paramsToSend = "data[info]="+encodeURI(jsonToSend);

				ttagit.xhr.setPost(paramsToSend,connectionId);

				ttagit.xhr.setOnLoadFunction (function(data){
					var response = jQuery.parseJSON(data);
					if(response.status == 'ok'){
						ttagit.viewController.viewInterface.unlockPage('hide');
						ttagit.openUrl("http://ttagit.com/ads/unlock");
					}
				},connectionId);

				ttagit.xhr.send(connectionId);
			break;
		}
	},

	/**
	 * -------------------------------------------
	 **/

}//of prototype ttagit
