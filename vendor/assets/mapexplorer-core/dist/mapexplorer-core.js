(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-hierarchy'), require('d3-transition'), require('d3-ease'), require('d3-selection'), require('d3-zoom'), require('d3-array')) :
	typeof define === 'function' && define.amd ? define(['exports', 'd3-hierarchy', 'd3-transition', 'd3-ease', 'd3-selection', 'd3-zoom', 'd3-array'], factory) :
	(factory((global.mapexplorerCore = global.mapexplorerCore || {}),global.d3,global.d3,global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3Hierarchy,d3Transition,d3Ease,d3Selection,d3Zoom,d3Array) { 'use strict';

function makeLink(source, target) {
  var margin = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

  var finalTarget = target || source;
  var targetX = finalTarget.x;
  var targetY = finalTarget.y - margin;
  return "M" + source.y + "," + source.x + "\n    C" + (source.y + targetY) / 2 + "," + source.x + " " + (source.y + targetY) / 2 + ",\n    " + targetX + " " + targetY + "," + targetX;
}

function finalLink(d, margin) {
  return makeLink(d.source, d.target, margin);
}

function translate(x, y) {
  return "translate(" + y + ", " + x + ")";
}

function parseChainscript(chainscript) {
    return d3Hierarchy.stratify().id(function (d) {
        return d.meta.linkHash;
    }).parentId(function (d) {
        return d.link.meta.prevLinkHash;
    })(chainscript);
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var margin = { top: 20, right: 120, bottom: 20, left: 120 };
var height = 800 - margin.top - margin.bottom;

var ChainTree = function () {
  function ChainTree(element) {
    var _this = this;

    classCallCheck(this, ChainTree);

    this.tree = d3Hierarchy.tree();

    this.svg = d3Selection.select(element).append('svg');
    this.innerG = this.svg.append('g');

    this.zoomed = function () {
      return _this.innerG.attr('transform', d3Selection.event.transform);
    };
  }

  createClass(ChainTree, [{
    key: 'display',
    value: function display(chainscript, options) {
      if (chainscript && chainscript.length) {
        var root = parseChainscript(chainscript);
        this._update(root, options);
      } else {
        this._update(null, options);
      }
    }
  }, {
    key: '_update',
    value: function _update(root, options) {
      var self = this;
      var polygon = options.polygonSize;
      var nodes = root ? root.descendants() : [];
      var links = root ? root.links() : [];
      var maxDepth = d3Array.max(nodes, function (x) {
        return x.depth;
      }) || 0;
      var computedWidth = Math.max(maxDepth * (polygon.width + options.getArrowLength()), 500);
      var treeTransition = d3Transition.transition().duration(options.duration).ease(d3Ease.easeLinear);

      var branchesCount = nodes.reduce(function (pre, cur) {
        return pre + (cur.children ? Math.max(cur.children.length - 1, 0) : 0);
      }, 1);
      var computedHeight = branchesCount * polygon.height * options.verticalSpacing;

      this.tree.size([computedHeight, computedWidth]);
      this.svg.attr('width', options.zoomable ? 1200 : computedWidth + margin.right + margin.left + options.getArrowLength()).attr('height', (options.zoomable ? height : computedHeight) + margin.top + margin.bottom);

      // Compute the new tree layout.
      if (root) {
        root.x0 = computedHeight / 2;
        root.y0 = 0;
        this.tree(root);
        root.each(function (node) {
          node.y += options.getArrowLength();
        });
      }

      if (options.zoomable) {
        this.svg.call(d3Zoom.zoom().on('zoom', this.zoomed));
      } else {
        this.svg.on('.zoom', null);
      }
      this.innerG.attr('transform', function () {
        return translate(margin.top, margin.left);
      });

      // Update the links...
      var link = this.innerG.selectAll('path.link').data(links, function key(d) {
        return d ? d.target.id : this.id;
      });

      link.enter().insert('text').attr('dx', polygon.width + 20).attr('dy', '-0.3em').append('textPath').attr('class', 'textpath').attr('xlink:href', function (d) {
        return '#link-' + d.target.id;
      }).text(options.getLinkText);

      // Enter any new links at the parent's previous position.
      link.enter().insert('path', 'g').attr('class', 'link').attr('id', function (d) {
        return 'link-' + d.target.id;
      });

      var linkUpdate = this.innerG.selectAll('path.link:not(.init)').transition(treeTransition);

      // Transition links to their new position.
      linkUpdate.attr('d', function (d) {
        return finalLink(d, 15);
      });

      link.exit().remove();

      // Update the nodes...
      var node = this.innerG.selectAll('g.node').data(nodes, function key(d) {
        return d ? d.id : this.id;
      });

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append('g').attr('class', function (d) {
        return ['node'].concat(d.data.link.meta.tags).join(' ');
      }).attr('id', function (d) {
        return d.id;
      }).attr('transform', function (d) {
        var origin = d.parent && d.parent.x0 ? d.parent : root;
        return translate(origin.x0, origin.y0);
      }).on('click', function onClick(d) {
        d3Selection.selectAll('g.node').classed('selected', false);
        d3Selection.select(this).classed('selected', true);
        options.onclick(d, function () {
          self.innerG.selectAll('g.node.selected').classed('selected', false);
        }, this);
      });

      nodeEnter.append('polygon').attr('points', '0,' + polygon.height / 4 + ' ' + polygon.width / 2 + ',' + polygon.height / 2 + ' ' + (polygon.width + ',' + polygon.height / 4 + ' ' + polygon.width + ',' + -polygon.height / 4 + ' ') + (polygon.width / 2 + ',' + -polygon.height / 2 + ' 0,' + -polygon.height / 4));

      nodeEnter.append('rect').attr('y', -(options.getBoxSize().height / 2)).attr('width', polygon.width).attr('height', options.getBoxSize().height).style('fill-opacity', 1e-6);

      nodeEnter.append('text').attr('dx', 12).attr('dy', 4).attr('text-anchor', 'begin').text(options.getSegmentText).style('fill-opacity', 1e-6);

      // Transition nodes to their new position.
      var nodeUpdate = this.svg.selectAll('g.node').transition(treeTransition);

      nodeUpdate.attr('transform', function (d) {
        return translate(d.x, d.y);
      });
      nodeUpdate.select('text').style('fill-opacity', 1);
      nodeUpdate.select('rect').style('fill-opacity', 1);

      // Transition exiting nodes to the parent's new position.
      var nodeExit = node.exit(); // .transition(treeTransition);
      nodeExit.select('text').style('fill-opacity', 1e-6);
      nodeExit.attr('transform', function () {
        return translate(0, 0);
      }).remove();

      this._drawInit(root);
    }
  }, {
    key: '_drawInit',
    value: function _drawInit(root) {
      this.innerG.append('path').attr('class', 'link init').attr('id', 'init-link').attr('d', makeLink({ x: root.x, y: root.y0 }, root, 15));

      this.innerG.append('text').attr('dx', 20).attr('dy', '-0.3em').append('textPath').attr('class', 'textpath').attr('xlink:href', '#init-link').text('init');
    }
  }]);
  return ChainTree;
}();

function compactHash (hash) {
  return "" + hash.slice(0, 3) + hash.slice(hash.length - 3);
}

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}

function interopDefault(ex) {
	return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var index = createCommonjsModule(function (module, exports) {
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.deepmerge = factory();
    }
}(commonjsGlobal, function () {

return function deepmerge(target, src) {
    var array = Array.isArray(src);
    var dst = array && [] || {};

    if (array) {
        target = target || [];
        dst = dst.concat(target);
        src.forEach(function(e, i) {
            if (typeof dst[i] === 'undefined') {
                dst[i] = e;
            } else if (typeof e === 'object') {
                dst[i] = deepmerge(target[i], e);
            } else {
                if (target.indexOf(e) === -1) {
                    dst.push(e);
                }
            }
        });
    } else {
        if (target && typeof target === 'object') {
            Object.keys(target).forEach(function (key) {
                dst[key] = target[key];
            })
        }
        Object.keys(src).forEach(function (key) {
            if (typeof src[key] !== 'object' || !src[key]) {
                dst[key] = src[key];
            }
            else {
                if (!target[key]) {
                    dst[key] = src[key];
                } else {
                    dst[key] = deepmerge(target[key], src[key]);
                }
            }
        });
    }

    return dst;
}

}));
});

var merge = interopDefault(index);

var jsonrequest = createCommonjsModule(function (module) {
'use strict';

module.exports = {
  processRequest: function(req) {
    var
      contentType = req.header('Content-Type'),
      hasJsonContentType = contentType &&
                           contentType.indexOf('application/json') !== -1;

    if (contentType != null && !hasJsonContentType) {
      return;
    }

    if (req.body) {
      if (!contentType) {
        req.header('Content-Type', 'application/json');
      }

      req.body = JSON.stringify(req.body);
    }
  }
};
});

var jsonrequest$1 = interopDefault(jsonrequest);
var processRequest$1 = jsonrequest.processRequest;

var require$$1 = Object.freeze({
  default: jsonrequest$1,
  processRequest: processRequest$1
});

var jsonresponse = createCommonjsModule(function (module) {
'use strict';

module.exports = {
  processRequest: function(req) {
    var accept = req.header('Accept');
    if (accept == null) {
      req.header('Accept', 'application/json');
    }
  },
  processResponse: function(res) {
    // Check to see if the contentype is "something/json" or
    // "something/somethingelse+json"
    if (res.contentType && /^.*\/(?:.*\+)?json(;|$)/i.test(res.contentType)) {
      var raw = typeof res.body === 'string' ? res.body : res.text;
      if (raw) {
        res.body = JSON.parse(raw);
      }
    }
  }
};
});

var jsonresponse$1 = interopDefault(jsonresponse);
var processRequest$2 = jsonresponse.processRequest;
var processResponse$1 = jsonresponse.processResponse;

var require$$0 = Object.freeze({
  default: jsonresponse$1,
  processRequest: processRequest$2,
  processResponse: processResponse$1
});

var json = createCommonjsModule(function (module) {
'use strict';

var jsonrequest = interopDefault(require$$1),
    jsonresponse = interopDefault(require$$0);

module.exports = {
  processRequest: function(req) {
    jsonrequest.processRequest.call(this, req);
    jsonresponse.processRequest.call(this, req);
  },
  processResponse: function(res) {
    jsonresponse.processResponse.call(this, res);
  }
};
});

var json$1 = interopDefault(json);

var cleanurl = createCommonjsModule(function (module) {
'use strict';

module.exports = {
  processRequest: function(req) {
    req.url = req.url.replace(/[^%]+/g, function(s) {
      return encodeURI(s);
    });
  }
};
});

var cleanurl$1 = interopDefault(cleanurl);
var processRequest$3 = cleanurl.processRequest;

var require$$7 = Object.freeze({
  default: cleanurl$1,
  processRequest: processRequest$3
});

var xhrBrowser = createCommonjsModule(function (module) {
module.exports = window.XMLHttpRequest;
});

var xhrBrowser$1 = interopDefault(xhrBrowser);


var require$$6 = Object.freeze({
	default: xhrBrowser$1
});

var delay = createCommonjsModule(function (module) {
'use strict';

// Wrap a function in a `setTimeout` call. This is used to guarantee async
// behavior, which can avoid unexpected errors.

module.exports = function(fn) {
  return function() {
    var
      args = Array.prototype.slice.call(arguments, 0),
      newFunc = function() {
        return fn.apply(null, args);
      };
    setTimeout(newFunc, 0);
  };
};
});

var delay$1 = interopDefault(delay);


var require$$5 = Object.freeze({
  default: delay$1
});

var request$1 = createCommonjsModule(function (module) {
'use strict';

function Request(optsOrUrl) {
  var opts = typeof optsOrUrl === 'string' ? {url: optsOrUrl} : optsOrUrl || {};
  this.method = opts.method ? opts.method.toUpperCase() : 'GET';
  this.url = opts.url;
  this.headers = opts.headers || {};
  this.body = opts.body;
  this.timeout = opts.timeout || 0;
  this.errorOn404 = opts.errorOn404 != null ? opts.errorOn404 : true;
  this.onload = opts.onload;
  this.onerror = opts.onerror;
}

Request.prototype.abort = function() {
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  return this;
};

Request.prototype.header = function(name, value) {
  var k;
  for (k in this.headers) {
    if (this.headers.hasOwnProperty(k)) {
      if (name.toLowerCase() === k.toLowerCase()) {
        if (arguments.length === 1) {
          return this.headers[k];
        }

        delete this.headers[k];
        break;
      }
    }
  }
  if (value != null) {
    this.headers[name] = value;
    return value;
  }
};


module.exports = Request;
});

var request$2 = interopDefault(request$1);


var require$$1$1 = Object.freeze({
  default: request$2
});

var index$2 = createCommonjsModule(function (module) {
module.exports = extend

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}
});

