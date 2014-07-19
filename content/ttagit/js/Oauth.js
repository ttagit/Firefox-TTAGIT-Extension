/**
 * Este modulo se encarga de realizar los calculos y seteos correspondientes para obtener la coneccion con las API's que
 * utilizar Oauth para su comunicacion.
 */

var TtagitOauth = function(consumerKey,sharedSecret){
	this.oauth_params = new Array();
	this.oauth_values = new Array();
	this.keys = {'consumer_key':consumerKey, 'shared_secret':sharedSecret};
	this.tokens = null;
}

TtagitOauth.prototype = {

		setTokens: function (oauthToken,oauthTokenSecret) {
			this.tokens = {'oauth_token':oauthToken, 'oauth_token_secret':oauthTokenSecret};
		},

		initValues: function (key, value) {
			this.setValues(null, null);
		},

		setValues: function (key, value) {
			var a_pair,timestamp,nonce;

			if (key != null && value != null ) {
				//set the pair name|value
				a_pair= this.oauth_values.pop();
				this.oauth_values.push(key+'|'+value);
				this.oauth_values.push(a_pair);
				return true;
			}

			timestamp = Math.round((new Date()).getTime() / 1000);
			nonce = timestamp + Math.random();

			//load default values
			this.oauth_params =new Array();
			this.oauth_values = new Array (
				"oauth_nonce|" + nonce,
				"oauth_signature_method|" + "HMAC-SHA1",
				"oauth_timestamp|" + timestamp,
				"oauth_consumer_key|" + this.keys.consumer_key,
				"oauth_version|" + "1.0"
			);

			// if user id loged in we must include the token
			if(this.tokens != null) {
				a_pair = this.oauth_values.pop();
				this.oauth_values.push('oauth_token' + '|' + this.tokens.oauth_token);
				this.oauth_values.push(a_pair);
			}

		},

		setParams: function (key, value) {
			this.oauth_params.push(ttagit.encript.rawEncode(key)+'|'+ttagit.encript.rawEncode(value));
		},

		calcSignature: function (method, url) {

			// read RFC 5849 (oAuth 1.0)
			// http://tools.ietf.org/html/rfc5849#section-3.4.1

			//url without get params
			var ots,base_string,params,i,a_pair,signature,
			urlWithoutParams= url,
			url_aux = url.split('?');

			urlWithoutParams=url_aux[0];

			//oauth token secret (if user is loged-in)
			ots = ''; 
			if(this.tokens != null) { ots = this.tokens.oauth_token_secret; }

			//first base string setings method & base string URI
			base_string = new Array (method,encodeURIComponent(urlWithoutParams)); 

			//Request Parameters
			params = this.oauth_params.concat(this.oauth_values); 
			params = params.sort();

			for(i =0; i< params.length; i++) 
			{
				a_pair = params[i].split("|");
				params[i] = a_pair.join('=');
			}
			params = params.join('&');
			params = encodeURIComponent(params);

			//add request parameters to base string
			base_string.push(params);
			base_string = base_string.join('&');

			//use HMAC-SHA1 to encript it 
			signature = ttagit.encript.sha1.b64_hmac_sha1(this.keys.shared_secret+"&"+ots, base_string);
			//this may be strange but it's fine. it all about b64_hmac_sha1() carences
			return signature+"=";
		},

		makeHeader: function () {

			//get values
			var i,a_pair,heather,
			values = this.oauth_values;

			//make it as name="value"
			for(i =0; i< values.length; i++)
			{
				a_pair = values[i].split("|");
				a_pair[1]= '\"' + ttagit.encript.rawEncode(a_pair[1]) +  '\"';
				values[i] = a_pair.join('=');
			}

			//add info
			values[0]='OAuth relam="", ' + values[0];

			//make header
			heather=values.join(', ');
			return heather;
		},

		getBody: function (type) {

			var i,a_pair,
			params = this.oauth_params;

			for(i =0; i< params.length; i++) {
				a_pair = params[i].split("|");
				params[i] = a_pair.join('=');
			}

			params = params.sort()
			params = params.join('&');

			return params;
		}

}
