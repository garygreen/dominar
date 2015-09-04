/*
 *  Copyright 2015 Gary Green.
 *  Licensed under the Apache License, Version 2.0.
 */

var Validator = require('validatorjs');

function DominarField(name, $field, options) {
	this.name = name;
	this.options = options;
	this.$field = $field;
	this.$container = $field.closest(this.options.container);
	this.$message = this.options.message ? this._getMessageElement() : $();
	this.$feedback = this.options.feedback ? this._getFeedbackElement() : $();
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
		var validate = $.Deferred();
		passes = passes || $.noop;
		fails = fails || $.noop;
		if (this.validator)
		{
			delete this.validator;
		}
		this.validator = this.getValidator();

		field.validatedValue = undefined;

		$.when(validate, this.options.remoteRule(value))
		.done(function() {
			field.showSuccess();
			field.validatedValue = value;
			passes();
		})
		.fail(function(error) {
			if (typeof error !== 'undefined' && typeof error !== 'string')
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
			validate.reject(this.validator.errors.first(this.name));
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
	_fireValidate: function(event) {
		var trigger = this._getTrigger(event);

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
		var name = this.name;
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
	 * Get value of field
	 *
	 * @return {mixed}
	 */
	getValue: function() {
		var type = this.$field[0].type;
		if (type == 'radio' || type == 'checkbox')
		{
			var $checkedFields = this.$field.filter(':checked');

			if (type == 'radio')
			{
				return $checkedFields.val();
			}

			return $checkedFields.map(function() {
				return this.value;
			}).get();
		}
		return this.$field.val();
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
	 * @param  {$.Event} jquery event
	 * @return {object}
	 */
	_getTrigger: function(event) {
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
	 * Get message element
	 *
	 * @return {jQuery}
	 */
	_getMessageElement: function() {
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
	_getFeedbackElement: function() {
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

module.exports = DominarField;
