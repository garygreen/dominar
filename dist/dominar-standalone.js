(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Dominar = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * Sync/Async forEach
 * https://github.com/cowboy/javascript-sync-async-foreach
 *
 * Copyright (c) 2012 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 * http://benalman.com/about/license/
 */

(function(exports) {

  // Iterate synchronously or asynchronously.
  exports.forEach = function(arr, eachFn, doneFn) {
    var i = -1;
    // Resolve array length to a valid (ToUint32) number.
    var len = arr.length >>> 0;

    // This IIFE is called once now, and then again, by name, for each loop
    // iteration.
    (function next(result) {
      // This flag will be set to true if `this.async` is called inside the
      // eachFn` callback.
      var async;
      // Was false returned from the `eachFn` callback or passed to the
      // `this.async` done function?
      var abort = result === false;

      // Increment counter variable and skip any indices that don't exist. This
      // allows sparse arrays to be iterated.
      do { ++i; } while (!(i in arr) && i !== len);

      // Exit if result passed to `this.async` done function or returned from
      // the `eachFn` callback was false, or when done iterating.
      if (abort || i === len) {
        // If a `doneFn` callback was specified, invoke that now. Pass in a
        // boolean value representing "not aborted" state along with the array.
        if (doneFn) {
          doneFn(!abort, arr);
        }
        return;
      }

      // Invoke the `eachFn` callback, setting `this` inside the callback to a
      // custom object that contains one method, and passing in the array item,
      // index, and the array.
      result = eachFn.call({
        // If `this.async` is called inside the `eachFn` callback, set the async
        // flag and return a function that can be used to continue iterating.
        async: function() {
          async = true;
          return next;
        }
      }, arr[i], i, arr);

      // If the async flag wasn't set, continue by calling `next` synchronously,
      // passing in the result of the `eachFn` callback.
      if (!async) {
        next(result);
      }
    }());
  };

}(typeof exports === "object" && exports || this));
},{}],2:[function(require,module,exports){
function AsyncResolvers(onFailedOne, onResolvedAll) {
  this.onResolvedAll = onResolvedAll;
  this.onFailedOne = onFailedOne;
  this.resolvers = {};
  this.resolversCount = 0;
  this.passed = [];
  this.failed = [];
  this.firing = false;
}

AsyncResolvers.prototype = {

  /**
   * Add resolver
   *
   * @param {Rule} rule
   * @return {integer}
   */
  add: function(rule) {
    var index = this.resolversCount;
    this.resolvers[index] = rule;
    this.resolversCount++;
    return index;
  },

  /**
   * Resolve given index
   *
   * @param  {integer} index
   * @return {void}
   */
  resolve: function(index) {
    var rule = this.resolvers[index];
    if (rule.passes === true) {
      this.passed.push(rule);
    } else if (rule.passes === false) {
      this.failed.push(rule);
      this.onFailedOne(rule);
    }

    this.fire();
  },

  /**
   * Determine if all have been resolved
   *
   * @return {boolean}
   */
  isAllResolved: function() {
    return (this.passed.length + this.failed.length) === this.resolversCount;
  },

  /**
   * Attempt to fire final all resolved callback if completed
   *
   * @return {void}
   */
  fire: function() {

    if (!this.firing) {
      return;
    }

    if (this.isAllResolved()) {
      this.onResolvedAll(this.failed.length === 0);
    }

  },

  /**
   * Enable firing
   *
   * @return {void}
   */
  enableFiring: function() {
    this.firing = true;
  }

};

module.exports = AsyncResolvers;

},{}],3:[function(require,module,exports){
var replacements = {

  /**
   * Between replacement (replaces :min and :max)
   *
   * @param  {string} template
   * @param  {Rule} rule
   * @return {string}
   */
  between: function(template, rule) {
    var parameters = rule.getParameters();
    return this._replacePlaceholders(rule, template, {
      min: parameters[0],
      max: parameters[1]
    });
  },

  /**
   * Required_if replacement.
   *
   * @param  {string} template
   * @param  {Rule} rule
   * @return {string}
   */
  required_if: function(template, rule) {
    var parameters = rule.getParameters();
    return this._replacePlaceholders(rule, template, {
      other: parameters[0],
      value: parameters[1]
    });
  }
};

function formatter(attribute) {
  return attribute.replace(/[_\[]/g, ' ').replace(/]/g, '');
}

module.exports = {
  replacements: replacements,
  formatter: formatter
};

},{}],4:[function(require,module,exports){
var Errors = function() {
  this.errors = {};
};

Errors.prototype = {
  constructor: Errors,

  /**
   * Add new error message for given attribute
   *
   * @param  {string} attribute
   * @param  {string} message
   * @return {void}
   */
  add: function(attribute, message) {
    if (!this.has(attribute)) {
      this.errors[attribute] = [];
    }

    if (this.errors[attribute].indexOf(message) === -1) {
      this.errors[attribute].push(message);
    }
  },

  /**
   * Returns an array of error messages for an attribute, or an empty array
   *
   * @param  {string} attribute A key in the data object being validated
   * @return {array} An array of error messages
   */
  get: function(attribute) {
    if (this.has(attribute)) {
      return this.errors[attribute];
    }

    return [];
  },

  /**
   * Returns the first error message for an attribute, false otherwise
   *
   * @param  {string} attribute A key in the data object being validated
   * @return {string|false} First error message or false
   */
  first: function(attribute) {
    if (this.has(attribute)) {
      return this.errors[attribute][0];
    }

    return false;
  },

  /**
   * Get all error messages from all failing attributes
   *
   * @return {Object} Failed attribute names for keys and an array of messages for values
   */
  all: function() {
    return this.errors;
  },

  /**
   * Determine if there are any error messages for an attribute
   *
   * @param  {string}  attribute A key in the data object being validated
   * @return {boolean}
   */
  has: function(attribute) {
    if (this.errors.hasOwnProperty(attribute)) {
      return true;
    }

    return false;
  }
};

module.exports = Errors;

},{}],5:[function(require,module,exports){
var Messages = require('./messages');

require('./lang/en');

var container = {

  messages: {},

  /**
   * Set messages for language
   *
   * @param {string} lang
   * @param {object} rawMessages
   * @return {void}
   */
  _set: function(lang, rawMessages) {
    this.messages[lang] = rawMessages;
  },

  /**
   * Set message for given language's rule.
   *
   * @param {string} lang
   * @param {string} attribute
   * @param {string|object} message
   * @return {void}
   */
  _setRuleMessage: function(lang, attribute, message) {
    this._load(lang);
    if (message === undefined) {
      message = this.messages[lang].def;
    }

    this.messages[lang][attribute] = message;
  },

  /**
   * Load messages (if not already loaded)
   *
   * @param  {string} lang
   * @return {void}
   */
  _load: function(lang) {
    if (!this.messages[lang]) {
      var rawMessages = require('./lang/' + lang);
      this._set(lang, rawMessages);
    }
  },

  /**
   * Get raw messages for language
   *
   * @param  {string} lang
   * @return {object}
   */
  _get: function(lang) {
    this._load(lang);
    return this.messages[lang];
  },

  /**
   * Make messages for given language
   *
   * @param  {string} lang
   * @return {Messages}
   */
  _make: function(lang) {
    this._load(lang);
    return new Messages(lang, this.messages[lang]);
  }

};

module.exports = container;

},{"./lang/en":6,"./messages":7}],6:[function(require,module,exports){
module.exports = {
  accepted: 'The :attribute must be accepted.',
  alpha: 'The :attribute field must contain only alphabetic characters.',
  alpha_dash: 'The :attribute field may only contain alpha-numeric characters, as well as dashes and underscores.',
  alpha_num: 'The :attribute field must be alphanumeric.',
  between: 'The :attribute field must be between :min and :max.',
  confirmed: 'The :attribute confirmation does not match.',
  email: 'The :attribute format is invalid.',
  date: 'The :attribute is not a valid date format',
  def: 'The :attribute attribute has errors.',
  digits: 'The :attribute must be :digits digits.',
  different: 'The :attribute and :different must be different.',
  'in': 'The selected :attribute is invalid.',
  integer: 'The :attribute must be an integer.',
  min: {
    numeric: 'The :attribute must be at least :min.',
    string: 'The :attribute must be at least :min characters.'
  },
  max: {
    numeric: 'The :attribute may not be greater than :max.',
    string: 'The :attribute may not be greater than :max characters.'
  },
  not_in: 'The selected :attribute is invalid.',
  numeric: 'The :attribute must be a number.',
  required: 'The :attribute field is required.',
  required_if: 'The :attribute field is required when :other is :value.',
  same: 'The :attribute and :same fields must match.',
  size: {
    numeric: 'The :attribute must be :size.',
    string: 'The :attribute must be :size characters.'
  },
  string: 'The :attribute must be a string.',
  url: 'The :attribute format is invalid.',
  regex: 'The :attribute format is invalid',
  attributes: {}
};

},{}],7:[function(require,module,exports){
var Attributes = require('./attributes');

var Messages = function(lang, messages) {
  this.lang = lang;
  this.messages = messages;
  this.customMessages = {};
  this.attributeNames = {};
};

Messages.prototype = {
  constructor: Messages,

  /**
   * Set custom messages
   *
   * @param {object} customMessages
   * @return {void}
   */
  _setCustom: function(customMessages) {
    this.customMessages = customMessages || {};
  },

  /**
   * Set custom attribute names.
   *
   * @param {object} attributes
   */
  _setAttributeNames: function(attributes) {
    this.attributeNames = attributes;
  },

  /**
   * Set the attribute formatter.
   *
   * @param {fuction} func
   * @return {void}
   */
  _setAttributeFormatter: function(func) {
    this.attributeFormatter = func;
  },

  /**
   * Get attribute name to display.
   *
   * @param  {string} attribute
   * @return {string}
   */
  _getAttributeName: function(attribute) {
    var name = attribute;
    if (this.attributeNames.hasOwnProperty(attribute)) {
      return this.attributeNames[attribute];
    } else if (this.messages.attributes.hasOwnProperty(attribute)) {
      name = this.messages.attributes[attribute];
    }

    if (this.attributeFormatter) {
      name = this.attributeFormatter(name);
    }

    return name;
  },

  /**
   * Get all messages
   *
   * @return {object}
   */
  all: function() {
    return this.messages;
  },

  /**
   * Render message
   *
   * @param  {Rule} rule
   * @return {string}
   */
  render: function(rule) {
    if (rule.customMessage) {
      return rule.customMessage;
    }
    var template = this._getTemplate(rule);

    var message;
    if (Attributes.replacements[rule.name]) {
      message = Attributes.replacements[rule.name].apply(this, [template, rule]);
    } else {
      message = this._replacePlaceholders(rule, template, {});
    }

    return message;
  },

  /**
   * Get the template to use for given rule
   *
   * @param  {Rule} rule
   * @return {string}
   */
  _getTemplate: function(rule) {

    var messages = this.messages;
    var template = messages.def;
    var customMessages = this.customMessages;
    var formats = [rule.name + '.' + rule.attribute, rule.name];

    for (var i = 0, format; i < formats.length; i++) {
      format = formats[i];
      if (customMessages.hasOwnProperty(format)) {
        template = customMessages[format];
        break;
      } else if (messages.hasOwnProperty(format)) {
        template = messages[format];
        break;
      }
    }

    if (typeof template === 'object') {
      template = template[rule._getValueType()];
    }

    return template;
  },

  /**
   * Replace placeholders in the template using the data object
   *
   * @param  {Rule} rule
   * @param  {string} template
   * @param  {object} data
   * @return {string}
   */
  _replacePlaceholders: function(rule, template, data) {
    var message, attribute;

    data.attribute = this._getAttributeName(rule.attribute);
    data[rule.name] = rule.getParameters().join(',');

    if (typeof template === 'string' && typeof data === 'object') {
      message = template;

      for (attribute in data) {
        message = message.replace(new RegExp(':' + attribute, 'g'), data[attribute]);
      }
    }

    return message;
  }

};

module.exports = Messages;

},{"./attributes":3}],8:[function(require,module,exports){
var rules = {

  required: function(val) {
    var str;

    if (val === undefined || val === null) {
      return false;
    }

    str = String(val).replace(/\s/g, "");
    return str.length > 0 ? true : false;
  },

  required_if: function(val, req, attribute) {
    req = this.getParameters();
    if (this.validator.input[req[0]] === req[1]) {
      return this.validator.getRule('required').validate(val);
    }

    return true;
  },

  // compares the size of strings
  // with numbers, compares the value
  size: function(val, req, attribute) {
    if (val) {
      req = parseFloat(req);

      var size = this.getSize();

      return size === req;
    }

    return true;
  },

  string: function(val, req, attribute) {
    return typeof val === 'string';
  },

  /**
   * Compares the size of strings or the value of numbers if there is a truthy value
   */
  min: function(val, req, attribute) {
    var size = this.getSize();
    return size >= req;
  },

  /**
   * Compares the size of strings or the value of numbers if there is a truthy value
   */
  max: function(val, req, attribute) {
    var size = this.getSize();
    return size <= req;
  },

  between: function(val, req, attribute) {
    req = this.getParameters();
    var size = this.getSize();
    var min = parseFloat(req[0], 10);
    var max = parseFloat(req[1], 10);
    return size >= min && size <= max;
  },

  email: function(val) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(val);
  },

  numeric: function(val) {
    var num;

    num = Number(val); // tries to convert value to a number. useful if value is coming from form element

    if (typeof num === 'number' && !isNaN(num) && typeof val !== 'boolean') {
      return true;
    } else {
      return false;
    }
  },

  array: function(val) {
    return val instanceof Array;
  },

  url: function(url) {
    return (/^https?:\/\/\S+/).test(url);
  },

  alpha: function(val) {
    return (/^[a-zA-Z]+$/).test(val);
  },

  alpha_dash: function(val) {
    return (/^[a-zA-Z0-9_\-]+$/).test(val);
  },

  alpha_num: function(val) {
    return (/^[a-zA-Z0-9]+$/).test(val);
  },

  same: function(val, req) {
    var val1 = this.validator.input[req];
    var val2 = val;

    if (val1 === val2) {
      return true;
    }

    return false;
  },

  different: function(val, req) {
    var val1 = this.validator.input[req];
    var val2 = val;

    if (val1 !== val2) {
      return true;
    }

    return false;
  },

  "in": function(val, req) {
    var list, i;

    if (val) {
      list = req.split(',');
    }

    if (val && !(val instanceof Array)) {
      val = String(val); // if it is a number

      for (i = 0; i < list.length; i++) {
        if (val === list[i]) {
          return true;
        }
      }

      return false;
    }

    if (val && val instanceof Array) {
      for (i = 0; i < val.length; i++) {
        if (list.indexOf(val[i]) < 0) {
          return false;
        }
      }
    }

    return true;
  },

  not_in: function(val, req) {
    var list = req.split(',');
    var len = list.length;
    var returnVal = true;

    val = String(val); // convert val to a string if it is a number

    for (var i = 0; i < len; i++) {
      if (val === list[i]) {
        returnVal = false;
        break;
      }
    }

    return returnVal;
  },

  accepted: function(val) {
    if (val === 'on' || val === 'yes' || val === 1 || val === '1' || val === true) {
      return true;
    }

    return false;
  },

  confirmed: function(val, req, key) {
    var confirmedKey = key + '_confirmation';

    if (this.validator.input[confirmedKey] === val) {
      return true;
    }

    return false;
  },

  integer: function(val) {
    return String(parseInt(val, 10)) === String(val);
  },

  digits: function(val, req) {
    var numericRule = this.validator.getRule('numeric');
    if (numericRule.validate(val) && String(val).length === parseInt(req)) {
      return true;
    }

    return false;
  },

  regex: function(val, req) {
    var mod = /[g|i|m]{1,3}$/;
    var flag = req.match(mod);
    flag = flag ? flag[0] : "";
    req = req.replace(mod, "").slice(1, -1);
    req = new RegExp(req, flag);
    return !!val.match(req);
  },

  date: function(val) {
    var valid = (new Date(val).toString()) !== 'Invalid Date';
    if (typeof val === 'number') {
      return val.toString().length === 12 && valid;
    }
    return valid;
  }

};

function Rule(name, fn, async) {
  this.name = name;
  this.fn = fn;
  this.passes = null;
  this.customMessage = undefined;
  this.async = async;
}

Rule.prototype = {

  /**
   * Validate rule
   *
   * @param  {mixed} inputValue
   * @param  {mixed} ruleValue
   * @param  {string} attribute
   * @param  {function} callback
   * @return {boolean|undefined}
   */
  validate: function(inputValue, ruleValue, attribute, callback) {
    var _this = this;
    this._setValidatingData(attribute, inputValue, ruleValue);
    if (typeof callback === 'function') {
      this.callback = callback;
      var handleResponse = function(passes, message) {
        _this.response(passes, message);
      };

      if (this.async) {
        return this.fn.apply(this, [inputValue, ruleValue, attribute, handleResponse]);
      } else {
        return handleResponse(this.fn.apply(this, [inputValue, ruleValue, attribute]));
      }
    }
    return this.fn.apply(this, [inputValue, ruleValue, attribute]);
  },

  /**
   * Set validating data
   *
   * @param {string} attribute
   * @param {mixed} inputValue
   * @param {mixed} ruleValue
   * @return {void}
   */
  _setValidatingData: function(attribute, inputValue, ruleValue) {
    this.attribute = attribute;
    this.inputValue = inputValue;
    this.ruleValue = ruleValue;
  },

  /**
   * Get parameters
   *
   * @return {array}
   */
  getParameters: function() {
    return this.ruleValue ? this.ruleValue.split(',') : [];
  },

  /**
   * Get true size of value
   *
   * @return {integer|float}
   */
  getSize: function() {
    var value = this.inputValue;

    if (value instanceof Array) {
      return value.length;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (this.validator._hasNumericRule(this.attribute)) {
      return parseFloat(value, 10);
    }

    return value.length;
  },

  /**
   * Get the type of value being checked; numeric or string.
   *
   * @return {string}
   */
  _getValueType: function() {

    if (typeof this.inputValue === 'number' || this.validator._hasNumericRule(this.attribute)) {
      return 'numeric';
    }

    return 'string';
  },

  /**
   * Set the async callback response
   *
   * @param  {boolean|undefined} passes  Whether validation passed
   * @param  {string|undefined} message Custom error message
   * @return {void}
   */
  response: function(passes, message) {
    this.passes = (passes === undefined || passes === true);
    this.customMessage = message;
    this.callback(this.passes, message);
  },

  /**
   * Set validator instance
   *
   * @param {Validator} validator
   * @return {void}
   */
  setValidator: function(validator) {
    this.validator = validator;
  }

};

var manager = {

  /**
   * List of async rule names
   *
   * @type {Array}
   */
  asyncRules: [],

  /**
   * Implicit rules (rules to always validate)
   *
   * @type {Array}
   */
  implicitRules: ['required', 'required_if', 'accepted'],

  /**
   * Get rule by name
   *
   * @param  {string} name
   * @param {Validator}
   * @return {Rule}
   */
  make: function(name, validator) {
    var async = this.isAsync(name);
    var rule = new Rule(name, rules[name], async);
    rule.setValidator(validator);
    return rule;
  },

  /**
   * Determine if given rule is async
   *
   * @param  {string}  name
   * @return {boolean}
   */
  isAsync: function(name) {
    for (var i = 0, len = this.asyncRules.length; i < len; i++) {
      if (this.asyncRules[i] === name) {
        return true;
      }
    }
    return false;
  },

  /**
   * Determine if rule is implicit (should always validate)
   *
   * @param {string} name
   * @return {boolean}
   */
  isImplicit: function(name) {
    return this.implicitRules.indexOf(name) > -1;
  },

  /**
   * Register new rule
   *
   * @param  {string}   name
   * @param  {function} fn
   * @return {void}
   */
  register: function(name, fn) {
    rules[name] = fn;
  },

  /**
   * Register async rule
   *
   * @param  {string}   name
   * @param  {function} fn
   * @return {void}
   */
  registerAsync: function(name, fn) {
    this.register(name, fn);
    this.asyncRules.push(name);
  }

};


module.exports = manager;

},{}],9:[function(require,module,exports){
var Rules = require('./rules');
var Lang = require('./lang');
var Errors = require('./errors');
var Attributes = require('./attributes');
var AsyncResolvers = require('./async');

var Validator = function(input, rules, customMessages) {
  var lang = Validator.getDefaultLang();
  this.input = input;

  this.messages = Lang._make(lang);
  this.messages._setCustom(customMessages);
  this.setAttributeFormatter(Validator.prototype.attributeFormatter);

  this.errors = new Errors();
  this.errorCount = 0;

  this.hasAsync = false;
  this.rules = this._parseRules(rules);
};

Validator.prototype = {

  constructor: Validator,

  /**
   * Default language
   *
   * @type {string}
   */
  lang: 'en',

  /**
   * Numeric based rules
   *
   * @type {array}
   */
  numericRules: ['integer', 'numeric'],

  /**
   * Attribute formatter.
   *
   * @type {function}
   */
  attributeFormatter: Attributes.formatter,

  /**
   * Run validator
   *
   * @return {boolean} Whether it passes; true = passes, false = fails
   */
  check: function() {
    var self = this;

    for (var attribute in this.rules) {
      var attributeRules = this.rules[attribute];
      var inputValue = this._objectPath(this.input, attribute);

      for (var i = 0, len = attributeRules.length, rule, ruleOptions, rulePassed; i < len; i++) {
        ruleOptions = attributeRules[i];
        rule = this.getRule(ruleOptions.name);

        if (!this._isValidatable(rule, inputValue)) {
          continue;
        }

        rulePassed = rule.validate(inputValue, ruleOptions.value, attribute);
        if (!rulePassed) {
          this._addFailure(rule);
        }

        if (this._shouldStopValidating(attribute, rulePassed)) {
          break;
        }
      }
    }

    return this.errorCount === 0;
  },

  /**
   * Run async validator
   *
   * @param {function} passes
   * @param {function} fails
   * @return {void}
   */
  checkAsync: function(passes, fails) {
    var _this = this;
    passes = passes || function() {};
    fails = fails || function() {};

    var failsOne = function(rule, message) {
      _this._addFailure(rule, message);
    };

    var resolvedAll = function(allPassed) {
      if (allPassed) {
        passes();
      } else {
        fails();
      }
    };

    var asyncResolvers = new AsyncResolvers(failsOne, resolvedAll);

    var validateRule = function(inputValue, ruleOptions, attribute, rule) {
      return function() {
        var resolverIndex = asyncResolvers.add(rule);
        rule.validate(inputValue, ruleOptions.value, attribute, function() {
          asyncResolvers.resolve(resolverIndex);
        });
      };
    };

    for (var attribute in this.rules) {
      var attributeRules = this.rules[attribute];
      var inputValue = this._objectPath(this.input, attribute);

      for (var i = 0, len = attributeRules.length, rule, ruleOptions; i < len; i++) {
        ruleOptions = attributeRules[i];

        rule = this.getRule(ruleOptions.name);

        if (!this._isValidatable(rule, inputValue)) {
          continue;
        }

        validateRule(inputValue, ruleOptions, attribute, rule)();
      }
    }

    asyncResolvers.enableFiring();
    asyncResolvers.fire();
  },

  /**
   * Add failure and error message for given rule
   *
   * @param {Rule} rule
   */
  _addFailure: function(rule) {
    var msg = this.messages.render(rule);
    this.errors.add(rule.attribute, msg);
    this.errorCount++;
  },

  /**
   * Flatten nested object, normalizing { foo: { bar: 1 } } into: { 'foo.bar': 1 }
   *
   * @param  {object} nested object
   * @return {object} flattened object
   */
  _flattenObject: function (obj) {
    var flattened = {};
    function recurse (current, property) {
      if (!property && Object.getOwnPropertyNames(current).length === 0) {
        return;
      }
      if (Object(current) !== current || Array.isArray(current)) {
        flattened[property] = current;
      } else {
        var isEmpty = true;
        for (var p in current) {
          isEmpty = false;
          recurse(current[p], property ? property + "." + p : p);
        }
        if (isEmpty) {
          flattened[property] = {};
        }
      }
    }
    if (obj) {
      recurse(obj);
    }
    return flattened;
  },

  /**
   * Extract value from nested object using string path with dot notation
   *
   * @param  {object} object to search in
   * @param  {string} path inside object
   * @return {any|void} value under the path
   */
  _objectPath: function (obj, path) {
    if (Object.prototype.hasOwnProperty.call(obj, path)) {
      return obj[path];
    }
    
    var keys = path.replace(/\[(\w+)\]/g, ".$1").replace(/^\./, "").split(".");
    var copy = obj.constructor();

    for (var attr in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, attr)) {
        copy[attr] = obj[attr];
      }
    }

    for (var i = 0, l = keys.length; i < l; i++) {
      if (Object.hasOwnProperty.call(copy, keys[i])) {
        copy = copy[keys[i]];
      } else {
        return;
      }
    }
    return copy;
  },

  /**
   * Parse rules, normalizing format into: { attribute: [{ name: 'age', value: 3 }] }
   *
   * @param  {object} rules
   * @return {object}
   */
  _parseRules: function(rules) {
    var parsedRules = {};
    rules = this._flattenObject(rules);
    for (var attribute in rules) {
      var rulesArray = rules[attribute];
      var attributeRules = [];

      if (typeof rulesArray === 'string') {
        rulesArray = rulesArray.split('|');
      }

      for (var i = 0, len = rulesArray.length, rule; i < len; i++) {
        rule = this._extractRuleAndRuleValue(rulesArray[i]);
        if (Rules.isAsync(rule.name)) {
          this.hasAsync = true;
        }
        attributeRules.push(rule);
      }

      parsedRules[attribute] = attributeRules;
    }
    return parsedRules;
  },

  /**
   * Extract a rule and a value from a ruleString (i.e. min:3), rule = min, value = 3
   *
   * @param  {string} ruleString min:3
   * @return {object} object containing the name of the rule and value
   */
  _extractRuleAndRuleValue: function(ruleString) {
    var rule = {},
      ruleArray;

    rule.name = ruleString;

    if (ruleString.indexOf(':') >= 0) {
      ruleArray = ruleString.split(':');
      rule.name = ruleArray[0];
      rule.value = ruleArray.slice(1).join(":");
    }

    return rule;
  },

  /**
   * Determine if attribute has any of the given rules
   *
   * @param  {string}  attribute
   * @param  {array}   findRules
   * @return {boolean}
   */
  _hasRule: function(attribute, findRules) {
    var rules = this.rules[attribute] || [];
    for (var i = 0, len = rules.length; i < len; i++) {
      if (findRules.indexOf(rules[i].name) > -1) {
        return true;
      }
    }
    return false;
  },

  /**
   * Determine if attribute has any numeric-based rules.
   *
   * @param  {string}  attribute
   * @return {Boolean}
   */
  _hasNumericRule: function(attribute) {
    return this._hasRule(attribute, this.numericRules);
  },

  /**
   * Determine if rule is validatable
   *
   * @param  {Rule}   rule
   * @param  {mixed}  value
   * @return {boolean}
   */
  _isValidatable: function(rule, value) {
    if (Rules.isImplicit(rule.name)) {
      return true;
    }

    return this.getRule('required').validate(value);
  },


  /**
   * Determine if we should stop validating.
   *
   * @param  {string} attribute
   * @param  {boolean} rulePassed
   * @return {boolean}
   */
  _shouldStopValidating: function(attribute, rulePassed) {

    var stopOnAttributes = this.stopOnAttributes;
    if (stopOnAttributes === false || rulePassed === true) {
      return false;
    }

    if (stopOnAttributes instanceof Array) {
      return stopOnAttributes.indexOf(attribute) > -1;
    }

    return true;
  },

  /**
   * Set custom attribute names.
   *
   * @param {object} attributes
   * @return {void}
   */
  setAttributeNames: function(attributes) {
    this.messages._setAttributeNames(attributes);
  },

  /**
   * Set the attribute formatter.
   *
   * @param {fuction} func
   * @return {void}
   */
  setAttributeFormatter: function(func) {
    this.messages._setAttributeFormatter(func);
  },

  /**
   * Get validation rule
   *
   * @param  {string} name
   * @return {Rule}
   */
  getRule: function(name) {
    return Rules.make(name, this);
  },

  /**
   * Stop on first error.
   *
   * @param  {boolean|array} An array of attributes or boolean true/false for all attributes.
   * @return {void}
   */
  stopOnError: function(attributes) {
    this.stopOnAttributes = attributes;
  },

  /**
   * Determine if validation passes
   *
   * @param {function} passes
   * @return {boolean|undefined}
   */
  passes: function(passes) {
    var async = this._checkAsync('passes', passes);
    if (async) {
      return this.checkAsync(passes);
    }
    return this.check();
  },

  /**
   * Determine if validation fails
   *
   * @param {function} fails
   * @return {boolean|undefined}
   */
  fails: function(fails) {
    var async = this._checkAsync('fails', fails);
    if (async) {
      return this.checkAsync(function() {}, fails);
    }
    return !this.check();
  },

  /**
   * Check if validation should be called asynchronously
   *
   * @param  {string}   funcName Name of the caller
   * @param  {function} callback
   * @return {boolean}
   */
  _checkAsync: function(funcName, callback) {
    var hasCallback = typeof callback === 'function';
    if (this.hasAsync && !hasCallback) {
      throw funcName + ' expects a callback when async rules are being tested.';
    }

    return this.hasAsync || hasCallback;
  }

};