var index$3 = interopDefault(index$2);


var require$$0$2 = Object.freeze({
    default: index$3
});

var extractResponseProps = createCommonjsModule(function (module) {
'use strict';

var extend = interopDefault(require$$0$2);

module.exports = function(req) {
  var xhr = req.xhr;
  var props = {request: req, xhr: xhr};

  // Try to create the response from the request. If the request was aborted,
  // accesssing properties of the XHR may throw an error, so we wrap in a
  // try/catch.
  try {
    var lines, i, m, headers = {};
    if (xhr.getAllResponseHeaders) {
      lines = xhr.getAllResponseHeaders().split('\n');
      for (i = 0; i < lines.length; i++) {
        if ((m = lines[i].match(/\s*([^\s]+):\s+([^\s]+)/))) {
          headers[m[1]] = m[2];
        }
      }
    }

    props = extend(props, {
      status: xhr.status,
      contentType: xhr.contentType || (xhr.getResponseHeader && xhr.getResponseHeader('Content-Type')),
      headers: headers,
      text: xhr.responseText,
      body: xhr.response || xhr.responseText
    });
  } catch (err) {}

  return props;
};
});

var extractResponseProps$1 = interopDefault(extractResponseProps);


var require$$0$1 = Object.freeze({
  default: extractResponseProps$1
});

