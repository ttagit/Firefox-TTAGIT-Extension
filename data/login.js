addon.port.on("pinSaved", function(isSuccess) {
  if (isSuccess === false)
   	console.log("There was some problem.");
});

$(function(){
	$("#submit").click(function(){
		addon.port.emit("savePin",$("#pin").val());
	});
})