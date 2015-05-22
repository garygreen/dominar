/* dominar.js - Copyright 2015 Gary Green. Licensed under the Apache License, Version 2.0 *//*! validatorjs - v1.3.2 - https://github.com/skaterdav85/validatorjs - 2015-02-11 */
(function() {

var messages = {
	accepted: 'The :attribute must be accepted.',
	alpha: 'The :attribute field must contain only alphabetic characters.',
	alpha_dash: 'The :attribute field may only contain alpha-numeric characters, as well as dashes and underscores.',
	alpha_num: 'The :attribute field must be alphanumeric.',
	confirmed: 'The :attribute confirmation does not match.',
	email: 'The :attribute format is invalid.',
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
		numeric: 'The :attribute must be less than :max.',
		string: 'The :attribute must be less than :max characters.'
	},
	not_in: 'The selected :attribute is invalid.',
	numeric: 'The :attribute must be a number.',
	required: 'The :attribute field is required.',
	same: 'The :attribute and :same fields must match.',
	size: {
		numeric: 'The :attribute must be :size.',
		string: 'The :attribute must be :size characters.'
	},
	url: 'The :attribute format is invalid.',
	regex: 'The :attribute format is invalid'
};

// Shim taken from MDN site
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fn, scope) {
        'use strict';
        var i, len;
        for (i = 0, len = this.length; i < len; ++i) {
            if (i in this) {
                fn.call(scope, this[i], i, this);
            }
        }
    };
}

