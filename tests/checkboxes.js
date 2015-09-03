var expect = window.chai.expect;

describe('checkbox tests', function() {

	beforeEach(function() {
		this.formHtml = [
			'<form>',
				'<div class="form-group">',
					'<label><input type="checkbox" name="fruits[]" value="apple"></label>',
					'<label><input type="checkbox" name="fruits[]" value="strawberry"></label>',
				'</div>',
			'</form>'
		].join('');
	});

	it('should error', function() {

		var dominar = new Dominar($(this.formHtml), { 'fruits[]': { rules: 'required|min:1' }});

		dominar.validate('fruits[]');

		var val = dominar.getField('fruits[]').getValue();
		expect(dominar.$form.find('.form-group').hasClass('has-error')).to.be.true;
		expect(val).to.be.instanceof(Array);
		expect(val.length).to.equal(0);

	});

	it('should pass', function() {

		var dominar = new Dominar($(this.formHtml), { 'fruits[]': { rules: 'required|min:1' }});

		dominar.$form.find('input').prop('checked', true);
		dominar.validate('fruits[]');

		expect(dominar.$form.find('.form-group').hasClass('has-success')).to.be.true;
		expect(dominar.getField('fruits[]').getValue()).to.have.members(['apple', 'strawberry']);

	});



});