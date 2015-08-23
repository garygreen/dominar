var expect = window.chai.expect;

describe('event tests', function() {

	this.timeout(100);

	beforeEach(function() {
		this.dominar = new Dominar($('<form><input name="username" type="text"></form>'), { username: { rules: 'required' } });
		this.dominar.$form.on('submit', function(event) {
			event.preventDefault();
		});

	});

	afterEach(function() {
		this.dominar.$form.unbind(this.event);
	});

	it('should trigger a "dominar.init-field" event when field is initialized', function(done) {

		var dominar = this.dominar;

		dominar.$form.bind('dominar.init-field', function(event) {
			expect(event.dominar).to.equal(dominar);
			expect(event.dominarField.$field.attr('name')).to.equal('username');
			done();
		});

		this.dominar.getField('username');

		this.event = 'dominar.init-field';
	});


	it('should fire a "dominar.submit" event when form is submitted and allow it to be prevented.', function(done) {

		this.dominar.$form.on('submit', function(event) {
			event.preventDefault();
		});

		this.dominar.$form.bind('dominar.submit', function(event) {
			event.preventDefault();
			done();
		});

		this.dominar.$form.submit();

		this.event = 'dominar.submit';

	});


	it('should fire a "dominar.submit-passed" event when form passed validation and allow it to be prevented.', function(done) {

		var dominar = this.dominar;

		var $username = dominar.$form.find('input');
		$username.val('test');

		dominar.$form.bind('dominar.submit-passed', function(event) {
			event.preventDefault();
			$username.val('');
			done();
		});

		dominar.$form.submit();

		this.event = 'dominar.submit-passed';

	});


	it('should fire a "dominar.submit-failed" event when form fails validation.', function(done) {

		this.dominar.$form.bind('dominar.submit-failed', function(event) {
			done();
		});

		this.dominar.$form.submit();

		this.event = 'dominar.submit-failed';

	});

});