var response = createCommonjsModule(function (module) {
'use strict';

var Request = interopDefault(require$$1$1);
var extractResponseProps = interopDefault(require$$0$1);

function Response(props) {
  this.request = props.request;
  this.xhr = props.xhr;
  this.headers = props.headers || {};
  this.status = props.status || 0;
  this.text = props.text;
  this.body = props.body;
  this.contentType = props.contentType;
  this.isHttpError = props.status >= 400;
}

Response.prototype.header = Request.prototype.header;

Response.fromRequest = function(req) {
  return new Response(extractResponseProps(req));
};


module.exports = Response;
});

var response$1 = interopDefault(response);


var require$$2 = Object.freeze({
  default: response$1
});

var error = createCommonjsModule(function (module) {
'use strict';

var Response = interopDefault(require$$2);
var extractResponseProps = interopDefault(require$$0$1);
var extend = interopDefault(require$$0$2);

function RequestError(message, props) {
  var err = new Error(message);
  err.name = 'RequestError';
  this.name = err.name;
  this.message = err.message;
  if (err.stack) {
    this.stack = err.stack;
  }

  this.toString = function() {
    return this.message;
  };

  for (var k in props) {
    if (props.hasOwnProperty(k)) {
      this[k] = props[k];
    }
  }
}

RequestError.prototype = extend(Error.prototype);
RequestError.prototype.constructor = RequestError;

RequestError.create = function(message, req, props) {
  var err = new RequestError(message, props);
  Response.call(err, extractResponseProps(req));
  return err;
};

module.exports = RequestError;
});

var error$1 = interopDefault(error);


var require$$4 = Object.freeze({
  default: error$1
});

var once = createCommonjsModule(function (module) {
'use strict';

// A "once" utility.
module.exports = function(fn) {
  var result, called = false;
  return function() {
    if (!called) {
      called = true;
      result = fn.apply(this, arguments);
    }
    return result;
  };
};
});

var once$1 = interopDefault(once);


var require$$0$3 = Object.freeze({
  default: once$1
});

var index$1 = createCommonjsModule(function (module) {
'use strict';

var
  cleanURL = interopDefault(require$$7),
  XHR = interopDefault(require$$6),
  delay = interopDefault(require$$5),
  RequestError = interopDefault(require$$4),
  Response = interopDefault(require$$2),
  Request = interopDefault(require$$1$1),
  extend = interopDefault(require$$0$2),
  once = interopDefault(require$$0$3);

var i,
    createError = RequestError.create;

function factory(defaults, plugins) {
  defaults = defaults || {};
  plugins = plugins || [];

  function http(req, cb) {
    var xhr, plugin, done, k, timeoutId, supportsLoadAndErrorEvents;

    req = new Request(extend(defaults, req));

    for (i = 0; i < plugins.length; i++) {
      plugin = plugins[i];
      if (plugin.processRequest) {
        plugin.processRequest(req);
      }
    }

    // Give the plugins a chance to create the XHR object
    for (i = 0; i < plugins.length; i++) {
      plugin = plugins[i];
      if (plugin.createXHR) {
        xhr = plugin.createXHR(req);
        break; // First come, first serve
      }
    }
    xhr = xhr || new XHR();

    req.xhr = xhr;

    // Use a single completion callback. This can be called with or without
    // an error. If no error is passed, the request will be examined to see
    // if it was successful.
    done = once(delay(function(rawError) {
      clearTimeout(timeoutId);
      xhr.onload = xhr.onerror = xhr.onabort = xhr.onreadystatechange = xhr.ontimeout = xhr.onprogress = null;

      var err = getError(req, rawError);

      var res = err || Response.fromRequest(req);
      for (i = 0; i < plugins.length; i++) {
        plugin = plugins[i];
        if (plugin.processResponse) {
          plugin.processResponse(res);
        }
      }

      // Invoke callbacks
      if (err && req.onerror) req.onerror(err);
      if (!err && req.onload) req.onload(res);
      if (cb) cb(err, err ? undefined : res);

    }));

    supportsLoadAndErrorEvents = ('onload' in xhr) && ('onerror' in xhr);
    xhr.onload = function() { done(); };
    xhr.onerror = done;
    xhr.onabort = function() { done(); };

    // We'd rather use `onload`, `onerror`, and `onabort` since they're the
    // only way to reliably detect successes and failures but, if they
    // aren't available, we fall back to using `onreadystatechange`.
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) return;

      if (req.aborted) return done();

      if (!supportsLoadAndErrorEvents) {
        // Assume a status of 0 is an error. This could be a false
        // positive, but there's no way to tell when using
        // `onreadystatechange` ):
        // See matthewwithanm/react-inlinesvg#10.

        // Some browsers don't like you reading XHR properties when the
        // XHR has been aborted. In case we've gotten here as a result
        // of that (either our calling `about()` in the timeout handler
        // or the user calling it directly even though they shouldn't),
        // be careful about accessing it.
        var status;
        try {
          status = xhr.status;
        } catch (err) {}
        var err = status === 0 ? new Error('Internal XHR Error') : null;
        return done(err);
      }
    };

    // IE sometimes fails if you don't specify every handler.
    // See http://social.msdn.microsoft.com/Forums/ie/en-US/30ef3add-767c-4436-b8a9-f1ca19b4812e/ie9-rtm-xdomainrequest-issued-requests-may-abort-if-all-event-handlers-not-specified?forum=iewebdevelopment
    xhr.ontimeout = function() { /* noop */ };
    xhr.onprogress = function() { /* noop */ };

    xhr.open(req.method, req.url);

    if (req.timeout) {
      // If we use the normal XHR timeout mechanism (`xhr.timeout` and
      // `xhr.ontimeout`), `onreadystatechange` will be triggered before
      // `ontimeout`. There's no way to recognize that it was triggered by
      // a timeout, and we'd be unable to dispatch the right error.
      timeoutId = setTimeout(function() {
        req.timedOut = true;
        done();
        try {
          xhr.abort();
        } catch (err) {}
      }, req.timeout);
    }

    for (k in req.headers) {
      if (req.headers.hasOwnProperty(k)) {
        xhr.setRequestHeader(k, req.headers[k]);
      }
    }

    xhr.send(req.body);

    return req;
  }

  var method,
    methods = ['get', 'post', 'put', 'head', 'patch', 'delete'],
    verb = function(method) {
      return function(req, cb) {
        req = new Request(req);
        req.method = method;
        return http(req, cb);
      };
    };
  for (i = 0; i < methods.length; i++) {
    method = methods[i];
    http[method] = verb(method);
  }

  http.plugins = function() {
    return plugins;
  };

  http.defaults = function(newValues) {
    if (newValues) {
      return factory(extend(defaults, newValues), plugins);
    }
    return defaults;
  };

  http.use = function() {
    var newPlugins = Array.prototype.slice.call(arguments, 0);
    return factory(defaults, plugins.concat(newPlugins));
  };

  http.bare = function() {
    return factory();
  };

  http.Request = Request;
  http.Response = Response;
  http.RequestError = RequestError;

  return http;
}

