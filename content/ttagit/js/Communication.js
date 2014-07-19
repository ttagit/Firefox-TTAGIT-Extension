/**
 *Este modulo mantiene un arreglo de conecciones, con las cuales los distintos modulos pueden acceder a las distintas
 *API's de forma asincronica y sin problemas de colisiones de datos.
 *Este modulo provee de una coneccion para cada funcion que necesite realizar una comunicacion con alguna API.
 */

var TtagitCommunication = function(){
	this.requests = new Object();
	this.responseText = null;
}

TtagitCommunication.prototype = {

	/**
	 * Este metodo genera una nueva coneccion, a la cual se le asigna un id, que permitira el acceso a la misma.
	 * @return: retorna el id de la coneccion generada, para que la funcion que hizo el pedido pueda acceder a dicha coneccion.
	 */
	getConnetion: function ()
	{
		var id = new Date().getTime();
		this.requests[id] = new TtagitHttpRequest(id);
		return id;
	},

	/**
	 * Este metodo elimina unaconeccion.
	 * @id - identifica la coneccion que se desea eliminar
	 */
	removeConnection: function(id)
	{
		if (this.requests[id] != undefined){
			delete this.requests[id];
		}
	},

	/**
	 * Este metodo setea la url para la coneccion indicada.
	 * @url - indicando la url que se desea setear.
	 * @id - que identifica la coneccion con la que se desea trabajar.
	 */
	setURL: function(url,id)
	{
		if (typeof this.requests[id] == 'undefined'){
			ttagit.debug.showMessage("se llamo a la funcion Communication.setURL con un id invalido. Se debe requerir una conexion antes.");
			ttagit.message.set('error','105',['Invalid connection access. The connection not exist, in function Communication.setURL']);
			return false;
		}

		this.requests[id].setURI(url);
		this.requests[id].setRedirectLimitation(0); //TODO: si se cambia este modulo por el otro, hay que eliminar esta linea.
	},

	/**
	 * Este metodo setea un header para la coneccion indicada.
	 * @header - indicando el header que se desea setear.
	 * @param - parametro para el header.
	 * @id - que identifica la coneccion con la que se desea trabajar.
	 */
	setHeader: function(header, param, id)
	{
		if (typeof this.requests[id] == 'undefined'){
			ttagit.debug.showMessage("se llamo a la funcion Communication.setHeader con un id invalido. Se debe requerir una conexion antes.");
			ttagit.message.set('error','105',['Invalid connection access. The connection not exist, in function Communication.setHeader']);
			return false;
		}

		this.requests[id].setRequestHeader(header,param,id);
	},

	/**
	 * Este metodo setea los parametros que se deben enviar por POST, para la coneccion indicada.
	 * @data - indicanco los datos que se desean enviar.
	 * @id - que identifica la coneccion con la que se desea trabajar.
	 */
	setPost: function(data,id)
	{
		if (typeof this.requests[id] == 'undefined'){
			ttagit.debug.showMessage("se llamo a la funcion Communication.setPost con un id invalido. Se debe requerir una conexion antes.");
			ttagit.message.set('error','105',['Invalid connection access. The connection not exist, in function Communication.setPost']);
			return false;
		}

		this.requests[id].setPostData(data,id);
	},

	/**
	 * Este metodo setea la funcion que se desea ejecutar luego de obtener la respuesta de la API con la cual se realizo la coneccion.
	 * @func - indicanco la funcion que se debe ejecutar
	 * @id - que identifica la coneccion con la que se desea trabajar.
	 */
	setOnLoadFunction: function (func,id)
	{
		if (typeof this.requests[id] == 'undefined'){
			ttagit.debug.showMessage("se llamo a la funcion Communication.setOnLoadFunction con un id invalido. Se debe requerir una conexion antes.");
			ttagit.message.set('error','105',['Invalid connection access. The connection not exist, in function Communication.setOnLoadFunction']);
			return false;
		}

		this.requests[id].setOnLoadFunction(func,id);
	},

	/**
	 * Este metodo setea la funcion que se desea ejecutar luego de obtener un error en la respuesta de la API con la cual se realizo la coneccion.
	 * @func - indicanco la funcion que se debe ejecutar.
	 * @id - que identifica la coneccion con la que se desea trabajar.
	 */
	OnErrorFunction: function (id)
	{
		if (typeof this.requests[id] == 'undefined'){
			ttagit.debug.showMessage("se llamo a la funcion Communication.OnErrorFunction con un id invalido. Se debe requerir una conexion antes.");
			ttagit.message.set('error','105',['Invalid connection access. The connection not exist, in function Communication.OnErrorFunction']);
			return false;
		}
		
		this.requests[id].onerror = function (msg,url,line) {
			var text1="Error Displayed\n\n";
			text1+="Error: " + msg + "\n";
			text1+="URL: " + url + "\n";
			text1+="Line Number: " + line + "\n\n";
			text1+="Click OK to continue.\n\n";
			alert(text1);
			//return true;
		};
	},

	/**
	 * Este metodo setea que los datos a enviar por la coneccion deben enviarse como binarios.
	 * @id - que identifica la coneccion con la que se desea trabajar.
	 */
	setAsBinary: function(id)
	{
		if (typeof this.requests[id] == 'undefined'){
			ttagit.debug.showMessage("se llamo a la funcion Communication.setAsBinary con un id invalido. Se debe requerir una conexion antes.");
			ttagit.message.set('error','105',['Invalid connection access. The connection not exist, in function Communication.setAsBinary']);
			return false;
		}

		this.requests[id].setAsBinary();
	},

	/**
	 * Este metodo hace el pedido a la API haciendo el envio.
	 * @id - que identifica la coneccion con la que se desea trabajar.
	 */
	send: function(id)
	{
		if (typeof this.requests[id] == 'undefined'){
			ttagit.debug.showMessage("se llamo a la funcion Communication.send con un id invalido. Se debe requerir una conexion antes.");
			ttagit.message.set('error','105',['Invalid connection access. The connection not exist, in function Communication.send']);
			return false;
		}
		
		this.requests[id].asyncOpen(true);
		this.removeConnection(id);
	},

	/**
	 * Obtiene la respuesta que se obtuvo de la llamada a la API.
	 * @id - que identifica la coneccion con la que se desea trabajar.
	 */
	response: function(id)
	{
		if (typeof this.requests[id] == 'undefined'){
			ttagit.debug.showMessage("se llamo a la funcion Communication.response con un id invalido. Se debe requerir una conexion antes.");
			ttagit.message.set('error','105',['Invalid connection access. The connection not exist, in function Communication.response']);
			return false;
		}
		
		this.responseText = this.requests[id].responseText;
		//alert(request.responseText);
		return this.responseText;
	}

}//of prototype