// Based on jquery's extend function
function extend() {
	var src, copy, name, options, clone;
	var target = arguments[0] || {};
	var i = 1;
	var length = arguments.length;

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( copy && typeof copy === "object" ) {
					clone = src && typeof src === "object" ? src : {};

					// Never move original objects, clone them
					target[ name ] = extend( clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
}

var ValidatorErrors = function() {};

ValidatorErrors.prototype = {
	constructor: ValidatorErrors,

	/**
	 * returns an array of error messages for an attribute, or an empty array
	 * @param  {String} attribute A key in the data object being validated
	 * @return {Array}           	An array of error messages
	 */
	get: function(attribute) {
		if (this[attribute]) {
			return this[attribute];
		}

		return [];
	},

	/**
	 * returns the first error message for an attribute, false otherwise
	 * @param  {String} attribute A key in the data object being validated
	 * @return {String}           First error message or false
	 */
	first: function(attribute) {
		if (this[attribute]) {
			return this[attribute][0];
		}

		return false;
	},

	/**
	 * Get all error messages from all failing attributes
	 * @return {Object} Failed attribute names for keys and an array of messages for values
	 */
	all: function() {
		return this;
	},

	/**
	 * checks if there are error messages for an attribute
	 * @param  {String}  attribute A key in the data object being validated
	 * @return {Boolean}           True if there are error messages. Otherwise false
	 */
	has: function(attribute) {
		if (this[attribute] && this[attribute].length > 0) {
			return true;
		}

		return false;
	}
};

var Validator = function(input, rules, customMessages) {
	this.input = input;
	this.rules = rules;
	this.messages = extend({}, messages, customMessages || {});

	this.errors = new ValidatorErrors();

	this.errorCount = 0;
	this.check();
};

Validator.prototype = {
	constructor: Validator,

	// replaces placeholders in tmpl with actual data
	_createMessage: function(tmpl, data) {
		var message, key;

		if (typeof tmpl === 'string' && typeof data === 'object') {
			message = tmpl;

			for (key in data) {
				if (data.hasOwnProperty(key)) {
					message = message.replace(':' + key, data[key]);
				}
			}
		}

		return message;
	},

	check: function() {
		var self = this;

		this._each(this.rules, function(attributeToValidate) {

			var rulesArray = this.rules[attributeToValidate];
			if( typeof rulesArray === "string" ) {
        rulesArray = this.rules[attributeToValidate].split('|');
      }

			var inputValue = this.input[attributeToValidate]; // if it doesnt exist in input, it will be undefined

			rulesArray.forEach(function(ruleString) {
				var ruleExtraction = self._extractRuleAndRuleValue(ruleString);
				var rule = ruleExtraction.rule;
				var ruleValue = ruleExtraction.ruleValue;
				var passes, dataForMessageTemplate, msgTmpl, msg;

				passes = self.validate[rule].call(self, inputValue, ruleValue, attributeToValidate);

				if (!passes) {
					if ( !self.errors.hasOwnProperty(attributeToValidate) ) {
						self.errors[attributeToValidate] = [];
					}

					dataForMessageTemplate = self._createErrorMessageTemplateData(attributeToValidate, rule, ruleValue);
					msgTmpl = self._selectMessageTemplate(rule, inputValue, attributeToValidate);
					msg = self._createMessage(msgTmpl, dataForMessageTemplate);
					self._addErrorMessage(attributeToValidate, msg);
				}
			});
		}, this); // end of _each()
	},

	_each: function(obj, cb, context) {
		for (var key in obj) {
			cb.call(context, key);
		}
	},

	/**
	 * Extract a rule and a rule value from a ruleString (i.e. min:3), rule = min, ruleValue = 3
	 * @param  {string} ruleString min:3
	 * @return {object} object containing the rule and ruleValue
	 */
	_extractRuleAndRuleValue: function(ruleString) {
		var obj = {}, ruleArray;

		obj.rule = ruleString;

		if (ruleString.indexOf(':') >= 0) {
			ruleArray = ruleString.split(':');
			obj.rule = ruleArray[0];
			obj.ruleValue = ruleArray.slice(1).join(":");
		}

		return obj;
	},

	_addErrorMessage: function(key, msg) {
		this.errors[key].push(msg);
		this.errorCount++;
	},

	_createErrorMessageTemplateData: function(key, rule, ruleVal) {
		var dataForMessageTemplate = { attribute: key };
		dataForMessageTemplate[rule] = ruleVal; // if no rule value, then this will equal to null

		return dataForMessageTemplate;
	},

	// selects the correct message template from the messages variable based on the rule and the value
	_selectMessageTemplate: function(rule, val, key) {
		var msgTmpl, messages = this.messages;

		// if the custom error message template exists in messages variable
		if (messages.hasOwnProperty(rule + '.' + key)) {
			msgTmpl = messages[rule + '.' + key];
		} else if (messages.hasOwnProperty(rule)) {
			msgTmpl = messages[rule];

			if (typeof msgTmpl === 'object') {
				switch (typeof val) {
					case 'number':
						msgTmpl = msgTmpl['numeric'];
						break;
					case 'string':
						msgTmpl = msgTmpl['string'];
						break;
				}
			}
		} else { // default error message
			msgTmpl = messages.def;
		}

		return msgTmpl;
	},

	passes: function() {
		return this.errorCount === 0 ? true : false;
	},

	fails: function() {
		return this.errorCount > 0 ? true : false;
	},

	// validate functions should return T/F
	validate: {
		required: function(val) {
			var str;

			if (val === undefined || val === null) {
				return false;
			}

			str = String(val).replace(/\s/g, "");
			return str.length > 0 ? true : false;
		},

		// compares the size of strings
		// with numbers, compares the value
		size: function(val, req) {
			if (val) {
				req = parseFloat(req);

				if (typeof val === 'number') {
					return val === req ? true : false;
				}

				return val.length === req ? true : false;
			}

			return true;
		},

		/**
		 * Compares the size of strings or the value of numbers if there is a truthy value
		 */
		min: function(val, req) {
			if (val === undefined || val === '') { return true; }

			if (typeof val === 'number') {
				return val >= req ? true : false;
			} else {
				return val.length >= req ? true : false;
			}
		},

		/**
		 * Compares the size of strings or the value of numbers if there is a truthy value
		 */
		max: function(val, req) {
			if (val === undefined || val === '') { return true; }

			if (typeof val === 'number') {
				return val <= req ? true : false;
			} else {
				return val.length <= req ? true : false;
			}
		},

		email: function(val) {
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

			if (val === undefined || val === '') {
				return true;
			}

			return re.test(val);
		},

		numeric: function(val) {
			var num;

			if (val === undefined || val === '') { return true; }

			num = Number(val); // tries to convert value to a number. useful if value is coming from form element

			if (typeof num === 'number' && !isNaN(num) && typeof val !== 'boolean') {
				return true;
			} else {
				return false;
			}
		},

		url: function(url) {
			if (url === undefined || url === '') { return true; }

			return (/^https?:\/\/\S+/).test(url);
		},

		alpha: function(val) {
			if (val === undefined || val === '') { return true; }

			return (/^[a-zA-Z]+$/).test(val);
		},

		alpha_dash: function(val) {
			if (val === undefined || val === '') { return true; }
			return (/^[a-zA-Z0-9_\-]+$/).test(val);
		},

		alpha_num: function(val) {
			if (val === undefined || val === '') { return true; }

			return (/^[a-zA-Z0-9]+$/).test(val);
		},

		same: function(val, req) {
			var val1 = this.input[req];
			var val2 = val;

			if (val1 === val2) {
				return true;
			}

			return false;
		},

		different: function(val, req) {
			var val1 = this.input[req];
			var val2 = val;

			if (val1 !== val2) {
				return true;
			}

			return false;
		},

		"in": function(val, req) {
			var list, len, returnVal;

			if (val) {
				list = req.split(',');
				len = list.length;
				returnVal = false;

				val = String(val); // convert val to a string if it is a number

				for (var i = 0; i < len; i++) {
					if (val === list[i]) {
						returnVal = true;
						break;
					}
				}

				return returnVal;
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
			if (val === 'on' || val === 'yes' || val === 1 || val === '1') {
				return true;
			}

			return false;
		},

		confirmed: function(val, req, key) {
			var confirmedKey = key + '_confirmation';

			if (this.input[confirmedKey] === val) {
				return true;
			}

			return false;
		},

		integer: function(val) {
			if (val === undefined || val === '') { return true; }

			val = String(val);

			if ( (/^\d+$/).test(val) ) {
				return true;
			} else {
				return false;
			}
		},

		digits: function(val, req) {
			if (this.validate.numeric(val) && String(val).length === parseInt(req)) {
				return true;
			}

			return false;
		},

    regex: function(val, req) {
    	var mod = /[g|i|m]{1,3}$/;
			var flag = req.match(mod);
			flag = flag ? flag[0] : "i";
			req = req.replace(mod,"").slice(1,-1);
			req = new RegExp(req,flag);
      return !!val.match(req);
    }
	}
};

// static methods
Validator.register = function(rule, fn, errMsg) {
	this.prototype.validate[rule] = fn;
	messages[rule] = (typeof errMsg === 'string') ? errMsg : messages['def'];
};

Validator.make = function(input, rules, customMessages) {
	return new Validator(input, rules, customMessages);
};

// Node environment
if (typeof module !== 'undefined' && module.exports) {
	module.exports = Validator;
} else { // browser environment
	if (typeof define === 'function' && define.amd) {
		define('Validator', [], function() {
			return Validator;
		});
	} else {
		window.Validator = Validator;
	}
}

})();
/*
 *  Copyright 2015 Gary Green.
 *  Licensed under the Apache License, Version 2.0 (the "License");
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
(function(factory) {

	if (typeof exports !== 'undefined')
	{
		module.exports = factory;
	}
	else
	{
		window.Dominar = factory(jQuery, Validator);
	}
}(function($, Validator) {

	function Dominar($form, options, config) {
		this.$form = $form;
		this.options = options || {};
		this.config = config || $.extend({}, this.configDefaults, config);
		this.fields = {};
		this.bindEvents();
	}

	Dominar.prototype = {

		defaults: {
			container: '.form-group',
			delay: 300,
			delayTriggers: ['keyup'],
			rules: '',
			remoteRule: $.noop,
			triggers: ['keyup', 'focusout', 'change'],
			message: true,
			customMessages: {},
			feedback: true,
			feedbackIcons: {
				success: '<i class="glyphicon glyphicon-check"></i>',
				error: '<i class="glyphicon glyphicon-remove"></i>'
			}
		},

		configDefaults: {
			validateOnSubmit: true
		},

		DominarField: DominarField,

		/**
		 * Bind events
		 *
		 * @return {void}
		 */
		bindEvents: function() {
			var dominar = this;
			this.$form.on('keyup blur change', 'textarea, input, select', function(event) { dominar.fireValidate.call(dominar, event); });
			this.$form.on('submit', function(event) { dominar.fireSubmit.call(dominar, event); });
		},

		/**
		 * Get existing or new dominar field for element
		 *
		 * @param  {string|jQuery} validating
		 * @return {DominarField|undefined}
		 */
		getField: function(validating) {
			if (typeof validating === 'string')
			{
				return this.fields[validating];
			}

			var name = validating.attr('name');
			var field = this.fields[name];
			if (!field && this.options[name])
			{
				field = new this.DominarField(name, validating, this.getOptions(name));
				this.fields[name] = field;
				this.trigger('init-field', { dominarField: field });
			}
			return field;
		},

		/**
		 * Get options for given name
		 *
		 * @param  {string} name
		 * @return {object}
		 */
		getOptions: function(name) {
			var options = this.options[name];
			return $.extend({}, this.defaults, options);
		},

		/**
		 * Add elements with given options
		 *
		 * @param {jQuery} $elements
		 * @param {object} options
		 */
		add: function($elements, options) {
			var dominar = this;
			$elements.each(function() {
				dominar.options[this.name] = options;
			});
			return this;
		},

		/**
		 * Trigger event
		 *
		 * @param  {string} name
		 * @param  {object} data
		 * @param  {function} callback
		 * @return {$.Event}
		 */
		trigger: function(name, data, callback) {
			var data = $.extend({}, { dominar: this }, data);
			var event = $.Event('dominar.' + name, data);
			this.$form.trigger(event);

			if (callback && !event.isDefaultPrevented())
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
		fireValidate: function(event) {
			var $element = $(event.target);
			var field = this.getField($element);
			if (field)
			{
				field.fireValidate(event);
			}
		},

		/**
		 * Fired submit event
		 *
		 * @param  {jquery event} event
		 * @return {void}
		 */
		fireSubmit: function(event) {
			var dominar = this;
			if (dominar.config.validateOnSubmit)
			{
				var submitPassed = function() { event.target.submit(); };
				var submitFailed = function() { dominar.trigger('submit-failed'); };
				var submit = function() {
					event.preventDefault();
					dominar.validateAll(function() {
						dominar.trigger('submit-passed', {}, submitPassed);
					}, function() {
						dominar.trigger('submit-failed', {}, submitFailed);
					});
				};
				dominar.trigger('submit', {}, submit);
			}
		},

		/**
		 * Validate
		 *
		 * @param  {string|jQuery} name
		 * @param  {function} passes
		 * @param  {function} fails
		 * @return {void}
		 */
		validate: function(name, passes, fails) {
			var field = this.getField(name);
			if (field) field.validate(passes, fails);
		},

		/**
		 * Validate with delay
		 *
		 * @param  {string|jQuery} name
		 * @param  {function} passes
		 * @param  {function} fails
		 * @return {void}
		 */
		validateDelayed: function(name, passes, fails) {
			var field = this.getField(name);
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
			var $element;
			var field;
			var dfd;
			var validators = [];
			passes = passes || $.noop;
			fails = fails || $.noop;
			for (var name in this.options)
			{
				dfd = $.Deferred();
				field = this.getField(name) || this.getField(this.$form.find('[name="' + name + '"]'));
				validators.push(dfd);
				(function(field, dfd) {
					field.validate(function() {
						dfd.resolve();
					}, function(error) {
						dfd.reject(error);
					});
				}(field, dfd));
			}

			return $.when.apply($, validators).done(passes).fail(fails);
		}

	};

	/**
	 * Register a custom validation rule
	 *
	 * @param  {string} rule
	 * @param  {function} func
	 * @param  {string} errorMessage
	 * @return {void}
	 */
	Dominar.register = function(rule, func, errorMessage) {
		Validator.register(rule, func, errorMessage);
	};

	function DominarField(name, $field, options) {
		this.name = name;
		this.options = options;
		this.$field = $field;
		this.$container = $field.closest(this.options.container);
		this.$message = this.options.message ? this.getMessageElement() : $();
		this.$feedback = this.options.feedback ? this.getFeedbackElement() : $();
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

			var name = this.getName();
			var value = this.getValue();
			var field = this;
			var validate = $.Deferred();
			passes = passes || $.noop;
			fails = fails || $.noop;
			if (this.validator)
			{
				delete this.validator;
			}
			this.validator = this.getValidator();

			$.when(validate, this.options.remoteRule(value))
			.done(function() {
				field.showSuccess();
				passes();
			})
			.fail(function(error) {
				if (typeof error !== 'string')
				{
					error = error.responseJSON.message;
				}
				field.showError(error);
				fails(error);
			});

			if (!this.validator || this.validator.passes())
			{
				validate.resolve();
			}
			else
			{
				validate.reject(this.validator.errors.first(name));
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
			passes = passes || $.noop;
			fails = fails || $.noop;
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
		fireValidate: function(event) {
			var trigger = this.getTrigger(event);

			if (trigger.validate)
			{
				if (trigger.delay) this.validateDelayed();
				else this.validate();
			}
		},

		/**
		 * Get validation options (data, rules)
		 *
		 * @return {object}
		 */
		getValidationOptions: function() {
			var name = this.getName();
			var data = {};
			var rules = {};

			data[name] = this.getValue();
			rules[name] = this.getRules();

			if (rules[name].length === 0) delete rules[name];

			var options = {
				data: data,
				rules: rules,
				customMessages: this.options.customMessages
			};

			if (this.options.validatorOptions)
			{
				options = this.options.validatorOptions.call(this, options);
			}

			return options;
		},

		/**
		 * Get validator instance
		 *
		 * @return {Validator}
		 */
		getValidator: function() {
			var options = this.getValidationOptions();
			var validator = new Validator(options.data, options.rules, options.customMessages);
			return validator;
		},

		/**
		 * Get validation rules
		 *
		 * @return {string}
		 */
		getRules: function() {
			return this.options.rules;
		},

		/**
		 * Get name of field
		 *
		 * @return {string}
		 */
		getName: function() {
			return this.name;
		},

		/**
		 * Get value of field
		 *
		 * @return {mixed}
		 */
		getValue: function() {
			return this.$field.val();
		},

		/**
		 * Get trigger options from given jQuery event
		 *
		 * @param  {$.Event} jquery event
		 * @return {object}
		 */
		getTrigger: function(event) {
			var eventType = event.type;
			var isKeyup = eventType == 'keyup';
			
			// Determine if validation can be triggered by this event (change, keyup etc)
			var trigger = $.inArray(eventType, this.options.triggers) > -1;

			// Determine if we should validate with a delay
			var delay = $.inArray(eventType, this.options.delayTriggers) > -1;

			// Determine if validation should occur
			var validate = ((isKeyup && event.keyCode !== 9) || !isKeyup) && trigger;

			return {
				validate: validate,
				delay: delay
			};
		},

		/**
		 * Get form field is for
		 *
		 * @return {jQuery}
		 */
		$form: function() {
			return this.$container.closest('form');
		},

		/**
		 * Get message element
		 *
		 * @return {jQuery}
		 */
		getMessageElement: function() {
			var $message = this.$container.find('.help-block');
			if ($message.length === 0)
			{
				$message = $('<span class="help-block"/>').insertAfter(this.$field);
			}
			return $message;
		},

		/**
		 * Get feedback element
		 *
		 * @return {jQuery}
		 */
		getFeedbackElement: function() {
			var $feedback = this.$container.find('.form-control-feedback');
			if ($feedback.length === 0)
			{
				$feedback = $('<span class="form-control-feedback"/>').insertAfter(this.$message.length ? this.$message : this.$field);
			}
			return $feedback;
		},

		/**
		 * Show the given error message
		 *
		 * @param  {string|undefined} message
		 * @return {void}
		 */
		showError: function(message) {
			this.reset();
			this.$container.addClass('has-error');
			if (this.options.message) this.$message.html(message || '');
			if (this.options.feedback) this.showFeedback('error');
		},

		/**
		 * Show the given success message
		 *
		 * @param  {string|undefined} message
		 * @return {void}
		 */
		showSuccess: function(message) {
			this.reset();
			this.$container.addClass('has-success');
			if (this.options.message) this.$message.html(message || '');
			if (this.options.feedback) this.showFeedback('success');
		},

		/**
		 * Show feedback of given type
		 *
		 * @param  {string} type Type; 'success' or 'error'
		 * @return {void}
		 */
		showFeedback: function(type) {
			this.$container.addClass('has-feedback');
			this.$feedback.html(this.options.feedbackIcons[type]);
		},

		/**
		 * Reset any errors/success messages
		 *
		 * @return {void}
		 */
		reset: function() {
			this.$container.removeClass('has-error has-success has-feedback');
			this.$message.empty();
			this.$feedback.empty();
		}

	};

	return Dominar;

}));