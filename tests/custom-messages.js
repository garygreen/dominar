var expect = window.chai.expect;

describe('custom messages tests', function() {

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
		expect($form.html()).to.equal([
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
		expect($form.html()).to.equal([
			'<div class="form-group has-error">',
				'<span class="help-block test">The username field is required.</span>',
				'<input name="username">',
			'</div>'
		].join(''));

	});

});