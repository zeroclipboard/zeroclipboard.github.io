(function() {

/********************
 *                  *
 *   Utility code   *
 *                  *
 ********************/


// List of HTML entities for escaping.
var HTML_ENTITY_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;'
};

// Replacement finding RegExp for those entities
var _htmlEscapingReplaceRegex = new RegExp("(?:" + Object.keys(HTML_ENTITY_ESCAPES).join("|") + ")", "g");

// Replacement callback function for those entities
function _htmlEscaper(match) {
  return HTML_ENTITY_ESCAPES[match];
}

function _escapeHtml(value) {
  return (
    typeof value !== "string" ?
      "" :
      value.replace(_htmlEscapingReplaceRegex, _htmlEscaper)
  );
}

function _clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function _cloneError(err) {
  var clone = _clone(err);

  // Some browsers and/or Error types do not need to clone correctly via
  // JSON serialization, so we may need to manually update the copy instead.
  //
  // This likely means that the Error instance's properties are:
  //   (a) non-enumerable;
  //   (b) prototypically inherited; or
  //   (c) getter functions
  //
  if (!clone) {
    clone = {};
  }
  if (!clone.name) {
    clone.name = err.name;
  }
  if (!clone.message) {
    clone.message = err.message;
  }
  if (!clone.stack) {
    clone.stack = err.stack;
  }

  return clone;
}


/*********************
 *                   *
 *   Analysis code   *
 *                   *
 *********************/

function _updateAllowancesMap(allowancesMap, allowancesString) {
  if (typeof allowancesString === "string") {
    var allowanceList =
      allowancesString
        .replace(/^\s+|\s+$/g, "")
        .toLowerCase()
        .split(/\s+/);

    allowancesMap.forms = allowanceList.indexOf("allow-forms") !== -1
    allowancesMap.pointerLock = allowanceList.indexOf("allow-pointer-lock") !== -1;
    allowancesMap.popups = allowanceList.indexOf("allow-popups") !== -1;
    allowancesMap.sameOrigin = allowanceList.indexOf("allow-same-origin") !== -1;
    allowancesMap.scripts = allowanceList.indexOf("allow-scripts") !== -1;
    allowancesMap.topNavigation = allowanceList.indexOf("allow-top-navigation") !== -1;
  }

  return allowancesMap;
}

function _analyzeSandboxing(frameEl) {
  //
  // An interesting note from: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
  //
  // NOTE:
  //   "When the embedded document has the same origin as the main
  //    page, it is strongly discouraged to use both allow-scripts
  //    and allow-same-origin at the same time, as that allows the
  //    embedded document to programmatically remove the sandbox
  //    attribute. Although it is accepted, this case is no more
  //    secure than not using the sandbox attribute."
  //
  // So... let's give that a try, too! >=D
  //
  // Next question: If we programmatically remove the iframe sandbox,
  // instantiate our ZeroClipboard SWF object, and then resandbox it,
  // will the instantiated plugin still work after being resandboxed?
  //
  var result = {
    sandboxed: undefined,
    sandboxAllowances: undefined,
    desandboxable: undefined,
    resandboxable: undefined,
    resandboxAllowances: undefined,
    resandboxLossless: undefined,
    errors: []
  };

  if (!(frameEl && frameEl.nodeType && frameEl.nodeName)) {
    return result;
  }

  // IMPORTANT: `_clone` this object, don't use it directly
  var defaultSandboxAllowances = {
    forms: null,
    pointerLock: null,
    popups: null,
    sameOrigin: true,
    scripts: true,
    topNavigation: null
  };

  // Is sandboxed?
  try {
    result.sandboxed = frameEl.hasAttribute("sandbox");
  }
  catch (sandboxErr) {
    result.sandboxed = null;
    result.errors.push(_cloneError(sandboxErr));
  }

  // Get sandbox configuration
  var sandboxAllowances;
  if (result.sandboxed) {
    try {
      sandboxAllowances = frameEl.getAttribute("sandbox") || "";
    }
    catch (sandboxErr) {
      sandboxAllowances = null;
      result.errors.push(_cloneError(sandboxErr));
    }
  }
  else if (result.sandboxed === null) {
    sandboxAllowances = null;
  }

  if (sandboxAllowances === null || typeof sandboxAllowances === "string") {
    result.sandboxAllowances =
      _updateAllowancesMap(
        _clone(defaultSandboxAllowances),
        sandboxAllowances
      );
  }

  // Analyze desandboxability
  if (result.sandboxed) {
    try {
      frameEl.removeAttribute("sandbox");
      result.desandboxable = !frameEl.hasAttribute("sandbox");
    }
    catch (sandboxErr) {
      result.desandboxable = false;
      result.errors.push(_cloneError(sandboxErr));
    }
  }

  // Analyze resandboxability
  if (result.desandboxable && typeof sandboxAllowances === "string") {
    try {
      frameEl.setAttribute("sandbox", sandboxAllowances);
      result.resandboxable = frameEl.hasAttribute("sandbox");
    }
    catch (sandboxErr) {
      result.resandboxable = false;
      result.errors.push(_cloneError(sandboxErr));
    }
  }

  // Get resandboxed configuration
  var resandboxAllowances;
  if (result.resandboxable && result.sandboxAllowances) {
    try {
      resandboxAllowances = frameEl.getAttribute("sandbox") || "";
    }
    catch (sandboxErr) {
      resandboxAllowances = null;
      result.errors.push(_cloneError(sandboxErr));
    }
  }
  else if (result.resandboxable === null) {
    resandboxAllowances = null;
  }

  if (resandboxAllowances === null || typeof resandboxAllowances === "string") {
    result.resandboxAllowances =
      _updateAllowancesMap(
        _clone(defaultSandboxAllowances),
        resandboxAllowances
      );
  }

  // Analyze quality of resandboxability
  if (result.resandboxable) {
    result.resandboxLossless = null;

    if (result.sandboxAllowances && result.resandboxAllowances) {
      var allUsedKeys =
        Object.keys(result.sandboxAllowances)
          .concat(Object.keys(result.resandboxAllowances))
          .filter(function(key, i, arr) {
            return arr.indexOf(key) === i;
          });

      var allMatched = true;
      for (var i = 0, len = allUsedKeys.length; i < len; i++) {
        var prop = allUsedKeys[i];
        if (!(
          result.sandboxAllowances.hasOwnProperty(prop) &&
          result.resandboxAllowances.hasOwnProperty(prop) &&
          result.sandboxAllowances[prop] === result.resandboxAllowances[prop]
        )) {
          allMatched = false;
          break;
        }
      }
      result.resandboxLossless = allMatched;
    }
  }

  return result;
}

window.analyzeFramedPage = function() {
  var results = {
    framed: false,
    crossOrigin: null,
    sandboxed: null,
    sandboxAllowances: undefined,
    desandboxable: undefined,
    resandboxable: undefined,
    resandboxAllowances: undefined,
    resandboxLossless: undefined,
    errors: []
  };

  try {
    var isChildWindow = window.opener != null;
    var hasWindowAncestors = window != window.top || (!!window.parent && window != window.parent);
    var effectiveScriptOrigin;

    try {
      effectiveScriptOrigin = document.domain || null;
    }
    catch (e) {
      effectiveScriptOrigin = null;
    }

    var frame, frameError;
    try {
      frame = window.frameElement;
    }
    catch (e) {
      frameError = _cloneError(e);
      results.errors.push(frameError);
    }

    results.framed = !isChildWindow && hasWindowAncestors;

    if (!results.framed) {
      results.crossOrigin = undefined;
      results.sandboxed = undefined;
      results.errors = undefined;
    }
    else {
      if (frame != null) {
        results.crossOrigin = false;

        var subResult = _analyzeSandboxing(frame);
        results.sandboxed = subResult.sandboxed;
        results.sandboxAllowances = subResult.sandboxAllowances;
        results.desandboxable = subResult.desandboxable;
        results.resandboxable = subResult.resandboxable;
        results.resandboxAllowances = subResult.resandboxAllowances;
        results.resandboxLossless = subResult.resandboxLossless;
        results.errors.concat(subResult.errors);
      }
      else {

        // IMPORTANT:
        // Firefox will return `frame == null` and NOT throw any Error for
        // cross-origin `frameElement` access:
        //   https://bugzilla.mozilla.org/show_bug.cgi?id=868235

        // Set the most frequent default values
        results.crossOrigin = true;
        results.sandboxed = null;
        results.sandboxAllowances = {
          forms: null,
          pointerLock: null,
          popups: null,
          sameOrigin: null,
          scripts: true,
          topNavigation: null
        };
        results.desandboxable = false;
        results.resandboxable = false;

        // `document.domain` has been rendered useless by sandboxing
        // without granting `allow-same-origin`
        if (effectiveScriptOrigin === null) {
          results.sandboxed = true;
          results.sandboxAllowances.sameOrigin = false;
        }
        else if (frameError) {
          if (frameError.name !== "SecurityError") {
            // Retract previous value... we're not sure anymore!
            results.crossOrigin = null;
          }
          else if (/(^|\s)sandbox(ed|ing|\.|\s|$)/.test(frameError.message.toLowerCase())) {
            results.sandboxed = true;
            results.sandboxAllowances.sameOrigin = true;
          }
        }
      }
    }
  }
  catch (err) {
    results.errors.push(_cloneError(err));
  }

  return results;
};


/**********************
 *                    *
 *   Rendering code   *
 *                    *
 **********************/

var IMPOSSIBLE_RESULT_VALUE = Math.PI;

var RESPONSE_CLASS_NAMES = {
  // Not Applicable" ("N/A") / Invalid
  "": "diff-invalid",
  // "Yes" / Good
  "true": "diff-good",
  // "No" / Bad
  "false": "diff-bad",
  // "Maybe?" / Uncertain
  "null": "diff-uncertain",
  // "Impossible result" / Impossible
  "IMPOSSIBLE": "diff-impossible"
};

function _getResponseClass(value) {
  var key =
    typeof value !== "undefined" ?
      (JSON.stringify(value) || "") :
      "";
  return RESPONSE_CLASS_NAMES[key] || RESPONSE_CLASS_NAMES.IMPOSSIBLE;
}

var RESPONSE_HTML = {
  // Not Applicable" ("N/A") / Invalid
  "": '<span class="glyphicon glyphicon-ban-circle" title="Not Applicable" aria-label="Not Applicable"></span>',
  // "Yes" / Good
  "true": '<span class="glyphicon glyphicon-ok" title="Yes" aria-label="Yes"></span>',
  // "No" / Bad
  "false": '<span class="glyphicon glyphicon-remove" title="No" aria-label="No"></span>',
  // "Maybe?" / Uncertain
  "null": '<span class="glyphicon glyphicon-flag" title="Maybe?" aria-label="Maybe?"></span>',
  // "Impossible result" / Impossible
  "IMPOSSIBLE": '<span class="glyphicon glyphicon-fire" title="Impossible result" aria-label="Impossible result"></span>'
};

function _getResponseHtml(value) {
  if (typeof value === "string") {
    return value;
  }

  var key =
    typeof value !== "undefined" ?
      (JSON.stringify(value) || "") :
      "";
  return RESPONSE_HTML[key] || RESPONSE_HTML.IMPOSSIBLE;
}

window.renderResults = function(outputEl, results) {
  if (!(outputEl && outputEl.nodeType && outputEl.nodeName)) {
    throw new Error("You must provide an Element argument for the `outputEl` parameter");
  }

  //
  // Simple properties
  //
  var simpleProperties = [
    "framed", "crossOrigin", "sandboxed",
    "desandboxable", "resandboxable", "resandboxLossless",
  ];
  simpleProperties.forEach(function(prop) {
    var cell = outputEl.querySelector('td[data-type="' + prop + '"]');
    if (!cell) {
      throw new Error('Could not find expected descendant for `tr#' + outputEl.id + '`: `td[data-type="' + prop + '"]`');
    }

    cell.className = _getResponseClass(results[prop]);
    cell.innerHTML = _getResponseHtml(results[prop]);
  });


  //
  // Nested properties
  //
  var nestedProperties = [
    "allowForms", "allowPointerLock", "allowPopups",
    "allowSameOrigin", "allowScripts", "allowTopNavigation"
  ];

  var originalSandboxAllowances = results.sandboxAllowances;
  if (!originalSandboxAllowances) {
    results.sandboxAllowances = {};
  }

  nestedProperties.forEach(function(prop) {
    var cell = outputEl.querySelector('td[data-type="' + prop + '"]');
    if (!cell) {
      throw new Error('Could not find expected descendant for `tr#' + outputEl.id + '`: `td[data-type="' + prop + '"]`');
    }

    // e.g. "allowSameOrigin" --> "sameOrigin"
    var dataProp = prop.slice(5, 6).toLowerCase() + prop.slice(6);

    if (!originalSandboxAllowances) {
      results.sandboxAllowances[dataProp] = originalSandboxAllowances;
    }
    else if (!results.sandboxAllowances.hasOwnProperty(dataProp)) {
      // Register as an impossible result
      results.sandboxAllowances[dataProp] = IMPOSSIBLE_RESULT_VALUE;
    }

    cell.className = _getResponseClass(results.sandboxAllowances[dataProp]);
    cell.innerHTML = _getResponseHtml(results.sandboxAllowances[dataProp]);
  });


  //
  // Complex properties
  //

  // `crossOrigin` (already rendered above as a simple property) may need an additional comment appended
  var prop = "crossOrigin";
  var cell = outputEl.querySelector('td[data-type="' + prop + '"]');
  if (!cell) {
    throw new Error('Could not find expected descendant for `tr#' + outputEl.id + '`: `td[data-type="' + prop + '"]`');
  }
  if (results.framed === true && results.crossOrigin === true && results.sandboxed === true && results.sandboxAllowances.sameOrigin === false) {
    cell.innerHTML += '<sup><span class="glyphicon glyphicon-comment" title="(via sandboxing, at least)" aria-label="(via sandboxing, at least)"></span></sup>';
  }

  // `errors` has a slightly more complicated rendering logic
  prop = "errors";
  cell = outputEl.querySelector('td[data-type="' + prop + '"]');
  if (!cell) {
    throw new Error('Could not find expected descendant for `tr#' + outputEl.id + '`: `td[data-type="' + prop + '"]`');
  }
  var classKey =
    results[prop] === undefined ?
      undefined :
      (
        !results[prop] ?
          IMPOSSIBLE_RESULT_VALUE :
          results[prop].length === 0
      );
  cell.className = _getResponseClass(classKey);

  var htmlKey =
    results[prop] === undefined ?
      undefined :
      (
        !results[prop] ?
          IMPOSSIBLE_RESULT_VALUE :
          results[prop].length === 0 ?
            '<span>0</span>' :
            '<a href="javascript:void(0);" role="button" title="Error(s) Details" aria-label="Error(s) Details" ' +
              'data-toggle="popover" data-container="body" data-placement="left" data-html="true" ' +
              'data-content="<pre>' + _escapeHtml(JSON.stringify(results[prop], null, 2)) + '</pre>"' +
            '>' +
              results[prop].length +
            '</a>'
      );
  cell.innerHTML = _getResponseHtml(htmlKey);

  // IMPORTANT: This last line of code relies on Bootstrap (and jQuery)
  // Enable the Bootstrap popover functionality
  $(cell).find('a[data-toggle="popover"]').popover();

};

})();