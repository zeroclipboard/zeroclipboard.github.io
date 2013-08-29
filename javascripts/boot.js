(function() {
  function parseQuery(query) {
    var ret = {};
    var pairs = query.slice(1).toLowerCase().split("&");
    for (var i = 0, len = pairs.length; i < len; i++) {
      var kvp = pairs[i].split("=");
      if (kvp.length > 1) {
        ret[kvp[0]] = kvp.slice(1).join(",");
      }
    }
    return ret;
  }
  
  function addScript(srcUrl, previousSiblingEl) {
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.src = srcUrl;
    s.async = false;
    
    var prevSib = previousSiblingEl || document.getElementsByTagName('script')[0];
    prevSib.parentNode.insertBefore(s, prevSib.nextSibling);
    
    return s;
  }


  // Grab the default configuration
  var $dropdown = $("#demo-type");
  var defaultVal = $dropdown.find("option").first().val();
  var queryString = window.location.search || defaultVal;
  var currentQuery = parseQuery(queryString);

  // Select the correct demo type for this page load
  $dropdown.find("option[value='" + queryString + "']").prop("selected", true);

  // Listen for a change in selection and refresh the page
  $dropdown.on("change", function(evt) {
    var selectedVal = $dropdown.val() || defaultVal;
    var selectedValQuery = parseQuery(selectedVal);
    if ((currentQuery.release !== selectedValQuery.release) || (currentQuery.type !== selectedValQuery.type)) {
      window.location.href = selectedVal;
    }
  });


  // Adjust the download link
  var stableVersion = $("#versions > .stable > code").text();  // e.g. "v1.1.7"
  $(".download > a")
    .attr("href", "https://github.com/zeroclipboard/ZeroClipboard/archive/" + stableVersion + ".zip")
    .text(stableVersion + " ZIP");


  // Boot-load the actual demo code
  var targetVersion = $("#versions > ." + currentQuery.release + " > code").text().replace(/^v/, "");
  if (targetVersion) {
    var loadingEdge = targetVersion === "git:master";
    
    switch (currentQuery.type) {

      case "traditional": {

        // Create a script block to load the ZeroClipboard library
        var zcLibSrcUrl = !loadingEdge ?
          "javascripts/zc/ZeroClipboard_" + targetVersion + ".js" :
          "//rawgithub.com/zeroclipboard/ZeroClipboard/master/ZeroClipboard.js";
        var zcLibEl = addScript(zcLibSrcUrl);

        // Create a cross-domain configuration script block if loading "edge"
        var zcConfigSrcUrl = "javascripts/config-traditional" + (loadingEdge ? "-edge" : "") + ".js";
        var zcConfigEl = addScript(zcConfigSrcUrl, zcLibEl);

        // Create a script block to hook up the demo
        var zcDemoEl = addScript("javascripts/demo-traditional.js", zcConfigEl);

        break;
      }

      case "amd": {

        // Create a script block to load the RequireJS AMD Loader library
        var requirejsLibEl = addScript("javascripts/vendor/require.js");

        // Shamefully define a global variable to curry the version number along to the AMD config.
        // Could've alternatively `define`d a named AMD module but there really wasn't any benefit.
        if (!loadingEdge) {
          window._ZC_DEMO_TARGET_VERSION = targetVersion;
        }

        // Create a cross-domain configuration script block if loading "edge"
        var zcConfigSrcUrl = "javascripts/config-amd" + (loadingEdge ? "-edge" : "") + ".js";
        var zcConfigEl = addScript(zcConfigSrcUrl, requirejsLibEl);

        // Create a script block to hook up the demo
        var zcDemoEl = addScript("javascripts/demo-amd.js", zcConfigEl);

        break;
      }

      /*
      case "commonjs": {
        // TODO: Implement CommonJS-based demo
        break;
      }
      */

      default: {
        alert("You've requested an invalid `type` for the demo: '" + currentQuery.type + "'");
        break;
      }
    }
  }
  else {
    alert("You've requested an invalid `release` for the demo: '" + currentQuery.release + "'");
  }
})();