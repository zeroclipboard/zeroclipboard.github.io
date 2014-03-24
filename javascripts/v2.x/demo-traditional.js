$(document).ready(function() {

  var clip = new ZeroClipboard($("#d_clip_button"));

  clip.on("ready", function() {
    debugstr("Flash movie loaded and ready.");

    this.on("aftercopy", function(event) {
      debugstr("Copied text to clipboard: " + event.data["text/plain"]);
    });
  });

  clip.on("error", function(event) {
    $(".demo-area").hide();
    debugstr('error[name="' + event.name + '"]: ' + event.message);
    ZeroClipboard.destroy();
  });


  // jquery stuff (optional)
  function debugstr(text) {
    $("#d_debug").append($("<p>").text(text));
  }

  $("#clear-test").on("click", function () {
    $("#fe_text").val("Copy me!");
    $("#testarea").val("");
  });

});