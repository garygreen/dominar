var expect = window.chai.expect;
var Dominar = require('../src/dominar');

describe('async remote rule testing', function() {

	it('should call error callback', function(done) {

		var dominar = new Dominar($('<form><div class="form-group"><input name="username"></div></form>'), {
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

		dominar.validate('username', $.noop, function() {
			expect(dominar.$form.html()).to.equal([
				'<div class="form-group has-error">',
					'<input name="username">',
					'<span class="help-block">Username is already taken.</span>',
				'</div>'
			].join(''));

			done();
		});

	});

	it('should call success callback', function(done) {

		var dominar = new Dominar($('<form><div class="form-group"><input name="username"></div></form>'), {
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

		dominar.$form.find('[name=username]').val('testing');
		dominar.validate('username', function() {
			expect(dominar.$form.html()).to.equal([
				'<div class="form-group has-success">',
					'<input name="username">',
					'<span class="help-block"></span>',
				'</div>'
			].join(''));

			done();
		});

	});

});