var expect = window.chai.expect;
var Dominar = require('../src/dominar');

describe('container tests', function() {

	it('should allow override of container', function() {

		var dominar = new Dominar($('<form><table><tr><td><input name="username" type="text"/></td></tr></table</form>')[0], {
			username: {
				rules: 'required|min:1',
				container: 'td',
				message: true,
				feedback: false
			}
		});

		dominar.validate('username');
		expect($(dominar.form).html()).to.equal([
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