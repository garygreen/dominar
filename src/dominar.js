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
		this.$form.on('keyup.dominar blur.dominar change.dominar', 'textarea, input, select', function(event) { dominar.fireValidate.call(dominar, event); });
		this.$form.on('submit.dominar', function(event) { dominar.fireSubmit.call(dominar, event); });
	},

	/**
	 * Unbind events.
	 *
	 * @return {void}
	 */
	unbindEvents: function() {
		this.$form.off('.dominar');
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
		var field = this.getField(event.target.name);
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
	},

	/**
	 * Destroy dominar.
	 *
	 * @return {void}
	 */
	destroy: function() {
		this.unbindEvents();
		for (var i in this.fields)
		{
			this.fields[i].reset();
		}

		this.fields = {};
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

module.exports = Dominar;
