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

},{"./utils":4,"validatorjs":"validatorjs"}],3:[function(require,module,exports){
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
},{"./dominar-field":2,"./utils":4,"async-foreach":1,"validatorjs":"validatorjs"}],4:[function(require,module,exports){
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

},{}]},{},[3])(3)
});