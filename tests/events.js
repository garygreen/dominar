var expect = window.chai.expect;

describe('event tests', function() {

	this.timeout(100);

	it('should trigger a "dominar.init-field" event when field is initialized', function(done) {

		var $form;
		var dominar = new Dominar($form = $('<form><input name="username" type="text"></form>'), { username: {} });

		$form.bind('dominar.init-field', function(event) {
			expect(event.dominar).to.equal(dominar);
			expect(event.dominarField.$field.attr('name')).to.equal('username');
			done();
		});

		dominar.getField('username');
	});


	it('should fire a "dominar.submit" event when form is submitted and allow it to be prevented.', function(done) {

		var $form;
		var dominar = new Dominar($form = $('<form></form>'));

		$form.bind('dominar.submit', function(event) {
			event.preventDefault();
			done();
		});

		$form.submit();

	});


	it('should fire a "dominar.submit-passed" event when form passed validation and allow it to be prevented.', function(done) {

		var $form;
		var dominar = new Dominar($form = $('<form></form>'));

		$form.bind('dominar.submit-passed', function(event) {
			event.preventDefault();
			done();
		});

		$form.submit();

	});


	it('should fire a "dominar.submit-failed" event when form fails validation.', function(done) {

		var $form;
		var dominar = new Dominar($form = $('<form><input name="username" type="text"></form>'), { username: { rules: 'required' } });

		$form.bind('dominar.submit-failed', function(event) {
			done();
		});

		$form.submit();

	});

});
