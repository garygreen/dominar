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


		it('should allow custom error message', function() {

			var $form;
			var dominar = new Dominar($form = $('<form><div class="form-group"><input name="username"/></div></form></form>'), {
				username: {
					rules: 'required',
					feedback: false,
					customMessages: {
						'required': ':attribute field is required you silly billy!'
					}
				}
			});

			dominar.validate($form.find('input'));
			assert.equal($form.html(), [
				'<div class="form-group has-error">',
					'<input name="username">',
					'<span class="help-block">username field is required you silly billy!</span>',
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
		

		it('should allow override of container', function() {

			var $form;
			var dominar = new Dominar($form = $('<form><table><tr><td><input name="username" type="text"/></td></tr></table</form>'), {
				username: {
					rules: 'required|min:1',
					container: 'td',
					message: true,
					feedback: false
				}
			});

			var $username = $form.find('[name=username]');
			dominar.validate($username);
			assert.equal($form.html(), [
				'<table>',
					'<tbody>',
						'<tr>',
							'<td class="has-error">',
								'<input name="username" type="text">',
								'<span class="help-block">The username field is required.</span>',
							'</td>',
						'</tr>',
					'</tbody>',
				'</table>'
			].join(''));

		});

	});

	describe('can add dynamic elements', function() {

		it('should add matched jQuery elements', function() {

			var $form;
			var dominar = new Dominar($form = $([
				'<form>',
					'<table>',
						'<thead>',
							'<tr>',
								'<th>name</th>',
							'</tr>',
						'</thead>',
						'<tbody>',
							'<tr>',
								'<td><input name="users[0][name]" type="text" class="user-name"/></td>',
							'</tr>',
							'<tr>',
								'<td><input name="users[1][name]" type="text" class="user-name"/></td>',
							'</tr>',
						'</tbody>',
					'</table>',
				'</form>'
			].join('')));

			dominar.add($form.find('.user-name'), {
				rules: 'required|min:1',
				container: 'td',
				feedback: false
			});

			dominar.validateAll();

			assert.equal($form.html(), [
				'<table>',
					'<thead>',
						'<tr>',
							'<th>name</th>',
						'</tr>',
					'</thead>',
					'<tbody>',
						'<tr>',
							'<td class="has-error">',
								'<input name="users[0][name]" type="text" class="user-name">',
								'<span class="help-block">The users[0][name] field is required.</span>',
							'</td>',
						'</tr>',
						'<tr>',
							'<td class="has-error">',
								'<input name="users[1][name]" type="text" class="user-name">',
								'<span class="help-block">The users[1][name] field is required.</span>',
							'</td>',
						'</tr>',
					'</tbody>',
				'</table>',
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