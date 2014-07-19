/**
 * Este modulo provee de las operaciones necesarias para la simulacion de cookies a traves de la base de datos.
 * Estas cokkies estan representadas en la base de datos, en la tabla "cokkies"
 **/

var TtagitCookie = function(){
}

TtagitCookie.prototype = {
	/**
	 * Crea la cookie en la base de datos.
	 * 
	 * @name: nombre de la cookie
	 * @value: valor
	*/
	create: function(name, value, global){
		var user_screen_name;

		try{			
			if(ttagit.cookie.exist(name)){
				//existia la cookie
				this.remove(name);
			}
			if(typeof(global)=="undefined"){
				user_screen_name = ttagit.getLoggedUserName();
			}else{
				user_screen_name = global;
			}

			ttagit.dbttagit.query("insert into cookies (ttagit_user_screen_name, name, value) values ('"+user_screen_name+"','"+name+"','"+ttagit.encript.rawEncode(value)+"')");
		}catch(e){
			ttagit.debug.showMessage("No se pudo escribir la cookie en la base de datos en funcion 'cookie.create'.");
		}
	},

	/**
	 * Lee una cookie.
	 *
	 * @name: nombre de la cookie que se desea leer
	 * @global: este parametro indica si la cookie debe ser leida en un ambito global ( sin un usuario logueado ).
	 * en el caso de que global sea true, entonces se utiliza el usuario generico "anonymous"
	 */
	read: function(name,global){
		var res, user_screen_name;

		try{
			if(typeof(global)=="undefined"){
				user_screen_name = ttagit.getLoggedUserName();
			}else{
				user_screen_name = global;
			}
			res = ttagit.dbttagit.query("select value from cookies where (name ='"+name+"' and ttagit_user_screen_name = '"+user_screen_name+"')");
			if(typeof(res[0])!="undefined"){
				return ttagit.encript.rawDecode(res[0].value);
			}
			return null;
		}catch(e){
			//ttagit.debug.showMessage("No se pudo leer la cookie de la base de datos en funcion 'cookie.read'.");
		}
	},

	/**
	 * Elimina una cookie.
	 *
	 * @name: nombre de la cookie que se desea eliminar
	 * @global: este parametro indica si la cookie debe ser eliminada en un ambito global ( sin un usuario logueado ).
	 * en el caso de que global sea true, entonces se utiliza el usuario generico "anonymous"
	 */
	remove: function(name,global){
		var user_screen_name = "anonymous";

		try{
			if(typeof(global)=="undefined"){
				user_screen_name = ttagit.getLoggedUserName();
			}else{
				user_screen_name = global;
			}
			
			ttagit.dbttagit.query("delete from cookies where (name ='"+name+"' and ttagit_user_screen_name = '"+user_screen_name+"')");
		}catch(e){
			ttagit.debug.showMessage("No se pudo borrar la cookie en la base de datos en funcion 'cookie.remove'.");
		}
	},

	/**
	 * Chequea la existencia de una cookie
	 *
	 * @name: nombre de la cookie que se desea buscar
	 * @global: este parametro indica si la cookie debe ser chequeada en un ambito global ( sin un usuario logueado ).
	 * en el caso de que global sea true, entonces se utiliza el usuario generico "anonymous"
	 */
	exist: function(name,global){
		var res;

		try{
			if(typeof(global)!="undefined"){
				res = ttagit.cookie.read(name,global);
			}else{
				res = ttagit.cookie.read(name);
			}
			if(res[0] != null){
				return true;
			}
			return false; 
		}catch(e){
			ttagit.debug.showMessage("No se pudo determinar si existe la cookie '"+name+"' en la base de datos en funcion 'cookie.exist'.");
		}
	},


	/**
	 * Trunca la tabla cookies.
	 */
	clear: function(){

		var user_id = null;
		if(ttagit.cookie.exist('keep_login_user','system')){
			 user_id = ttagit.cookie.read('keep_login_user','system');
		}
		
		ttagit.dbttagit.truncateTable_cookies();

		if(user_id != null){
			ttagit.cookie.create('keep_login_user',user_id,'system');
		}
	},
}
