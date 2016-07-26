Dominar
====

[![Build Status](https://travis-ci.org/garygreen/dominar.svg?branch=master)](https://travis-ci.org/garygreen/dominar)

Lightweight and highly configurable boostrap validator built on-top of [validator.js](https://github.com/skaterdav85/validatorjs).

### Usage

```javascript
var validator = new Dominar(document.getElementById('registration-form'), {
   email: {
      rules: 'required|email'
   },
   username: {
      rules: 'required|min:3|max:10',
      triggers: ['keyup', 'change', 'focusout'],
      delay: 300
   }
});
```

**Note:** See below for all possible options. Only `rules` is required.

### Demo

http://garygreen.github.io/dominar/

### Installation

**Bower**
> bower install dominar --save

**NPM**
> npm install dominar --save

**Browser**

The main file to include is `dist/dominar-standalone.js`. If you already have [validator.js](https://github.com/skaterdav85/validatorjs) installed then just simply use `dist/dominar.js`

---

### Main syntax

```javascript
var validator = new Dominar(<form element>, <field options>, [dominar options]);
```

### Available validation rules

* `accepted`
* `alpha`
* `alpha_dash`
* `alpha_num`
* `confirmed`
* `digits:value`
* `different:attribute`
* `email`
* `in:foo,bar,..`
* `integer`
* `max:value`
* `not_in:foo,bar,..`
* `numeric`
* `required`
* `same:attribute`
* `size:value`
* `url`
* `regex:pattern`

See [here](https://github.com/skaterdav85/validatorjs#validation-rules) for more rules & usage details.

### Custom validation rule

```javascript
Dominar.Validator.register('uppercase', function(value) {
   return value.toUpperCase() === value;
}, 'The :attribute must only be uppercase.');
```

### Asynchronous / Ajax validation rules

Use `Dominar.Validator.registerAsync` to register an asynchronous rule.

```javascript
Dominar.Validator.registerAsync('username_availability', function(username, attribute, parameters, passes) {
   // Below example assumes you are using jQuery.
   $.get('/api/check-username', { username: username }, passes)
    .fails(function(response) {
       passes(false, response.message);
    });
});

var dominar = new Dominar(document.getElementById('my-form'), {
   username: {
      rules: 'required|username_availability'
   }
});
```

On **your server** return HTTP status code 200 if validation passes or if not, a `4xx` json response with the error message:

```json
{"message": "Username already taken."}
```

### HTML Structure

By default it is assumed your element is contained inside a `.form-group`

```html
<div class="form-group">
   <label>Username</label>
   <input type="text" name="username"/>
</div>
```

You can change this by supplying the `container` option e.g. `container: 'td'`

### Custom error message

By default error messages are automatically generated for you. If you would like to customise, use the `customMessages` option to specify a custom error message for the rules.

```javascript
username: {
   rules: 'required|min:5',
   customMessages: {
      required: 'Whoops, :attribute field is required!',
      min: 'This needs more characters :('
   }
}
```

## Custom attribute names

By default attribute names are automatically generated in errors based on the name of the attribute. If you would like to override, use the `customAttributes` option:

```javascript
username: {
   rules: 'required|min:5',
   customAttributes: {
      first_name: 'First Name'
   }
}
```

### Customising placement of error messages

Just manually add anywhere inside your `.form-group` a `.help-block` and dominar will automatically detect and use.

```html
<div class="form-group">
   <div class="help-block"></div>
   <input type="text" name="username"/>
</div>
```

Note: by default dominar will automatically add errors message straight after the `input` element.

### Disable submit when failing validation

Just set the `disableSubmit` config option on dominar. It can either be `true`, `false` or a selector-string to disable e.g. `.my-btn-to-disable`

### Changing default options

If you want to change the default options you can simply overwrite on the prototype like in the below example. This is useful if you want to always use e.g. fontawesome icons instead of glyphicons. Of course these are just defaults and can still be customised on a per-field level.

```javascript
// Below example assumes you are using jQuery.
Dominar.prototype.defaults = $.extend({}, Dominar.prototype.defaults, {
   feedbackIcons: {
      error: '<i class="fa fa-remove"></i>',
      success: '<i class="fa fa-check"></i>'
   }
});
```

### Field Options

Option         | Type           | Description
---------------|----------------|-----------------------------------------------------------------------
rules          | string         | Set of rules seperated by pipe
triggers       | array/false    | Determines when validation will be triggered on element. Set to `false` to turn off automatic triggering.
delay          | integer/false  | Delay in triggering validation when typing in a field. Set to `false` to always trigger validation as soon as possible.
delayTriggers  | array          | Determines when validation will be triggered as a delay on element.
container      | string         | The selector for the element container
message        | boolean        | Whether to display error messages or not
customMessages | object         | Set custom error messages for the rules
feedback       | boolean        | Whether to display feedback icon or not
feedbackIcons  | object         | Configure the `success` and `error` feedback icons

### Dominar options

Option            | Type            | Description
------------------|-----------------|-----------------------------------------------------------------------
validateOnSubmit  | boolean         | Whether to validate the form on submit.
disableSubmit     | boolean, string | Whether to disable the submit button when validation is failing. String indicates selector.

## Events

Dominar will fire various events on the `form`. You can listen for the events like:

```javascript
document.getElementById('my-form').addEventListener('dominarInitField', function(event) {
   var dominar = event.detail.dominar;    // The Dominar instance.
   var field = event.detail.dominarField; // The DominarField which has been initialized.
});
```

The `submit` event allows you to prevent the validation from occuring by preventing the default action:

```javascript
document.getElementById('my-form').addEventListener('dominarSubmit', function(event) {
   event.preventDefault(); // Prevent form from being validated
});
```

Name                  | Preventable | Description
----------------------|-------------|----------------------------------------------------------
dominarInitField      | No          | When a `DominarField` has been initialized (useful for adding additional event listeners to the input element etc)
dominarSubmit         | Yes         | When form is about to be submitted and before validation check has been run.
dominarSubmitPassed   | Yes         | When form passed validation and is about to be submitted.
dominarSubmitFailed   | No          | When failed validation check when form was attempted to be submitted.
