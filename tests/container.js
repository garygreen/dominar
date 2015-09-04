var expect = window.chai.expect;
var Dominar = require('../src/dominar');

describe('container tests', function() {

	it('should allow override of container', function() {

		var $form;
		var dominar = new Dominar($form = $('<form><table><tr><td><input name="username" type="text"/></td></tr></table</form>'), {
			username: {
				rules: 'required|min:1',
				container: 'td',
				message: true,
				feedback: false
			}
		});

		var $username = $form.find('[name=username]');
		dominar.validate($username);
		expect($form.html()).to.equal([
			'<table>',
				'<tbody>',
					'<tr>',
						'<td class="has-error">',
							'<input name="username" type="text">',
							'<span class="help-block">The username field is required.</span>',
						'</td>',
					'</tr>',
				'</tbody>',
			'</table>'
		].join(''));

	});

});