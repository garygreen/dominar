var assert, Dominar;

if (typeof require !== 'undefined')
{
	assert = require('chai').assert,
	Dominar = require('../src/dominar-standalone.js');
}
else
{
	// Browser testing support
	assert  = window.chai.assert;
	Dominar = window.Dominar;
}

describe('initialisation', function() {

	it('should be able to initialise dominar', function() {
		var dominar = new Dominar($('<form/>'), {

		});
	});

	it('should default options to', function() {

		assert.deepEqual(Dominar.prototype.defaults, {
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
		});

	});

	it('should default config to', function() {

		assert.deepEqual(Dominar.prototype.configDefaults, {
			validateOnSubmit: true
		});

	});

});

describe('basic validation and option testing', function() {

	it('should show just error', function() {
		var $form;
		var dominar = new Dominar($form = $('<form><div class="form-group"><input name="username"/></div></form>'), {
			username: {
				rules: 'required|min:1',
				feedback: false,
				message: true
			}
		});

		var $username = $form.find('[name=username]');
		dominar.validate($username);
		assert.equal($form.html(), [
			'<div class="form-group has-error">',
				'<input name="username"><span class="help-block">The username field is required.</span>',
			'</div>'
		].join(''));
	});

});