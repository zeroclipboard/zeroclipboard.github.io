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
      "ZeroClipboard_lib": "//rawgithub.com/zeroclipboard/ZeroClipboard/master/ZeroClipboard",
      "jquery":            "vendor/jquery.min",
      "domReady":          "vendor/requirejs-plugins/domReady"
    }
  });

  // If jQuery was already loaded (which it should've been), add a fake AMD wrapper for it
  if (window.jQuery) {
    define("jquery", function() {
      return window.jQuery
    });
  }

  // Messy but strictly for demo purposes: wrap ZeroClipboard with another module
  define("ZeroClipboard", ["ZeroClipboard_lib"], function(ZeroClipboard) {

    /*
    ZeroClipboard.config({

      

    });
    */

    return ZeroClipboard;
  });

})();