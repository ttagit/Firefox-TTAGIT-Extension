
	$(document ).tooltip();

//--------------------------------------------
//	 LOGIN USER
//--------------------------------------------

	$(".usersOnTheSystem li").live("click", function(){
		var res,
		userData = $(this).attr('id').split('|'),//obtengo el id del usuario seleccionado
		userID = userData[0],//obtengo el id del usuario seleccionado
		hasPassword =false;

		// verificar si el usuario  elegido tiene password password
		res = ttagit.dbttagit.query("SELECT password FROM users WHERE( id='"+userID+"')");
		if(typeof(res[0])== "undefined"){ return false; }

		if(res[0].password !=''){
			//mostrar el pasword form
			ttagit.viewController.viewInterface.loginPaswordForm('show');
			// guardar en que usuario se hizo click para poder tomar los datos despues de que ingreso el pass
			ttagit.cookie.create("selectedUser",userID);
			//ttagit.cookie.create("pass_"+userID,userPass);
		}else{
			//ocultar el mensaje de error de logueo si se esta mostrando.
			ttagit.viewController.viewInterface.messageForLogin('hide');
			//mostrar whait page
			ttagit.viewController.viewInterface.waitPage('show');
			//loqueo al usuario seleccionado
			ttagit.LogUser(userID);
		}

		return false;
	});

	$("#secureaccount a.cancelsecure").live("click", function(){
		ttagit.viewController.viewInterface.loginPaswordForm('hide');
		return false;
	});

	$("#secureaccount a.signAccount").live("click", function(){
		$("#secureaccount p.password_error").hide('fast');

		var res,userPass, userName,
		userID = ttagit.cookie.read("selectedUser"),
		pass_inserted = ttagit.encript.sha1.b64_sha1($('#login_userpass').val());

		res = ttagit.dbttagit.query("SELECT name, password FROM users WHERE( id='"+userID+"')");

		if(typeof(res[0]) == "undefined" ){
			$("#secureaccount #login_userpass").val('');
			$("#secureaccount p.password_error").show('fast');
			return false;
		}

		userName = ttagit.encript.sha1.b64_sha1(ttagit.encript.sha1.b64_sha1( res[0].name + 'ALLYOUNEEDISLOVE' ).substring(0,10));
		userPass = res[0].password;

		if(typeof(res[0]) == "undefined" || $.inArray(pass_inserted, [userPass, userName ]) == -1 ){
			$("#secureaccount #login_userpass").val('');
			$("#secureaccount p.password_error").show('fast');
			return false;
		}

		$("#secureaccount #login_userpass").val('');
		ttagit.viewController.viewInterface.waitPage('show');

		ttagit.cookie.remove("selectedUser");
		ttagit.LogUser(userID);//loqueo al usuario seleccionado

		return false;
	});

//--------------------------------------------
//	 DELETE USER
//--------------------------------------------

	$(".usersOnTheSystem li a.close").live("click", function(){
		$(this).parent().find("img, .close, .username").hide();
		$(this).next().fadeIn();
		return false;
	});

	$(".hiddenConfirmation .cancel").live("click", function(){
		$(this).parents("li").find(".hiddenConfirmation").hide();
		$(this).parents("li").find("img, .close, .username").fadeIn();
		return false;
	});

	$(".hiddenConfirmation .confirm").live("click", function(){
		var userData,userName;

		$(this).parents("li").fadeOut();

		userData = $(this).parents("li").attr('id').split('|');//obtengo el id del usuario seleccionado
		userName = userData[1];//obtengo el id del usuario seleccionado
		ttagit.deleteUserIfExist(userName);

		return false;
	});

//--------------------------------------------
//   CREATE ACCOUNT
//--------------------------------------------

    $("#btConfirm").click(function(){
        ttagit.viewController.viewInterface.clickConfirm();
        return false;
    });

    $("#btConfirmCancel").click(function(){
        ttagit.viewController.viewInterface.clickConfirmCancel();
        return false;
    });

