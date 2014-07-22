const TWITTER_USER_ID_STORAGE_KEY = "userid";

var Twitter = function() {};

Twitter.prototype.getAccessToken = function() {
  var accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

  return _.isString(accessToken) ? accessToken : null;
};

Twitter.prototype.getAccessTokenSecret = function() {
  var accessTokenSecret = localStorage.getItem(ACCESS_TOKEN_SECRET_STORAGE_KEY);

  return _.isString(accessTokenSecret) ? accessTokenSecret : null;
};

Twitter.prototype.getUserID = function() {
  var userid = Number(localStorage.getItem(TWITTER_USER_ID_STORAGE_KEY));

  return (_.isNumber(userid) && !_.isNaN(userid)) ? userid : null;
};

Twitter.prototype.parseToken = function(data) {
  if (_.isString(data)) {
    var parsedToken = {};

    data.split('&').forEach(function(token) {
      var kv = token.split('=');

      parsedToken[kv[0]] = kv[1];
    });

    return parsedToken;
  }

  return null;
};


//


Twitter.prototype.login = function() {
  var that = this;
  var message = {
    "method": "GET",
    "action": "https://api.twitter.com/oauth/request_token",
    "parameters": {
      "oauth_consumer_key": CONSUMER_KEY,
      "oauth_signature_method": "HMAC-SHA1"
    }
  };

  var accessor = {
    "consumerSecret": CONSUMER_SECRET
  };

  OAuth.setTimestampAndNonce(message);
  OAuth.SignatureMethod.sign(message, accessor);
    
  self.port.on('savePin',function(pin){
    that.sign(pin, function(isSuccess){
      self.port.emit('pinCheck',isSuccess);
    });
  });
  

  self.port.emit("generateTwitterLoginUrl", OAuth.addToURL(message.action, message.parameters));
  self.port.on('generatedResult',function(data){
    console.log("got data",data);
    var params = that.parseToken(data);
    console.log("got params",params);
    var token = params.oauth_token;
    var secret = params.oauth_token_secret;


    message.action = "https://api.twitter.com/oauth/authorize";
    message.parameters.oauth_token = token;

    accessor.oauth_token_secret = secret;

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);

    that.request_token = token;
    that.request_token_secret = secret;

    self.port.emit('openLoginUrl',OAuth.addToURL(message.action, message.parameters));

  });
  
  // $.get(
  //   OAuth.addToURL(message.action, message.parameters),
  //   $.proxy(
  //     function(data) {
  //       var params = this.parseToken(data);
  //       var token = params.oauth_token;
  //       var secret = params.oauth_token_secret;

  //       message.action = "https://api.twitter.com/oauth/authorize";
  //       message.parameters.oauth_token = token;

  //       accessor.oauth_token_secret = secret;

  //       OAuth.setTimestampAndNonce(message);
  //       OAuth.SignatureMethod.sign(message, accessor);

  //       this.request_token = token;
  //       this.request_token_secret = secret;

  //       window.open(OAuth.addToURL(message.action, message.parameters));
  //     },
  //     this
  //   )
  // );
};

Twitter.prototype.sign = function(pin, cb) {
  var that = this;
  var requestToken = this.request_token;
  var requestTokenSecret = this.request_token_secret;

  delete this.request_token;
  delete this.request_token_secret;

  var message = {
    "method": "GET",
    "action": "https://api.twitter.com/oauth/access_token",
    "parameters": {
      "oauth_consumer_key": CONSUMER_KEY,
      "oauth_signature_method": "HMAC-SHA1",
      "oauth_token": requestToken,
      "oauth_verifier": pin
    }
  };

  var accessor = {
    "consumerSecret": CONSUMER_SECRET,
    "tokenSecret": requestTokenSecret
  };

  OAuth.setTimestampAndNonce(message);
  OAuth.SignatureMethod.sign(message, accessor);

  $.ajax({
    "type": "GET",
    "url": OAuth.addToURL(message.action, message.parameters),
    "success": $.proxy(function(data) {
      var params = this.parseToken(data);

      this.save(params.oauth_token, params.oauth_token_secret, params.user_id);

      cb(true);
    }, this),
    "error": function(xhr, status, error) {
      cb(false);
    }
  });
};

Twitter.prototype.save = function(accessToken, accessTokenSecret, userid) {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(ACCESS_TOKEN_SECRET_STORAGE_KEY, accessTokenSecret);
  localStorage.setItem(TWITTER_USER_ID_STORAGE_KEY, userid);
};

