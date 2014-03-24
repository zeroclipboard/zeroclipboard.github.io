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

  function addScript(srcUrl) {
    // Stupid IE:  http://www.guypo.com/technical/ies-premature-execution-problem/
    document.write('<scr' + 'ipt type="text/javascript" src="' + srcUrl + '"></script>');
  }


  // Grab the default configuration
  var $demoVersionDropdown = $("#demo-version");
  var defaultVersion = $demoVersionDropdown.find(":selected").val();
  var $demoTypeDropdown = $("#demo-type");
  var defaultType = $demoTypeDropdown.find(":selected").val();

  // Identify the desired demo based on the current URL's query string
  var query = parseQuery(window.location.search);
  if (!query.version) {
    query.version = defaultVersion;
  }
  if (!query.type) {
    query.type = defaultType;
  }

  // Select the correct demo type for this page load
  $demoVersionDropdown.find("option").filter(function() { return $(this).val() === query.version; }).prop("selected", true);
  $demoTypeDropdown.find("option[value='" + query.type + "']").prop("selected", true);

  $("#current-demo-config").html("<code>" + query.version + "</code> &mdash; " + $demoTypeDropdown.find(":selected").text());

  // Listen for a click and refresh the page
  $("#boot").on("click", function(evt) {
    var selectedVersion = $demoVersionDropdown.find(":selected").val() || defaultVersion;
    var selectedType = $demoTypeDropdown.find(":selected").val() || defaultType;
    if ((query.version !== selectedVersion) || (query.type !== selectedType)) {
      window.location.href = "?version=" + selectedVersion + "&type=" + selectedType;
    }
  });


  // Adjust the stable version's download link
  var stableVersion = defaultVersion;  // e.g. "v1.1.7"
  $(".download > a")
    .attr("href", "https://github.com/zeroclipboard/ZeroClipboard/archive/" + stableVersion + ".zip")
    .text(stableVersion + " ZIP");


  // Boot-load the actual demo code
  var targetVersion = query.version.replace(/^v/, "");
  if (targetVersion) {
    var loadingEdge = targetVersion === "git:1.x-master";

    switch (query.type) {

      case "traditional": {
        // Create a script block to load the ZeroClipboard library
        var zcLibSrcUrl = !loadingEdge ?
          "javascripts/zc/v" + targetVersion + "/ZeroClipboard.js" :
          "//rawgithub.com/zeroclipboard/ZeroClipboard/1.x-master/ZeroClipboard.js";
        addScript(zcLibSrcUrl);

        // Create a cross-domain configuration script block if loading "edge"
        var zcConfigSrcUrl = "javascripts/v1.x/config-traditional" + (loadingEdge ? "-edge" : "") + ".js";
        addScript(zcConfigSrcUrl);

        // Create a script block to hook up the demo
        addScript("javascripts/v1.x/demo-traditional.js");

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
        var zcConfigSrcUrl = "javascripts/v1.x/config-amd" + (loadingEdge ? "-edge" : "") + ".js";
        addScript(zcConfigSrcUrl);

        // Create a script block to hook up the demo
        addScript("javascripts/v1.x/demo-amd.js");

        break;
      }

      case "commonjs": {
        alert("There is no CommonJS demo implemented yet.");
        break;
      }

      default: {
        alert("You've requested an invalid `type` for the demo: '" + query.type + "'");
        break;
      }
    }
  }
  else {
    alert("You've requested an invalid `version` for the demo: '" + targetVersion + "'");
  }
})();