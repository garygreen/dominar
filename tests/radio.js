var expect = window.chai.expect;
var Dominar = require('../src/dominar');

describe('radio tests', function() {

	beforeEach(function() {
		this.formHtml = [
			'<form>',
				'<div class="form-group">',
					'<label><input type="radio" name="fruit" value="apple"></label>',
					'<label><input type="radio" name="fruit" value="strawberry"></label>',
				'</div>',
			'</form>'
		].join('');
	});

	it('should error', function() {

		var dominar = new Dominar($(this.formHtml)[0], { 'fruit': { rules: 'required' }});

		dominar.validate('fruit');

		expect($(dominar.form).find('.form-group').hasClass('has-error')).to.be.true;
		expect(dominar.getField('fruit').getValue()).to.be.undefined;

	});

	it('should pass', function() {

		var dominar = new Dominar($(this.formHtml)[0], { 'fruit': { rules: 'required' }});

		$(dominar.form).find('[value="strawberry"]').prop('checked', true);
		dominar.validate('fruit');

		expect($(dominar.form).find('.form-group').hasClass('has-success')).to.be.true;
		expect(dominar.getField('fruit').getValue()).to.equal('strawberry');

	});



});