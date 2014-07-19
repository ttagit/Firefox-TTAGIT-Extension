/**
 * ESTE MODULO NO SE ENCUENTRA EN USO ACTUALMENTE
 * Este modulo se encarga del almacenamiento de los mensajes que se deben ir mostrando. Mantiene una secuencia de mensajes que luego
 * pueden ser mostrados cuando se desee.
 **/

var TtagitMessage = function(){
	this.messages = [];
}

TtagitMessage.prototype = {

	set: function(type,errorCode,msg){
		if(type == 'info'){
			ttagit.message.setInfoMessage(msg);
		}else if(type == 'general'){
			ttagit.message.setGeneralMessage(msg);
		}else if(type == 'error'){
			ttagit.message.setErrorMessage(errorCode,msg);
		}else{
			ttagit.debug.showMessage("tipo invalido de mensaje en funcion 'setMessage'.");
		}
	},

	showMessage: function(message){
		alert(message);
	},

	//TODO join setInfoMessage, setGeneralMessage and setErrorMessage in
	//setMessage (type, msg)

	setInfoMessage: function(msg){
		var message = [{'code':'0','type':'info','message':msg[0]}];
		ttagit.message.messages = ttagit.message.messages.concat(message);
	},

	setGeneralMessage: function(msg){
		var message = [{'code':'0','type':'general','message':msg[0]}];
		ttagit.message.messages = ttagit.message.messages.concat(message);
	},

	setErrorMessage: function(errorCode,msg){
		var message = [{'code':errorCode,'type':'error','message':msg[0]}];
		ttagit.message.messages = ttagit.message.messages.concat(message);
		if(msg.length == 1){
			ttagit.errorLog.setError(errorCode,msg[0]);
		}else{
			//en el caso de que hayan mas de un mensaje seteado en el arreglo,
			//el primero es el que se muestra al usuario.
			//y el segundo el que se setea en el errorLog.
			ttagit.errorLog.setError(errorCode,msg[1]);
		}
	},

	get: function(){
		if(ttagit.message.empty()){ return null; }
		return ttagit.message.messages.pop();
	},

	getAll: function(){
		var msj;
		if(ttagit.message.empty()){ return null; }

		msj = ttagit.message.messages;
		ttagit.message.messages = [];
		return msj;
	},

	empty: function(){
		if(ttagit.message.length == 0){ return true; }
		return false;
	},

	length: function(){
		return ttagit.message.messages.length;
	},
}
