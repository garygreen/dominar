var expect = window.chai.expect;
var Dominar = require('../src/dominar');

describe('can add dynamic elements', function() {

	it('should add matched array elements', function() {

		var $form;
		var dominar = new Dominar($form = $([
			'<form>',
				'<table>',
					'<thead>',
						'<tr>',
							'<th>name</th>',
						'</tr>',
					'</thead>',
					'<tbody>',
						'<tr>',
							'<td><input name="users[0][name]" type="text" class="user-name"/></td>',
						'</tr>',
						'<tr>',
							'<td><input name="users[1][name]" type="text" class="user-name"/></td>',
						'</tr>',
					'</tbody>',
				'</table>',
			'</form>'
		].join('')));

		dominar.add($form.find('.user-name').toArray(), {
			rules: 'required|min:1',
			container: 'td',
			feedback: false
		});

		dominar.validateAll();

		var $tds = $form.find('td');
		expect($tds.eq(0).hasClass('has-error')).to.be.true;
		expect($tds.eq(0).find('.help-block').html()).to.equal('The users 0 name field is required.');

		expect($tds.eq(1).hasClass('has-error')).to.be.true;
		expect($tds.eq(1).find('.help-block').html()).to.equal('The users 1 name field is required.');
	});

});
