/**
 * Este modulo, mantiene las funciones que se encargan de realizar las conecciones propiamente dichas con las distintas API's
 */
var TtagitHttpRequest = function(id){
	var xhr = new XMLHttpRequest;
	this.postData = null;
	this.responseText = "";
	this.method = "GET";
	this.url = null;
	this.headers = new Array();
	this.onLoadFunc = null;
	this.asBinary = false;
	this.id = id;
}

TtagitHttpRequest.prototype = {
	/**
	 * Este metodo se encarga de setear la url de la coneccion, donde se desea hacer el pedido
	 */
	setURI: function(url)
	{
		this.url = url;
	},

	/**
	 * Este metodo se encarga de setear los headers a la coneccion
	 * @header - nombre del header que se desea setear 
	 * @param - valor a setear para el header
	 */
	setRequestHeader: function(header, param)
	{
		this.headers.push({'header':header,'param':param});
	},

	setRedirectLimitation: function(num)
	{
		//DO NOTHING
	},

	/**
	 * Este metodo se encarga de setear los datos que se desean enviar.
	 * @data - datos que se desean enviar.
	 */
	setPostData: function(data)
	{
		this.method = "POST";
		this.postData = data;
	},

	/**
	 * Este metodo se encarga de setear la funcion que se desea realizar luego de obtener la respuesta de la API.
	 * @func - funcion que se desea ejecutar luego de obtener la respuesta.
	 */
	setOnLoadFunction: function(func)
	{
		this.onLoadFunc = func;
	},

	/**
	 * Este metodo se encarga de indicar que los datos que van a enviarse, se deben enviar de forma binaria.
	 */
	setAsBinary: function()
	{
		this.asBinary = true;
	},

	/**
	 * Este metodo se encarga de hacer la llamada a la API, enviando los datos correspondientes y segun todas las opciones seteadas.
	 */
	asyncOpen: function()
	{
		var i,func,id,xxx,
		xhr = new XMLHttpRequest;

		if(this.asBinary){
			xhr.open(this.method, this.url, true);
			for(i=0;i<this.headers.length;i++){
				xhr.setRequestHeader(this.headers[i].header, this.headers[i].param);
			}
			func = this.onLoadFunc;
			id = this.id;
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					//alert (xhr.getAllResponseHeaders());
					func(xhr.responseText);
					ttagit.xhr.removeConnection(id);
				}
			};

			xhr.sendAsBinary(this.postData);
		}else{
			xhr.open(this.method, this.url, true);
			xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded; charset=UTF-8');
			for(i=0;i<this.headers.length;i++){
				xhr.setRequestHeader(this.headers[i].header, this.headers[i].param);
			}
			func = this.onLoadFunc;
			xxx = this.url;
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					//alert (xxx);
					//alert(xhr.responseText);
					//if(xxx == "https://upload.twitter.com/1/statuses/update_with_media.json"){
					//alert(xhr.getAllResponseHeaders());
					//}
					func(xhr.responseText);
						
					//TODO: hacer un removeConnection
				}
			};
			xhr.send(this.postData);
		}
	},
};
