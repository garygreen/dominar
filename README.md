Dominar
====

Lightweight and highly configurable boostrap validator built on-top of [validator.js](https://github.com/skaterdav85/validatorjs).

### Usage

```javascript
var validator = new Dominar($('form'), {
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

---

### HTML Structure

By default it is assumed your element is contained inside a `.form-group`

```html
<div class="form-group">
	<label>Username</label>
	<input type="text" name="username"/>
</div>
```

You can change this by supplying the `container` option e.g. `container: 'td'`

### Custom validation rule

Add a custom validation rule:

```javascript
Dominar.register('uppercase', function(value) {
	return value.toUpperCase() === value;
}, 'The :attribute must only be uppercase.');
```

### Asynchronous / Ajax validation rules

Use `remoteRule` which takes a deferred object (like `$.ajax` and `$.get` returns).

```javascript
var dominar = new Dominar($('form'), {
   username: {
      rules: 'required',
      remoteRule: function(desiredUsername) {
         return $.get('/api/check-username', { username: desiredUsername });
      }
   }
});
```

On **your server** return HTTP status code 200 if validation passes or if not, a `4xx` json response with the error message:

```json
{"message": "Username already taken."}
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

### Options

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
remoteRule     | function       | Asynchronous rule to run