module.exports = factory({}, [cleanURL]);

/**
 * Analyze the request to see if it represents an error. If so, return it! An
 * original error object can be passed as a hint.
 */
function getError(req, err) {
  if (req.aborted) return createError('Request aborted', req, {name: 'Abort'});

  if (req.timedOut) return createError('Request timeout', req, {name: 'Timeout'});

  var xhr = req.xhr;
  var type = Math.floor(xhr.status / 100);

  var kind;
  switch (type) {
    case 0:
    case 2:
      // These don't represent errors unless the function was passed an
      // error object explicitly.
      if (!err) return;
      return createError(err.message, req);
    case 4:
      // Sometimes 4XX statuses aren't errors.
      if (xhr.status === 404 && !req.errorOn404) return;
      kind = 'Client';
      break;
    case 5:
      kind = 'Server';
      break;
    default:
      kind = 'HTTP';
  }
  var msg = kind + ' Error: ' +
        'The server returned a status of ' + xhr.status +
        ' for the request "' +
        req.method.toUpperCase() + ' ' + req.url + '"';
  return createError(msg, req);
}
});

var httpplease = interopDefault(index$1);

function deprecated(oldFunc, newFunc) {
  if (!newFunc) {
    console.warn("WARNING: " + oldFunc + " is deprecated.");
  } else {
    console.warn("WARNING: " + oldFunc + " is deprecated. Please use " + newFunc + " instead.");
  }
}

/**
 * Makes a query string.
 * @param {object} obj - an object of keys
 * @returns {string} a query string
 */
function makeQueryString(obj) {
  var parts = Object.keys(obj).reduce(function (curr, key) {
    var val = Array.isArray(obj[key]) ? obj[key].join('+') : obj[key];
    curr.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
    return curr;
  }, []);

  if (parts.length) {
    return '?' + parts.join('&');
  }

  return '';
}

var request = httpplease.use(json$1);

function send(method, url, args) {
  return new Promise(function (resolve, reject) {
    request({ method: method, url: url, body: args }, function (err, res) {
      if (err) {
        var error = err && err.body && err.body.meta && err.body.meta.errorMessage ? new Error(err.body.meta.errorMessage) : err;
        error.status = err.status;
        reject(error);
      } else {
        resolve(res);
      }
    });
  });
}

function get$1(url) {
  return send('GET', url);
}

function post(url, args) {
  return send('POST', url, args);
}

function findSegments(agent) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  return get$1(agent.url + '/segments' + makeQueryString(opts)).then(function (res) {
    return res.body.map(function (obj) {
      return segmentify(agent, obj);
    });
  });
}

function getBranches(agent, prevLinkHash) {
  var tags = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

  deprecated('Agent#getBranches(agent, prevLinkHash, tags = [])', 'Agent#findSegments(agent, filter)');

  return findSegments(agent, { prevLinkHash: prevLinkHash, tags: tags });
}

function segmentify(agent, obj) {
  Object.keys(agent.agentInfo.actions).filter(function (key) {
    return ['init'].indexOf(key) < 0;
  }).forEach(function (key) {
    /*eslint-disable*/
    obj[key] = function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return post(agent.url + '/segments/' + obj.meta.linkHash + '/' + key, args).then(function (res) {
        return segmentify(agent, res.body);
      });
    };
  });

  /*eslint-disable*/
  obj.getPrev = function () {
    /*eslint-enable*/
    if (obj.link.meta.prevLinkHash) {
      return agent.getSegment(obj.link.meta.prevLinkHash);
    }

    return Promise.resolve(null);
  };

  // Deprecated.
  /*eslint-disable*/
  obj.load = function () {
    /*eslint-enable*/
    deprecated('segment#load()');
    return Promise.resolve(segmentify(agent, {
      link: JSON.parse(JSON.stringify(obj.link)),
      meta: JSON.parse(JSON.stringify(obj.meta))
    }));
  };

  // Deprecated.
  /*eslint-disable*/
  obj.getBranches = function () {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    /*eslint-enable*/
    return getBranches.apply(undefined, [agent, obj.meta.linkHash].concat(args));
  };

  return obj;
}

function createMap(agent) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  return post(agent.url + '/segments', args).then(function (res) {
    return segmentify(agent, res.body);
  });
}

function getSegment(agent, linkHash) {
  return get$1(agent.url + '/segments/' + linkHash).then(function (res) {
    return segmentify(agent, res.body);
  });
}

function getMapIds(agent) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  return get$1(agent.url + '/maps' + makeQueryString(opts)).then(function (res) {
    return res.body;
  });
}

function getLink(agent, hash) {
  deprecated('Agent#getLink(agent, hash)', 'Agent#getSegment(agent, hash)');

  return getSegment(agent, hash);
}

function getMap(agent, mapId) {
  var tags = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

  deprecated('getMap(agent, mapId, tags = [])', 'findSegments(agent, filter)');

  return findSegments(agent, { mapId: mapId, tags: tags });
}

