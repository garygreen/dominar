var expect = window.chai.expect;
var Dominar = require('../src/dominar');

describe('html5 validation tests', function() {

	it('should validate min rule', function() {
		var dominar = new Dominar($('<form><div class="form-group"><input type="text" name="number" required min="8"></div></form>')[0], {
            number: {
                feedback: false
            }
        });

        dominar.validateAll();

        var html = $(dominar.form).html();

        expect(html).to.contain('<div class="form-group has-error">');
        expect(dominar.form.querySelector('[name=number]').validity.valid).to.be.false;
        expect(html).to.contain('<span class="help-block">' + dominar.form.querySelector('[name=number]').validationMessage + '</span>');
    });

    it('should clear custom invalidty state when calling .validate()', function() {
		var dominar = new Dominar($('<form><div class="form-group"><input type="text" name="username" value="test" required></div></form>')[0], {
            username: {
                feedback: false
            }
        });

        var field = dominar.form.querySelector('[name=username]');
        field.setCustomValidity('Some error');

        dominar.validate('username');

        var html = $(dominar.form).html();

        expect(html).to.contain('has-success');
    });

    it('should clear custom invalidty state when calling .validateDelayed()', function(passes) {
		var dominar = new Dominar($('<form><div class="form-group"><input type="text" name="username" value="test" required></div></form>')[0], {
            username: {
                feedback: false
            }
        });

        var field = dominar.form.querySelector('[name=username]');
        field.setCustomValidity('Some error');

        dominar.validateDelayed('username', function() {
            passes();
        });
    });

    it('should clear custom invalidty state when calling .validateAll()', function() {
		var dominar = new Dominar($('<form><div class="form-group"><input type="text" name="username" value="test" required></div></form>')[0], {
            username: {
                feedback: false
            }
        });

        var field = dominar.form.querySelector('[name=username]');
        field.setCustomValidity('Some error');

        dominar.validateAll();

        var html = $(dominar.form).html();

        expect(html).to.contain('has-success');
    });

    it('should show error when using setCustomValidity on element directly', function() {
		var dominar = new Dominar($('<form><div class="form-group"><input type="text" name="username"></div></form>')[0], {
            username: {
                feedback: false
            }
        });

        var field = dominar.form.querySelector('input');
        field.setCustomValidity('Some error');
        field.checkValidity();

        expect(dominar.form.innerHTML).to.contain('Some error');
    });


});