Twitter.prototype.isAuthenticated = function() {
  return !_.isNull(this.getAccessToken()) && !_.isNull(this.getAccessTokenSecret()) && _.isNumber(this.getUserID()) ? true : false;
};

Twitter.prototype.fetchTimelines = function(elm,inputButton,loading,url) {
  //
  var accessToken = this.getAccessToken();
  var accessTokenSecret = this.getAccessTokenSecret();

  var q = encodeURIComponent(url).replace(/'/g,"%27").replace(/"/g,"%22");

  var message = {
    "method": "GET",
    "action": "https://api.twitter.com/1.1/search/tweets.json?q="+q,
    "parameters": {
      "oauth_consumer_key": CONSUMER_KEY,
      "oauth_signature_method": "HMAC-SHA1",
      "oauth_token": accessToken,
      "count": 100
    }
  };

  var accessor = {
    "consumerSecret": CONSUMER_SECRET,
    "tokenSecret": accessTokenSecret
  };

  OAuth.setTimestampAndNonce(message);
  OAuth.SignatureMethod.sign(message, accessor);
  //alert((JSON.stringify(OAuth.addToURL(message.action, message.parameters))));




//   <form role="form">
//   <div class="form-group">
//     <label for="exampleInputEmail1">Email address</label>
//     <input type="email" class="form-control" id="exampleInputEmail1" placeholder="Enter email">
//   </div>
//   <div class="form-group">
//     <label for="exampleInputPassword1">Password</label>
//     <input type="password" class="form-control" id="exampleInputPassword1" placeholder="Password">
//   </div>
//   <div class="form-group">
//     <label for="exampleInputFile">File input</label>
//     <input type="file" id="exampleInputFile">
//     <p class="help-block">Example block-level help text here.</p>
//   </div>
//   <div class="checkbox">
//     <label>
//       <input type="checkbox"> Check me out
//     </label>
//   </div>
//   <button type="submit" class="btn btn-default">Submit</button>
// </form>

  var tweetInput = $("<div>").attr("id","newTweet").attr("class","col-xs-12").append(

    $("<form>").attr("role","form").append(

      $("<div>").attr("class","form-group").append(
        $("<textarea>").attr("class","inputbox form-control").attr("placeholder","What's on your mind?"),
        $("<button>").html("Tweet about this page").attr("id","sendTweet").attr("class","btn btn-default pull-right")
        .click(function(){
              sendTweet();
          })
        )

      )
   
  );
  //var debug = $("<div>").attr("id", "debug");
  //debug.html(JSON.stringify(OAuth.addToURL(message.action, message.parameters)));
  
  var renderTweets = null;
  var tweets = null;
  var in_reply_to_status_id = null;


  


  var sendTweet = function(){
    $(loading).addClass('show').removeClass('hide');
    delete message['count'];
    message.method = "POST";
    message.action = "https://api.twitter.com/1.1/statuses/update.json";
    message.oauth_token = accessToken
    message.parameters['status'] = ($(tweetInput).find("textarea").val() +" " +url)
    if(in_reply_to_status_id)
      message.parameters['in_reply_to_status_id'] = in_reply_to_status_id;
    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, {
      "consumerSecret": CONSUMER_SECRET,
      "tokenSecret": accessTokenSecret
    });

    $.ajax({
      type: "POST",
      url: OAuth.addToURL(message.action, message.parameters),
      //data: {status : encodeURIComponent($(tweetInput).find("textarea").val() +" " +url).replace(/'/g,"%27").replace(/"/g,"%22") },
      success: function(data){
        //alert(JSON.stringify(data));
        tweets.unshift(data);
        renderTweets();
        $(tweetInput).find("textarea").val("");
        $(loading).addClass('hide').removeClass('show');
      },
      error: function(xhr, status, error) {
        //alert(JSON.stringify(xhr));
        //alert(JSON.stringify(message));
        //alert(JSON.stringify(error));
        //alert(OAuth.addToURL(message.action, message.parameters));
        //alert(encodeURIComponent($(tweetInput).find("textarea").val() +" " + url).replace(/'/g,"%27").replace(/"/g,"%22"));

        if (xhr.status === 401) {
          //localStorage.removeItem("access_token");

          //$(elm.querySelector("#twitter-login")).css("display", "block");
        }
      },
      dataType: "json"
    });
  };


  var follow = function(userId,followElement,username,alreadyFollowing){
    $(loading).addClass('show').removeClass('hide');
    message.method = "POST";
    if(alreadyFollowing)
      message.action = "https://api.twitter.com/1.1/friendships/destroy.json";
    else
      message.action = "https://api.twitter.com/1.1/friendships/create.json";
    message.oauth_token = accessToken;
    message.parameters['user_id'] = userId;
    if(!alreadyFollowing)
      message.parameters['follow'] = true;    

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, {
      "consumerSecret": CONSUMER_SECRET,
      "tokenSecret": accessTokenSecret
    });


    $.ajax({
      type: "POST",
      url: OAuth.addToURL(message.action, message.parameters),
      //data: {status : encodeURIComponent($(tweetInput).find("textarea").val() +" " +url).replace(/'/g,"%27").replace(/"/g,"%22") },
      success: function(data){
        //alert(JSON.stringify(data));
        $(loading).addClass('hide').removeClass('show');
        if(!alreadyFollowing)
          $(followElement).attr('following','true').text("Unfollow @"+username);
        else
          $(followElement).attr('following','false').text("Follow @"+username);

      },
      error: function(xhr, status, error) {
        alert(JSON.stringify(xhr));
        alert(JSON.stringify(message));
        alert(JSON.stringify(error));
        alert(OAuth.addToURL(message.action, message.parameters));
        
        if (xhr.status === 401) {
          //localStorage.removeItem("access_token");

          //$(elm.querySelector("#twitter-login")).css("display", "block");
        }
      },
      dataType: "json"
    });

  };

  var reTweet = function(id,TheElement){
    $(loading).addClass('show').removeClass('hide');
    message.method = "POST";
    message.action = "https://api.twitter.com/1.1/statuses/retweet/"+id+".json";
    message.oauth_token = accessToken;

    

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, {
      "consumerSecret": CONSUMER_SECRET,
      "tokenSecret": accessTokenSecret
    });

    $.ajax({
      type: "POST",
      url: OAuth.addToURL(message.action, message.parameters),
      //data: {status : encodeURIComponent($(tweetInput).find("textarea").val() +" " +url).replace(/'/g,"%27").replace(/"/g,"%22") },
      success: function(data){
        //alert(JSON.stringify(data));
        $(TheElement).addClass('retweeted');
        $(loading).addClass('hide').removeClass('show');

      },
      error: function(xhr, status, error) {
        //alert(JSON.stringify(xhr));
        //alert(JSON.stringify(message));
        //alert(JSON.stringify(error));
        //alert(OAuth.addToURL(message.action, message.parameters));
        //alert(encodeURIComponent($(tweetInput).find("textarea").val() +" " + url).replace(/'/g,"%27").replace(/"/g,"%22"));

        if (xhr.status === 401) {
          //localStorage.removeItem("access_token");

          //$(elm.querySelector("#twitter-login")).css("display", "block");
        }
      },
      dataType: "json"
    });
  };
  
  var favIt = function(id,TheElement){
    $(loading).addClass('show').removeClass('hide');
    message.method = "POST";
    message.action = "https://api.twitter.com/1.1/favorites/create.json";
    message.oauth_token = accessToken;

    delete message.parameters;

    message.parameters = {
      "oauth_consumer_key": CONSUMER_KEY,
      "oauth_signature_method": "HMAC-SHA1",
      "oauth_token": accessToken,
      "id" : id 
    }

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, {
      "consumerSecret": CONSUMER_SECRET,
      "tokenSecret": accessTokenSecret
    });

    $.ajax({
      type: "POST",
      url: OAuth.addToURL(message.action, message.parameters),
      //data: {status : encodeURIComponent($(tweetInput).find("textarea").val() +" " +url).replace(/'/g,"%27").replace(/"/g,"%22") },
      success: function(data){
        //alert(JSON.stringify(data));
        $(TheElement).addClass('retweeted');
        $(loading).addClass('hide').removeClass('show');

      },
      error: function(xhr, status, error) {
        alert(JSON.stringify(xhr));
        //alert(JSON.stringify(message));
        //alert(JSON.stringify(error));
        //alert(OAuth.addToURL(message.action, message.parameters));
        //alert(encodeURIComponent($(tweetInput).find("textarea").val() +" " + url).replace(/'/g,"%27").replace(/"/g,"%22"));

        if (xhr.status === 401) {
          //localStorage.removeItem("access_token");

          //$(elm.querySelector("#twitter-login")).css("display", "block");
        }
      },
      dataType: "json"
    });
  };

  
  

  $.ajax({
    "type": "GET",
    "url": OAuth.addToURL(message.action, message.parameters),
    "dataType": "json",
    "success": function(data) {
      $(loading).addClass('hide');
      tweets = data.statuses;
      var root = $("<div>").attr("id", "tweets").attr("class", "col-xs-12");

      //$("#sendTweet");



      renderTweets = function(){
        tweets.forEach(function(tweet) {
          var retweeted = false;

          if (_.has(tweet, "retweeted_status")) {
            var entities = tweet.entities;
            var retweetUser = tweet.user;

            tweet = tweet.retweeted_status;
            tweet.entities = entities;
            tweet.retweet_user = retweetUser;

            retweeted = true;
          }

          var user = tweet.user;
          var source = $(tweet.source);
          
          if (_.isObject(source) && _.isElement(source[0])) {
            source.attr("target", "_blank");
          } else {
            source = $("<a>").attr("href", "javascript:void(0)").text(tweet.source);
          }

          $(source).attr(
                        "class",
                        "time-information"
                      );
          $(source).html( "Tweeted through "+$(source).html() );

          var replyBack = $("<a>").attr({"href":"javascript:void(0)","id":"reply"+tweet.id_str, "data-original-title":"Reply"}).prepend(
              $('<i>').attr("class","fa fa-reply")
            );

          var retweet =  $("<a>").attr({"href":"javascript:void(0)","id":"retweet"+tweet.id_str,"data-original-title":"Retweet"}).prepend(
              $('<i>').attr("class","fa fa-retweet")
            );


          

          if(retweeted)
            $(retweet).attr('class','retweeted');

          var like =  $("<a>").attr({"href":"javascript:void(0)","id":"like"+tweet.id_str,"data-original-title":"Like"}).prepend(
              $('<i>').attr("class","fa fa-star")
            );


          $(replyBack).tooltip();
          $(retweet).tooltip();
          $(like).tooltip();


          $(replyBack).click(function(){
            in_reply_to_status_id = tweet.id_str;
            $(tweetInput).find("textarea").val("@"+user.screen_name);
          });

          
          $(retweet).click(function(){
            //if(retweeted)
              reTweet(tweet.id_str,retweet);
            // else
            //   undoReTweet(tweet.id_str,retweet);
          });

          
          $(like).click(function(){
            favIt(tweet.id_str,like);
          });

          

          var row = $("<div>").attr("class", "rows");
          var tweetTime = $("<a>").attr(
                        "href",
                        "https://twitter.com/" + user.screen_name + "/status/" + tweet.id_str
                      ).attr(
                        "target",
                        "_blank"
                      )
                      .attr(
                        "class",
                        "time-information"
                      )
                      .attr(
                        "title",
                        new Date(tweet.created_at)
                      ).text(normalizeDateTime(new Date(tweet.created_at)));

          var followButton = $("<button>").attr("class","btn btn-primary btn-xs").attr('following','false').text("Follow @" + user.screen_name);
          if(user.following)
            $(followButton).attr('following','true').text("Unfollow @" + user.screen_name);
          var tweetInfo = 
                $("<div>").attr("class", "tweet-info clearfix").append(
                  $("<div>").attr("class", "row").append(
                    $("<div>").attr("class", "col-xs-8").append(
                      followButton
                    ),
                    $("<div>").attr("class", "col-xs-4").append(
                      $("<ul>").attr("class","list-inline pull-right").append(
                        $("<li>").append(replyBack),
                        $("<li>").append(retweet),
                        $("<li>").append(like)
                      )
                    )
                  )
                  
                );
                //source,


          $(followButton).click(function(){
            if( JSON.parse( $(followButton).attr('following') ) )
              follow(user.id,followButton,user.screen_name,true);
            else
              follow(user.id,followButton,user.screen_name,false);
          });
          
          var media = $("<div>").attr("class", "medias");
          if(tweet.entities.media && tweet.entities.media.length){
            var mElements = tweet.entities.media[0];

            $(media).append(
              $("<img>").attr("src",mElements.media_url)
              );
          };
          

          row.append(

            $("<div>").attr("class", "tweet-icon col-xs-2").append(
              $("<img>").attr("src", user.profile_image_url_https).attr("class","img-rounded")
            ),


            $("<div>").attr("class", "tweet-detail col-xs-10").prepend(


              $("<div>").attr("class", "row").prepend(

                $("<div>").attr("class", "col-xs-6").prepend(
                  //username
                  $("<a>").attr(
                      "href",
                      "http://twitter.com/" + user.screen_name
                    ).attr("target", "_blank").attr("class", "username").text(user.name)
                      
                  ),
                
                $("<div>").attr("class", "col-xs-6").prepend(
                      $("<div>").attr("class","pull-right").append(
                        $("<p>").attr("class","").append(tweetTime)
                      )
                  )
                

                ),

              $("<div>").attr("class", "row").prepend(

                $("<div>").attr("class", "col-xs-12").prepend(
                  //
                  //tweet.entities.media
                  $("<div>").attr("class","border").html((normalizeTweetText(tweet))),
                  media,
                  tweetInfo
                      
                  )
                

                )

                
            )

          )
          var tweetView = $("<div>").attr("class", "tweet border").append(
            row);


          

          //tweetInfo.append(source);

          // if (retweeted) {
          //   tweetInfo.append(
          //     $("<div>").attr("class", "retweet-info").append(
          //       $("<span>").append(
          //         $("<i>").attr("class", "retweet-icon")
          //       ),
          //       $("<span>").css("color", "#336699").text("Retweeted by " + tweet.retweet_user.name)
          //     )
          //   );
          // }

          tweetView.append($("<div>").attr("class", "clearfix"));

          
          root.append(tweetView);
          $(loading).addClass('hide').removeClass('show');
          //root.append(debug);

        });
      };


      renderTweets();
        

      elm.removeChild(elm.querySelector("#twitter-login"));
      $(elm).append(root);
      
      $(elm).prepend(
        
        $("<div>").attr("id","header").attr("class","col-xs-12 border")
        .prepend(
          $("<h5>").attr("class","col-xs-12").html("<b class='bold-heading'>Tweets</b> for <i>" + url + "</i>")
          )


        );

      $(inputButton).append(tweetInput);
    },
    "error": function(xhr, status, error) {
      alert(JSON.stringify(xhr));
      alert(JSON.stringify(status));
      alert(JSON.stringify(error));
      alert(OAuth.addToURL(message.action, message.parameters));

      if (xhr.status === 401) {
        //localStorage.removeItem("access_token");

        //$(elm.querySelector("#twitter-login")).css("display", "block");
      }
    }
  });
};



