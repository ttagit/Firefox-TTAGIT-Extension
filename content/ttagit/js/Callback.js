/**
 * Este modulo se encarga de hacer los llamados asincronicos necesarios para la comunicacion de ttagit con las distintas API's que
 * se manejan.
 * Mozilla no permite que los addons hagan uso de la funcion eval provista por javascript, por lo tanto este modulo
 * se encarga de realizar los llamados correspondientes, realizando manualmente las acciones que realizaria la funcion eval.
 **/
var TtagitCallBack = function(){

}

TtagitCallBack.prototype = {

	/**
	 * Ejecuta las funciones necesarias.
	 **/
	execute: function (data){
		//alert(data.f1);
		switch(data.f1){
			case "ttagit.twitter.requestToken":
				ttagit.twitter.requestToken(data.f2,data.p2);
			break
			case "ttagit.afterRequestPin":
				ttagit.afterRequestPin(data.p1[0]);
			break
			case "ttagit.twitter.Auth":
				ttagit.twitter.Auth(data.p1[0],data.p1[1], data.p1[2],data.f2,data.p2);
			break
			case "ttagit.afterAuthorize":
				ttagit.afterAuthorize(data.p1[0],data.p1[1],data.p1[2]);
			break
			case "ttagit.twitter.getUserInformation":
				ttagit.twitter.getUserInformation(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.saveUserAndInitSession":
				ttagit.saveUserAndInitSession(data.p1[0],data.p1[1]);
			break
			case "ttagit.checkLogin":
				ttagit.checkLogin();
			break
			case "ttagit.afterLogUser":
				ttagit.afterLogUser(data.p1[0]);
			break
			case "ttagit.twitter.getConfiguration":
				ttagit.twitter.getConfiguration(data.f2,data.p2);
			break
			case "ttagit.afterGetConfiguration":
				ttagit.afterGetConfiguration(data.p1[0]);
			break
			case "ttagit.twitter.getAccountSetttings":
				ttagit.twitter.getAccountSetttings(data.f2,data.p2);
			break
			case "ttagit.aftergetAccountSetttings":
				ttagit.aftergetAccountSetttings(data.p1[0],data.p1[1]);
			break
			case "ttagit.LoadTrendTopics":
				ttagit.LoadTrendTopics();
			break
			case "ttagit.twitter.getTrendTopics":
				ttagit.twitter.getTrendTopics(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.aftergetTrendTopics":
				ttagit.aftergetTrendTopics(data.p1[0],data.p1[1])
			break
			case "ttagit.twitter.hasFriendship":
				ttagit.twitter.hasFriendship(data.p1[0],data.p1[1],data.f2,data.p2);
			break
			case "ttagit.follow_unfollow":
				ttagit.follow_unfollow(data.p1[0],data.p1[1]);
			break
			case "ttagit.afterFollow_unfollow":
				ttagit.afterFollow_unfollow(data.p1[0],data.p1[1],data.p1[2]);
			break
			case "ttagit.twitter.unfollowUser":
				ttagit.twitter.unfollowUser(data.p1[0],data.p1[1],data.f2,data.p2);
			break
			case "ttagit.afterUnfollowUser":
				ttagit.afterUnfollowUser(data.p1[0],data.p1[1]);
			break
			case "ttagit.twitter.followUser":
				ttagit.twitter.followUser(data.p1[0],data.p1[1],data.f2,data.p2);
			break
			case "ttagit.afterFollowUser":
				ttagit.afterFollowUser(data.p1[0],data.p1[1]);
			break
			case "ttagit.afterSendFollowRequestUser":
				ttagit.afterSendFollowRequestUser(data.p1[0],data.p1[1]);
			break
			case "ttagit.blockUser":
				ttagit.blockUser(data.p1[0],data.p1[1]);
			break
			case "ttagit.twitter.blockUser":
				ttagit.twitter.blockUser(data.p1[0],data.p1[1],data.f2,data.p2);
			break
			case "ttagit.afterBlockUser":
				ttagit.afterBlockUser(data.p1[0]);
			break
			case "ttagit.muteUser":
				ttagit.muteUser(data.p1[0],data.p1[1]);
			break
			case "ttagit.reportUserAsSpamer":
				ttagit.reportUserAsSpamer(data.p1[0],data.p1[1]);
			break
			case "ttagit.twitter.reportSpam":
				ttagit.twitter.reportSpam(data.p1[0],data.p1[1],data.f2,data.p2);
			break
			case "ttagit.afterReportUserAsSpamer":
				ttagit.afterReportUserAsSpamer(data.p1[0]);
			break
			case "ttagit.twitter.newPost":
				ttagit.twitter.newPost(data.p1[0],data.p1[1],data.f2,data.p2);
			break
			case "ttagit.afterUpdateStatus":
				ttagit.afterUpdateStatus(data.p1[0]);
			break
			case "ttagit.deleteStatus":
				ttagit.deleteStatus(data.p1[0]);
			break
			case "ttagit.twitter.deleteTweet":
				ttagit.twitter.deleteTweet(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.afterDeleteStatus":
				ttagit.afterDeleteStatus(data.p1[0],data.p1[1]);
			break
			case "ttagit.twitter.retweet":
				ttagit.twitter.retweet(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.retweetStatus":
				ttagit.retweetStatus(data.p1[0]);
			break
			case "ttagit.afterRetweetStatus":
				ttagit.afterRetweetStatus(data.p1[0],data.p1[1]);
			break
			case "ttagit.twitter.addToFavorites":
				ttagit.twitter.addToFavorites(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.updateTweetAsFavorite":
				ttagit.updateTweetAsFavorite(data.p1[0]);
			break
			case "ttagit.twitter.removeOfFavorites":
				ttagit.twitter.removeOfFavorites(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.updateTweetAsNotFavorite":
				ttagit.updateTweetAsNotFavorite(data.p1[0]);
			break
			case "ttagit.twitter.getTimeLineTweets":
				ttagit.twitter.getTimeLineTweets(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.saveAndShowTweets":
				ttagit.saveAndShowTweets(data.p1[0],data.p1[1]);
			break
			case "ttagit.twitter.getMentions":
				ttagit.twitter.getMentions(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.twitter.getFavorites":
				ttagit.twitter.getFavorites(data.f2,data.p2);
			break
			case "ttagit.saveFavoritesTweets":
				ttagit.saveFavoritesTweets(data.p1[0]);
			break
			case "ttagit.directMessages_allows_step_two":
				ttagit.directMessages_allows_step_two(data.p1[0],data.p1[1],data.p1[2],data.p1[3]);
			break
			case "ttagit.afterDirectMessages_allows":
				ttagit.afterDirectMessages_allows(data.p1[0],data.p1[1],data.p1[2]);
			break
			case "ttagit.twitter.getDirectMessages":
				ttagit.twitter.getDirectMessages(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.saveAndShowDirectMessages":
				ttagit.saveAndShowDirectMessages(data.p1[0]);
			break
			case "ttagit.twitter.getDirectMessagesSent":
				ttagit.twitter.getDirectMessagesSent(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.twitter.sendDirectMessage":
				ttagit.twitter.sendDirectMessage(data.p1[0],data.p1[1],data.p1[2],data.f2,data.p2);
			break
			case "ttagit.afterSendDirectMessage":
				ttagit.afterSendDirectMessage(data.p1[0],data.p1[1]);
			break
			case "ttagit.deleteDirectMessage":
				ttagit.deleteDirectMessage(data.p1[0]);
			break
			case "ttagit.twitter.deleteDirectMessage":
				ttagit.twitter.deleteDirectMessage(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.afterDeleteDirectMessage":
				ttagit.afterDeleteDirectMessage(data.p1[0],data.p1[1]);
			break
			case "ttagit.loadTweetsTrendTopic":
				ttagit.loadTweetsTrendTopic(data.p1[0]);
			break
			case "ttagit.saveAndShowTweetsOfTrendTopics":
				ttagit.saveAndShowTweetsOfTrendTopics(data.p1[0], data.p1[1]);
			break
			case "ttagit.twitter.getLists":
				ttagit.twitter.getLists(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.saveAndShowLists":
				ttagit.saveAndShowLists(data.p1[0]);
			break
			case "ttagit.twitter.getListTweets":
				ttagit.twitter.getListTweets(data.p1[0],data.p1[1],data.f2,data.p2);
			break
			case "ttagit.saveAndShowTweetsList":
				ttagit.saveAndShowTweetsList(data.p1[0],data.p1[1]);
			break
			case "ttagit.twitter.getSavedSearch":
				ttagit.twitter.getSavedSearch(data.f2,data.p2);
			break
			case "ttagit.saveAndShowSearches":
				ttagit.saveAndShowSearches(data.p1[0]);
			break
			case "ttagit.twitter.search":
				ttagit.twitter.search(data.p1[0],data.p1[1],data.f2,data.p2);
			break
			case "ttagit.saveAndShowTweetsOfsavedSearch":
				ttagit.saveAndShowTweetsOfsavedSearch(data.p1[0],data.p1[1]);
			break
			case "ttagit.saveAndShowTweetsOfSearch":
				ttagit.saveAndShowTweetsOfSearch(data.p1[0]);
			break
			case "ttagit.twitter.saveSearch":
				ttagit.twitter.saveSearch(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.afterSaveTempSearch":
				ttagit.afterSaveTempSearch(data.p1[0],data.p1[1]);
			break
			case "ttagit.twitter.deleteSearch":
				ttagit.twitter.deleteSearch(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.afterDeleteSearch":
				ttagit.afterDeleteSearch(data.p1[0]);
			break
			case "ttagit.loadAllList":
				//ttagit.loadAllList();
				setTimeout(function(){ttagit.loadAllList();});
			break
			case "ttagit.loadAllSearches":
				//ttagit.loadAllSearches();
				setTimeout(function(){ttagit.loadAllSearches();});
			break
			case "ttagit.LoadDirectMessages":
				//ttagit.LoadDirectMessages();
				setTimeout(function(){ttagit.LoadDirectMessages();});
			break
			case "ttagit.LoadDirectMessagesSent":
				//ttagit.LoadDirectMessagesSent();
				setTimeout(function(){ttagit.LoadDirectMessagesSent();});
			break
			case "ttagit.loadTimeLineTweets":
				//ttagit.loadTimeLineTweets();
				setTimeout(function(){ttagit.loadTimeLineTweets();});
			break
			case "ttagit.loadMentionsTweets":
				//ttagit.loadMentionsTweets();
				setTimeout(function(){ttagit.loadMentionsTweets();});
			break
			case "ttagit.loadTweetsOfList":
				ttagit.loadTweetsOfList(data.p1[0]);
			break
			case "ttagit.loadTweetsOfSavedSearch":
				ttagit.loadTweetsOfSavedSearch(data.p1[0]);
			break
			case "ttagit.afterPostPhoto":
				ttagit.afterPostPhoto(data.p1[0]);
			break
			case "ttagit.afterPostPhotoDM":
				ttagit.afterPostPhotoDM(data.p1[0]);
			break
			case "ttagit.startTempSearch":
				ttagit.startTempSearch(data.p1[0]);
			break
			case "ttagit.viewController.viewInterface.setTweetTextarea":
				ttagit.viewController.viewInterface.setTweetTextarea(data.p1[0]);
			break
			case "ttagit.shortenUrl.short":
				ttagit.shortenUrl.short(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.afterShortenURL":
				ttagit.afterShortenURL(data.p1[0],data.p1[1],data.p1[2],data.p1[3]);
			break
			case "ttagit.mediaUploader.sharePhoto":
				ttagit.mediaUploader.sharePhoto(data.p1[0],data.f2,data.p2);
			break
			case "ttagit.dbttagit.create_database":
				ttagit.dbttagit.create_database();
			break
			case "ttagit.dbttagit.Addwoeid_to_users":
				ttagit.dbttagit.Addwoeid_to_users();
			break
			case "ttagit.dbttagit.truncateTable_users":
				ttagit.dbttagit.truncateTable_users();
			break
			case "ttagit.dbttagit.truncateTable_preferences":
				ttagit.dbttagit.truncateTable_preferences();
			break
			case "ttagit.dbttagit.updateTable_preferences":
				ttagit.dbttagit.updateTable_preferences();
			break
			case "ttagit.dbttagit.truncateTable_trendtopics":
				ttagit.dbttagit.truncateTable_trendtopics();
			break
			case "ttagit.dbttagit.truncateTable_temp_tweets":
				ttagit.dbttagit.truncateTable_temp_tweets();
			break
			case "ttagit.dbttagit.truncateTable_lists":
				ttagit.dbttagit.truncateTable_lists();
			break
			case "ttagit.dbttagit.truncateTable_tweet_Lists":
				ttagit.dbttagit.truncateTable_tweet_Lists();
			break
			case "ttagit.dbttagit.truncateTable_searches":
				ttagit.dbttagit.truncateTable_searches();
			break
			case "ttagit.dbttagit.truncateTable_tweets_search":
				ttagit.dbttagit.truncateTable_tweets_search();
			break
			case "ttagit.dbttagit.truncateTable_direct_messages":
				ttagit.dbttagit.truncateTable_direct_messages();
			break
			case "ttagit.dbttagit.truncateTable_tweets":
				ttagit.dbttagit.truncateTable_tweets();
			break
			case "ttagit.dbttagit.truncateTable_cookies":
				ttagit.dbttagit.truncateTable_cookies();
			break
			case "ttagit.dbttagit.truncateTable_error_log":
				ttagit.dbttagit.truncateTable_error_log();
			break
			case "ttagit.dbttagit.truncateTable_ttagit":
				ttagit.dbttagit.truncateTable_ttagit();
			break
			case "ttagit.dbttagit.add_trendtopics_tables_and_fields":
				ttagit.dbttagit.add_trendtopics_tables_and_fields();
			break
			case "ttagit.dbttagit.add_tweetimage":
				ttagit.dbttagit.add_tweetimage();
			break
			case "ttagit.reports.add":
				ttagit.reports.add(data.p1[0]);
			break
			case "ttagit.unlockCheck":
				ttagit.unlockCheck();
			break
			case "alert":
				alert(data.p1[0]);
			break
		}
	},

}//of prototype CallBack
