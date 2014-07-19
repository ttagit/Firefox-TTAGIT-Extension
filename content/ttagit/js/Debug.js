/**
 * Este modulo permite realizar un mejor debugger de ttagit. Provee de las operaciones necesarias para mostrar mensajes de alerta con
 * informacion importante para el debugger. Al activar por medio de la operacion activate, los mensajes comienzan a mostrarse, luego
 * al llamar a la operacion deActivate se desactivan dichos mensajes.
 **/

var TtagitDebug= function(){
	this.active = false;
}

TtagitDebug.prototype = {
	activate: function(){
		this.active = true;
	},

	deActivate: function(){
		this.active = false;
	},

	showMessage: function(message){
		if(this.active){
			ttagit.message.showMessage(message);
		}
	},

	jsonToString: function(json){
		return JSON.stringify(json);
	},

}//of prototype Debug
