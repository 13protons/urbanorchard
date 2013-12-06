$(document).bind( "mobileinit", function() {
    
    // Make your jQuery Mobile framework configuration changes here!
    $.support.cors = true;
    $.mobile.allowCrossDomainPages = true; 
    
    $.extend(  $.mobile , {
        allowCrossDomainPages: true
      });
});

$(function(){
    console.log("jquery up and running");

    $(".facebookLogin").click(function(event){
        event.preventDefault();
        console.log("intercepted...");
        window.location = "/login/facebook";
    });

});