//--------------------------------------------
//	 CREATE ACCOUNT
//--------------------------------------------

	//Evento para boton "Add New Account"
	$(".addNewAccount").click(function(){
		ttagit.requestPin();
		$(".addNewAccount").css('display', 'none');
		$("#addNewUserWhait").fadeIn();
		return false;
	});

	/*enter pin events*/
	$(".twitterValidation li input").keypress(function(e){
		var aux,next;

		//if ($(this).attr('id') == 'pin-1' ){ return false }

		if (e.which == 8 && $(this).val() == '' ){
			aux = $(this).attr('id').split('-');
			next = (parseInt(aux[1]) - 1);
			$(".twitterValidation li input#pin-" + next).focus();
			return false;
		}
	});

	$(".twitterValidation li input").keyup(function(e){
		var aux,next;

		if ($(this).attr('id') != 'pin-7' && e.which != 8 && $(this).val() != '')
		{
			aux = $(this).attr('id').split('-');
			next = (parseInt(aux[1]) + 1);
			$(".twitterValidation li input#pin-" + next).focus();
		}
	});

	//evento para comportamiento de checkboxs en addNewAccount
	$("#remember").click(function(){
		if($('#remember').attr('checked')){
			$("#securecheckbox").removeAttr('disabled');
			return false;
		}

		if(typeof($('#securecheckbox').attr('checked'))=="undefined"){//si box de seguridad no esta activado
			$("#securecheckbox").attr('disabled','true');//lo deshabilito
			return false;
		}

		$("#securecheckbox").attr('disabled','true');//lo deshabilito
		$("#addNewUser .secureIt").slideToggle();//lo cierro
		$('#securecheckbox').attr('checked', false);//elimino el check
		$("#pass").val('');//seteo a vacio los campos
		$("#pass_confirm").val('');//seteo a vacio los campos
	});

	//Evento para mostrar campos de seguridad al crear una nueva cuenta
	$("#securecheckbox").change(function(){
		if($('#remember').attr('checked')){
			$("#addNewUser .secureIt").slideToggle();
		}
	});

	//Evento para el boton de confirmacion para crear usuario.
	$("#addNewUser .createAccount").click(function(){
		var i,val,pass,pass_confirm,userPass,
		pin = '';

		$("#addNewUser p.password_error").hide('fast');
		$("#addNewUser p.pin_error_incomplete").hide('fast');
		$("#addNewUser p.pin_error_novalid").hide('fast');
		$("#addNewUser p.permit_access_first").hide('fast');

		//has sutorized ttagit?
		if( !ttagit.permitedAccessForTtagit()) {
			$("#addNewUser p.permit_access_first ").show('fast');
			return false;
		}

		for (i=1; i<8 ;i++ ) {
			val = $("#pin-"+i).val();
			if (val == ''){
				$("#addNewUser p.pin_error_incomplete").show('fast');
				return false;
			}
			pin+= val;
		}

		if(typeof($('#remember').attr('checked'))=="undefined"){
			ttagit.authorize('Notremember','', pin);//envia el pedido de autorizacion a twitter. y el pass a la funcion que guarda el usuario en ttagit.
			return false;
		}

		//si se debe recordar el usuario en ttagit
		if(typeof($('#securecheckbox').attr('checked'))=="undefined"){
			ttagit.authorize('remember','', pin);//envia el pedido de autorizacion a twitter.
			return false;
		}

		pass = $("#pass").val();
		pass_confirm = $("#pass_confirm").val();

		if(pass != pass_confirm){
			$("#addNewUser p.password_error").show('fast');
			return false;
		}

		userPass = ttagit.encript.sha1.b64_sha1(pass);
		ttagit.authorize('remember',userPass, pin);//envia el pedido de autorizacion a twitter. y el pass a la funcion que guarda el usuario en ttagit.
		return false;
	});

	//Evento para cancelar la creacion de una nueva cuenta
	$("#addNewUser .cancelCreate").click(function(){
		ttagit.viewController.viewInterface.AddUserForm('hide');
		return false;
	});

//--------------------------------------------
//	 SYTEM MENU DROP DOWN
//--------------------------------------------

	//menu drop down: open
	$(".options").click(function(){
		$(this).addClass("active").parent().find(".somePadding").fadeIn("500");

		return false;
	});

	//menu drop down: close
	$(".optionsWrapper").mouseleave(function(){
		$(this).parent().find(".somePadding").fadeOut("500");
		$(".options").removeClass("active");
	});

	//menu drop down option: close ttagit
	$("#closeTtagit").click(function(){
		$("#somePadding").fadeOut("500");
		$("#options").removeClass("active");
		window.top.toggleSidebar('TtagitSideBar');
	});

	//menu drop down option: signout
	$("#signOutTtagit").click(function(){
		$("#somePadding").fadeOut("500");
		$("#options").removeClass("active");
		ttagit.logOut();
	});

	//menu drop down option: preferences
	$(".optionsWrapper a#option_Pref").click(function(){
		ttagit.viewController.viewInterface.showPreferences();
		return false;
	});

	$("#Preferences .cancelPreferences").click(function(){
		ttagit.viewController.viewInterface.hidePreferences();
		return false;
	});

	$("#Preferences .savePreferences").click(function(){
		var pass_confirm,
		sidebar_position = "left",
		image_uploader = "pikchur",
		reload_rate = $("#reload_rate option:selected").val(),
		pass = "",
		secure = false;

		if(!$('#left_sidebar').attr('checked')){
			sidebar_position = "right";
		}

		if($('#twitter_uploader').attr('checked')){
			image_uploader = "twitter";
		}

		if(typeof($('#securecheckbox_pref').attr('checked'))=="undefined"){
			ttagit.savePreferences(sidebar_position,image_uploader,reload_rate,secure,pass);
			return false;
		}

		secure = true;
		pass = $("#pass_pref").val();
		pass_confirm = $("#pass_confirm_pref").val();
		if(pass != pass_confirm){
			$("#Preferences .secureIt .password_error").show();
			return false;
		}

		pass = ttagit.encript.sha1.b64_sha1(pass);
		ttagit.savePreferences(sidebar_position,image_uploader,reload_rate,secure,pass);
		return false;
	});

	$("#securecheckbox_pref").change(function(){
		$("#Preferences .secureIt").slideToggle();
	});

	$("#pass_pref").click(function(){
		if(ttagit.cookie.exist("password_on_pref")){
			$("#pass_pref").val("");
			$("#pass_confirm_pref").val("");
			ttagit.cookie.remove("password_on_pref");
		}
	});

	$("#pass_confirm_pref").click(function(){
		if(ttagit.cookie.exist("password_on_pref")){
			$("#pass_pref").val("");
			$("#pass_confirm_pref").val("");
			ttagit.cookie.remove("password_on_pref");
		}
	});


	$(".optionsWrapper a#option_muted").click(function(){
		ttagit.viewController.viewInterface.showMutedUsersList();
		return false;
	});

	$("#mutedUsers .mutedUsersGoBack").click(function(){
		ttagit.viewController.viewInterface.hideMutedUsersList();
		return false;
	});


	$(".mutedUserList li a.close").live("click", function(){
		var parent = $(this).parent();
		parent.find("img, .close, .username").hide();
		parent.find(".hiddenConfirmation").fadeIn();
		return false;
	});

	$(".mutedUserList li").live("click", function(){
		$(this).find("img, .close, .username").hide();
		$(this).find(".hiddenConfirmation").fadeIn();
		return false;
	});

	$("#mutedUsers .hiddenConfirmation .cancel").live("click", function(){
		$(this).parents("li").find(".hiddenConfirmation").hide();
		$(this).parents("li").find("img, .close, .username").fadeIn();
		return false;
	});

	$("#mutedUsers .hiddenConfirmation .confirm").live("click", function(){
		var userData,userName;

		$(this).parents("li").fadeOut();

		userData = $(this).parents("li").attr('id').split('|');//obtengo el id del usuario seleccionado
		userId = userData[0];//obtengo el id del usuario seleccionado
		ttagit.viewController.removeMutedUser(userId);

		return false;
	});

