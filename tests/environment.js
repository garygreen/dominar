var expect = window.chai.expect;

describe('initialisation', function() {

	it('should be able to initialise dominar', function() {
		var dominar = new Dominar($('<form/>'), {

		});
	});

	it('should default options to', function() {

		expect(Dominar.prototype.defaults).to.deep.equal({
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

		expect(Dominar.prototype.configDefaults).to.deep.equal({
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
		expect($form.html()).to.equal([
			'<div class="form-group has-error">',
				'<input name="username"><span class="help-block">The username field is required.</span>',
			'</div>'
		].join(''));
	});

});