	function TtagitOverlay () {
		this.ttagitHtmlUrl = "chrome://ttagit/content/index.html";
	}

	TtagitOverlay.prototype={

		/**
		* Loading the Jquery from the mozilla subscript method
		 *
		 * @return void
		 * @access public
		*/
		loadJQuery:  function(context) {
			if(!ttagitOver.jQuery) {
				var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
				loader.loadSubScript("chrome://ttagit/content/js/libs/jquery-1.6.1.min.js",context);
				var jQuery = window.jQuery.noConflict(true);
				if( typeof(jQuery.fn._init) == 'undefined') { jQuery.fn._init = jQuery.fn.init; }
				ttagitOver.jQuery = jQuery;
			}
		},

		/**
		* Thins to do when this begin
		 *
		 * @return void
		 * @access public
		*/
		init: function () {

			var res,
			db = new TtagitDBHandler();
			icon = false,
			ttagit= false;

			try {
				res = db.query("SELECT version FROM ttagit");
				if(typeof(res[0]) =="undefined"){ttagitOver.addIconToNavBar();}
			}catch(e){
				ttagitOver.addIconToNavBar();
			}

			ttagitOver.setWidth();
			ttagitOver.loadHtml();

			ttagitOver.loadJQuery(ttagitOver);

			if(typeof(top.document.getElementById("ttagit-button")) != "undefined"){
				icon = true;
			}

			if (icon && ttagitOver.sidebarStatus() == 'vissible') {
				ttagitOver.jQuery("#ttagit-button",top.document).attr('active', 'yes');
			}

			//add handler to show/hide twit this picture context menu
			var menu = document.getElementById("contentAreaContextMenu");
			menu.addEventListener("popupshowing", ttagitOver.showHideContextMenuItem, false);
		},

		/**
		* Thins to do when this finish
		 *
		 * @return void
		 * @access public
		*/
		end: function (){

		},

		/**
		* This function adds Ttagit icon to the navbar if it is not present there.
		 *
		 * @return void
		 * @access public
		*/
		addIconToNavBar: function () {

			var toolbox, toolboxDocument, hasTtagitButton, i, toolbar, newSet, child;

			toolbox = document.getElementById("navigator-toolbox");
			toolboxDocument = toolbox.ownerDocument;
			hasTtagitButton = false;

			// serach for button
			for (i = 0; i < toolbox.childNodes.length; ++i) {
				toolbar = toolbox.childNodes[i];
				if (toolbar.localName == "toolbar" && toolbar.getAttribute("customizable") == "true" ) {
					if (toolbar.currentSet.indexOf("ttagit-button") > -1) {
						hasTtagitButton = true;
					}
				}
			}

			//add it if not pressent
			if (hasTtagitButton) { return true; }

			for (i = 0; i < toolbox.childNodes.length; ++i) {
				toolbar = toolbox.childNodes[i];
				if (toolbar.localName == "toolbar" &&  toolbar.getAttribute("customizable") == "true" && toolbar.id == "nav-bar") {

					newSet = "";
					child = toolbar.firstChild;
					while (child) {
						newSet += child.id + ",";
						child = child.nextSibling;
					}
					newSet += ',ttagit-button';

					toolbar.currentSet = newSet;
					toolbar.setAttribute("currentset", newSet);
					toolboxDocument.persist(toolbar.id, "currentset");
					BrowserToolboxCustomizeDone(true);
					break;
				}
			}
		},

		/**
		* This function is called when Ttagit sidebar is toggled and loads url in the sidebar if it is open.
		 *
		 * @return void
		 * @access public
		*/
		loadHtml: function ()  {
			var sidebar = top.document.getElementById("sidebar");
			var broadcaster = top.document.getElementById('TtagitSideBar');

			if (broadcaster.hasAttribute('checked')) {
				sidebar.loadURI(ttagitOver.ttagitHtmlUrl);
			}

		},

		/**
		* Set width style for side bar
		 *
		 * @return void
		 * @access public
		*/
		setWidth: function () {
			ttagitOver.loadJQuery(ttagitOver);
			ttagitOver.jQuery("#sidebar-box",window.top.document).css({"min-width":"245px", "max-width":"370px", 'width': '320px'});
		},

		/**
		* Handle the action over the bird botton icon.
		 * Check if the side bar not exist or it is hidden, and does
		 * the correct action depending on it's status
		 *
		 * @param EventObject event: teel us what button has been pressed
		 * @return void
		 * @access public
		*/
		handleSideBar: function(event) {

			//event.button 0: (left click); 1: (middle click); 2: (right click)
			if (event.button == 2) { return true; }

			ttagitOver.loadJQuery(ttagitOver);

			var sidebarStatus, sidebarHtmlUrl, ttagit, current_tab;

			//get sidebar status
			sidebarStatus = ttagitOver.sidebarStatus();
			sidebarHtmlUrl = top.document.getElementById("sidebar").contentWindow.location.href;

			//get ttagit object if exist and the last viewed ttagit tab
			if(typeof(top.document.getElementById("sidebar").contentWindow.ttagit) != "undefined"){
				ttagit = top.document.getElementById("sidebar").contentWindow.ttagit;
				current_tab = ttagit.viewController.viewCurrent;
			}

			//Open sidebar, this load index.html on sidebar and create ttagit object, etc
			if(sidebarStatus == 'noExists') {
				toggleSidebar('TtagitSideBar');
				ttagitOver.jQuery("#TtagitSideBar",top.document).attr('checked', true);
				ttagitOver.jQuery("#ttagit-button",top.document).attr('active', 'yes');
				return true;
			}

			//hide sidebar but keep it running
			if(sidebarStatus == 'vissible') {
				//lo comentado es porque seguramente la url siempre cambia agregandole un # al final o algo
				//if(sidebarHtmlUrl != ttagitOver.ttagitHtmlUrl ) {
					//ttagitOver.init();
				//}else{
					ttagitOver.jQuery("#sidebar",top.document).hide();
					ttagitOver.jQuery("#sidebar-box",top.document).hide();
					ttagitOver.jQuery("#TtagitSideBar",top.document).attr('checked', false);
				//}
				return true;
			}

			// show sidebar with the last tab opened
			if(sidebarStatus == 'hidden') {
				//user may oppened other sidebar, so we need to load ttagit again
				//if(sidebarHtmlUrl != ttagitOver.ttagitHtmlUrl ) {
					//ttagitOver.init();
				//}

				ttagitOver.jQuery("#sidebar",top.document).css('display', '');
				ttagitOver.jQuery("#sidebar-box",top.document).css('display', '');
				ttagitOver.jQuery("#TtagitSideBar",top.document).attr('checked', true);

				switch(current_tab){
					case "TimeLine":
						ttagit.viewController.showTimeLineTweets();
					break;

					case "Mention":
						ttagit.viewController.showMentionsTweets();
					break;

					case "direct_messages":
						ttagit.viewController.showDirectMessages();
					break;

					case "Favorite":
						ttagit.viewController.showFavoriteTweets();
					break;

					case "List":
						ttagit.viewController.showAllList();
					break;

					case "searches":
						ttagit.viewController.showSearches();
						ttagit.viewController.showTempSearchTweets();
					break;
				}

				return true;
			}

		},

		/**
		* Return the current status of the sidebar
		 *
		 * @return string: sidebar status
		 * @access public
		*/
		sidebarStatus: function () {
			var sidebar_box = top.document.getElementById("sidebar-box"),
			sidebar = top.document.getElementById("sidebar");

			if(sidebar_box.getAttribute("hidden")){
				//si esta escondido quiere decir que la pagina no esta cargada
				//ergo el objeto ttagit no existe
				return 'noExists';
			}

			if (sidebar.style.display == "none" ){
				return 'hidden';
			}

			return 'vissible';
		},

		/**
		* Handler to display Twit this image only when context menu open over a image
		 *
		 * @return string: sidebar status
		 * @access public
		*/
		showHideContextMenuItem: function () {
			gContextMenu.showItem("ttagit-twitThisImage-menuitem", gContextMenu.onImage );
		},

		/**
		* Handle the action over "Twit this page" on FF context menu.
		 *
		 * @param string URL: url to be sortened or null to use browser current tab url
		 * @return void
		 * @access public
		*/
		shareURL: function (url) {
			var image = false;
			ttagitOver.loadJQuery(ttagitOver);

			if (ttagitOver.jQuery.inArray( ttagitOver.sidebarStatus(), ["noExists", "hidden"]) != -1) {
				ttagitOver.handleSideBar({"button": 1});
			}

			if (url) {
				longUrl = url;
				image = true;
			} else {
				longUrl = content.wrappedJSObject.location;
			}

			var cox = new TtagitHttpRequest ();
			var url = "http://api.bit.ly/v3/shorten?login=ttagit&apiKey=R_6832fe42e74ac086234b761422395d36&longUrl="+encodeURIComponent(longUrl)+"&format=json"

			cox.setURI(url);
			cox.setOnLoadFunction (function(datos){
				// datos = { "status_code": 200, "status_txt": "OK", "data": { "long_url": "http:\/\/www.google.com.ar\/", "url": "http:\/\/bit.ly\/chUkKE", "hash": "chUkKE", "global_hash": "funN", "new_hash": 0 } }
				var res = ttagitOver.jQuery.parseJSON(datos);
				if (res.status_txt == 'OK')
				{
					var surl = res.data.url;
					var context = top.document.getElementById("sidebar").contentDocument;
					ttagitOver.jQuery("#searchbox textarea",context).focus();

					if(!top.document.getElementById("sidebar").contentWindow.ttagit.userLogged()) {
						ttagitOver.jQuery("#searchbox textarea",context).val(surl);
					}else{
						var open = top.document.getElementById("sidebar").contentWindow.ttagit.viewController.viewInterface.tweetAreaItsOpen();
						if(open && (top.document.getElementById("sidebar").contentWindow.ttagit.viewController.viewInterface.getTweetTextarea() != "")){
							ttagitOver.jQuery("#searchbox textarea",context).val(ttagitOver.jQuery("#searchbox textarea",context).val()+" "+surl);
						}else{
							ttagitOver.jQuery("#searchbox textarea",context).val(surl);
						}
					}

					top.document.getElementById("sidebar").contentWindow.ttagit.cookie.create('Setedurl', 'global');

					//Reports
					if(top.document.getElementById("sidebar").contentWindow.ttagit.userLogged()){
						if(image){
							top.document.getElementById("sidebar").contentWindow.ttagit.reports.add('Session.links');
						}else{
							top.document.getElementById("sidebar").contentWindow.ttagit.reports.add('Session.tweet_this_page');
						}
					}
				}
			});
			cox.asyncOpen(true);
		},

		/**
		* Handle the action over "Twit this Picture" on FF context menu.
		 * take the url of an image and pass it to shortURL function.
		 *
		 * @return void
		 * @access public
		*/
		shareIMG: function () {
			if (gContextMenu.onImage) {
				var url = gContextMenu.imageURL;
				ttagitOver.shareURL(url);//true indica que es una imagen
			}
		},

		/**
		* Handle the action over "Twits about this age" on FF context menu.
		 *
		 * @return void
		 * @access public
		*/
		searchURL: function ()  {
			var query, status = ttagitOver.sidebarStatus();
			if (ttagitOver.jQuery.inArray( status, ["noExists", "hidden"]) != -1) {
				ttagitOver.handleSideBar({"button": 1});
			}

			query = content.wrappedJSObject.location.href;
			query = query.replace("http://","").replace("https://","").replace(/\//g," ");
			query_name = query;//content.wrappedJSObject.location.hostname;

			if((status == "noExists")||(!top.document.getElementById("sidebar").contentWindow.ttagit.userLogged())){
					setTimeout(function(){ttagitOver.sendTaskToTtagit(query_name, query)}, 1000);
			}else{
				top.document.getElementById("sidebar").contentWindow.ttagit.cookie.create('search_query_name', query_name);
				top.document.getElementById("sidebar").contentWindow.ttagit.cookie.create('search_query', query);
				top.document.getElementById("sidebar").contentWindow.ttagit.startTempSearch(query);

				//Reports
				if(top.document.getElementById("sidebar").contentWindow.ttagit.userLogged()){
					top.document.getElementById("sidebar").contentWindow.ttagit.reports.add('Session.tweets_about_this_page');
				}
			}
		},

		sendTaskToTtagit: function(name, query){
			top.document.getElementById("sidebar").contentWindow.ttagit.cookie.create('search_query_name', name);
			top.document.getElementById("sidebar").contentWindow.ttagit.cookie.create('search_query', query);
			top.document.getElementById("sidebar").contentWindow.ttagit.setFunctionToExecuteOnInit("ttagit.startTempSearch",[query]);
		}

	};

	ttagitOver = null;
	ttagitOver=new TtagitOverlay();
	window.addEventListener("load", function(){ ttagitOver.init(); }, true);