/**
 * Set messages for language
 *
 * @param {string} lang
 * @param {object} messages
 * @return {this}
 */
Validator.setMessages = function(lang, messages) {
  Lang._set(lang, messages);
  return this;
};

/**
 * Get messages for given language
 *
 * @param  {string} lang
 * @return {Messages}
 */
Validator.getMessages = function(lang) {
  return Lang._get(lang);
};

/**
 * Set default language to use
 *
 * @param {string} lang
 * @return {void}
 */
Validator.useLang = function(lang) {
  this.prototype.lang = lang;
};

/**
 * Get default language
 *
 * @return {string}
 */
Validator.getDefaultLang = function() {
  return this.prototype.lang;
};

/**
 * Set the attribute formatter.
 *
 * @param {fuction} func
 * @return {void}
 */
Validator.setAttributeFormatter = function(func) {
  this.prototype.attributeFormatter = func;
};

/**
 * Stop on first error.
 *
 * @param  {boolean|array} An array of attributes or boolean true/false for all attributes.
 * @return {void}
 */
Validator.stopOnError = function(attributes) {
  this.prototype.stopOnAttributes = attributes;
};

/**
 * Register custom validation rule
 *
 * @param  {string}   name
 * @param  {function} fn
 * @param  {string}   message
 * @return {void}
 */
