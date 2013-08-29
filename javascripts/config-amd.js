//
// WARNING!
// This is NOT a recommended example of setting up an AMD demo. However, doing it this way
// prevented us from having to create multiple near-duplicate files with different version
// info just to be able to show demos for the various versions of ZeroClipboard.
//

(function() {

  requirejs.config({
    // Note that the path itself must be relative to the page serving the scripts
    baseUrl: "javascripts/",

    // paths are relative to the aforementioned `baseUrl`
    paths: {
      "ZeroClipboard_lib": "zc/ZeroClipboard_" + window._ZC_DEMO_TARGET_VERSION,
      "jquery":            "vendor/jquery.min",
      "domReady":          "vendor/requirejs-plugins/domReady"
    }
  });
  
  // Delete the shameful global variable
  delete window._ZC_DEMO_TARGET_VERSION;

  // If jQuery was already loaded (which it should've been), add a fake AMD wrapper for it
  if (window.jQuery) {
    define("jquery", function() {
      return window.jQuery
    });
  }

  // Messy but strictly for demo purposes: wrap ZeroClipboard with another module
  define("ZeroClipboard", ["ZeroClipboard_lib"], function(ZeroClipboard) {

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
    
    return ZeroClipboard;
  });

})();