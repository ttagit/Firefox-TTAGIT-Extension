/**
 * Este modulo se encarga de mantener las funciones que se encargan de enviar datos multimedia a las API's necesarias.
 */
 
var TtagitMediaUpload = function(form){
	this.form = form;
	this.boundary = null;
	this.parts = [];
	this.uploader = "pikchur";
}

TtagitMediaUpload.prototype = {

	/**
	 * Setea el form con el cual se desea que el modulo trabaje.
	 * este formulario quedara seteado, hasta que se setee otro, por lo tanto si se desea trabajar con otro formulario, debera ser seteado tambien
	 */
	setForm: function(form){
		ttagit.mediaUploader.form = form;
	},
	
	/**
	 * Este metodo setea cual es la api que se utilizara para subir los datos multimedia que se seteen.
	 * las posibles API's con los que trabaja este modulo hasta el momento son "pikchur "(por defecto) y "twitter"
	 */
	setMediaUploader: function(uploader){
		ttagit.mediaUploader.uploader = uploader;
	},

	/**
	 * chequea si el parametro pasado es nulo. en esta funcion se pueden incluir los posibles valor que se tomaran como nulos.
	 */
	isNull: function(param){
		if((param == null)||(param == "")){
			return true;
		}
		return false;
	},

	/**
	 * realiza el parsea del json recibido y lo retorna
	 */
	parse_JSON: function(JsonResponse){
		var jsonRes = null;

		try{
			jsonRes = jQuery.parseJSON(JsonResponse);
		}catch(e){
			ttagit.debug.showMessage("communication error with pikchur API");
			ttagit.errorLog.setError('104',"Error Code:"+jsonRes.status_code+" message:"+jsonRes.status_txt);
			return null;
		}

		if(jsonRes.status_code != 200){
			ttagit.debug.showMessage("Error  api de bit.ly");
			ttagit.errorLog.setError('104',"Error Code:"+jsonRes.status_code+" message:"+jsonRes.status_txt);
			return null;
		}
		return jsonRes;
	},

	/**
		* Este metodo retorna un arreglo conteniendo los campos (input y select )d el formulario seteado al modulo
		* @return Array
		*/
	getElements: function() {
		var l,i,
		fields = [],
		inputs = this.form.getElementsByTagName("INPUT"),
		selects = this.form.getElementsByTagName("SELECT");

		for (l=inputs.length, i=0; i<l; i++) {
			fields.push(inputs[i]);
		}

		for (l=selects.length, i=0; i<l; i++) {
			fields.push(selects[i]);
		}

		return fields;
	},

	/**
	 * Este metodo genera el boundary que se debe utilizar para enviar los datos 
	 * @return String
	*/
	generateBoundary : function() {
		return "---------------------------" + (new Date).getTime();
	},

/**
	* Crea el mensaje que se debe enviar
	* @param  Array elements
	* @param  String boundary
	* @return String
	*/
	buildMessage : function(mode,functionToEval,paramsTofunc) {
		var CRLF  = "\r\n",
		fields = this.getElements();

		this.parts = [];

		ttagit.mediaUploader.clear = 1;

		fields.forEach(function(field, index, all) {
			var file, reader,
			part = "",
			type = "TEXT";

			if (field.nodeName.toUpperCase() === "INPUT") {
				type = field.getAttribute("type").toUpperCase();
			}

			if (type === "FILE" && field.files.length > 0) {
				file = field.files[0];

				/*
				* Content-Disposition header contains name of the field used
				* to upload the file and also the name of the file as it was
				* on the user's computer.
				*/
				part += 'Content-Disposition: form-data; ';
				part += 'name="' + field.name + '"; ';
				part += 'filename="'+ file.name + '"' + CRLF;

				/*
				* Content-Type header contains the mime-type of the file to
				* send. Although we could build a map of mime-types that match
				* certain file extensions, we'll take the easy approach and
				* send a general binary header: application/octet-stream.
				*/
				part += "Content-Type: application/octet-stream" + CRLF + CRLF;

				/*
					* File contents read as binary data, obviously
				*/
				reader = new FileReader();

				reader.onerror = this.errorHandler;

				reader.onload = function(){
					var result = reader.result;

					part += result + CRLF;
					ttagit.mediaUploader.makeRequest(mode,fields.length,part,functionToEval,paramsTofunc);
				};

				reader.readAsBinaryString(file);

			}else{
				/*
				* In case of non-files fields, Content-Disposition contains
				* only the name of the field holding the data.
				*/
				part += 'Content-Disposition: form-data; ';
				part += 'name="' + field.name + '"' + CRLF;
				part += "Content-Type: text/plain" + CRLF + CRLF;

				/*
				* Field value
				*/
				part += field.value + CRLF;
				ttagit.mediaUploader.makeRequest(mode,fields.length,part,functionToEval,paramsTofunc);
			}
		});
	},

	makeRequest: function(mode,fields,part,functionToEval,paramsTofunc){
		var image,request,
		CRLF  = "\r\n";

		ttagit.mediaUploader.parts.push(part);

		if(ttagit.mediaUploader.parts.length != fields){ return true; }

		image = ttagit.mediaUploader.parts.pop();
		ttagit.mediaUploader.parts.unshift(image);
		request = "--" + ttagit.mediaUploader.boundary + CRLF;
		request+= ttagit.mediaUploader.parts.join("--" + ttagit.mediaUploader.boundary + CRLF);
		request+= "--" + ttagit.mediaUploader.boundary + "--" + CRLF;

		if((ttagit.mediaUploader.uploader == "pikchur") || (mode == "DM")){
			ttagit.mediaUploader.sendData(request,functionToEval,paramsTofunc);
		}else{
			ttagit.twitter.newPostWithMedia(request,functionToEval,paramsTofunc);
		}
	},

	errorHandler: function(evt) {
		//alert(evt.target.error.code);
	},

	sharePhoto: function(mode,functionToEval,paramsTofunc){
		//asinc
		ttagit.mediaUploader.boundary = this.generateBoundary();
		this.buildMessage(mode,functionToEval,paramsTofunc);
	},

	sendData: function(postdata,functionToEval,paramsTofunc){
		var oauth_signature,auth_header,connectionId,contentType,returnHandler,
		url = "https://api.twitter.com/1.1/account/verify_credentials.json";

		ttagit.twitter.oauth.setValues();
		oauth_signature = ttagit.twitter.oauth.calcSignature("GET", url);

		ttagit.twitter.oauth.setValues('realm', 'http://api.twitter.com/');
		ttagit.twitter.oauth.setValues('oauth_signature', oauth_signature);

		auth_header = ttagit.twitter.oauth.makeHeader();
		auth_header = auth_header.replace(/OAuth /i,'');
		connectionId = ttagit.xhr.getConnetion();
		ttagit.xhr.setURL("http://api.pikchur.com/simple/uploadOnly",connectionId);
// 		ttagit.xhr.setURL("http://api.pikchur.com/simple/uploadAndPost",connectionId);

		contentType = "multipart/form-data; boundary=" + ttagit.mediaUploader.boundary;
		ttagit.xhr.setHeader("Content-Type", contentType, connectionId);
		ttagit.xhr.setHeader('X-Verify-Credentials-Authorization',auth_header, connectionId);
		ttagit.xhr.setHeader('X-Auth-Service-Provider','https://api.twitter.com/1.1/account/verify_credentials.json', connectionId);
		returnHandler = ttagit.utils.returnHandler;

		ttagit.xhr.setPost(postdata, connectionId);
		
		ttagit.xhr.setOnLoadFunction (function(datos){// esta funcion se ejecuta cuando termina de cargarse el la respuesta de la API.
			returnHandler(functionToEval,paramsTofunc,datos,'mediaUploader');
		},connectionId);
		ttagit.xhr.setAsBinary(connectionId);//le indico al modulo de comunicacion que voy a enviar los datos como binarios.
		ttagit.xhr.send(connectionId);
	},

}//of prototype
