// Python Tutor: https://github.com/pgbovine/OnlinePythonTutor/
// Copyright (C) Philip Guo (philip@pgbovine.net)
// LICENSE: https://github.com/pgbovine/OnlinePythonTutor/blob/master/LICENSE.txt

var optCommon = require('./opt-frontend-common.ts');
var pytutor = require('./pytutor.ts');
var assert = pytutor.assert;

require('../css/opt-frontend.css');


var originFrontendJsFile = 'iframe-embed.js';

function NOP() {};

function iframeHandleUncaughtException(trace) {
  var excMsg = null;
  if (trace.length == 1) {
    excMsg = trace[0].exception_msg; // killer!
  }
  else if (trace.length > 0 && trace[trace.length - 1].exception_msg) {
    excMsg = trace[trace.length - 1].exception_msg;
  }
  else {
    excMsg = "Unknown error. Reload the page and try again. Or report a bug to philip@pgbovine.net";
  }
  $("#vizDiv").html(pytutor.htmlspecialchars(excMsg));
}

$(document).ready(function() {
  optCommon.initializeFrontendParams({originFrontendJsFile: originFrontendJsFile,
                                      executeCode: executeCode});

  var queryStrOptions = optCommon.getQueryStringOptions();

  var preseededCode = queryStrOptions.preseededCode;
  var pyState = queryStrOptions.py;
  var verticalStackBool = (queryStrOptions.verticalStack == 'true');
  var heapPrimitivesBool = (queryStrOptions.heapPrimitives == 'true');
  var textRefsBool = (queryStrOptions.textReferences == 'true');
  var cumModeBool = (queryStrOptions.cumulative == 'true');

  // these two are deprecated
  var drawParentPointerBool = (queryStrOptions.drawParentPointers == 'true');

  var codeDivWidth = undefined;
  var cdw = $.bbq.getState('codeDivWidth');
  if (cdw) {
    codeDivWidth = Number(cdw);
  }

  var codeDivHeight = undefined;
  var cdh = $.bbq.getState('codeDivHeight');
  if (cdh) {
    codeDivHeight = Number(cdh);
  }


  var startingInstruction = queryStrOptions.preseededCurInstr;
  if (!startingInstruction) {
    startingInstruction = 0;
  }

  var backend_script = optCommon.langToBackendScript(pyState);
  assert(backend_script);

  // David Pritchard's code for resizeContainer option ...
  var resizeContainer = ($.bbq.getState('resizeContainer') == 'true');
    
  if (resizeContainer) {
      function findContainer() {
          var ifs = window.top.document.getElementsByTagName("iframe");
          for(var i = 0, len = ifs.length; i < len; i++)  {
              var f = ifs[i];
              var fDoc = f.contentDocument || f.contentWindow.document;
              if(fDoc === document)   {
                  return f;
              }
          }
      }
      
      var container = findContainer();
      
      function resizeContainerNow() {
          $(container).height($("html").height());
      };
  }


  // set up all options in a JS object
  var backendOptionsObj = {cumulative_mode: cumModeBool,
                           heap_primitives: heapPrimitivesBool,
                           origin: originFrontendJsFile};

  var frontendOptionsObj = {startingInstruction: startingInstruction,
                            embeddedMode: true,
                            verticalStack: verticalStackBool,
                            disableHeapNesting: heapPrimitivesBool,
                            drawParentPointers: drawParentPointerBool,
                            textualMemoryLabels: textRefsBool,
                            executeCodeWithRawInputFunc: optCommon.executeCodeWithRawInput,
                            heightChangeCallback: (resizeContainer ? resizeContainerNow : NOP),
                            codeDivWidth: codeDivWidth,
                            codeDivHeight: codeDivHeight,
                           }

  function executeCode(forceStartingInstr) {
    if (forceStartingInstr) {
      frontendOptionsObj.startingInstruction = forceStartingInstr;
    }
    optCommon.executeCodeAndCreateViz(preseededCode,
                            backend_script, backendOptionsObj,
                            frontendOptionsObj,
                            'vizDiv',
                            function() { // success
                              if (resizeContainer)
                                  resizeContainerNow();
                              var myVisualizer = optCommon.getVisualizer();
                              myVisualizer.redrawConnectors();
                            },
                            iframeHandleUncaughtException);
  }


  // log a generic AJAX error handler
  $(document).ajaxError(function() {
    alert("Ugh, Online Python Tutor server error :( Email philip@pgbovine.net");
  });


  // redraw connector arrows on window resize
  $(window).resize(function() {
    var myVisualizer = optCommon.getVisualizer();
    myVisualizer.redrawConnectors();
  });


  optCommon.executeCodeFromScratch(); // finally, execute code and display visualization
});