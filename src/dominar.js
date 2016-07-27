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
