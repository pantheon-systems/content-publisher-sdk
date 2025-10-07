# VUE

### IMPORTANT NOTE

This package has been **deprecated**, but remains here in case there is a developer who may benefit from using this as an (outdated) integration reference in the future.

<div align="center">
	<h1>Pantheon Content Publisher SDK for Vue.js</h1>
	<p>
		<b>A simple and easy to use Vue client for the Pantheon Content Publisher API</b>
	</p>
	<br>
</div>

## Installation

```console
npm install @pantheon-systems/pcc-vue-sdk
```

## Setup

Initialize the Pantheon Content Publisher plugin with your PCC instance URL and site
identifier.

```javascript
import { pccPlugin } from "@pantheon-systems/pcc-vue-sdk";

createApp(App)
  // Install the plugin
  .use(pccPlugin, {
    siteId: import.meta.env.VITE_PCC_SITE_ID, // PCC Site Id; required
    token: import.meta.env.VITE_PCC_TOKEN, // PCC Token; required
  })
  .mount("#app");
```

## Usage

This package exports composables and helper components to get you up and running
with the Pantheon Content Publisher API.

### Components

#### Article Renderer

The `<ArticleRenderer />` component will render the article received from
Content Publisher by converting the raw article data into HTML elements you can
style and render in your app.

```vue
<script setup>
import { useArticle } from "@pantheon-systems/pcc-vue-sdk";
import { ArticleRenderer } from "@pantheon-systems/pcc-vue-sdk/components";

// Import the default styles
import "@pantheon-systems/pcc-vue-sdk/components/style.css";

const { id } = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const { result, loading, error } = useArticle(id);
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-if="error">{{ error }}</div>
  <div v-if="result">
    <h1>{{ result.article.title }}</h1>
    <ArticleRenderer :article="result.article" />
  </div>
</template>
```

### Composables

All composables use the [`Vue Apollo` library](https://v4.apollo.vuejs.org/)
under the hood and return the same `result`, `loading`, `error` refs among
[other properties](https://v4.apollo.vuejs.org/api/use-query.html#return).

#### useArticle

Fetch an article by ID.

```vue
<script setup>
import { useArticle } from "@pantheon-systems/pcc-vue-sdk";
import { ArticleRenderer } from "@pantheon-systems/pcc-vue-sdk/components";

// Import the default styles
import "@pantheon-systems/pcc-vue-sdk/components/style.css";

const { id } = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const { result, loading, error } = useArticle(id);
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-if="error">{{ error }}</div>
  <div v-if="result">
    <h1>{{ result.article.title }}</h1>
    <ArticleRenderer :article="result.article" />
  </div>
</template>
```

#### useArticles

Fetch a list of available articles. This query does not include the article
content.

```vue
<script setup>
import { useArticles } from "@pantheon-systems/pcc-vue-sdk";

const { id } = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const { result, loading, error } = useArticle(id);
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-if="error">{{ error }}</div>
  <template v-if="result">
    <div v-for="article in result.articles" :key="article.id">
      <h1>{{ article.title }}</h1>
      <p>{{ article.tags.join(", ") }}</p>
    </div>
  </template>
</template>
```
