var expect = window.chai.expect;
var Dominar = require('../src/dominar');

describe('async rule testing', function() {

	it('should call error callback', function(done) {

		Dominar.Validator.registerAsync('username-async-1', function(username, attribute, req, passes) {
			setTimeout(function() {
				expect(username).to.equal('test');
				passes(false, 'Username is already taken.');
			}, 50);
			
		});

		var dominar = new Dominar($('<form><div class="form-group"><input name="username" value="test"></div></form>'), {
			username: {
				feedback: false,
				rules: 'required|username-async-1'
			}
		});

		dominar.validate('username', $.noop, function() {
			expect(dominar.$form.html()).to.equal([
				'<div class="form-group has-error">',
					'<input name="username" value="test">',
					'<span class="help-block">Username is already taken.</span>',
				'</div>'
			].join(''));

			done();
		});

	});

	it('should call success callback', function(done) {

		Dominar.Validator.registerAsync('username-async-2', function(username, attribute, req, passes) {
			setTimeout(function() {
				expect(username).to.equal('gary');
				passes();
			}, 50);
			
		});

		var dominar = new Dominar($('<form><div class="form-group"><input name="username" value="gary"></div></form>'), {
			username: {
				feedback: false,
				rules: 'required|username-async-2'
			}
		});

		dominar.validate('username', function() {
			expect(dominar.$form.html()).to.equal([
				'<div class="form-group has-success">',
					'<input name="username" value="gary">',
					'<span class="help-block"></span>',
				'</div>'
			].join(''));

			done();
		});

	});

});