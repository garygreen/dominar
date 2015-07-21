var assert, Dominar;

if (typeof require !== 'undefined')
{
	assert = require('chai').assert,
	Dominar = require('../src/dominar-standalone.js');
}
else
{
	// Browser testing support
	assert  = window.chai.assert;
	Dominar = window.Dominar;
}

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
		assert.equal($form.html(), [
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