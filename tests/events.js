var expect = window.chai.expect;
var Dominar = require('../src/dominar');

describe('event tests', function() {

	this.timeout(100);

	function submit(form) {
		form.querySelector('button').click();
	};

	beforeEach(function() {
		this.dominar = new Dominar($('<form><div class="form-group"><input name="username" type="text"></div><button type="submit">Submit</button></form>'), { username: { rules: 'required' } });
		this.dominar.$form[0].addEventListener('submit', this.submitHandler = function(event) {
			event.preventDefault();
		});
	});

	afterEach(function() {
		this.dominar.$form[0].removeEventListener(this.event, this.eventHandler);
	});

	it('should trigger a "dominarInitField" event when field is initialized', function(done) {

		var dominar = this.dominar;

		dominar.$form[0].addEventListener('dominarInitField', this.eventHandler = function(event) {
			expect(event.detail.dominar).to.equal(dominar);
			expect(event.detail.dominarField.fields[0].name).to.equal('username');
			done();
		});

		this.dominar.getField('username');

		this.event = 'dominarInitField';
	});


	it('should fire a "dominarSubmit" event when form is submitted and allow it to be prevented.', function(done) {

		this.dominar.$form[0].removeEventListener(this.submitHandler);

		this.dominar.$form[0].addEventListener('dominarSubmit', this.eventHandler = function(event) {
			event.preventDefault();
			done();
		});

		submit(this.dominar.$form[0]);

		this.event = 'dominarSubmit';

	});


	it('should fire a "dominarSubmitPassed" event when form passed validation and allow it to be prevented.', function(done) {

		var dominar = this.dominar;

		dominar.$form[0].removeEventListener(this.submitHandler);

		var $username = dominar.$form.find('input');
		$username.val('test');

		dominar.$form[0].addEventListener('dominarSubmitPassed', this.eventHandler = function(event) {
			event.preventDefault();
			$username.val('');
			done();
		});

		submit(dominar.$form[0]);

		this.event = 'dominarSubmitPassed';

	});


	it('should fire a "dominarSubmitFailed" event when form fails validation.', function(done) {

		this.dominar.$form[0].addEventListener('dominarSubmitFailed', this.eventHandler = function(event) {
			done();
		});

		submit(this.dominar.$form[0]);

		this.event = 'dominarSubmitFailed';

	});

});
