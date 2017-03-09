/**
 * @fileoverview Rule to disallow use more than allowed number of assertions. `it`s without any assertions are also disallowed
 * @author onechiporenko
 * @copyright 2015 onechiporenko. All rights reserved.
 */

"use strict";

var n = require("../utils/node.js");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function (context) {
  var insideIt = false;
  var assertsCounter = 0;
  var options = context.options[0] || {};
  var assertsLimit = options.assertsLimit >= 1 ? options.assertsLimit : 3;
  var skipSkipped = options.hasOwnProperty("skipSkipped") ? options.skipSkipped : false;
  var ignoreZeroAssertionsIfDoneExists = options.hasOwnProperty("ignoreZeroAssertionsIfDoneExists") ? options.ignoreZeroAssertionsIfDoneExists : true;
  var ignoreZeroAssertionsFor = options.hasOwnProperty("ignoreZeroAssertionsFor") ? options.ignoreZeroAssertionsFor : false;
  var nodeSkipped;
  var nodeExempted;
  var doneExists;

  function tryIgnoreZeroAssertionsFor(node) {
    return ignoreZeroAssertionsFor.includes(n.getCaller(n.getParentExpression(node).expression));
  }

  function check(node) {
    if (!insideIt || nodeSkipped) {
      return;
    }
    if (n.isAssertion(node)) {
      return assertsCounter++;
    }
  }

  function fEnter(node) {
    if (n.isTestBody(node)) {
      if (skipSkipped) {
        nodeSkipped = n.tryDetectSkipInParent(node);
      }
      if (ignoreZeroAssertionsFor) {
        nodeExempted = tryIgnoreZeroAssertionsFor(node);
      }
      doneExists = node.params.length > 0;
      insideIt = true;
    }
  }

  function fExit(node) {
    if (n.isTestBody(node)) {
      if (assertsCounter > assertsLimit) {
        context.report(node.parent, "Too many assertions ({{num}}). Maximum allowed is {{max}}.", {
          max: assertsLimit,
          num: assertsCounter
        });
      }
      if (assertsCounter === 0 && !nodeExempted && !nodeSkipped && !(ignoreZeroAssertionsIfDoneExists && doneExists)) {
        context.report(node.parent, "Test without assertions is not allowed.");
      }
      insideIt = false;
      nodeExempted = false;
      nodeSkipped = false;
      doneExists = false;
      assertsCounter = 0;
    }
  }

  return {
    "FunctionExpression": fEnter,
    "ArrowFunctionExpression": fEnter,
    "FunctionExpression:exit": fExit,
    "ArrowFunctionExpression:exit": fExit,
    "MemberExpression": check,
    "CallExpression": check
  };
};

module.exports.schema = [
  {
    type: "object",
    properties: {
      assertsLimit: {
        type: "number"
      },
      skipSkipped: {
        type: "boolean"
      },
      ignoreZeroAssertionsIfDoneExists: {
        type: "boolean"
      },
      ignoreZeroAssertionsFor: {
        type: "array"
      }
    },
    additionalProperties: false
  }
];