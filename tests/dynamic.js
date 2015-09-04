var expect = window.chai.expect;
var Dominar = require('../src/dominar');

describe('can add dynamic elements', function() {

	it('should add matched jQuery elements', function() {

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

		dominar.add($form.find('.user-name'), {
			rules: 'required|min:1',
			container: 'td',
			feedback: false
		});

		dominar.validateAll();

		expect($form.html()).to.equal([
			'<table>',
				'<thead>',
					'<tr>',
						'<th>name</th>',
					'</tr>',
				'</thead>',
				'<tbody>',
					'<tr>',
						'<td class="has-error">',
							'<input name="users[0][name]" type="text" class="user-name">',
							'<span class="help-block">The users[0][name] field is required.</span>',
						'</td>',
					'</tr>',
					'<tr>',
						'<td class="has-error">',
							'<input name="users[1][name]" type="text" class="user-name">',
							'<span class="help-block">The users[1][name] field is required.</span>',
						'</td>',
					'</tr>',
				'</tbody>',
			'</table>',
		].join(''));
	});

});