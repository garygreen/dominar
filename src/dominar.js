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
var Utils = require('./utils');

function Dominar($form, options, config) {
	this.$form = $form;
	this.options = options || {};
	this.config = config || $.extend({}, this.configDefaults, config);
	this.fields = {};
	this._bindEvents();
}

Dominar.prototype = {

	defaults: {
		container: '.form-group',
		delay: 300,
		delayTriggers: ['keyup'],
		rules: '',
		remoteRule: Utils.noop,
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

	/**
	 * Bind events
	 *
	 * @return {void}
	 */
	_bindEvents: function() {
		var dominar = this;
		this.$form.on('keyup.dominar blur.dominar change.dominar', 'textarea, input, select', function(event) { dominar._fireValidate.call(dominar, event); });
		this.$form.on('submit.dominar', function(event) { dominar._fireSubmit.call(dominar, event); });
	},

	/**
	 * Unbind events.
	 *
	 * @return {void}
	 */
	_unbindEvents: function() {
		this.$form.off('.dominar');
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
			field = new DominarField(name, element, this._getOptions(name));
			this.fields[name] = field;
			this._trigger('init-field', { dominarField: field });
		}
		return field;
	},

	/**
	 * Get options for given name
	 *
	 * @param  {string} name
	 * @return {object}
	 */
	_getOptions: function(name) {
		var options = this.options[name];
		return $.extend({}, this.defaults, options);
	},

	/**
	 * Find elements within the context of the form.
	 *
	 * @param  {string} selector
	 * @return {Array}
	 */
	$: function(selector) {
		return Utils.$(selector, this.$form[0]);
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
	 * @return {$.Event}
	 */
	_trigger: function(name, data, callback) {
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
	_fireValidate: function(event) {
		var field = this.getField(event.target.name);
		if (field)
		{
			field._fireValidate(event);
		}
	},

	/**
	 * Fired submit event
	 *
	 * @param  {jquery event} event
	 * @return {void}
	 */
	_fireSubmit: function(event) {
		var dominar = this;
		if (dominar.config.validateOnSubmit)
		{
			var submitPassed = function() { event.target.submit(); };
			var submitFailed = function() { dominar._trigger('submit-failed'); };
			var submit = function() {
				event.preventDefault();
				dominar.validateAll(function() {
					dominar._trigger('submit-passed', {}, submitPassed);
				}, function() {
					dominar._trigger('submit-failed', {}, submitFailed);
				});
			};
			dominar._trigger('submit', {}, submit);
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
		var $element;
		var field;
		var dfd;
		var validators = [];
		passes = passes || Utils.noop;
		fails = fails || Utils.noop;
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