Validator.register = function(name, fn, message) {
  var lang = Validator.getDefaultLang();
  Rules.register(name, fn);
  Lang._setRuleMessage(lang, name, message);
};

/**
 * Register asynchronous validation rule
 *
 * @param  {string}   name
 * @param  {function} fn
 * @param  {string}   message
 * @return {void}
 */
Validator.registerAsync = function(name, fn, message) {
  var lang = Validator.getDefaultLang();
  Rules.registerAsync(name, fn);
  Lang._setRuleMessage(lang, name, message);
};

module.exports = Validator;

},{"./async":2,"./attributes":3,"./errors":4,"./lang":5,"./rules":8}],10:[function(require,module,exports){
/*
 *  Copyright 2015 Gary Green.
 *  Licensed under the Apache License, Version 2.0.
 */

var Validator = require('validatorjs');
var Utils = require('./utils');

function DominarField(name, fields, options, dominar) {
	this.name = name;
	this.options = options;
	this.fields = fields;
	this.container = Utils.element(this.fields[0]).closest(this.options.container);
	this.dominar = dominar;
	if (this.options.message) {
		this.message = this._getMessageElement();
	}
	if (this.options.feedback) {
		this.feedback = this._getFeedbackElement();
	}
};

DominarField.prototype = {

	/**
	 * Validate field
	 *
	 * @param {function} passes
	 * @param {function} fails
	 * @return {void}
	 */
	validate: function(passes, fails) {

		var value = this.getValue();
		var field = this;
		passes = passes || Utils.noop;
		fails = fails || Utils.noop;
		if (this.validator)
		{
			delete this.validator;
		}
		var validator = this.validator = this.getValidator();

		field.validatedValue = undefined;

		var passesHandler = function() {
			field.showSuccess();
			field.validatedValue = value;
			passes();
		};

		var failsHandler = function() {
			field.showError(validator.errors.first(field.name));
			fails(validator.errors.first(field.name));
		};

		if (validator.hasAsync) {
			return validator.checkAsync(passesHandler, failsHandler);
		}
		
		if (validator.passes()) {
			passesHandler();
		}
		else
		{
			failsHandler();
		}
		
	},

	/**
	 * Validate field with delay (if applicable)
	 *
	 * @param {function} passes
	 * @param {function} fails
	 * @return {void}
	 */
	validateDelayed: function(passes, fails) {

		var field = this;
		var delay = this.options.delay;
		passes = passes || Utils.noop;
		fails = fails || Utils.noop;
		clearTimeout(this.delayTimer);
		if (delay)
		{
			this.delayTimer = setTimeout(function() { field.validate.apply(field, [passes, fails]) }, delay);
		}
		else
		{
			this.validate(passes, fails);
		}
	},

	/**
	 * Fire validating from an event
	 *
	 * @param  {jQuery event} event
	 * @return {void}
	 */
	_fireValidate: function(event) {
		var trigger = this._getTrigger(event);

		if (trigger.validate)
		{
			if (trigger.delay) this.validateDelayed();
			else this.validate();
		}
	},

	/**
	 * Get validation options (data, rules, customMessages, customAttributes)
	 *
	 * @return {object}
	 */
	getValidationOptions: function() {
		var data = {};
		var rules = {};

		data[this.name] = this.getValue();
		rules[this.name] = this.getRules();

		if (rules[this.name].length === 0) delete rules[this.name];

		var includeValues = this._getIncludeValues();

		if (includeValues.length)
		{
			data = Utils.extend(data, this.dominar._getFieldValues(includeValues));
		}

		var options = {
			data: data,
			rules: rules,
			customMessages: this.options.customMessages,
			customAttributes: this.options.customAttributes
		};

		if (this.options.validatorOptions)
		{
			options = this.options.validatorOptions.call(this, options);
		}

		return options;
	},

	/**
	 * Get the additional attributes values to include when validating.
	 *
	 * @return {array}
	 */
	_getIncludeValues: function() {
		var includeValues = this.options.includeValues || [];

		if (this._hasRule('confirmed'))
		{
			var confirmedField = this.name + '_confirmation';
			if (includeValues.indexOf(confirmedField) === -1) {
				includeValues.push(confirmedField);
			}
		}

		var sameRuleOptions = this._getRuleOptions('same');
		
		if (sameRuleOptions) {
			includeValues.push(sameRuleOptions.options[0]);
		}

		return includeValues;
	},

	/**
	 * Get validator instance
	 *
	 * @return {Validator}
	 */
	getValidator: function() {
		var options = this.getValidationOptions();
		var validator = new Validator(options.data, options.rules, options.customMessages);

		if (options.customAttributes) {
			validator.setAttributeNames(options.customAttributes);
		}

		return validator;
	},

	/**
	 * Get validation rules
	 *
	 * @return {object}
	 */
	getRules: function() {
		return this.options.rules;
	},

	/**
	 * Determine if field has given validation rule.
	 *
	 * @param  {string}  rule
	 * @return {boolean}
	 */
	_hasRule: function(rule) {
		var ruleOptions = this._getRuleOptions(rule);

		return ruleOptions ? true : false;
	},

	/**
	 * Get options for the rule.
	 *
	 * @param  {string} rule
	 * @return {object|undefined}
	 */
	_getRuleOptions: function(rule) {
		var rules = this.options.rules;
		if (typeof rules === 'string') {
			rules = rules.split('|');
		}
		var reg = new RegExp('^' + rule + '(?:$|:(.*))', 'i');
		for (var i = 0, len = rules.length, matches; i < len; i++) {
			matches = reg.exec(rules[i]);
			if (matches) {
				var retObj = {
					name: rule,
					options: matches[1] === undefined ? undefined : matches[1].split(',')
				};

				return retObj;
			}
		}
	},

	/**
	 * Get value of field
	 *
	 * @return {mixed}
	 */
	getValue: function() {
		return Utils.elementValues(this.fields);
	},

	/**
	 * Get the last validated value.
	 *
	 * @return {mixed}
	 */
	getValidatedValue: function() {
		return this.validatedValue;
	},

	/**
	 * Get trigger options from given jQuery event
	 *
	 * @param  {Event} jquery event
	 * @return {object}
	 */
	_getTrigger: function(event) {
		var eventType = event.type;
		var isKeyup = eventType == 'keyup';
		
		// Determine if validation can be triggered by this event (change, keyup etc)
		var trigger = this.options.triggers.indexOf(eventType) > -1;

		// Determine if we should validate with a delay
		var delay = this.options.delayTriggers.indexOf(eventType) > -1;

		// Determine if validation should occur
		var validate = ((isKeyup && event.keyCode !== 9) || !isKeyup) && trigger;

		return {
			validate: validate,
			delay: delay
		};
	},

	/**
	 * Get message element
	 *
	 * @return {Node}
	 */
	_getMessageElement: function() {
		var message = this.container.getElementsByClassName('help-block');
		if (message.length)
		{
			return message[0];
		}

		message = Utils.element('span').addClass('help-block');
		this.container.appendChild(message.get());
		return message.get();
	},

	/**
	 * Get feedback element
	 *
	 * @return {Node}
	 */
	_getFeedbackElement: function() {
		var feedback = this.container.getElementsByClassName('form-control-feedback');
		if (feedback.length)
		{
			return feedback[0];
		}

		feedback = Utils.element('span').addClass('form-control-feedback');
		this.container.appendChild(feedback.get());
		return feedback.get();
	},

	/**
	 * Determine if given feedback type should be shown.
	 *
	 * @param  {string} type Type; error, success.
	 * @return {boolean}
	 */
	_showFeedbackType: function(type) {
		var feedback = this.options.feedback;
		if (feedback instanceof Array)
		{
			return feedback.indexOf(type) > -1;
		}

		return feedback;
	},

	/**
	 * Show the given type.
	 *
	 * @param  {string} type    Type to show; success, error.
	 * @param  {string} message Message to show.
	 * @return {void}
	 */
	_show: function(type, message) {
		this.reset();
		Utils.element(this.container).addClass('has-' + type);
		if (this.options.message) this.message.innerHTML = message || '';
		if (this._showFeedbackType(type)) this.showFeedback(type);
	},

	/**
	 * Show the given error message.
	 *
	 * @param  {string|undefined} message
	 * @return {void}
	 */
	showError: function(message) {
		this._show('error', message);
	},

	/**
	 * Show the given success message.
	 *
	 * @param  {string|undefined} message
	 * @return {void}
	 */
	showSuccess: function(message) {
		this._show('success', message);
	},

	/**
	 * Show feedback of given type.
	 *
	 * @param  {string} type Type; 'success' or 'error'
	 * @return {void}
	 */
	showFeedback: function(type) {
		Utils.element(this.container).addClass('has-feedback');
		this.feedback.innerHTML = this.options.feedbackIcons[type];
	},

	/**
	 * Reset any errors/success messages.
	 *
	 * @return {void}
	 */
	reset: function() {
		Utils.element(this.container).removeClass('has-error has-success has-feedback');
		
		if (this.message) {
			this.message.innerHTML = '';
		}

		if (this.feedback) {
			this.feedback.innerHTML = '';
		}
	}

};

module.exports = DominarField;

},{"./utils":12,"validatorjs":9}],11:[function(require,module,exports){
(function (global){
/*!
 *  Copyright 2015 Gary Green. Licensed under the Apache License, Version 2.0.
 */
/*
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var Validator = require('validatorjs');
var DominarField = require('./dominar-field');
var forEach = require('async-foreach').forEach;
var Utils = require('./utils');

function Dominar(form, options, config) {
	this.form = form;
	this.options = options || {};
	this.config = Utils.extend(this.configDefaults, config);
	this.fields = {};
	this._bindEvents();
}

Dominar.prototype = {

	defaults: {
		container: '.form-group',
		delay: 300,
		delayTriggers: ['keyup'],
		rules: '',
		triggers: ['keyup', 'focusout', 'change'],
		message: true,
		customMessages: {},
		customAttributes: {},
		feedback: true,
		feedbackIcons: {
			success: '<i class="glyphicon glyphicon-check"></i>',
			error: '<i class="glyphicon glyphicon-remove"></i>'
		}
	},

	configDefaults: {
		validateOnSubmit: true,
		triggers: ['keyup', 'focusout', 'change']
	},

	eventHandlers: {},

	/**
	 * Bind events
	 *
	 * @return {void}
	 */
	_bindEvents: function() {
		var dominar = this;
		for (var i = 0, len = this.config.triggers.length, trigger; i < len; i++) {
			trigger = this.config.triggers[i];
			this.form.addEventListener(trigger, this.eventHandlers[trigger] = function(event) {
				dominar._fireValidate.call(dominar, event);
			});
		}
		this.form.addEventListener('submit', this.eventHandlers.submit = function(event) {
			dominar._fireSubmit.call(dominar, event);
		});
	},

	/**
	 * Unbind events.
	 *
	 * @return {void}
	 */
	_unbindEvents: function() {
		for (var eventType in this.eventHandlers) {
			this.form.removeEventListener(eventType, this.eventHandlers[eventType]);
		}
	},

	/**
	 * Get existing or new dominar field for element
	 *
	 * @param  {string|Node} element
	 * @return {DominarField|undefined}
	 */
	getField: function(element) {
		
		if (typeof element === 'string') {
			element = this.$('[name="' + element + '"]');

			if (!element.length) {
				return;
			}
		}
		else
		{
			element = [element];
		}

		var name = element[0].name;
		var field = this.fields[name];
		if (field)
		{
			return field;
		}

		if (this.options[name])
		{
			field = new DominarField(name, element, this._getOptions(name), this);
			this.fields[name] = field;
			this._trigger('InitField', { dominarField: field });
		}
		return field;
	},

	/**
	 * Get field values for given field names.
	 *
	 * @param  {array} names
	 * @return {object}
	 */
	_getFieldValues: function(names) {
		var values = {};
		for (var i = 0, len = names.length, name; i < len; i++) {
			name = names[i];
			values[name] = Utils.elementValues(this.$('[name="' + name + '"]'));
		}
		return values;
	},

	/**
	 * Get options for given name
	 *
	 * @param  {string} name
	 * @return {object}
	 */
	_getOptions: function(name) {
		var options = this.options[name];
		return Utils.extend(this.defaults, options);
	},

	/**
	 * Find elements within the context of the form.
	 *
	 * @param  {string} selector
	 * @return {Array}
	 */
	$: function(selector) {
		return Utils.$(selector, this.form);
	},

	/**
	 * Add elements with given options
	 *
	 * @param {Array} elements
	 * @param {object} options
	 */
	add: function(elements, options) {
		var dominar = this;
		for (var i = 0, len = elements.length; i < len; i++)
		{
			dominar.options[elements[i].name] = options;
		}
		return this;
	},

	/**
	 * Trigger event
	 *
	 * @param  {string} name
	 * @param  {object} data
	 * @param  {function} callback
	 * @return {Event}
	 */
	_trigger: function(name, data, callback) {
		var eventName = 'dominar' + name;
		var data = data || {};
		data.dominar = this;
		var event = document.createEvent('CustomEvent');
		event.initCustomEvent(eventName, true, true, data);
		this.form.dispatchEvent(event);

		if (callback && !event.defaultPrevented)
		{
			callback();
		}

		return event;
	},

	/**
	 * Fire validation from an event
	 *
	 * @param  {jquery event} event
	 * @return {void}
	 */
	_fireValidate: function(event) {
		var tag = event.target.tagName.toLowerCase();
		if (['input', 'select', 'textarea'].indexOf(tag) === -1)
		{
			return;
		}

		var field = this.getField(event.target.name);
		if (field)
		{
			field._fireValidate(event);
		}
	},

	/**
	 * Fired submit event
	 *
	 * @param  {Event} event
	 * @return {void}
	 */
	_fireSubmit: function(event) {
		var dominar = this;
		if (dominar.config.validateOnSubmit)
		{
			event.preventDefault();
			var submitPassed = function() { event.target.submit(); };
			var submitFailed = function() { dominar._trigger('SubmitFailed'); };
			var submit = function() {
				dominar.validateAll(function() {
					dominar._trigger('SubmitPassed', {}, submitPassed);
				}, function() {
					dominar._trigger('SubmitFailed', {}, submitFailed);
				});
			};
			dominar._trigger('Submit', {}, submit);
		}
	},

	/**
	 * Validate
	 *
	 * @param  {string|Node} element
	 * @param  {function} passes
	 * @param  {function} fails
	 * @return {void}
	 */
	validate: function(element, passes, fails) {
		var field = this.getField(element);
		if (field) field.validate(passes, fails);
	},

	/**
	 * Validate with delay
	 *
	 * @param  {string|Node} element
	 * @param  {function} passes
	 * @param  {function} fails
	 * @return {void}
	 */
	validateDelayed: function(element, passes, fails) {
		var field = this.getField(element);
		if (field) field.validateDelayed(passes, fails);
	},

	/**
	 * Validate all elements
	 *
	 * @param  {function} passes
	 * @param  {function} fails
	 * @return {void}
	 */
	validateAll: function(passes, fails) {
		passes = passes || Utils.noop;
		fails = fails || Utils.noop;

		var dominar = this;
		var fields = Object.keys(this.options);
		var passedCount = 0;
		forEach(fields, function(item) {
			var done = this.async();
			var field = dominar.getField(item);
			field.validate(function() {
				passedCount++;
				done();
			}, done);
		}, function(success) {
			if (passedCount === fields.length) passes();
			else fails();
		});
	},

	/**
	 * Destroy dominar.
	 *
	 * @return {void}
	 */
	destroy: function() {
		this._unbindEvents();
		for (var i in this.fields)
		{
			this.fields[i].reset();
		}
		this.fields = {};
	}

};

Dominar.Validator = Validator;

global.Dominar = Dominar;
module.exports = Dominar;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./dominar-field":10,"./utils":12,"async-foreach":1,"validatorjs":9}],12:[function(require,module,exports){
/**
 * Query selector shortcut.
 *
 * @param  {string|Array} selector
 * @param  {Node} context
 * @return {Array|null}
 */
function $(selector, context) {
	if (selector instanceof Array) {
		return selector;
	}

	return Array.prototype.slice.call(context.querySelectorAll(selector));
}

/**
 * No operation function.
 *
 * @return {void}
 */
function noop()
{

}

/**
 * Super basic extend obj2 into obj1, overwriting obj1 on clashing keys.
 *
 * @param  {object} obj1
 * @param  {object} obj2
 * @return {object}
 */
function extend(obj1, obj2)
{
	var obj = {};
	for (var i in obj1) {
		obj[i] = obj1[i];
	}
	for (var i in obj2) {
		obj[i] = obj2[i];
	}
	return obj;
}

/**
 * Get matches selector.
 *
 * @param  {Node} elem
 * @return {function}
 */
function matchesSelector(elem) {
	return elem.matches || elem.webkitMatchesSelector || elem.mozMatchesSelector || elem.msMatchesSelector;
}

/**
 * Get field's values from given set of elements.
 *
 * @param  {array} fields
 * @return {mixed}
 */
function elementValues(fields)
{
	var type = fields[0].type;
	if (type == 'radio' || type == 'checkbox')
	{
		for (var i = 0, len = fields.length, field, values = []; i < len; i++) {
			field = fields[i];
			if (field.checked)
			{
				values.push(field.value);
			}
		}

		if (type == 'radio')
		{
			return values.shift();
		}

		return values;
	}
	return fields[0].value;
}

/**
 * Element wrapper.
 *
 * @param {Node|string} element
 */
function Element(element)
{
	if (typeof element === 'string') {
		element = document.createElement(element);
	}
	this.element = element;
}

Element.prototype = {

	/**
	 * Determine if element has the given class.
	 *
	 * @param  {string}  className
	 * @return {Boolean}
	 */
	hasClass: function(className) {
		var matchSelector = matchesSelector(this.element);
		return matchSelector.call(this.element, '.' + className);
	},

	/**
	 * Add classes.
	 *
	 * @param {string} className
	 * @return {this}
	 */
	addClass: function(className) {
		var elementClasses = this.element.className;
		if (!this.hasClass(className)) {
			this.element.className += (elementClasses.length ? ' ' : '') + className;
		}
		return this;
	},

	/**
	 * Remove classes.
	 *
	 * @param  {string} className
	 * @return {this}
	 */
	removeClass: function(className) {
		var classNames = className.split(' ');
		var elementClasses = this.element.className;
		for (var i = 0, len = classNames.length; i < len; i++) {
			className = classNames[i];
			if (this.hasClass(className)) {
				elementClasses = elementClasses.replace(new RegExp("(^|\\s)" + className + "(\\s|$)"), " ").replace(/\s$/, "");
			}
		}

		this.element.className = elementClasses;
		return this;
	},

	/**
	 * Find element.
	 *
	 * @param  {string} selector
	 * @return {Array}
	 */
	find: function(selector) {
		return $(selector, this.element);
	},

	/**
	 * Find closest ancestor.
	 *
	 * @param  {string} selector
	 * @return {Node}
	 */
	closest: function(selector) {
		var firstChar = selector.charAt(0);
		var elem = this.element.parentElement;
		var matchSelector = matchesSelector(elem);

		// Get closest match
		while (elem) {

			// If selector is a class
			if (matchSelector.call(elem, selector)) {
				return elem;
			}

			elem = elem.parentElement;
		}
		

		return null;
	},

	/**
	 * Get raw node.
	 *
	 * @return {Node}
	 */
	get: function() {
		return this.element;
	}
};


module.exports = {
	$: $,
	element: function(element) { return new Element(element); },
	noop: noop,
	extend: extend,
	elementValues: elementValues
};

},{}]},{},[11])(11)
});