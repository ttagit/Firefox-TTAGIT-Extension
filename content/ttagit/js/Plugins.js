
// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  arguments.callee = arguments.callee.caller;  
  if(this.console) console.log( Array.prototype.slice.call(arguments) );
};
// make it safe to use console.log always
(function(b){function c(){}for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();)b[a]=b[a]||c})(window.console=window.console||{});


// place any jQuery/helper plugins in here, instead of separate, slower script files.


/*
 * Fade Slider Toggle plugin
 * 
 * Copyright(c) 2009, Cedric Dugas
 * http://www.position-relative.net
 *	
 * A sliderToggle() with opacity
 * Licenced under the MIT Licence
 */


 jQuery.fn.fadeSliderToggle = function(settings) {
 	/* Damn you jQuery opacity:'toggle' that dosen't work!~!!!*/
 	 settings = jQuery.extend({
		speed:500,
		easing : "swing"
	}, settings)
	
	caller = this
 	if($(caller).css("display") == "none"){
 		$(caller).animate({
 			opacity: 1,
 			height: 'toggle'
 		}, settings.speed, settings.easing);
	}else{
		$(caller).animate({
 			opacity: 0,
 			height: 'toggle'
 		}, settings.speed, settings.easing);
	}
}; 


/* Fancy File Inputs */

var SITE = SITE || {};

SITE.fileInputs = function() {
	var $this = $(this),
	  $val = $this.val(),
	  valArray = $val.split('\\'),
	  newVal = valArray[valArray.length-1],
	  $button = $this.siblings('.button'),
	  $fakeFile = $this.siblings('.file-holder');
	if(newVal !== '') {
		if($fakeFile.length === 0) {
			$button.text("Picture attached"); //newVal
			$button.addClass("itsdone");
		} else {
			$fakeFile.text(newVal);
		}
	}
};

$(document).ready(function() {
  $('.file-wrapper input[type=file]').bind('change focus click', SITE.fileInputs);
});