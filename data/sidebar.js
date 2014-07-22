addon.port.on("pinSaved", function(isSucccess) {
  if (isSuccess === true)
        alert("Authorized, woot!");
      else
        alert("There was some problem.");
});

$(function(){
	$("#submit").click(function(){
		alert($("#pin").val())
		addon.port.emit("savePin",$("#pin").val());
	});
})