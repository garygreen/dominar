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

describe('feedback tests', function() {

	it('should show just feedback', function() {
		var $form;
		var dominar = new Dominar($form = $('<form><div class="form-group"><input name="username"/></div></form>'), {
			username: {
				rules: 'required|min:1',
				feedback: true,
				message: false
			}
		});

		var $username = $form.find('[name=username]');
		dominar.validate($username);
		assert.equal($form.html(), [
			'<div class="form-group has-error has-feedback">',
				'<input name="username"><span class="form-control-feedback"><i class="glyphicon glyphicon-remove"></i></span>',
			'</div>'
		].join(''));
	});

	it('should show error and feedback', function() {
		var $form;
		var dominar = new Dominar($form = $('<form><div class="form-group"><input name="username"/></div></form>'), {
			username: {
				rules: 'required|min:1',
				feedback: true,
				message: true
			}
		});

		var $username = $form.find('[name=username]');
		dominar.validate($username);
		assert.equal($form.html(), [
			'<div class="form-group has-error has-feedback">',
				'<input name="username"><span class="help-block">The username field is required.</span>',
				'<span class="form-control-feedback"><i class="glyphicon glyphicon-remove"></i></span>',
			'</div>'
		].join(''));
	});

	it('should allow custom feedback icons', function() {

		var $form;
		var dominar = new Dominar($form = $('<form><div class="form-group"><input name="username"/></div></form>'), {
			username: {
				rules: 'required|min:1',
				message: false,
				feedbackIcons: {
					error: '<i class="custom-error-icon"></i>',
					success: '<i class="custom-success-icon"></i>'
				}
			}
		});

		var $username = $form.find('[name=username]');
		dominar.validate($username);
		assert.equal($form.html(), [
			'<div class="form-group has-error has-feedback">',
				'<input name="username"><span class="form-control-feedback"><i class="custom-error-icon"></i></span>',
			'</div>'
		].join(''));

		dominar.validate($username.val('test'));
		assert.equal($form.html(), [
			'<div class="form-group has-success has-feedback">',
				'<input name="username"><span class="form-control-feedback"><i class="custom-success-icon"></i></span>',
			'</div>'
		].join(''));

	});

});