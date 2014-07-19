/**
 * Este modulo mantiene las operaciones de encriptacion necesarias para almacenar datos en la base de datos y para el envio de
 * informacion.
 **/
var TtagitEncript= function(){
	this.sha1 = new Sha1();
	this.base64 = new Base64();
	this.md5 = new Md5();
}

TtagitEncript.prototype = {
	rawEncode: function(text)
	{
		var aux = '';
		aux = encodeURIComponent(text);
		//aux = aux.replace(/~/g,'%7E');
		aux = aux.replace(/!/g,'%21');
		aux = aux.replace(/\*/g,'%2A');
		aux = aux.replace(/\(/g,'%28');
		aux = aux.replace(/\)/g,'%29');
		aux = aux.replace(/\'/g,'%27');
		return aux;
	},

	rawDecode: function(text)
	{
		var aux = text;
		aux = aux.replace(/%7E/g,'~');
		aux = aux.replace(/%21/g,'!');
		aux = aux.replace(/%2A/g,'*');
		aux = aux.replace(/%28/g,'(');
		aux = aux.replace(/%29/g,')');
		aux = aux.replace(/%27/g,'\'');
		aux = decodeURIComponent(aux);
		return aux;
	},

	addslashes: function(str) {
		str=str.replace(/\\/g,'\\\\');
		str=str.replace(/\'/g,'\\\'');
		//str=str.replace(/\"/g,'\\"');
		str=str.replace(/\0/g,'\\0');
		return str;
	},

	stripslashes: function(str) {
		str=str.replace(/\\'/g,'\'');
		str=str.replace(/\\"/g,'"');
		str=str.replace(/\\0/g,'\0');
		str=str.replace(/\\\\/g,'\\');
		return str;
	},
}//of prototype Encript
