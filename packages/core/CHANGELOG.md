# @pantheon-systems/pcc-sdk-core

## 5.0.1

### Patch Changes

- 40af988: - The `status` endpoint returns richer diagnostics to help with
  debugging issues.
  - The `status` endpoint response also now includes a `platform` section with
    framework specific diagnostics.

## 5.0.0

### Minor Changes

- 654325d: Added support for the DRAFT publishing level and versionIds

### Patch Changes

- dd8541f: `getArticleURLFromSite` only returns slugs in the url for published
  articles

## 5.0.0-beta.2

## 5.0.0-beta.1

## 5.0.0-beta.0

### Minor Changes

- 654325d: Added support for the DRAFT publishing level and versionIds

### Patch Changes

- dd8541f: `getArticleURLFromSite` only returns slugs in the url for published
  articles

## 4.0.0

### Major Changes

- a6c7134: Now supporting tabbed content.

## 3.13.1

### Minor Changes

- Bump to 3.13.1

## 3.12.1

## 3.12.0

## 3.11.3

## 3.11.2

### Patch Changes

- b8be0ac: Have the option to accept multiple values for any smart-component
  field values

## 3.11.1

### Patch Changes

- b72e906: Fix browser SDK referencing process.env even from client-side pages.
- 548a31f: - Tries to fetch the site info from pantheon client rather than
  convenience functions in pantheon-api.ts
  - If the client is not defined or if pcc grant is used to initialize the
    client, we dont fetch the site.
  - If the site is not fetched, the path computed for an article is just
    basepath/slug-or-id

## 3.11.1-beta.2

## 3.11.1-beta.1

## 3.11.1-beta.0

### Patch Changes

- b72e906: Fix browser SDK referencing process.env even from client-side pages.
- 548a31f: - Tries to fetch the site info from pantheon client rather than
  convenience functions in pantheon-api.ts
  - If the client is not defined or if pcc grant is used to initialize the
    client, we dont fetch the site.
  - If the site is not fetched, the path computed for an article is just
    basepath/slug-or-id

## 3.11.0

### Minor Changes

- a407141: - Added functionality in the pcc-sdk-core to compute the path of an
  article from the site's content structure. This will be the path at which the
  article will be visible.
  - If someone tries to access the article without the full path, it will be
    redirected to the full path.
  - Developers can use the default functionality as is and also customise the
    path generation to only include the id or slug and a configurable number of
    parents.

## 3.10.0

### Minor Changes

- 572fb97: Add support for metadata groups (like authors).

### Patch Changes

- 67bc79b: Use 'label' for metadata group record identifiers instead of 'name'
- 400fc48: Allow caller to retrieve all metadata groups, optionally hydrated.

## 3.10.0-beta.2

### Patch Changes

- 67bc79b: Use 'label' for metadata group record identifiers instead of 'name'

## 3.10.0-beta.1

### Patch Changes

- 400fc48: Allow caller to retrieve all metadata groups, optionally hydrated.

## 3.10.0-beta.0

### Minor Changes

- 572fb97: Add support for metadata groups (like authors).

## 3.9.0

### Minor Changes

- 9adfb1a: Component schema supports special 'variant' attribute.

## 3.9.0-beta.0

### Minor Changes

- 4267508: Component schema supports special 'variant' attribute.

## 3.8.1

### Patch Changes

- 61c7d15: Add 'preamble' property for searches with summary.
- Fixed issue where sometimes the question input appeared to hang.

## 3.8.0

## 3.7.0

### Patch Changes

- 11e0509: Fixed issue where some GQL parameters would not be passed to the API
  in `getAllArticles`
- 87fdf27: PCC-GRANT (preview token) cookie now set with most relaxed security
  so that preview-pages can be shown in iframes.

## 3.6.1

### Patch Changes

- 183ad17: Added queries and helper methods for fetching site information

## 3.6.0

### Patch Changes

- 61363af: Fixes issue where redirects to local preview/publish targets would be
  redirected to https://localhost
- 3651708: Fix how protocols are being forwarded by API handler.
- 61363af: Removes inline sourcemaps. Sourcemaps are still provided, just linked
  in separate files instead.

## 3.6.0-beta.3

## 3.6.0-beta.2

## 3.6.0-beta.1

### Patch Changes

- Fix how protocols are being forwarded by API handler.

## 3.6.0-beta.0

## 3.5.3

### Patch Changes

- Fix type export for Article

## 3.5.3-beta.0

### Patch Changes

- Fix type export for Article

## 3.5.2

### Patch Changes

- fcfa574: Fix graphql error handling issue which caused sites to show error
  pages instead of 404.
- 289e05c: Add updateConfig function which will override the default PCC
  connection settings that PCCConvenienceFunctions will use.

## 3.5.2-beta.1

### Patch Changes

- Add updateConfig function which will override the default PCC connection
  settings that PCCConvenienceFunctions will use.

## 3.5.2-beta.0

### Patch Changes

- Fix graphql error handling issue which caused sites to show error pages
  instead of 404.

## 3.5.1

## 3.5.0

### Patch Changes

- 0e74720: Add textarea to supported smartcomponent metadata fields
- 4cab3e2: Fix how JSON was returned, headers were set, and redirect codes were
  checked for PantheonAPI affecting Nextjs page router implementations.

## 3.4.1

### Patch Changes

- 19f9ac8: Fix how preview JWT token is set from PantheonAPI

## 3.4.0

### Minor Changes

- 37e1c39: PantheonAPI now supports app router.
- 5124a8b: Added support for `metadataFilters` parameter sent to GraphQL API.

## 3.3.3

## 3.3.2

## 3.3.1

### Patch Changes

- 63537f7: Consume article search results snippets from the backend (GQL).

## 3.3.0

### Patch Changes

- Fixed implementation of PCCConvenienceFunctions.getArticleBySlugOrId

## 3.2.1

### Patch Changes

- 8e880f2: Ability to retrieve gen AI summary results for a search query.

## 3.2.0

### Minor Changes

- - More detailed Apollo errors will be surfaced from the SDK.
  - Bump minimum React version to 18.
  - Gracefully handle rendering errors that occur inside smart components.
  - Added disableAllStyles to the Vue SDK (React SDK already had this).
  - Simplified SDK integration. Less boilerplate needed to turn on by using
    commonsense defaults under the hood. New PCCConvenienceFunctions utilities
    object which provides what used to be in the boilerplate (such as
    getAllArticles, getArticleBySlugOrId, getRecommendedArticles, and getTags).

## 3.1.2

### Patch Changes

- Pagination query is no longer the default.

## 3.1.1

## 3.1.0

### Minor Changes

- 282e854: Support paginated articles

## 0.1.0

### Minor Changes

- Update React and Vue SDK to depend on core package

  Core package updated to export types and static helpers

  Vue package updated to support subscriptions
