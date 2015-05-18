Dominar
====

Ultra lightweight and highly configurable boostrap validator built on-top of [validator.js](https://github.com/skaterdav85/validatorjs).

### Usage

```javascript
var validator = new Dominar($('form'), {
   username: {
      rules: 'required|min:3|max:10',
      trigger: ['blur', 'change'],
      delay: 300
   },
   email: {
      rules: 'required|email'
   }
});
```

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

Option        | Type           | Description
--------------|----------------|-----------------------------------------------------------------------
rules         | string         | Set of rules seperated by pipe
triggers      | array/false    | Determines when validation will be triggered on element. Set to `false` to turn off automatic triggering.
delay         | integer/false  | Delay in triggering validation when typing in a field. Set to `false` to always trigger validation as soon as possible.
container     | string         | The selector for the element container
message       | boolean        | Whether to display error messages or not
feedback      | boolean        | Whether to display feedback icon or not
feedbackIcons | object         | Configure the `success` and `error` feedback icons
remoteRule    | function       | Asynchronous rule to run