// Deprecated.
function getAgent(url) {
  return get$1(url).then(function (res) {
    var agent = res.body;

    agent.url = url;
    agent.createMap = createMap.bind(null, agent);
    agent.getSegment = getSegment.bind(null, agent);
    agent.findSegments = findSegments.bind(null, agent);
    agent.getMapIds = getMapIds.bind(null, agent);

    // Deprecated.
    agent.getBranches = getBranches.bind(null, agent);
    agent.getLink = getLink.bind(null, agent);
    agent.getMap = getMap.bind(null, agent);

    return agent;
  });
}

function fromSegment(obj) {
  return getAgent(obj.meta.agentUrl || obj.meta.applicationLocation).then(function (agent) {
    var segment = segmentify(agent, obj);
    return { agent: agent, segment: segment };
  });
}

function loadLink(obj) {
  deprecated('loadLink(obj)', 'fromSegment(obj)');

  return fromSegment(obj).then(function (_ref) {
    var segment = _ref.segment;
    return segment;
  });
}

function resolveLinks(segments) {
  return Promise.all(segments.map(function (segment) {
    if (!segment.link.state) {
      return loadLink(segment).then(function (res) {
        return merge(res, segment);
      });
    }
    return Promise.resolve(segment);
  }));
}

function wrap(arrayOrObject) {
  if (arrayOrObject instanceof Array) {
    return arrayOrObject;
  }
  return [arrayOrObject];
}

function parseIfJson(object) {
  if ((typeof object === 'undefined' ? 'undefined' : _typeof(object)) !== 'object') {
    object = JSON.parse(object);
  }
  return object;
}

function flatten(arr) {
  var _ref;

  var flat = (_ref = []).concat.apply(_ref, toConsumableArray(arr));
  return flat.some(Array.isArray) ? flatten(flat) : flat;
}

function tagsSet(chainscript) {
  return new Set(flatten(chainscript.map(function (segment) {
    return segment.link.meta.tags;
  })));
}

var defaultOptions = {
  withArgs: false,
  duration: 750,
  verticalSpacing: 1.2,
  polygonSize: { width: 78, height: 91 },
  getBoxSize: function getBoxSize() {
    var self = this;
    return { width: self.polygonSize.width, height: 25 };
  },
  getArrowLength: function getArrowLength() {
    return this.polygonSize.width;
  },
  getSegmentText: function getSegmentText(node) {
    return compactHash(node.data.meta.linkHash);
  },
  getLinkText: function getLinkText(node) {
    return node.target.data.link.meta.action + (this.withArgs ? '(' + node.target.data.link.meta.arguments.join(', ') + ')' : '');
  },
  onclick: function onclick() {},
  onTag: function onTag() {}
};

var ChainTreeBuilder = function () {
  function ChainTreeBuilder(element) {
    classCallCheck(this, ChainTreeBuilder);

    this.chainTree = new ChainTree(element);
  }

  createClass(ChainTreeBuilder, [{
    key: 'build',
    value: function build(map, options) {
      var _this = this;

      this.onTag = options.onTag;
      if (map.id && map.applicationUrl) {
        return this._load(map).then(function (segments) {
          return _this._display(segments, options);
        });
      } else if (map.chainscript && map.chainscript.length) {
        try {
          return resolveLinks(wrap(parseIfJson(map.chainscript))).then(function (segments) {
            return _this._display(segments, options);
          });
        } catch (err) {
          return Promise.reject(err);
        }
      }
      return Promise.resolve();
    }
  }, {
    key: '_display',
    value: function _display(segments, options) {
      this.chainTree.display(segments, _extends({}, defaultOptions, options));
      this._notifyTags(segments);
      return segments;
    }
  }, {
    key: '_notifyTags',
    value: function _notifyTags(chainscript) {
      tagsSet(chainscript).forEach(this.onTag);
    }
  }, {
    key: '_load',
    value: function _load(map) {
      return getAgent(map.applicationUrl).then(function (app) {
        return app.findSegments({ mapId: map.id });
      }).catch(function (res) {
        return console.log(res);
      });
    }
  }]);
  return ChainTreeBuilder;
}();

var index$4 = createCommonjsModule(function (module) {
/*
The original version of this code is taken from Douglas Crockford's json2.js:
https://github.com/douglascrockford/JSON-js/blob/master/json2.js

I made some modifications to ensure a canonical output.
*/

function f(n) {
    // Format integers to have at least two digits.
    return n < 10 ? '0' + n : n;
}

var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    gap,
    indent,
    meta = {    // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    },
    rep;


function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

    escapable.lastIndex = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        var c = meta[a];
        return typeof c === 'string'
            ? c
            : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
}


function str(key, holder) {

// Produce a string from holder[key].

    var i,          // The loop counter.
        k,          // The member key.
        v,          // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

    if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
        value = value.toJSON(key);
    }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

    if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
    }

// What happens next depends on the value's type.

    switch (typeof value) {
    case 'string':
        return quote(value);

    case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

        return isFinite(value) ? String(value) : 'null';

    case 'boolean':
    case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

        return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

    case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

        if (!value) {
            return 'null';
        }

// Make an array to hold the partial results of stringifying this object value.

        gap += indent;
        partial = [];

// Is the value an array?

        if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

            length = value.length;
            for (i = 0; i < length; i += 1) {
                partial[i] = str(i, value) || 'null';
            }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

            v = partial.length === 0
                ? '[]'
                : gap
                ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                : '[' + partial.join(',') + ']';
            gap = mind;
            return v;
        }

// If the replacer is an array, use it to select the members to be stringified.

        if (rep && typeof rep === 'object') {
            length = rep.length;
            for (i = 0; i < length; i += 1) {
                if (typeof rep[i] === 'string') {
                    k = rep[i];
                    v = str(k, value);
                    if (v) {
                        partial.push(quote(k) + (gap ? ': ' : ':') + v);
                    }
                }
            }
        } else {

// Otherwise, iterate through all of the keys in the object.
            var keysSorted = Object.keys(value).sort()
            for (i in keysSorted) {
                k = keysSorted[i]
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = str(k, value);
                    if (v) {
                        partial.push(quote(k) + (gap ? ': ' : ':') + v);
                    }
                }
            }
        }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

        v = partial.length === 0
            ? '{}'
            : gap
            ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
            : '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
}

// If the JSON object does not yet have a stringify method, give it one.
var stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

    var i;
    gap = '';
    indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

    if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
            indent += ' ';
        }

// If the space parameter is a string, it will be used as the indent string.

    } else if (typeof space === 'string') {
        indent = space;
    }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

    rep = replacer;
    if (replacer && typeof replacer !== 'function' &&
            (typeof replacer !== 'object' ||
            typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
    }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

    return str('', {'': value});
};

module.exports = stringify
});

var stringify = interopDefault(index$4);

