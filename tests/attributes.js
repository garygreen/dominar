var expect = window.chai.expect;
var Dominar = require('../src/dominar');

describe('custom attributes tests', function() {

	it('should show allow custom attribute names', function() {

		var dominar = new Dominar($('<form><div class="form-group"><input name="name"></div></form>')[0], {
			name: {
				rules: 'required',
				customAttributes: {
					name: 'Your Name'
				}
			}
		});

		dominar.validateAll();

		expect($(dominar.form).html()).to.contain([
			'<input name="name">',
			'<span class="help-block">The Your Name field is required.</span>',
		].join(''));
	});

	it('should allow short-hand style custom attribute names', function() {

		var dominar = new Dominar($('<form><div class="form-group"><input name="name"></div></form>')[0], {
			name: {
				rules: 'required',
				customAttributes: 'Your Name'
			}
		});

		dominar.validateAll();

		expect($(dominar.form).html()).to.contain([
			'<input name="name">',
			'<span class="help-block">The Your Name field is required.</span>',
		].join(''));
	});

});