//--------------------------------------------
//	 MENU NAV (open tab)
//--------------------------------------------

	$("#navPrincipal > a").click(function() {
		ttagit.viewController.openTab($(this));
	});

//--------------------------------------------
//	 NEW TWEET
//--------------------------------------------

	//excribir en el text aread de un twit
	$("#searchbox textarea").focus(function(){
		// If it isn't opened
		if($(this).hasClass("opened")) { return false; }

		// Animations and text of opened state
		if($(this).val() == "Share something, " + ttagit.getLoggedUserName()) {
			$(this).val('');
		}

		$(this).animate({
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

		$(this).addClass("opened");

	});

	$("#searchbox textarea").keyup(function() {

		// Character counter
		var image_url,remaining,
		charLength = $(this).val().length;

		//correccion de carcteres faltantes al haber una imagen cargada
		//-------------------------------------------------------------
		if(ttagit.cookie.exist("image_attached")){//si hay una imagen cargada
			if(ttagit.mediaUploader.uploader != "pikchur"){
				charLength = charLength + ttagit.http_short_url_length + 1;//la url contiene 19 caracteres y sumo uno mas para el " "
			}else{
				image_url = ttagit.cookie.read("image_attached");//leo la url de la imagen.
				charLength = charLength + ttagit.http_short_url_length + 1 ;//le sumo el largo de la url mas uno por el " "
			}
		}
		//-------------------------------------------------------------

		remaining = 140 - charLength;
		$('.secondStep .counter').html(ttagit.utils.escapeHTML(remaining));

		if (remaining < 0) {
			$('.secondStep .counter').addClass("error");
			ttagit.viewController.viewInterface.setStatusSubmit("disabled");
		}else if (remaining >= 0) {
			$('.secondStep .counter').removeClass("error");
			ttagit.viewController.viewInterface.setStatusSubmit("enabled");
		}
	});

	$("#searchbox textarea").keypress(function(event) {
		var tweet,url;

		if(event.which == '13'){
			return true;
		}

		if(event.which == '32'){
			tweet = ttagit.viewController.viewInterface.getTweetTextarea();
			tweet += ' ';
			url = ttagit.haveUrl(tweet);

			if(url){
				ttagit.ShortenURL(tweet,url,'change');
			}
		}
	});

	//agregar una imagen al tweet
	$(".secondStep .positionMe .file-wrapper  input[type='file']").live("change",function() {
		ttagit.viewController.viewInterface.setInputFile("disabled");//desactivo la opcion para agregar mas imagenes
		$("#button").text("Picture attached");
		$("#button").addClass("itsdone");
		if(ttagit.mediaUploader.uploader == "pikchur"){//en el caso de que se este usando pikchur para subir la imagen llamo a postPhoto
			ttagit.postPhoto();
			$(this).val("");//reseteo el campo file.
		}else{
			ttagit.cookie.create("image_attached","twitter");
		}
	});

	//enviar un tweet
	$("#searchbox .secondStep input[type=submit]").click(function(){
		var url,
		tweet = ttagit.viewController.viewInterface.getTweetTextarea(),
		attached_image = ttagit.cookie.exist("image_attached"),
		image_url = ttagit.cookie.read("image_attached"),
		uploader = ttagit.mediaUploader.uploader;

		if(tweet.length > 140){ return false; }

		url = ttagit.haveUrl(tweet);
		if(url){
			//on ajax return it will ask for images in teh tweet.
			ttagit.ShortenURL(tweet,url,'post');
			return false;
		}

		//si hay una imagen cargada y envia por pikchur
		//la imagen ya se envio y solo queda concatenar la URL de la imagen
		if(attached_image && uploader == "pikchur" ){
			tweet = tweet+" "+image_url;//concateno la imagen al tweet.
			ttagit.updateStatus(tweet);//hago el tweet.
			ttagit.viewController.viewInterface.cancelTweet();//contrae el textarea y elimina las cookies
			return false;
		}

		//si hay una imagen cargada y envia por twitter
		//hago el tweet por medio de la funcion postPhoto.
		if(attached_image && uploader != "pikchur" ){
			ttagit.postPhoto();
			ttagit.viewController.viewInterface.cancelTweet();//contrae el textarea y elimina las cookies
			return false;
		}

		//no hay imagen envio normalmente
		ttagit.updateStatus(tweet);//hago el tweet.
		ttagit.viewController.viewInterface.cancelTweet();//contrae el textarea y elimina las cookies
		return false;
	});

	//cancellar un twitt
	$(".cancelTweet").click(function(){
		ttagit.viewController.viewInterface.cancelTweet();
		return false;
	});

//--------------------------------------------
//	 TWEET ACTIONS
//--------------------------------------------

	/* Tweet actions  reply, reply all, retweet, retweet with comments, favirite*/
	$(".timeline li .actions .default .relativeMe a.retweet, .timeline li .actions .default .relativeMe a.favorite").live("click", function(){
		var tweetId = $(this).parents("li").attr("id");

		if($(this).hasClass("retweet")){
			//$(this).addClass("retweeted");
			ttagit.viewController.viewInterface.confirmationPage ('retweet', 'Do you want to retweet this?', {"f1":"ttagit.retweetStatus","p1":[tweetId]});
			return false;
		}

		if ($(this).hasClass("favorite")) {
			$(this).appendTo($(this).parents(".actions").find(".selected .relativeMe"));
			$(this).addClass("active");//muestra la estrella amarilla
			ttagit.addTweetToFavorites(tweetId);//agrego el tweet a favoritos
		}

		return false;
	});

	$(".timeline li .actions .selected .relativeMe a.retweet, .timeline li .actions .selected .relativeMe a.favorite").live("click", function(){
		$(this).appendTo($(this).parents(".actions").find(".default .relativeMe"));

		var tweetId = $(this).parents("li").attr("id");

		if($(this).hasClass("retweet")){
			$(this).removeClass("retweeted");
			ttagit.removeRetweet(tweetId);//elimino el retweet
		} else if ($(this).hasClass("favorite")) {
			$(this).removeClass("active");//deja de mostrar la estrella amarilla
			ttagit.remTweetOfFavorites(tweetId);//elimino el tweet de favoritos
		}

		return false;
	});

	$(".timeline li .actions a.reply").live("click", function(){
		var username,tweetId;

		username = $(this).parents("li").find(".username").html();
		$("#shareTweet").focus().val("@"+username + " ").keyup();
		tweetId = $(this).parents("li").attr("id");

		ttagit.cookie.create('in_reply_to_status_id',tweetId);
		// Reset input file
		$("#photo").attr({ value: '' });
		$(".file-wrapper .button").text("Attach a picture");

		return false;
	});

	$(".timeline li .actions .default .relativeMe a.replyAll").live("click", function(){
		var tweetID = $(this).parents("li").attr("id");
		ttagit.replyToAll(tweetID);
	});

	$(".timeline li .actions .default .relativeMe a.retweetComment").live("click", function(){
		var tweetID = $(this).parents("li").attr("id");
		ttagit.retweetWithComments(tweetID);
	});


	$(".timeline li .actions .default .relativeMe .deleteDM").live("click", function(){
		var tweetID = $(this).parents("li").attr("id");
		ttagit.viewController.viewInterface.confirmationPage ('Delete DM', 'Do you want to delete this Direct message?', {"f1":"ttagit.deleteDirectMessage","p1":[tweetID]});
	});


	// Evento para clicks en links de un tweet
	$(".tweetlink").live("click", function(){
		ttagit.openUrl($(this).attr('href'));
		return false;
	});

	$(".tweetlinkb").live("click", function(){
		ttagit.openUrlBAN($(this).attr('href'));
		return false;
	});

	// Evento para clicks en un hash tag de un link
	$(".hashtaglink").live("click", function(){
		var query = "#"+$(this).attr('href');
		ttagit.cookie.create('search_query', query);
		ttagit.cookie.create('search_query_name', query);
		ttagit.startTempSearch(query);
		return false;
	});

//--------------------------------------------
//	 TWITS CONTEXT MENU
//--------------------------------------------

	//open
	$(".timeline.tweets li").live("contextmenu", function(e) {
		var tweetID,tweet,user_screen_name,cursorPosition,cursorPositionY,docWidth,docHeight,leftPosition,topPosition;

		// Get the Tweet ID for AJAX requests/actions
		tweetID = $(this).find("span.tweetID").html();
		$(".mainWindow .dropdownMenu .actualTweetID").html(ttagit.utils.escapeHTML(tweetID));
		tweet = ttagit.getTweet(tweetID);
		user_screen_name = ttagit.getLoggedUserName();

		if(user_screen_name == tweet.owner_screen_name){
			$(".mainWindow .dropdownMenu .li_follow-Unfollow").addClass("disabled");
			$(".mainWindow .dropdownMenu .follow-Unfollow").removeClass("follow-Unfollow");
			$(".mainWindow .dropdownMenu .li_follow-Unfollow a").html("Unfollow/follow");

			$(".mainWindow .dropdownMenu .li_reply_to_all").addClass("disabled");
			$(".mainWindow .dropdownMenu .li_reply_to_all a").removeClass("reply_to_all");

			$(".mainWindow .dropdownMenu .li_muteUser").addClass("disabled");
			$(".mainWindow .dropdownMenu .li_muteUser a").removeClass("muteUser");

			$(".mainWindow .dropdownMenu .li_retweet_with_comments").addClass("disabled");
			$(".mainWindow .dropdownMenu .retweet_with_comments").removeClass("retweet_with_comments");

			$(".mainWindow .dropdownMenu .li_spamReport").addClass("disabled");
			$(".mainWindow .dropdownMenu .spamReport").removeClass("spamReport");

			$(".mainWindow .dropdownMenu .li_blockUser").addClass("disabled");
			$(".mainWindow .dropdownMenu .blockUser").removeClass("blockUser");

			$(".mainWindow .dropdownMenu .li_deleteTweet").removeClass("disabled");
			$(".mainWindow .dropdownMenu .li_deleteTweet a").addClass("deleteTweet");
		}else{
			if( ( tweet.retweeted_by == 'null' || tweet.retweeted_by == 'protected' ) && ttagit.viewController.viewCurrent == 'TimeLine'){
				$(".mainWindow .dropdownMenu .li_follow-Unfollow a").html("Unfollow/follow "+ttagit.utils.escapeHTML(tweet.owner_screen_name));
			}else{
				$(".mainWindow .dropdownMenu .li_follow-Unfollow a").html("Unfollow/follow "+ttagit.utils.escapeHTML(tweet.owner_screen_name));
			}

			$(".mainWindow .dropdownMenu .li_muteUser").removeClass("disabled");
			$(".mainWindow .dropdownMenu .li_muteUser a").addClass("muteUser");
			$(".mainWindow .dropdownMenu .li_muteUser a").html("Mute "+ttagit.utils.escapeHTML(tweet.owner_screen_name));

			$(".mainWindow .dropdownMenu .li_follow-Unfollow").removeClass("disabled");
			$(".mainWindow .dropdownMenu .li_follow-Unfollow a").addClass("follow-Unfollow");

			$(".mainWindow .dropdownMenu .li_reply_to_all").removeClass("disabled");
			$(".mainWindow .dropdownMenu .li_reply_to_all a").addClass("reply_to_all");

			$(".mainWindow .dropdownMenu .li_retweet_with_comments").removeClass("disabled");
			$(".mainWindow .dropdownMenu .li_retweet_with_comments a").addClass("retweet_with_comments");

			$(".mainWindow .dropdownMenu .li_deleteTweet").addClass("disabled");
			$(".mainWindow .dropdownMenu .deleteTweet").removeClass("deleteTweet");

			$(".mainWindow .dropdownMenu .li_spamReport").removeClass("disabled");
			$(".mainWindow .dropdownMenu .li_spamReport a").addClass("spamReport");

			$(".mainWindow .dropdownMenu .li_blockUser").removeClass("disabled");
			$(".mainWindow .dropdownMenu .li_blockUser a").addClass("blockUser");
		}

		cursorPosition = e.pageX+165;
		cursorPositionY = e.pageY+ 225;

		docWidth = $(document).width();
		docHeight = $(document).height();

		// Display on left if it goes off the screen
		if (cursorPosition > docWidth) {
			//leftPosition = 175;
			leftPosition = 189;
			$(".mainWindow .dropdownMenu").addClass("onTheLeft");
		} else {
			//leftPosition = 26;
			leftPosition = 30;
			$(".mainWindow .dropdownMenu").removeClass("onTheLeft");
		}

		topPosition =5; //0
		if (cursorPositionY > docHeight) {
			topPosition = 220; //210
		}

		$(".mainWindow .paddingForMenu").css({
			top: e.pageY - topPosition+'px',
			left: e.pageX-leftPosition+'px'
		}).fadeIn("100");

		return false;
	});


	// Close the dropdown if the user left-click anywhere
	$(".mainWindow .paddingForMenu").mouseleave(function(){
		$('.mainWindow .paddingForMenu').hide();
	});


	//open menucontext search box
    $("#searchbox #shareTweet").live("contextmenu", function(e) {

        // Get the Tweet ID for AJAX requests/actions
        //var tweetID = $(this).find("span.tweetID").html();
        //$("#searchbox .dropdownMenu .actualTweetID").html(tweetID);
        //var tweet = ttagit.getTweet(tweetID);
        //var user_screen_name = ttagit.getLoggedUserName(); 65279
		var cursorPosition, cursorPositionY,docWidth,docHeight,leftPosition,topPosition,
        pastetext = ttagit.pasteClipboard();

        if(pastetext.charCodeAt(0) != 10){
          $("#searchbox .dropdownMenu .li_pasteText").removeClass("disabled");
          $("#searchbox .dropdownMenu .li_pasteText a").addClass("pasteText");
        }else{
          $("#searchbox .dropdownMenu .li_pasteText").addClass("disabled");
          $("#searchbox .dropdownMenu .li_pasteText .pasteText").removeClass("pasteText");
        }

        if($("#shareTweet").val()){
           $("#searchbox .dropdownMenu .li_copyText").removeClass("disabled");
           $("#searchbox .dropdownMenu .li_copyText a").addClass("copyText");
        }else{
            $("#searchbox .dropdownMenu .li_copyText").addClass("disabled");
            $("#searchbox .dropdownMenu .li_copyText .copyText").removeClass("copyText");
        }

        cursorPosition = e.pageX+165;
        cursorPositionY = e.pageY+ 225;

        docWidth = $(document).width();
        docHeight = $(document).height();

        // Display on left if it goes off the screen
        if (cursorPosition > docWidth) {
            //leftPosition = 175;
            leftPosition = 189;
            $("#searchbox .dropdownMenu").addClass("onTheLeft");
        } else {
            //leftPosition = 26;
            leftPosition = 30;
            $("#searchbox .dropdownMenu").removeClass("onTheLeft");
        }

        topPosition =5; //0
        if (cursorPositionY > docHeight) {
            topPosition = 220; //210
        }

        $("#searchbox .paddingForMenu").css({
            top: e.pageY - topPosition+'px',
            left: e.pageX-leftPosition+'px'
        }).fadeIn("100");

        return false;
    });

    // Close serarch box the dropdown if the user left-click anywhere
    $("#searchbox .paddingForMenu").mouseleave(function(){
        $('#searchbox .paddingForMenu').hide();
    });


	$(".mainWindow .dropdownMenu .sendDM").click(function(){

		var tweet,
		//Get tweetID to get username of author
		tweetID = $(this).parents(".dropdownMenu").find(".actualTweetID").html();

		tweet = ttagit.getTweet(tweetID);
		$("#directMessage .username").html(ttagit.utils.escapeHTML(tweet.owner_screen_name));
		ttagit.directMessages_allows(tweet.owner_screen_name,tweet.owner_id);
	});

	$(".mainWindow .dropdownMenu .twitterProfile").live("click", function(){
		var tweet,url,
		tweetID = $(this).parents(".dropdownMenu").find(".actualTweetID").html();

		tweet = ttagit.getTweet(tweetID);
		url = 'http://twitter.com/#!/'+tweet.owner_screen_name;
		ttagit.openUrl(url);
		ttagit.viewController.viewInterface.hideTweetDropdownMenu();
	});

	$(".mainWindow .dropdownMenu .follow-Unfollow").live("click", function(){
		var tweet,
		tweetID = $(this).parents(".dropdownMenu").find(".actualTweetID").html();

		tweet = ttagit.getTweet(tweetID);
		ttagit.viewController.viewInterface.confirmationPage ('Unfollow/follow', 'Do you want to Unfollow/follow '+tweet.owner_screen_name+'?', {"f1":"ttagit.follow_unfollow","p1":[tweet.owner_screen_name,tweet.owner_id]});
	});

	$(".mainWindow .dropdownMenu .reply_to_all").live("click", function(){
		var tweet,
		tweetID = $(this).parents(".dropdownMenu").find(".actualTweetID").html();
		ttagit.replyToAll(tweetID);
		ttagit.viewController.viewInterface.hideTweetDropdownMenu();
	});

	$(".mainWindow .dropdownMenu .retweet_with_comments").live("click", function(){
		var tweet,
		tweetID = $(this).parents(".dropdownMenu").find(".actualTweetID").html();
		ttagit.retweetWithComments(tweetID);
		ttagit.viewController.viewInterface.hideTweetDropdownMenu();
	});

	$(".mainWindow .dropdownMenu .spamReport").live("click", function(){
		var tweet,
		tweetID = $(this).parents(".dropdownMenu").find(".actualTweetID").html();

		tweet = ttagit.getTweet(tweetID);
		ttagit.viewController.viewInterface.confirmationPage ('spam report', 'Do you want to report '+tweet.owner_screen_name+' as spammer?', {"f1":"ttagit.reportUserAsSpamer","p1":[tweet.owner_screen_name,tweet.owner_id]});
	});

	$(".mainWindow .dropdownMenu .blockUser").live("click", function(){
		var tweet,
		tweetID = $(this).parents(".dropdownMenu").find(".actualTweetID").html();

		tweet = ttagit.getTweet(tweetID);
		ttagit.viewController.viewInterface.confirmationPage ('block', 'Do you want to block '+tweet.owner_screen_name+'?', {"f1":"ttagit.blockUser","p1":[tweet.owner_screen_name,tweet.owner_id]});
	});

	$(".mainWindow .dropdownMenu .deleteTweet").live("click", function(){
		var tweet,
		tweetID = $(this).parents(".dropdownMenu").find(".actualTweetID").html();

		tweet = ttagit.getTweet(tweetID);
		ttagit.viewController.viewInterface.confirmationPage ('tweet', 'Do you want to remove this tweet?', {"f1":"ttagit.deleteStatus","p1":[tweet.tweet_id]});
	});

	$(".mainWindow .dropdownMenu .copyText").live("click", function(){
		var tweet,
		tweetID = $(this).parents(".dropdownMenu").find(".actualTweetID").html();

		tweet = ttagit.getTweet(tweetID);
		ttagit.copyToClipboard(ttagit.encript.rawDecode(tweet.text));
		ttagit.viewController.viewInterface.hideTweetDropdownMenu();
	});

	$("#searchbox .dropdownMenu .copyText").live("click", function(){
		ttagit.copyToClipboard(ttagit.encript.rawDecode($("#shareTweet").val()));
		$('#searchbox .paddingForMenu').hide();
    });

	$("#searchbox .dropdownMenu .pasteText").live("click", function(){
		var pastetext = ttagit.pasteClipboard();

		ttagit.insertAtCursor("shareTweet",pastetext);
		$('#searchbox .paddingForMenu').hide();
    });

	$(".mainWindow .dropdownMenu .muteUser").live("click", function(){
		var tweet,
		tweetID = $(this).parents(".dropdownMenu").find(".actualTweetID").html();

		tweet = ttagit.getTweet(tweetID);
		ttagit.viewController.viewInterface.confirmationPage ('block', 'Do you want to Mute '+tweet.owner_screen_name+'?', {"f1":"ttagit.muteUser","p1":[tweet.owner_screen_name,tweet.owner_id]});
	});



//--------------------------------------------
//	 SEARCHES
//--------------------------------------------

	// Search TEXTAREA behavior
	$("#searchinput").keyup(function(){
		if ($(this).val() != "") {
			$(".searchExpanded .searchCleaner").show();
		} else {
			$(".searchExpanded .searchCleaner").hide();
		}

		if ($(".searchExpanded .action").hasClass("saveSearch")) {
			$(".searchExpanded .action").removeClass("saveSearch").addClass("singleline").html("GO");
			$("#searchtweets").html('');
		}
	});

	$("#searchinput").focus(function(){
		if($(this).val() != "What are you looking for?"){ return false; }

		$(this).val("");
		$(".searchExpanded .action").removeClass("saveSearch").addClass("singleline").html("GO");
        $("#searchtweets").html('');
        $(".searchExpanded .searchCleaner").hide();

        ttagit.taskScheduler.remove({"f1":"ttagit.loadTweetsOfSavedSearch","p1":[ttagit.viewController.viewTweetsOfSearchCurrent]});
	});

	$("#searchinput").blur(function(){
		if ($(this).val() != ""){ return false; }

		$(this).val("What are you looking for?");
		$(".searchExpanded .searchCleaner").show();
		ttagit.viewController.viewTweetsOfSearchCurrent = "";
	});

	// Search button: (GO)
	$(".searchExpanded .action.singleline").live("click", function(){

		var query;
		ttagit.taskScheduler.remove({"f1":"ttagit.loadTweetsOfSavedSearch","p1":[ttagit.viewController.viewTweetsOfSearchCurrent]});

		query = $('#searchinput').val();
		ttagit.startTempSearch(query);

		if (ttagit.cookie.exist('search_query')){
			ttagit.cookie.remove('search_query');
		}
		ttagit.cookie.create('search_query',query);

		return false;
	});

	// Search button (Save Search)
	$(".searchExpanded .action.saveSearch").live("click", function(){

		ttagit.taskScheduler.remove({"f1":"ttagit.loadTweetsOfSavedSearch","p1":[ttagit.viewController.viewTweetsOfSearchCurrent]});

		if (ttagit.cookie.exist('search_query')){
			query = ttagit.cookie.read('search_query');
			ttagit.cookie.remove('search_query');
		}
		else if (ttagit.cookie.exist('search_query', 'global')) {
			query = ttagit.cookie.read('search_query');
			ttagit.cookie.remove('search_query', 'global');
		}

		query_name = $("#searchinput").val();
		ttagit.saveTempSearch(query, query_name);

		//resetear valores a cero
		ttagit.viewController.viewInterface.setSearchButton('go');
		ttagit.viewController.viewInterface.setSearchText("What are you looking for?");

		return false;
	});

	// Search button while working
	//!! esto no va cero el boton deberia convertirse en algo que dice waiting
	$(".searchExpanded .action.working").click(function(){
		return false;
	});

	// Search cleaner button
	$(".searchExpanded .searchCleaner").click(function(){
		$("#searchinput").val('').focus();
		$(".searchExpanded .action").removeClass("saveSearch").addClass("singleline").html("GO");
		$("#searchtweets").html('');
		$(this).hide();

        ttagit.taskScheduler.remove({"f1":"ttagit.loadTweetsOfSavedSearch","p1":[ttagit.viewController.viewTweetsOfSearchCurrent]});
        ttagit.viewController.viewTweetsOfSearchCurrent = "";
		return false;
	});

	// Saved Search: show/hide list
	$(".savedSearches .title").live("click", function(){
		$(this).parent().find(".searchesColumns").slideToggle();
		$(this).toggleClass("opened");
		return false;
	});

	// Saved Search: delete search
	$(".savedSearches .searches span.close").live("click", function(){
		var searchID;

		//remuevo el boton que correspondiente a la busqueda
		$(this).parent().parent().fadeOut();
		// pido el id que esta econdido dentro del boton
		searchID = $(this).parent().parent().find(".searchID").html();
		//ttagit.viewController.deleteSearch(searchID);
		ttagit.deleteSearch( searchID );

		if( searchID == ttagit.viewController.viewTweetsOfSearchCurrent )
		{
		  ttagit.taskScheduler.remove({"f1":"ttagit.loadTweetsOfSavedSearch","p1":[ttagit.viewController.viewTweetsOfSearchCurrent]});
		  $("#searchtweets").html('');
	    }

		return false;
	});

	// Saved Search: show Search
	$(".savedSearches a").live("click", function(){
		var searchID;

		ttagit.viewController.viewInterface.waitPage('show');

		searchID = $(this).parent().find(".searchID").html();
		ttagit.taskScheduler.remove({"f1":"ttagit.loadTweetsOfSavedSearch","p1":[ttagit.viewController.viewTweetsOfSearchCurrent]});

		//iniciamos el sheduler para esta busqueda
		ttagit.taskScheduler.add({"f1":"ttagit.loadTweetsOfSavedSearch","p1":[searchID]}, 1);
		return false;
	});

//--------------------------------------------
//	 TREND TOPICS
//--------------------------------------------

	// Show Trend Topics Tweets
	$(".timeline.trends .trend").live("click", function(){
		var query;

		ttagit.viewController.viewInterface.waitPage('show');
		// Get the list ID for AJAX request
		query = $(this).find(".trendQuery").html();

		ttagit.taskScheduler.remove({"f1":"ttagit.loadTweetsTrendTopic","p1":[query]});

		//iniciamos el sheduler para esta lista
		ttagit.taskScheduler.add({"f1":"ttagit.loadTweetsTrendTopic","p1":[query]});

		return false;
	});

	// Go back to lists page
	$("#trendsTweets .timeline .goBackToTrendMain a").live("click", function(){
		$(".tab_content").hide();

		ttagit.taskScheduler.remove({"f1":"ttagit.loadTweetsTrendTopic","p1":[ttagit.viewController.viewTweetsOfTrendTopicCurrent]});

		ttagit.viewController.showTrendTopics();
		$("#trends").fadeIn();

		return false;
	});

//--------------------------------------------
//	 LIST
//--------------------------------------------

	// Open a list
	$(".timeline.lists .list").live("click", function(){
		var listID;

		ttagit.viewController.viewInterface.waitPage('show');
		// Get the list ID for AJAX request
		listID = $(this).find(".listID").html();
		ttagit.taskScheduler.remove({"f1":"ttagit.loadTweetsOfList","p1":[ttagit.viewController.viewTweetsOfListCurrent]});
		//iniciamos el sheduler para esta lista
		ttagit.taskScheduler.add({"f1":"ttagit.loadTweetsOfList","p1":[listID]},1);

		//ttagit.viewController.showTweetsOfLists(listID);
		return false;
	});

	// Go back to lists page
	$("#listsFiltered .timeline .goBackToMain a").live("click", function(){
		$(".tab_content").hide();
		ttagit.viewController.showAllList();
		$("#lists").fadeIn();

		return false;
	});

//--------------------------------------------
//	 DM
//--------------------------------------------

	//Show a conversation
	$(".timeline.dms li.tweetsDM").live("click", function(){

		// Get the conversationID for AJAX request
		var author = $(this).find(".author a").html();
		ttagit.viewController.showConversationDirectMessages(author);

		return false;
	});

	$('#dms .timeline .WriteNewMessage a').live('click', function(){
	    $("#direct_message_from").val('');
	    $("#DM_user_id_sel").val('');
	    $("#resultUser").html('');
	    ttagit.viewController.viewInterface.openDMUser();
	});

	// Go Back button to conversations list
	$('#conversation .timeline .goBackToMain .backConversation').live('click', function(){
		$(".tab_content").hide();
		ttagit.viewController.showDirectMessages();
		$("#dms").fadeIn();
		return false;
	});

	// Send conversations
	$('#conversation .timeline .WriteNewMessage a').live('click', function(){
        //Get tweetID to get username of author
        var DM,
		screen_name = "",
		screen_name_id = "",
		DMid = ttagit.viewController.viewLastItem;

        DM = ttagit.getDM(DMid);
        if( DM.sender_screen_name == ttagit.getLoggedUserName() ){
            screen_name = DM.recipient_screen_name;
            screen_name_id = DM.recipient_id;
        }else{
            screen_name = DM.sender_screen_name;
            screen_name_id = DM.sender_id;
        }
        $("#directMessage .username").html(ttagit.utils.escapeHTML(screen_name));
        ttagit.directMessages_allows(screen_name, screen_name_id);
	});

	$("#directMessageTextarea").keyup(function() {
		// Character counter
		var remaining,
		charLength = $(this).val().length;

		remaining = 140 - charLength;
		$(this).parents("#directMessage").find('.counter').html(ttagit.utils.escapeHTML(remaining));

		if ($(this).val().length > 140) {
			$(this).parents("#directMessage").find('.counter').addClass("error");
			ttagit.viewController.viewInterface.setDMSubmit("disabled");
		}else if ($(this).val().length <= 140) {
			$(this).parents("#directMessage").find('.counter').removeClass("error");
			ttagit.viewController.viewInterface.setDMSubmit("enabled");
		}
	});

	$("#directMessageTextarea").keypress(function(event) {
		var url,
		DM = ttagit.viewController.viewInterface.getDMTextarea();

		if(event.which == '13'){
			return true;
		}

		if(event.which == '32'){
			DM += ' ';
			url = ttagit.haveUrl(DM);

			if(url){
				ttagit.ShortenURL(DM,url,'changeDM');
			}
		}
	});

	//agregar una imagen al direct message
	$("#directMessage .positionMe .file-wrapper  input[type='file']").change( function() {
		ttagit.postPhotoDM();
		$(this).val("");//reseteo el campo file.
	});


	// Send Direct Message
	$("#directMessage #sendDM").click(function(){
		var url,DM_recipient_id,DM_recipient_name,msg,
		DM = ttagit.viewController.viewInterface.getDMTextarea();

		if(DM.length > 140){ return false; }

		url = ttagit.haveUrl(DM);
		if(url){
			ttagit.cookie.create('DM_msg',ttagit.viewController.viewInterface.getDMTextarea());
			ttagit.ShortenURL(url,'sendDM');
			return false;
		}

		DM_recipient_id = ttagit.cookie.read('DM_recipient_id');
		DM_recipient_name = ttagit.cookie.read('DM_recipient_name');
		msg = ttagit.viewController.viewInterface.getDMTextarea();
		ttagit.sendDirectMessage(DM_recipient_name,DM_recipient_id,msg);
		ttagit.cookie.remove('DM_recipient_id');
		ttagit.cookie.remove('DM_recipient_name');
		ttagit.viewController.viewInterface.cancelDM();
	});

	// Cancel direct message
	$("#directMessage .cancelSend").click(function(){
		ttagit.viewController.viewInterface.cancelDM();
	});


    // Send Direct Message From Any
    $("#direct_message_from").keyup(function() {
        if(this.value != ""){
            ttagit.viewController.directMessagesSearchUser(this.value);
        }
        if(this.value == "") {
            $("#resultUser").html('');
        }
        $('#DM_user_id_sel').val('');
    });

    //listado de usuarios que sigo o me siguen filtrado por busqueda
    $("#resultUser a").live('click', function() {
        $("#direct_message_from").val( $(this).find('.user_screen_name').html() );
        $("#DM_user_id_sel").val( $(this).find('.user_id').html() );
        $("#resultUser").html('');
        return false;
    });

    // Send Direct Message From Any
    $("#directMessageUser #sendDMUser").click(function(){
        var DM_recipient_id = $('#DM_user_id_sel').val(),
        DM_recipient_name = $("#direct_message_from").val();

        $("#directMessage .username").html(ttagit.utils.escapeHTML(DM_recipient_name));
        ttagit.directMessages_allows(DM_recipient_name, DM_recipient_id);
    });

    // Cancel direct message
    $("#directMessageUser .cancelSend").click(function(){
        ttagit.viewController.viewInterface.cancelDMUser();
    });

/**
 *------ CHECK UNLOCKED APP
 **/

	$("#oneYearUnlock").click(function(){
		ttagit.unlockApp('one year');
	});

	$("#twoDaysUnlock").click(function(){
		ttagit.unlockApp('two days');
	});


 /**
 *-----------------------------------------
 **/