var sha256 = createCommonjsModule(function (module) {
/*
 * js-sha256 v0.3.0
 * https://github.com/emn178/js-sha256
 *
 * Copyright 2014-2015, emn178@gmail.com
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
;(function(root, undefined) {
  'use strict';

  var NODE_JS = typeof(module) != 'undefined';
  if(NODE_JS) {
    root = commonjsGlobal;
  }
  var TYPED_ARRAY = typeof(Uint8Array) != 'undefined';
  var HEX_CHARS = '0123456789abcdef'.split('');
  var EXTRA = [-2147483648, 8388608, 32768, 128];
  var SHIFT = [24, 16, 8, 0];
  var K =[0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
          0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
          0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
          0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
          0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
          0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
          0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
          0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

  var blocks = [];

  var sha224 = function(message) {
    return sha256(message, true);
  };

  var sha256 = function(message, is224) {
    var notString = typeof(message) != 'string';
    if(notString && message.constructor == root.ArrayBuffer) {
      message = new Uint8Array(message);
    }

    var h0, h1, h2, h3, h4, h5, h6, h7, block, code, first = true, end = false,
        i, j, index = 0, start = 0, bytes = 0, length = message.length,
        s0, s1, maj, t1, t2, ch, ab, da, cd, bc;

    if(is224) {
      h0 = 0xc1059ed8;
      h1 = 0x367cd507;
      h2 = 0x3070dd17;
      h3 = 0xf70e5939;
      h4 = 0xffc00b31;
      h5 = 0x68581511;
      h6 = 0x64f98fa7;
      h7 = 0xbefa4fa4;
    } else { // 256
      h0 = 0x6a09e667;
      h1 = 0xbb67ae85;
      h2 = 0x3c6ef372;
      h3 = 0xa54ff53a;
      h4 = 0x510e527f;
      h5 = 0x9b05688c;
      h6 = 0x1f83d9ab;
      h7 = 0x5be0cd19;
    }
    block = 0;
    do {
      blocks[0] = block;
      blocks[16] = blocks[1] = blocks[2] = blocks[3] =
      blocks[4] = blocks[5] = blocks[6] = blocks[7] =
      blocks[8] = blocks[9] = blocks[10] = blocks[11] =
      blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      if(notString) {
        for (i = start;index < length && i < 64; ++index) {
          blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
        }
      } else {
        for (i = start;index < length && i < 64; ++index) {
          code = message.charCodeAt(index);
          if (code < 0x80) {
            blocks[i >> 2] |= code << SHIFT[i++ & 3];
          } else if (code < 0x800) {
            blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else if (code < 0xd800 || code >= 0xe000) {
            blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else {
            code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
            blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          }
        }
      }
      bytes += i - start;
      start = i - 64;
      if(index == length) {
        blocks[i >> 2] |= EXTRA[i & 3];
        ++index;
      }
      block = blocks[16];
      if(index > length && i < 56) {
        blocks[15] = bytes << 3;
        end = true;
      }

      var a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for(j = 16;j < 64;++j) {
        // rightrotate
        t1 = blocks[j - 15];
        s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3);
        t1 = blocks[j - 2];
        s1 = ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^ (t1 >>> 10);
        blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
      }

      bc = b & c;
      for(j = 0;j < 64;j += 4) {
        if(first) {
          if(is224) {
            ab = 300032;
            t1 = blocks[0] - 1413257819;
            h = t1 - 150054599 << 0;
            d = t1 + 24177077 << 0;
          } else {
            ab = 704751109;
            t1 = blocks[0] - 210244248;
            h = t1 - 1521486534 << 0;
            d = t1 + 143694565 << 0;
          }
          first = false;
        } else {
          s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
          s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
          ab = a & b;
          maj = ab ^ (a & c) ^ bc;
          ch = (e & f) ^ (~e & g);
          t1 = h + s1 + ch + K[j] + blocks[j];
          t2 = s0 + maj;
          h = d + t1 << 0;
          d = t1 + t2 << 0;
        }
        s0 = ((d >>> 2) | (d << 30)) ^ ((d >>> 13) | (d << 19)) ^ ((d >>> 22) | (d << 10));
        s1 = ((h >>> 6) | (h << 26)) ^ ((h >>> 11) | (h << 21)) ^ ((h >>> 25) | (h << 7));
        da = d & a;
        maj = da ^ (d & b) ^ ab;
        ch = (h & e) ^ (~h & f);
        t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
        t2 = s0 + maj;
        g = c + t1 << 0;
        c = t1 + t2 << 0;
        s0 = ((c >>> 2) | (c << 30)) ^ ((c >>> 13) | (c << 19)) ^ ((c >>> 22) | (c << 10));
        s1 = ((g >>> 6) | (g << 26)) ^ ((g >>> 11) | (g << 21)) ^ ((g >>> 25) | (g << 7));
        cd = c & d;
        maj = cd ^ (c & a) ^ da;
        ch = (g & h) ^ (~g & e);
        t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
        t2 = s0 + maj;
        f = b + t1 << 0;
        b = t1 + t2 << 0;
        s0 = ((b >>> 2) | (b << 30)) ^ ((b >>> 13) | (b << 19)) ^ ((b >>> 22) | (b << 10));
        s1 = ((f >>> 6) | (f << 26)) ^ ((f >>> 11) | (f << 21)) ^ ((f >>> 25) | (f << 7));
        bc = b & c;
        maj = bc ^ (b & d) ^ cd;
        ch = (f & g) ^ (~f & h);
        t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
        t2 = s0 + maj;
        e = a + t1 << 0;
        a = t1 + t2 << 0;
      }

      h0 = h0 + a << 0;
      h1 = h1 + b << 0;
      h2 = h2 + c << 0;
      h3 = h3 + d << 0;
      h4 = h4 + e << 0;
      h5 = h5 + f << 0;
      h6 = h6 + g << 0;
      h7 = h7 + h << 0;
    } while(!end);

    var hex = HEX_CHARS[(h0 >> 28) & 0x0F] + HEX_CHARS[(h0 >> 24) & 0x0F] +
              HEX_CHARS[(h0 >> 20) & 0x0F] + HEX_CHARS[(h0 >> 16) & 0x0F] +
              HEX_CHARS[(h0 >> 12) & 0x0F] + HEX_CHARS[(h0 >> 8) & 0x0F] +
              HEX_CHARS[(h0 >> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] +
              HEX_CHARS[(h1 >> 28) & 0x0F] + HEX_CHARS[(h1 >> 24) & 0x0F] +
              HEX_CHARS[(h1 >> 20) & 0x0F] + HEX_CHARS[(h1 >> 16) & 0x0F] +
              HEX_CHARS[(h1 >> 12) & 0x0F] + HEX_CHARS[(h1 >> 8) & 0x0F] +
              HEX_CHARS[(h1 >> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] +
              HEX_CHARS[(h2 >> 28) & 0x0F] + HEX_CHARS[(h2 >> 24) & 0x0F] +
              HEX_CHARS[(h2 >> 20) & 0x0F] + HEX_CHARS[(h2 >> 16) & 0x0F] +
              HEX_CHARS[(h2 >> 12) & 0x0F] + HEX_CHARS[(h2 >> 8) & 0x0F] +
              HEX_CHARS[(h2 >> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] +
              HEX_CHARS[(h3 >> 28) & 0x0F] + HEX_CHARS[(h3 >> 24) & 0x0F] +
              HEX_CHARS[(h3 >> 20) & 0x0F] + HEX_CHARS[(h3 >> 16) & 0x0F] +
              HEX_CHARS[(h3 >> 12) & 0x0F] + HEX_CHARS[(h3 >> 8) & 0x0F] +
              HEX_CHARS[(h3 >> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] +
              HEX_CHARS[(h4 >> 28) & 0x0F] + HEX_CHARS[(h4 >> 24) & 0x0F] +
              HEX_CHARS[(h4 >> 20) & 0x0F] + HEX_CHARS[(h4 >> 16) & 0x0F] +
              HEX_CHARS[(h4 >> 12) & 0x0F] + HEX_CHARS[(h4 >> 8) & 0x0F] +
              HEX_CHARS[(h4 >> 4) & 0x0F] + HEX_CHARS[h4 & 0x0F] +
              HEX_CHARS[(h5 >> 28) & 0x0F] + HEX_CHARS[(h5 >> 24) & 0x0F] +
              HEX_CHARS[(h5 >> 20) & 0x0F] + HEX_CHARS[(h5 >> 16) & 0x0F] +
              HEX_CHARS[(h5 >> 12) & 0x0F] + HEX_CHARS[(h5 >> 8) & 0x0F] +
              HEX_CHARS[(h5 >> 4) & 0x0F] + HEX_CHARS[h5 & 0x0F] +
              HEX_CHARS[(h6 >> 28) & 0x0F] + HEX_CHARS[(h6 >> 24) & 0x0F] +
              HEX_CHARS[(h6 >> 20) & 0x0F] + HEX_CHARS[(h6 >> 16) & 0x0F] +
              HEX_CHARS[(h6 >> 12) & 0x0F] + HEX_CHARS[(h6 >> 8) & 0x0F] +
              HEX_CHARS[(h6 >> 4) & 0x0F] + HEX_CHARS[h6 & 0x0F];
    if(!is224) {
      hex += HEX_CHARS[(h7 >> 28) & 0x0F] + HEX_CHARS[(h7 >> 24) & 0x0F] +
             HEX_CHARS[(h7 >> 20) & 0x0F] + HEX_CHARS[(h7 >> 16) & 0x0F] +
             HEX_CHARS[(h7 >> 12) & 0x0F] + HEX_CHARS[(h7 >> 8) & 0x0F] +
             HEX_CHARS[(h7 >> 4) & 0x0F] + HEX_CHARS[h7 & 0x0F];
    }
    return hex;
  };
  
  if(!root.JS_SHA256_TEST && NODE_JS) {
    sha256.sha256 = sha256;
    sha256.sha224 = sha224;
    module.exports = sha256;
  } else if(root) {
    root.sha256 = sha256;
    root.sha224 = sha224;
  }
}(commonjsGlobal));
});

var sha256$1 = interopDefault(sha256);

/**
 * Canonically hashes a json object.
 * @param {Object} obj the json object
 */
function hashJson(obj) {
  return sha256$1(stringify(obj));
}

var _buffer;
var _slowbuffer;
var _INSPECT_MAX_BYTES;
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,___mod,_expor_){
'use strict'

_expor_.toByteArray = toByteArray
_expor_.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],2:[function(_dereq_,___mod,_expor_){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = _dereq_('base64-js')
var ieee754 = _dereq_('ieee754')
var isArray = _dereq_('isarray')

_expor_.Buffer = Buffer
_expor_.SlowBuffer = SlowBuffer
_expor_.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
_expor_.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  that.write(string, encoding)
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = _expor_.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

function arrayIndexOf (arr, val, byteOffset, encoding) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var foundIndex = -1
  for (var i = byteOffset; i < arrLength; ++i) {
    if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
      if (foundIndex === -1) foundIndex = i
      if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
    } else {
      if (foundIndex !== -1) i -= i - foundIndex
      foundIndex = -1
    }
  }

  return -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  if (Buffer.isBuffer(val)) {
    // special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(this, val, byteOffset, encoding)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset, encoding)
  }

  throw new TypeError('val must be string, number or Buffer')
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":1,"ieee754":3,"isarray":4}],3:[function(_dereq_,___mod,_expor_){
_expor_.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

_expor_.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(_dereq_,___mod,_expor_){
var toString = {}.toString;

___mod.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],5:[function(_dereq_,___mod,_expor_){
var buf = _dereq_('buffer');
_buffer = buf.Buffer;
_slowbuffer = buf.SlowBuffer;
_INSPECT_MAX_BYTES = buf._INSPECT_MAX_BYTES;

},{"buffer":2}]},{},[5]);

