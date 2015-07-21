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

describe('async remote rule testing', function() {

	it('should call error callback', function(done) {

		var $form;
		var dominar = new Dominar($form = $('<form><div class="form-group"><input name="username"/></div></form>'), {
			username: {
				feedback: false,
				remoteRule: function() {
					var dfd = $.Deferred();
					setTimeout(function() {
						dfd.reject('Username is already taken.');
					}, 50);
					return dfd;
				}
			}
		});

		var $username = $form.find('[name=username]');
		dominar.validate($username, $.noop, function() {
			assert.equal($form.html(), [
				'<div class="form-group has-error">',
					'<input name="username">',
					'<span class="help-block">Username is already taken.</span>',
				'</div>'
			].join(''));

			done();
		});

	});

	it('should call success callback', function(done) {

		var $form;
		var dominar = new Dominar($form = $('<form><div class="form-group"><input name="username"/></div></form>'), {
			username: {
				feedback: false,
				remoteRule: function() {
					var dfd = $.Deferred();
					setTimeout(function() {
						dfd.resolve();
					}, 50);
					return dfd;
				}
			}
		});

		var $username = $form.find('[name=username]').val('testing');
		dominar.validate($username, function() {
			assert.equal($form.html(), [
				'<div class="form-group has-success">',
					'<input name="username">',
					'<span class="help-block"></span>',
				'</div>'
			].join(''));

			done();
		});

	});

});