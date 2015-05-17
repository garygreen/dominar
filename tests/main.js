(function() {

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
				delay: 300,
				rules: '',
				remoteRule: $.noop,
				triggers: ['keyup', 'focusout', 'change'],
				message: true,
				feedback: true,
				feedbackIcons: {
					success: '<i class="fa fa-check"></i>',
					error: '<i class="fa fa-remove"></i>'
				}
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
					'<input name="username"><span class="form-control-feedback"><i class="fa fa-remove"></i></span>',
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
					'<span class="form-control-feedback"><i class="fa fa-remove"></i></span>',
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


		it('should use existing message element if found', function() {

			var $form;
			var dominar = new Dominar($form = $('<form><div class="form-group"><span class="help-block test"></span><input name="username"/></div></form>'), {
				username: {
					rules: 'required|min:1',
					message: true,
					feedback: false
				}
			});

			var $username = $form.find('[name=username]');
			dominar.validate($username);
			assert.equal($form.html(), [
				'<div class="form-group has-error">',
					'<span class="help-block test">The username field is required.</span>',
					'<input name="username">',
				'</div>'
			].join(''));

		});

	});

	
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

})();