function computeMerkleParent(left, right) {
  if (right) {
    return sha256$1(_buffer.concat([new _buffer(left, 'hex'), new _buffer(right, 'hex')]));
  }
  return left;
}

var blockCypherCache = {};

var SegmentValidator = function () {
  function SegmentValidator(segment) {
    classCallCheck(this, SegmentValidator);

    this.segment = segment;
  }

  createClass(SegmentValidator, [{
    key: 'validate',
    value: function validate(errors) {
      errors.linkHash.push(this._validateLinkHash());
      errors.stateHash.push(this._validateStateHash());
      errors.merklePath.push(this._validateMerklePath());
      errors.fossil.push(this._validateFossil());
    }
  }, {
    key: '_validateLinkHash',
    value: function _validateLinkHash() {
      var computed = hashJson(this.segment.link);
      var actual = this.segment.meta.linkHash;
      if (computed !== actual) {
        return 'LinkHash computed: ' + computed + ', Found: ' + actual;
      }
      return null;
    }
  }, {
    key: '_validateStateHash',
    value: function _validateStateHash() {
      if (this.segment.link.state) {
        var computed = hashJson(this.segment.link.state);
        var actual = this.segment.link.meta.stateHash;
        if (computed !== actual) {
          return 'StateHash computed: ' + computed + ', Found: ' + actual;
        }
      }
      return null;
    }
  }, {
    key: '_validateMerklePath',
    value: function _validateMerklePath() {
      var _this = this;

      var evidence = this.segment.meta.evidence;
      if (evidence) {
        if (evidence.state === 'COMPLETE') {
          var _ret = function () {
            var previous = _this.segment.meta.linkHash;

            var error = void 0;
            evidence.merklePath.every(function (merkleNode) {
              if (merkleNode.left === previous || merkleNode.right === previous) {
                var computedParent = computeMerkleParent(merkleNode.left, merkleNode.right);

                if (computedParent !== merkleNode.parent) {
                  error = 'Invalid Merkle Node ' + JSON.stringify(merkleNode) + ': ' + ('computed parent: ' + computedParent);
                  return false;
                }
                previous = merkleNode.parent;
                return true;
              }
              error = 'Invalid Merkle Node ' + JSON.stringify(merkleNode) + ': ' + ('previous hash (' + previous + ') not found');
              return false;
            });

            if (error) {
              return {
                v: error
              };
            }

            var lastMerkleNode = evidence.merklePath[evidence.merklePath.length - 1];
            if (lastMerkleNode.parent !== evidence.merkleRoot) {
              return {
                v: 'Invalid Merkle Root ' + evidence.merkleRoot + ': not found in Merkle Path'
              };
            }
          }();

          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }
      }
      return null;
    }
  }, {
    key: '_validateFossil',
    value: function _validateFossil() {
      var _this2 = this;

      var txId = this.segment.meta.evidence.transactions['bitcoin:main'];
      return this._getFossil(txId).then(function (res) {
        var body = JSON.parse(res.xhr.response);
        if (!body.outputs.find(function (output) {
          return output.data_hex === _this2.segment.meta.evidence.merkleRoot;
        })) {
          return 'Merkle root not found in transaction data';
        }
        return null;
      });
    }
  }, {
    key: '_getFossil',
    value: function _getFossil(txId) {
      if (blockCypherCache[txId]) {
        return Promise.resolve(blockCypherCache[txId]);
      }

      var p = new Promise(function (resolve, reject) {
        return httpplease.get('https://api.blockcypher.com/v1/btc/main/txs/' + txId, function (err, res) {
          return err ? reject(err) : resolve(res);
        });
      });
      blockCypherCache[txId] = p;
      return p;
    }
  }]);
  return SegmentValidator;
}();