function normalizeTweetText(tweet) {
  if (_.isObject(tweet)) {
    var text = tweet.text;
    var entities = tweet.entities;

    if (_.isArray(entities.hashtags)) {
      entities.hashtags.forEach(function(hashtag) {
        text = text.replace(
          '#' + hashtag.text,
          '<a href="http://twitter.com/search/' + encodeURIComponent('#' + hashtag.text) + '" target="_blank">#' + hashtag.text + '</a>'
        );
      });
    }

    if (_.isArray(entities.media)) {
      entities.media.forEach(function(media) {
        text = text.replace(
          media.url,
          '<a href="' + media.media_url_https + '" target="_blank">' + media.url + '</a>'
        );
      });
    }

    if (_.isArray(entities.urls) > 0) {
      entities.urls.forEach(function(url) {
        text = text.replace(
          url.url,
          '<a href="' + url.expanded_url + '" target="_blank">' + url.expanded_url + '</a>'
        );
      });
    }

    if (_.isArray(entities.user_mentions)) {
      entities.user_mentions.forEach(function(mention) {
        text = text.replace(
          '@' + mention.screen_name,
          '<a href="https://twitter.com/' + mention.screen_name + '" target="_blank">@' + mention.screen_name + '</a>'
        );
      });
    }

    return text;
  } else {
    throw new Error("argument isn`t prototype of String");
  }
}

function normalizeDateTime(date) {

Date.prototype.getMonthName = function(lang) {
    lang = lang && (lang in Date.locale) ? lang : 'en';
    return Date.locale[lang].month_names[this.getMonth()];
};

Date.prototype.getMonthNameShort = function(lang) {
    lang = lang && (lang in Date.locale) ? lang : 'en';
    return Date.locale[lang].month_names_short[this.getMonth()];
};

Date.locale = {
    en: {
       month_names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
       month_names_short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    }
};
  if (_.isDate(date)) {
    return date.getDate() + " " + date.getMonthNameShort();
    //return date.getFullYear() + "/" + zeroPadding(date.getMonth() + 1) + "/" + zeroPadding(date.getDate()) + " " + zeroPadding(date.getHours()) + ":" + zeroPadding(date.getMinutes()) + ":" + zeroPadding(date.getSeconds());
  } else {
    throw new Error("argument isn`t prototype of Date");
  }
}

function zeroPadding(n) {
  if (_.isNumber(n)) {
    if (String(n).length == 1) {
      return "0" + n;
    }
  }

  return n;
}
