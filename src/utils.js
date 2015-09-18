function $(selector, context) {
	if (selector instanceof Array) {
		return selector;
	}

	return context.querySelectorAll(selector);
}

function noop()
{

}

// function Element(element)
// {
// 	this.element = element;
// }

// Element.prototype = {

// 	hasClass: function(className) {
// 		return (' ' + this.element.className + ' ').indexOf(' ' + className +' ') > -1;
// 	},

// 	addClass: function(className) {
// 		if (!this.hasClass(className)) {
// 			this.element.className += ' ' + className;
// 		}
// 	},

// 	removeClass: function(className) {
// 		if (this.hasClass(className)) {
// 			this.element.className = this.element.className.replace(new RegExp("(^|\\s)" + className + "(\\s|$)"), " ").replace(/\s$/, "");
// 		}
// 	},

// 	find: function(selector) {
// 		return $(selector, this.element);
// 	}
// };


module.exports = {
	$: $,
	Element: Element,
	noop: noop
};
