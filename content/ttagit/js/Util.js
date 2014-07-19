
/**
 * Este modulo mantiene las funciones comunes a los modulos.
 **/
var TtagitUtil = function(){
}

TtagitUtil.prototype = {

	escapeHTML: function (str) {
		str = str + '';
		return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
	},

//--------------------------------------------
//	 ASYNC MANAGAMENT
//--------------------------------------------

	/*
	 * Funcion para la llamada a las funciones de comunicacion con las distintas API's.
	 * - data - Recibe por parametros un json de la forma
	 * {f1:'function to execute','p1':'params to function f1',f2:'function to execute after execute f1',p2:'params to f2'}
	 *
	 * - prototype - nombre del prototipo donde se encuentra la funcion f1.
	 */
	callHandler: function(data,prototype){
		var params1 = data.p1,
		params2 = data.p2;

		data.f1 = "ttagit."+prototype+"."+data.f1;
		ttagit.callback.execute(data);
	},

	/*
	 * Funcion para el retorno de las funciones de comunicacion con las distintas API's
	 * Todas las funciones de comunicacion con las API's hacen un llamado a esta funcion cuando obtienen el resultado correspondiente pasando
	 * por parametro la funcion que se desea ejecutar, sus respectivos parametros, y la respuesta.
	 */
	returnHandler: function(functionToEval,params,response,prototype){
		var response = ttagit.utils.processResponse(response,prototype);

		if(params != null){
			ttagit.callback.execute({"f1":functionToEval,"p1":params.concat([response])});
		}else{
			ttagit.callback.execute({"f1":functionToEval,"p1":[response]});
		}
	},

	/**
	 *
	 * Esta funcion es la encargada de procesar la respuesta obtenida de las distintas API's, segun el prototipo (modulo) con el cual se este trabajando
	 * - response - recibe en este parametro la respuesta obtenida desde la API.
	 * - prototype - recibe en este parametro el nombre del prototipo con el que se esta trabajando.
	 **/
	processResponse: function(response, prototype){
		var res;
		switch(prototype){
			case 'twitter': //se llamo al returnHandler desde el modulo de twitter
				res = this.actionsForTwitter(response);
			break;
			case 'mediaUploader':
				res = this.actionsForMediaUpload(response);
			break;
			case 'shortenUrl':
				res = this.actionsForShortenUrl(response);
			break;
		}
		return res;
	},

	/**
	 * esta funcion chequea que el parametro recibido sea nulo. toma como parametro nulo a un parametro con valor null o ''
	 **/
	isNull: function(param){
		if((param == null)||(param == "")){
			return true;
		}
		return false;
	},

	/**
	 * Esta funcion recibe informacion y luego intenta parsearla. para esto primero intenta parsear un JSON, en el caso de poder parsearlo correcamente
	 * retorna el JSON parseado. En el caso de haber recibido un XML entonces se produce un error, la funcion detecta el error e intenta parsear entonces un XML.
	 * luego convierte la informacion obtenida del XML a un JSON valido y lo retorna.
	 */
	ParseInfo: function(info){
		var JSON,XML;
		JSON = this.parse_JSON(info);

		if(JSON != null){
			return JSON;
		}

		parser = new DOMParser();
		XML = parser.parseFromString(info,"text/xml");

		JSON = $.xml2json(XML);
		return JSON
	},

	/**
	 * TWITTER
	 */

	/*
	 *Verifica si hubo un error en la respuesta obtenida de twitter. Retorna un arreglo con un entero indicando si hubo o no un error, luego
	 *un string con el error. Y en caso de no existir un error tambien retorna el json parseado de la respuesta de twitter.
	 *Posibles errores que se pueden dar son:
	 * - Twitter is over Capacity. Error de tipo -1. Se da en caso de no poder parsear el json, porque twittter retorna un HTML cuando esta sobre capacidad.
	 * - Error enviado por twitter. Error de tipo 0. Error enviado por twitter en el json.
	 * en el caso de no haber un error el codigo sera 1.
	 */
	ParseTwitterInfo: function(twitterResponse){
		var jsonRes = null;
		if(twitterResponse == null){//si la respuesta fue null
			return [-1,"Twitter is Over Capacity.",{"error":"Twitter is Over Capacity."}];
		}

		try{
			jsonRes = jQuery.parseJSON(twitterResponse);
		}catch(e){
			return [-1,"Twitter is Over Capacity.",{"error":"Twitter is Over Capacity."}];//si no se pudo parsear el json de respuesta
		}

		try{
			if(typeof(jsonRes.error) != "undefined"){
				return [0,jsonRes.error,jsonRes];
			}
		}catch(e){
			return [-1,"Twitter does not respond.",{"error":"Twitter does not respond."}];//se encontro un error no reconocido
		}

		return [1,"OK",jsonRes];
	},

	actionsForTwitter: function(response){
		var validate = this.ParseTwitterInfo(response);

		if(validate[0]==-1){
			//no se pudo parsear el json -  probablemente es un HTML "Twitter is over capacity"
			ttagit.debug.showMessage(validate[1]);
			ttagit.message.set('error','101',[validate[1]]);
		}

		else if(validate[0]==0){
			//hubo un error en el json
			ttagit.debug.showMessage("Error: "+validate[1]);
			ttagit.message.set('error','102',[validate[1]]);
		}

		return (validate[2]);// retorno la respuesta de isError.
	},

	/**
	 * MEDIAUPLOAD
	 */

	actionsForMediaUpload: function(response){
		var parser,xmlDoc,status,msg,mediaUrl;

		//Esta API responde por medio de un XML, asi que lo tengo que PARSEAR para poder obtener la url de la imagen.
		parser = new DOMParser();
		xmlDoc = parser.parseFromString(response,"text/xml");

		status = $(xmlDoc).find('rsp').attr('status');

		if(status == "ok"){
			mediaUrl = $(xmlDoc).find('mediaurl').text();
			return ({"status":"ok","mediaurl":mediaUrl});
		}else{
			msg = $(xmlDoc).find('err').attr('msg');
			return ({"status":"fail","msg":msg});
		}
	},

	ParseBitLyInfo: function(JsonResponse){
		var jsonRes = null;

		try{
			jsonRes = jQuery.parseJSON(JsonResponse);
		}catch(e){
			ttagit.debug.showMessage("Error de comunicacion con api de bit.ly");
			ttagit.errorLog.setError('104',"Error Code:"+jsonRes.status_code+" message:"+jsonRes.status_txt);
			return null;
		}

		if(jsonRes.status_code == 200){ return jsonRes; }

		ttagit.debug.showMessage("Error  api de bit.ly");
		ttagit.errorLog.setError('104',"Error Code:"+jsonRes.status_code+" message:"+jsonRes.status_txt);
		return null;
	},

	actionsForShortenUrl: function(response){
		var response_JSON,url;

		response_JSON = this.ParseBitLyInfo(response),
		url = ttagit.shortenUrl.longUrl;

		if(response_JSON != null){
			url = unescape(response_JSON.data.url);
			this.longUrl = null;
		}
		return url;
	},

}
