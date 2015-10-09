/**
 * Query selector shortcut.
 *
 * @param  {string|Array} selector
 * @param  {Node} context
 * @return {Array|null}
 */
function $(selector, context) {
	if (selector instanceof Array) {
		return selector;
	}

	return Array.prototype.slice.call(context.querySelectorAll(selector));
}

/**
 * No operation function.
 *
 * @return {void}
 */
function noop()
{

}

/**
 * Super basic extend obj2 into obj1, overwriting obj1 on clashing keys.
 *
 * @param  {object} obj1
 * @param  {object} obj2
 * @return {object}
 */
function extend(obj1, obj2)
{
	var obj = {};
	for (var i in obj1) {
		obj[i] = obj1[i];
	}
	for (var i in obj2) {
		obj[i] = obj2[i];
	}
	return obj;
}

/**
 * Get matches selector.
 *
 * @param  {Node} elem
 * @return {function}
 */
function matchesSelector(elem) {
	return elem.matches || elem.webkitMatchesSelector || elem.mozMatchesSelector || elem.msMatchesSelector;
}

/**
 * Get field's values from given set of elements.
 *
 * @param  {array} fields
 * @return {mixed}
 */
function elementValues(fields)
{
	var type = fields[0].type;
	if (type == 'radio' || type == 'checkbox')
	{
		for (var i = 0, len = fields.length, field, values = []; i < len; i++) {
			field = fields[i];
			if (field.checked)
			{
				values.push(field.value);
			}
		}

		if (type == 'radio')
		{
			return values.shift();
		}

		return values;
	}
	return fields[0].value;
}

/**
 * Element wrapper.
 *
 * @param {Node|string} element
 */
function Element(element)
{
	if (typeof element === 'string') {
		element = document.createElement(element);
	}
	this.element = element;
}

Element.prototype = {

	/**
	 * Determine if element has the given class.
	 *
	 * @param  {string}  className
	 * @return {Boolean}
	 */
	hasClass: function(className) {
		var matchSelector = matchesSelector(this.element);
		return matchSelector.call(this.element, '.' + className);
	},

	/**
	 * Add classes.
	 *
	 * @param {string} className
	 * @return {this}
	 */
	addClass: function(className) {
		var elementClasses = this.element.className;
		if (!this.hasClass(className)) {
			this.element.className += (elementClasses.length ? ' ' : '') + className;
		}
		return this;
	},

	/**
	 * Remove classes.
	 *
	 * @param  {string} className
	 * @return {this}
	 */
	removeClass: function(className) {
		var classNames = className.split(' ');
		var elementClasses = this.element.className;
		for (var i = 0, len = classNames.length; i < len; i++) {
			className = classNames[i];
			if (this.hasClass(className)) {
				elementClasses = elementClasses.replace(new RegExp("(^|\\s)" + className + "(\\s|$)"), " ").replace(/\s$/, "");
			}
		}

		this.element.className = elementClasses;
		return this;
	},

	/**
	 * Find element.
	 *
	 * @param  {string} selector
	 * @return {Array}
	 */
	find: function(selector) {
		return $(selector, this.element);
	},

	/**
	 * Find closest ancestor.
	 *
	 * @param  {string} selector
	 * @return {Node}
	 */
	closest: function(selector) {
		var firstChar = selector.charAt(0);
		var elem = this.element.parentElement;
		var matchSelector = matchesSelector(elem);

		// Get closest match
		while (elem) {

			// If selector is a class
			if (matchSelector.call(elem, selector)) {
				return elem;
			}

			elem = elem.parentElement;
		}
		

		return null;
	},

	/**
	 * Get raw node.
	 *
	 * @return {Node}
	 */
	get: function() {
		return this.element;
	}
};


module.exports = {
	$: $,
	element: function(element) { return new Element(element); },
	noop: noop,
	extend: extend,
	elementValues: elementValues
};
