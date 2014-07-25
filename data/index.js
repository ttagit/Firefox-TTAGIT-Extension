var tweets = null

var renderTweets = null;
var in_reply_to_status_id = null;
var elm = document.querySelector("#content");
var root = $("<div>").attr("id", "tweets").attr("class", "col-xs-12");
var input = document.querySelector("#input");
var loading = document.querySelector("#loading");


addon.port.on('updatedUrl',function(url){
	addon.port.emit('getUpdatedTweets');
});
addon.port.on('newTweets',function(data){
	console.log(data.tweets.statuses);

	in_reply_to_status_id = null;
	elm = document.querySelector("#content");
	root = $("<div>").attr("id", "tweets").attr("class", "col-xs-12");
	input = document.querySelector("#input");
	loading = document.querySelector("#loading");

	$(elm).html('');
	$(input).html('');
	
	renderTweets(data.tweets.statuses,data.url);
});


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






      //$("#sendTweet");



      renderTweets = function(allTweets,url){
        allTweets.forEach(function(tweet) {
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

	      $(elm).append(root);
	      $(elm).prepend(
	        
	        $("<div>").attr("id","header").attr("class","col-xs-12 border")
	        .prepend(
	          $("<h5>").attr("class","col-xs-12").html("<b class='bold-heading'>Tweets</b> for <i>" + url + "</i>")
	          )


	        );

	      $(input).append(tweetInput);
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