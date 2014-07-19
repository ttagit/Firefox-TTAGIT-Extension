var TtagitErrorLog = function(){
	this.active = true;//se utiliza para controlar si se deben guardar o no los logs. En el caso de true (Por defecto) los logs seran guardados.
	this.logs = [];
}

TtagitErrorLog.prototype = {

	/*
	 *almacena un nuevo errorlog en el arreglo de logs, luego hace un dump en la base de datos y borra los logs.
	 */
	setError: function(errorCode,msg){
		var i, res, date, error, logsToSave,
		user_screen_name = "anonymous",
		user_twitter_id = '',
		log = [{'code':errorCode,'message':msg}];

		if(ttagit.logedUser != null){
			user_screen_name = ttagit.logedUser.screen_name;
			user_twitter_id = ttagit.logedUser.twitter_id;
		}


		ttagit.errorLog.logs = ttagit.errorLog.logs.concat(log);
		try{
			// La funcion getAll Ya hace un clear de los logs, asi que no hace falta hacerlo.
			logsToSave = ttagit.errorLog.getAll();
			for (i=0;i<logsToSave.length;i++){

				//Tomo el error y borro las comillas simples y dobles para poder guardar en la base de datos.
				error = logsToSave[i];
				error.message = error.message.replace(/\'/g,'');
				error.message = error.message.replace(/\"/g,'');

				//registro el error en la DB
				res = ttagit.dbttagit.query("SELECT datetime() date");
				date = res[0].date;
				ttagit.dbttagit.query("insert into errorlog (twitter_id ,username,created, error_code, text) values ('"+user_twitter_id+"','"+user_screen_name+"','"+date+"','"+error.code+"','"+error.message+"')");
			}
		}catch(e){
			ttagit.debug.showMessage("No se pudo escribir el log en la base de datos en funcion 'errorLog.setError'.'\n' description: "+e);
		}
	},

	/*
	 *almacena un nuevo log en el arreglo de logs.
	 */
	setLog: function(msg){
		var Log = [{'code':'0','message':msg}];

		if(!this.active){
			ttagit.debug.showMessage("Warning - actualmente se encuentra desactivado el registro de logs.\nPuede activarlos con la funcion activateLogs en el modulo ErrorLog ");
			return false;
		}

		ttagit.errorLog.logs = ttagit.errorLog.logs.concat(Log);
		if(ttagit.errorLog.logs.length > 20){
			//borro el primer log
			ttagit.errorLog.logs.splice(0,1);
		}
	},

	/*
	 * Limpia el arreglo de logs
	 */
	clear: function(){
		if(!ttagit.errorLog.empty()){ ttagit.errorLog.logs = []; }
	},

	/*
	 * Retorna el arreglo de logs y lo limpia
	 */
	getAll: function(){
		var Log;
		if(ttagit.errorLog.empty()){ return null; }

		Log = ttagit.errorLog.logs;
		ttagit.errorLog.clear();
		return Log;
	},

	/*
	 * Retorna true si no hay logs, y false en caso contrario.
	 */
	empty: function(){
		if(ttagit.errorLog.length == 0){ return true; }
		return false;
	},

	/*
	 * Retorna la cantidad de logs guardados.
	 */
	length: function(){
		return ttagit.message.messages.length;
	},

	/*
	 * Activa el record de logs
	 */
	activateLogs: function(){
		this.active = true;
	},

	/*
	 * Desactiva el record de logs
	 */
	deActivateLogs: function(){
		this.active = false;
	},
}
