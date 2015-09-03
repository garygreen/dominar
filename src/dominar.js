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
(function(jQuery, Validator, factory) {

	window.Dominar = factory(jQuery, Validator);
	
}(jQuery, Validator, function(jQuery, Validator) {

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
			
			if (this.fields[validating])
			{
				return this.fields[validating];
			}

			if (typeof validating === 'string')
			{
				validating = this.$form.find('[name="' + validating + '"]');
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
				field = this.getField(name);
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

	Dominar.DominarField = DominarField;

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
			var $field = this.$field;
			var type = $field[0].type;
			if (type == 'radio' || type == 'checkbox')
			{
				$field = $field.filter(':checked');
			}
			return $field.val();
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