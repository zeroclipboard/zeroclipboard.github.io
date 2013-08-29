// Configure the root ZeroClipboard object
ZeroClipboard.setDefaults({

  // The path must be relative to the PAGE, NOT to the current AMD module!
  // Or, it could be an absolute path on the domain, e.g.:
  //  - "/javascripts/ZeroClipboard.swf"
  // Or, it could be an absolute URL to anywhere, e.g.:
  //  - "//" + window.location.host + "/javascripts/ZeroClipboard.swf"
  //  - "//localhost:3000/javascripts/ZeroClipboard.swf"
  //  - "//my.awesomecdn.com/javascripts/ZeroClipboard.swf"
  //  - "http://my.awesomecdn.com/javascripts/ZeroClipboard.swf"
  moviePath: "javascripts/zc/ZeroClipboard_" + ZeroClipboard.version + ".swf"

});