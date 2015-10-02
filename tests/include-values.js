var expect = window.chai.expect;
var Dominar = require('../src/dominar');

describe('includeValues option tests', function() {

	it('should include values from given fields', function(done) {
		var dominar = new Dominar($('<form><div class="form-group"><input type="text" name="field1" value="a"></div><div class="form-group"><input type="hidden" name="field2" value="b"></div></form>'), {
			field1: {
				includeValues: ['field2'],
				validatorOptions: function(options) {
					expect(options.data.field2).to.equal('b');
					done();
				}
			}
		});

		dominar.validateAll();
	});

	it('should automatically include confirmation field with confirmed rule', function(done) {

		var dominar = new Dominar($('<form><div class="form-group"><input type="password" name="password" value="a"></div><div class="form-group"><input type="password" name="password_confirmation" value="a"></div></form>'), {
			password: {
				rules: 'confirmed',
				validatorOptions: function(options) {
					expect(options.data.password_confirmation).to.equal('a');
					done();
				}
			}
		});

		dominar.validateAll();

	});

});
