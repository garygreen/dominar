/*
 *  Copyright 2015 Gary Green.
 *  Licensed under the Apache License, Version 2.0.
 */

var Validator = require('validatorjs');
var Utils = require('./utils');

function DominarField(name, fields, options) {
	this.name = name;
	this.options = options;
	this.fields = fields;
	this.container = Utils.element(this.fields[0]).closest(this.options.container);
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
			fails();
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
	 * @return {object}
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
		var type = this.fields[0].type;
		if (type == 'radio' || type == 'checkbox')
		{
			for (var i = 0, len = this.fields.length, field, values = []; i < len; i++) {
				field = this.fields[i];
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
		return this.fields[0].value;
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
