var expect = window.chai.expect;
var Dominar = require('../src/dominar');

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

		dominar.validate('username');
		expect($form.html()).to.equal([
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

		dominar.validate('username');
		expect($form.html()).to.equal([
			'<div class="form-group has-error has-feedback">',
				'<input name="username"><span class="help-block">The username field is required.</span>',
				'<span class="form-control-feedback"><i class="glyphicon glyphicon-remove"></i></span>',
			'</div>'
		].join(''));
	});

	it('should support specifying feedback types as an array', function() {

		var dominar = new Dominar($('<form><div class="form-group"><input name="username"/></div></form>'), {
			username: {
				rules: 'required',
				feedback: ['success']
			}
		});

		var $username = dominar.$form.find('[name=username]');
		dominar.validate('username');
		expect(dominar.$form.find('.form-group').hasClass('has-feedback')).to.be.false;

		$username.val('test');
		dominar.validate('username');
		expect(dominar.$form.find('.form-group').hasClass('has-feedback')).to.be.true;

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
		dominar.validate($username[0]);
		expect($form.html()).to.equal([
			'<div class="form-group has-error has-feedback">',
				'<input name="username"><span class="form-control-feedback"><i class="custom-error-icon"></i></span>',
			'</div>'
		].join(''));

		dominar.validate($username.val('test')[0]);
		expect($form.html()).to.equal([
			'<div class="form-group has-success has-feedback">',
				'<input name="username"><span class="form-control-feedback"><i class="custom-success-icon"></i></span>',
			'</div>'
		].join(''));

	});

});