var ChainValidator = function () {
  function ChainValidator(chainscript) {
    classCallCheck(this, ChainValidator);

    this.chainscript = chainscript;
    this.errors = {
      linkHash: [],
      stateHash: [],
      merklePath: [],
      fossil: []
    };
  }

  createClass(ChainValidator, [{
    key: 'validate',
    value: function validate() {
      var _this = this;

      try {
        return resolveLinks(wrap(parseIfJson(this.chainscript))).then(function (segments) {
          wrap(segments).forEach(function (segment) {
            return new SegmentValidator(segment).validate(_this.errors);
          });
          return _this.errors;
        });
      } catch (err) {
        return Promise.reject(err);
      }
    }
  }]);
  return ChainValidator;
}();

var margin$1 = { top: 10, right: 5, bottom: 20, left: 5 };
var height$1 = 350 - margin$1.top - margin$1.bottom;
var width = 400 - margin$1.left - margin$1.right;

var MerklePathTree = function () {
  function MerklePathTree(element) {
    classCallCheck(this, MerklePathTree);

    this.tree = d3Hierarchy.tree().size([width, height$1]);
    this.svg = d3Selection.select(element).append('svg').attr('width', width + margin$1.right + margin$1.left).attr('height', height$1 + margin$1.top + margin$1.bottom);
    this.innerG = this.svg.append('g').attr('transform', function () {
      return translate(margin$1.top, margin$1.left);
    });
    this.root = null;
  }

  createClass(MerklePathTree, [{
    key: 'display',
    value: function display(merklePath) {
      if (merklePath && merklePath.length) {
        this.root = this._parse(merklePath);
        this._update(this.root.descendants(), this.root.links());
      } else {
        this.root = null;
        this._update([], []);
      }
    }
  }, {
    key: '_parse',
    value: function _parse(merklePath) {
      var nodes = [];

      merklePath.forEach(function (path, index) {
        nodes.push({
          id: path.left + '-' + index,
          name: path.left,
          parentId: path.parent + '-' + (index + 1)
        });
        if (path.right) {
          nodes.push({
            id: path.right + '-' + index,
            name: path.right,
            parentId: path.parent + '-' + (index + 1)
          });
        }
      });

      var root = merklePath[merklePath.length - 1].parent;
      nodes.push({
        id: root + '-' + merklePath.length,
        name: root
      });

      return d3Hierarchy.stratify()(nodes);
    }
  }, {
    key: '_update',
    value: function _update(nodes, links) {
      // Compute the new tree layout.
      if (this.root) {
        this.tree(this.root);
      }

      // Update the nodes…
      var node = this.innerG.selectAll('g.node').data(nodes, function key(d) {
        return d ? d.id : this.id;
      });

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append('g').attr('class', 'node').attr('transform', function (d) {
        return translate(d.y, d.x);
      });

      nodeEnter.append('circle').attr('r', 10);

      nodeEnter.append('text').attr('dx', 0).attr('dy', 5).attr('text-anchor', 'middle').text(function (d) {
        return compactHash(d.data.name);
      });

      nodeEnter.on('mouseover', function go(d) {
        d3Selection.select(this).select('text').text(d.data.name);
      }).on('mouseout', function go(d) {
        d3Selection.select(this).select('text').text(compactHash(d.data.name));
      });

      node.exit().remove();

      // Update the links...
      var link = this.innerG.selectAll('path.link').data(links, function key(d) {
        return d ? d.target.id : this.id;
      });

      // Enter any new links at the parent's previous position.
      link.enter().insert('path', 'g').attr('class', 'link').attr('id', function (d) {
        return d.target.id;
      }).attr('d', function (d) {
        return makeLink({ x: d.source.y, y: d.source.x }, { x: d.target.y, y: d.target.x });
      });

      // Transition exiting nodes to the parent's new position.
      link.exit().remove();
    }
  }]);
  return MerklePathTree;
}();

exports.ChainTreeBuilder = ChainTreeBuilder;
exports.defaultOptions = defaultOptions;
exports.ChainTree = ChainTree;
exports.ChainValidator = ChainValidator;
exports.SegmentValidator = SegmentValidator;
exports.MerklePathTree = MerklePathTree;
exports.compactHash = compactHash;
exports.parseChainscript = parseChainscript;
exports.resolveLinks = resolveLinks;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=mapexplorer-core.js.map
