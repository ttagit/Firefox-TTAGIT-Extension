/**
 * Este modulo se encarga de enviar una url larga a la API de bit.ly para poder obtener la url corta.
**/
var TtagitShortenUrl = function(){
	this.longUrl = null;
}

TtagitShortenUrl.prototype = {

	/**
	 * Esta funcion se encarga de obtener la url acortada
	 */
	short: function(longUrl,functionToEval,paramsTofunc){
		var connectionId,returnHandler,
		url = "http://api.bit.ly/v3/shorten?login=ttagit&apiKey=R_6832fe42e74ac086234b761422395d36&longUrl="+longUrl+"&format=json";

		if(longUrl == null){ ttagit.debug.showMessage("falta el parametro longUrl en la llamada a la funcion shortenUrl.short."); }
		this.longUrl = longUrl;

		url = "http://api.bit.ly/v3/shorten?login=ttagit&apiKey=R_6832fe42e74ac086234b761422395d36&longUrl="+encodeURIComponent(longUrl)+"&format=json"
		connectionId = ttagit.xhr.getConnetion()

		ttagit.xhr.setURL(url,connectionId);

		returnHandler = ttagit.utils.returnHandler;
		ttagit.xhr.setOnLoadFunction (function(datos){// esta funcion se ejecuta cuando termina de cargarse el la respuesta de la API.
			returnHandler(functionToEval,paramsTofunc,datos,'shortenUrl');
		},connectionId);

		ttagit.xhr.send(connectionId);
	},

}//of prototype
