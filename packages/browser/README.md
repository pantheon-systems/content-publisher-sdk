# Browser

<div align="center">
	<h1>Pantheon Content Publisher SDK for Browsers</h1>
	<p>
		<b>A simple and easy to use browser client for the Pantheon Content Publisher API</b>
	</p>
	<br>
</div>

## Requirements

1. A published Pantheon Content Publisher article
2. A Pantheon Content Publisher Token. Obtain one from the [PCC CLI](https://github.com/pantheon-systems/content-publisher-sdk/tree/main/packages/cli#readme).

## Usage

1. Add the script tags that load the SDK to your HTML file:

```html
<-- Add this to the <head> of your HTML file or right before the closing </body> tag -->
<script
  src="https://unpkg.com/@pantheon-systems/pcc-browser-sdk@latest/dist/index.js"
  data-site-id="<your PCC Site ID>"
  data-token="<your PCC Token>"
></script>
```

2. Add the `pcc-article` custom element to your HTML file. Place it where you want
   the article to be rendered.

```html
<pcc-article id="<id of your article>">
  <!-- Add a fallback message here for when the article is loading... -->
  Loading...
</pcc-article>
```

That's it! You should now see yur article rendered in your browser.

## Options

The `pcc-article` custom element accepts the following attributes:

| Attribute      | Type    | Required                  | Description                                      |
| -------------- | ------- | ------------------------- | ------------------------------------------------ |
| id             | String  | Yes                       | The ID of the article you want to render         |
| slug           | String  | Yes if id is not provided | The slug of the article you want to render       |
| disable-styles | Boolean | No                        | Disable rendering default styles for the article |
