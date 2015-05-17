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
(function($, window, Validator) {

	function Dominar($form, options) {
		this.$form = $form;
		this.options = options;
		this.fields = {};
		this.bindEvents();
	}

	Dominar.prototype = {

		defaults: {
			delay: 300,
			rules: '',
			remoteRule: $.noop,
			triggers: ['keyup', 'focusout', 'change'],
			message: true,
			feedback: true,
			feedbackIcons: {
				success: '<i class="glyphicon glyphicon-check"></i>',
				error: '<i class="glyphicon glyphicon-remove"></i>'
			}
		},

		DominarField: DominarField,

		/**
		 * Bind events
		 *
		 * @return {void}
		 */
		bindEvents: function() {
			this.$form.on('keyup blur change', 'textarea, input, select', $.proxy(this.fireValidate, this));
			this.$form.on('submit', $.proxy(this.fireSubmit, this));
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
			if (!field)
			{
				field = new this.DominarField(name, validating, this.getOptions(name));
				this.fields[name] = field;
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
		 * Fire validation from an event
		 *
		 * @param  {jquery event} event
		 * @return {void}
		 */
		fireValidate: function(event) {
			var $element = $(event.target);
			var field = this.getField($element);
			var eventType = event.type;
			var isKeyup = eventType == 'keyup';
			if (((isKeyup && event.keyCode !== 9) || !isKeyup) && field.canTrigger(eventType))
			{
				if (isKeyup) this.validateDelayed($element);
				else this.validate($element);
			}
		},

		/**
		 * Fired submit event
		 *
		 * @param  {jquery event} event
		 * @return {void}
		 */
		fireSubmit: function(event) {
			event.preventDefault();
			this.validateAll(function() {
				event.target.submit();
			});
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
			field.runValidator(passes, fails);
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
			field.validate(passes, fails);
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
					field.runValidator(function() {
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
		this.$container = $field.closest('.form-group');
		this.$message = this.options.message ? this.getMessageElement() : $();
		this.$feedback = this.options.feedback ? this.getFeedbackElement() : $();
	};

	DominarField.prototype = {

		/**
		 * Determine if field is valid
		 *
		 * @param {function} passes
		 * @param {function} fails
		 * @return {void}
		 */
		validate: function(passes, fails) {

			var delay = this.options.delay;
			passes = passes || $.noop;
			fails = fails || $.noop;
			clearTimeout(this.delayTimer);
			if (delay)
			{
				this.delayTimer = setTimeout($.proxy(function() { this.runValidator(passes, fails); }, this), delay);
			}
			else
			{
				this.runValidator(passes, fails);
			}
		},

		/**
		 * Run validator
		 *
		 * @param {function} passes
		 * @param {function} fails
		 * @return {void}
		 */
		runValidator: function(passes, fails) {

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
				rules: rules
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
			var validationOptions = this.getValidationOptions();
			var validator = new Validator(validationOptions.data, validationOptions.rules);
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
		 * Determine if validation can be triggered from the given type (blur, change, etc)
		 *
		 * @param  {string} type
		 * @return {boolean}
		 */
		canTrigger: function(type) {
			if ($.isArray(this.options.triggers))
			{
				return $.inArray(type, this.options.triggers) > -1;
			}
			return false;
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

	}

	window.Dominar = Dominar;

}(jQuery, window, window.Validator));