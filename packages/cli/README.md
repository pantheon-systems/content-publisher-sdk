# CLI

<div align="center">
	<h1>Content Publisher Toolkit</h1>
	<p>
		<b>Content Publisher toolkit for setting up projects.</b>
	</p>
	<br>
</div>

## Installation

npm

```console
npm install @pantheon-systems/cpub --global
```

yarn

```console
yarn add @pantheon-systems/cpub --global
```

## Usage

```bash
# Login the user
$ pcc login

# Create project with nextjs template
$ pcc init new_proj

# Create project using pnpm package manager
$ pcc init new_proj --use-pnpm

# Create Typescript project and setup ESLint in it
$ pcc init new_proj --ts --eslint

# Create project without installing dependencies
$ pcc init new_proj --noInstall

# Create project and provide site ID to pre-populate .env file with
$ pcc init new_proj --site-id 123456789example1234

# Create new token
$ pcc token create

# Create new site
$ pcc site create --url test-site.com

# Get webhooks event delivery logs for a site ID
$ pcc site webhooks history 123456789example1234

# Generate preview link for given document ID
$ pcc document preview 1234567890example1234567890exam_ple123456789

# Generate preview link for given document URL
$ pcc document preview https://docs.google.com/document/d/1234567890example1234567890exam_ple123456789

# Get details of logged-in user
$ pcc whoami

# Logout the user
$ pcc logout

```

## Import existing content from a Drupal site

You must ensure that the JSON API for your Drupal site is enabled (which it
should be by default).
https://www.drupal.org/docs/core-modules-and-themes/core-modules/jsonapi-module/api-overview

Once you've ensured that it's working, you will need to determine the URL which
Content Publisher client can use to get the initial results page of posts (e.g.
https://example.com/jsonapi/node/article). But please note that the exact URL
will depend on which resource type(s) you want to import.

The second and last piece of information you will need before proceeding to
import, is the id of the Content Publisher collection which the posts should be
imported into. Posts are NOT going to be published automatically after
importing, but they will be automatically connected to the site id provided.

With this information, you can now run the import command.

```bash
$ pcc import drupal https://example.com/jsonapi/node/article siteid12345
```
