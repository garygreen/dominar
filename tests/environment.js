var expect = window.chai.expect;
var Dominar = require('../src/dominar');
var DominarField = require('../src/dominar-field');
var Utils = require('../src/utils');
var Validator = require('validatorjs');

describe('initialisation', function() {

	it('should be able to initialise dominar', function() {
		var dominar = new Dominar($('<form/>')[0], {

		});
	});

	it('should be globally available', function() {
		expect(window.Dominar).to.be.defined;
	});

	it('should default options to', function() {

		expect(Dominar.prototype.defaults).to.deep.equal({
			container: '.form-group',
			delay: 300,
			delayTriggers: ['keyup'],
			rules: '',
			triggers: ['keyup', 'focusout', 'change'],
			message: true,
			customMessages: {},
			customAttributes: {},
			feedback: true,
			feedbackIcons: {
				success: '<i class="glyphicon glyphicon-check"></i>',
				error: '<i class="glyphicon glyphicon-remove"></i>'
			}
		});

	});

	it('should default config to', function() {

		expect(Dominar.prototype.configDefaults).to.deep.equal({
			validateOnSubmit: true,
			disableSubmit: false,
			triggers: ['keyup', 'focusout', 'change']
		});

	});

	it('should expose the validator', function() {

		expect(Dominar.Validator).to.equal(Validator);

	});

});

describe('basic validation and option testing', function() {

	it('should show just error', function() {
		var dominar = new Dominar($('<form><div class="form-group"><input name="username"></div></form>')[0], {
			username: {
				rules: 'required',
				feedback: false,
				message: true
			}
		});

		dominar.validate('username');
		expect($(dominar.form).html()).to.equal([
			'<div class="form-group has-error">',
				'<input name="username"><span class="help-block">The username field is required.</span>',
			'</div>'
		].join(''));
	});

	// it('should show error on keyup', function() {
		
	// 	var dominar = new Dominar($('<form><div class="form-group"><input name="username"></div></form>'), {
	// 		username: {
	// 			rules: 'required',
	// 			feedback: false,
	// 			message: false
	// 		}
	// 	});

	// 	var spy = sinon.spy(dominar, 'validateDelayed');

	// 	dominar.$form.find('input').trigger('keyup');

	// 	setTimeout(function() {
	// 		expect(spy.called).to.be.true
	// 	}, 50);

	// 	// console.log(dominar.$form.find('.form-group'));
	// 	// setTimeout(function() {
	// 	// 	expect(dominar.$form.find('.form-group').hasClass('has-error')).to.be.true;
	// 	// }, 2000);
	// });

	it('should allow getting a field by name', function() {

		var dominar = new Dominar($('<form><div class="form-group"><input name="username"></div></form>')[0], { username: {} });
		var field = dominar.getField('username');
		expect(field).to.be.instanceof(DominarField);
		expect(field.name).to.equal('username');

	});

	it('should be able to destroy', function() {

		var dominar = new Dominar($('<form><div class="form-group"><input name="username"></div></form>')[0], { username: {} });

		dominar.getField('username').showError('test');

		var $form = $(dominar.form);
		expect($form.find('.form-group').hasClass('has-error')).to.be.true;
		expect($form.find('.form-control-feedback').length).to.equal(1);
		expect($form.find('.help-block').html()).to.equal('test');

		dominar.destroy();

		expect($form.find('.form-group').hasClass('.has-error')).to.be.false;
		expect($form.find('.help-block').html().length).to.equal(0);
		expect($form.find('.form-control-feedback').html().length).to.equal(0);

	});

});