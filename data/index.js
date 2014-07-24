addon.port.on('updatedUrl',function(url){
	addon.port.emit('getUpdatedTweets');
});
addon.port.on('newTweets',function(tweets){
	$("div").text(JSON.stringify(tweets));
});