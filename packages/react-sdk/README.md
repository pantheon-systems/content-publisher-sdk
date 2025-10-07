# React

<div align="center">
	<h1>Pantheon Content Publisher SDK for React </h1>
	<p>
		<b>A simple and easy to use React client for the Pantheon Content Publisher API</b>
	</p>
	<br>
</div>

## Installation

```console
npm install @pantheon-systems/pcc-react-sdk
```

## Setup

```javascript
import {
  PantheonClient,
  PantheonProvider,
} from "@pantheon-systems/pcc-react-sdk";

// Create a client
const pantheonClient = new PantheonClient();

// Wrap your app in the provider
function App() {
  return (
    // Pass the client to the provider
    <PantheonProvider client={pantheonClient}>
      <Blog />
    </PantheonProvider>
  );
}
```

## Usage

We provide a set of helpers in the form of API helpers, React hooks and React
helper components to get you up and running with the Pantheon Content Publisher
API.

### React Components

#### Article Renderer

The `<ArticleRenderer />` component will render the article received from
Content Publisher by converting the raw article data into React elements you can
style and render in your app.

```javascript
import { ArticleRenderer } from "@pantheon-systems/pcc-react-sdk";

function ArticlePage({ id }) {
  const { article } = useArticle(id);

  return (
    <main>
      {
        // Render the article
        article && <ArticleRenderer article={article} />
      }
    </main>
  );
}
```

### React Hooks

#### useArticle

Fetch an article by ID.

```javascript
import { useArticle } from "@pantheon-systems/pcc-react-sdk";

function Article({ id }) {
  const { article, loading, error } = useArticle(id);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.body }} />
    </div>
  );
}
```

#### useArticles

Fetch a list of available articles.

```javascript
import { useArticles } from "@pantheon-systems/pcc-react-sdk";

function Articles() {
  const { articles, loading, error } = useArticles();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <ul>
      {articles.map((article) => (
        <li key={article.id}>
          <a href={`/articles/${article.id}`}>{article.title}</a>
        </li>
      ))}
    </ul>
  );
}
```

### API Helpers

These helpers are used to fetch data from the Pantheon Content Publisher API
outside of the React component lifecycle.

They are useful for fetching data in server-side rendered applications or in
other contexts where React hooks cannot be used.

#### getArticle

Fetch an article by ID.

```javascript
import { getArticle } from "@pantheon-systems/pcc-react-sdk";

// In Next.js getServerSideProps for example

export async function getServerSideProps({ params }) {
  const article = await getArticle(
    pantheonClient, // The PantheonClient instance initialized in [Setup](#Setup)
    params.id,
  );

  return {
    props: {
      article,
    },
  };
}
```

#### getArticles

Fetch a list of available articles, excluding their content.

```javascript
import { getArticles } from "@pantheon-systems/pcc-react-sdk";

// In Next.js getStaticPaths for example
export async function getStaticPaths() {
  const articles = await getArticles(pantheonClient); // The PantheonClient instance initialized in [Setup](#Setup)

  const paths = articles.map((article) => ({
    params: { slug: article.id },
  }));

  return {
    paths,
    fallback: true,
  };
}
```

#### Creating your own smart components

Create the smart component

```javascript
import { forwardRef } from "react";
import { useBaseSmartComponent } from "./hooks/useBaseSmartComponent";

const MyAwesomeComponent = forwardRef(function ({ title, body }, ref) {
  useBaseSmartComponent();

  return <div><h3>{title}</h3><p>{body}</p></div>;
```

Provide it to the PantheonAPI's smart component map. (Note that other properties
should be passed in too, such as getPantheonClient and resolvePath). See the
NextJS starter kit for a clearer reference.

```javascript
PantheonAPI({
  smartComponentMap: {
    AWESOME_COMPONENT: {
      reactComponent: MyAwesomeComponent,
      title: "My Awesome Component",
      iconUrl: null,
      fields: {
        title: {
          required: true,
          type: "string",
        },
        body: {
          required: false,
          type: "string",
        },
      },
    },
  },
});
```
