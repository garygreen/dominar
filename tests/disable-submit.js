var expect = window.chai.expect;
var Dominar = require('../src/dominar');

describe('disableSubmit tests', function() {

	function submit(dominar, $submitElement, cb) {
		dominar.form.addEventListener('submit', this.submitHandler = function(event) {
			event.preventDefault();
		});

		setTimeout(function() {
			$submitElement[0].click();

			cb();
		}, 1);
	}

	it('should disable the submit button if form failing validation', function() {

		var dominar = new Dominar($('<form><div class="form-group"><input name="username"><input type="submit"></div></form>')[0], {
			username: {
				rules: 'required',
				feedback: false,
				message: true
			}
		}, {
			disableSubmit: true
		});

		submit(dominar, $(':submit', dominar.form), function() {
			expect($(':submit', dominar.form).prop('disabled')).to.be.true;
		});

	});

	it('should disable the given submit selector if form failing validation', function() {

		var dominar = new Dominar($('<form><div class="form-group"><input name="username"><button type="submit" class="submit-1"></button><button type="submit" class="submit-2"></button></div></form>')[0], {
			username: {
				rules: 'required',
				feedback: false,
				message: true
			}
		}, {
			disableSubmit: '.submit-2'
		});

		submit(dominar, $('.submit-2', dominar.form), function() {

			expect($('.submit-1', dominar.form).prop('disabled')).to.be.false;
			expect($('.submit-2', dominar.form).prop('disabled')).to.be.true;

		});

	});

	it('should enable the submit button if form passes', function() {

		var dominar = new Dominar($('<form><div class="form-group"><input name="username" value="gary"><input type="submit"></div></form>')[0], {
			username: {
				rules: 'required',
			}
		}, {
			disableSubmit: true
		});

		submit(dominar, $(':submit', dominar.form), function() {
			expect($(':submit', dominar.form).prop('disabled')).to.be.false;
		});
		
	});

	it('should not disable submit if form fails and disableSubmit option is false', function() {

		var dominar = new Dominar($('<form><div class="form-group"><input name="username"><input type="submit"></div></form>')[0], {
			username: {
				rules: 'required',
			}
		}, {
			disableSubmit: false
		});

		submit(dominar, $(':submit', dominar.form), function() {
			expect($(':submit', dominar.form).prop('disabled')).to.be.false;
		});

	});

});
