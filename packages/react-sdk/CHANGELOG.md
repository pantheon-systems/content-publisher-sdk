# @pantheon-systems/pcc-react-sdk

## 5.0.1

### Patch Changes

- 40af988: - The `status` endpoint returns richer diagnostics to help with
  debugging issues.
  - The `status` endpoint response also now includes a `platform` section with
    framework specific diagnostics.
- Updated dependencies [40af988]
  - @pantheon-systems/pcc-sdk-core@5.0.1

## 5.0.0

### Major Changes

- a780941: Now requiring Next 15 and React 19

### Minor Changes

- 654325d: Added support for the DRAFT publishing level and versionIds

### Patch Changes

- 45c39b4: Fixes issue with deprecated renderTitle prop which would cause
  article elements to get removed from the body.
- f88e3da: cdnURLOverride now allows you to provide a function to rewrite the
  url.
- bb12fa0: Multi-collection search through articlesv3 now supported
- a7db2dc: Fixed issue with realtime updates not causing re-renders in
  useArticle hook in React 19
- Updated dependencies [654325d]
- Updated dependencies [dd8541f]
  - @pantheon-systems/pcc-sdk-core@5.0.0

## 5.0.0-beta.2

### Patch Changes

- 45c39b4: Fixes issue with deprecated renderTitle prop which would cause
  article elements to get removed from the body.
  - @pantheon-systems/pcc-sdk-core@5.0.0-beta.2

## 5.0.0-beta.1

### Patch Changes

- bb12fa0: Multi-collection search through articlesv3 now supported
  - @pantheon-systems/pcc-sdk-core@5.0.0-beta.1

## 5.0.0-beta.0

### Major Changes

- a780941: Now requiring Next 15 and React 19

### Minor Changes

- 654325d: Added support for the DRAFT publishing level and versionIds

### Patch Changes

- f88e3da: cdnURLOverride now allows you to provide a function to rewrite the
  url.
- Updated dependencies [654325d]
- Updated dependencies [dd8541f]
  - @pantheon-systems/pcc-sdk-core@5.0.0-beta.0

## 4.0.0

### Major Changes

- a6c7134: Now supporting tabbed content.

### Patch Changes

- Updated dependencies [a6c7134]
  - @pantheon-systems/pcc-sdk-core@4.0.0

## 3.13.1

### Minor Changes

- 4317fcd: Updated DOM structure for image elements: The `img` tag is now
  wrapped within an additional `span` element. As a result, any CSS targeting
  `.pantheon-img-container img` should be updated to reflect the new structure
  using the selector `.pantheon-img-container span img`.
- Bump to 3.13.1

### Patch Changes

- a235787: Added cdnURLOverride experimental option to ArticleRenderer to allow
  you to use different CDN origins.
- Updated dependencies
  - @pantheon-systems/pcc-sdk-core@3.13.1

## 3.12.1

### Patch Changes

- b587dda: New CSS classes: pantheon-img-container-breakboth and
  pantheon-img-container-alone
  - @pantheon-systems/pcc-sdk-core@3.12.1

## 3.12.0

### Minor Changes

- 33368d3: Image captions are now rendered by default, but can be opted out by
  using \_\_experimentalFlags.renderImageCpations in ArticleRenderer. Image
  containers and captions are now targetable with CSS classes.

### Patch Changes

- @pantheon-systems/pcc-sdk-core@3.12.0

## 3.11.3

### Patch Changes

- @pantheon-systems/pcc-sdk-core@3.11.3

## 3.11.2

### Patch Changes

- Updated dependencies [b8be0ac]
  - @pantheon-systems/pcc-sdk-core@3.11.2

## 3.11.1

### Patch Changes

- b75afed: Fix lodash import.
- Updated dependencies [b72e906]
- Updated dependencies [548a31f]
  - @pantheon-systems/pcc-sdk-core@3.11.1

## 3.11.1-beta.2

### Patch Changes

- Fix lodash import.
  - @pantheon-systems/pcc-sdk-core@3.11.1-beta.2

## 3.11.1-beta.1

### Patch Changes

- @pantheon-systems/pcc-sdk-core@3.11.1-beta.1

## 3.11.1-beta.0

### Patch Changes

- Updated dependencies [b72e906]
- Updated dependencies [548a31f]
  - @pantheon-systems/pcc-sdk-core@3.11.1-beta.0

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

### Patch Changes

- Updated dependencies [a407141]
  - @pantheon-systems/pcc-sdk-core@3.11.0

## 3.10.0

### Minor Changes

- b89c5ee: The injected preview bar is deprecated in favor of the integrated
  preview bar in the dashboard preview interface

### Patch Changes

- 67bc79b: Use 'label' for metadata group record identifiers instead of 'name'
- Updated dependencies [67bc79b]
- Updated dependencies [400fc48]
- Updated dependencies [572fb97]
  - @pantheon-systems/pcc-sdk-core@3.10.0

## 3.10.0-beta.2

### Minor Changes

- b89c5ee: The injected preview bar is deprecated in favor of the integrated
  preview bar in the dashboard preview interface

### Patch Changes

- 67bc79b: Use 'label' for metadata group record identifiers instead of 'name'
- Updated dependencies [67bc79b]
  - @pantheon-systems/pcc-sdk-core@3.10.0-beta.2

## 3.10.0-beta.1

### Patch Changes

- Updated dependencies [400fc48]
  - @pantheon-systems/pcc-sdk-core@3.10.0-beta.1

## 3.10.0-beta.0

### Patch Changes

- Updated dependencies [572fb97]
  - @pantheon-systems/pcc-sdk-core@3.10.0-beta.0

## 3.9.0

### Minor Changes

- 9adfb1a: Component schema supports special 'variant' attribute.

### Patch Changes

- Updated dependencies [9adfb1a]
  - @pantheon-systems/pcc-sdk-core@3.9.0

## 3.9.0-beta.0

### Minor Changes

- 4267508: Component schema supports special 'variant' attribute.

### Patch Changes

- Updated dependencies [4267508]
  - @pantheon-systems/pcc-sdk-core@3.9.0-beta.0

## 3.8.1

### Patch Changes

- Updated dependencies [61c7d15]
  - @pantheon-systems/pcc-sdk-core@3.8.1

## 3.8.0

### Patch Changes

- @pantheon-systems/pcc-sdk-core@3.8.0

## 3.7.0

### Patch Changes

- e7d5252: Gracefully handle implementation edge case where a smart component
  map was provided to the ArticlerRenderer but without defining the react
  components that should be used.
- Updated dependencies [11e0509]
- Updated dependencies [87fdf27]
  - @pantheon-systems/pcc-sdk-core@3.7.0

## 3.6.1

### Patch Changes

- edf7252: GraphQL queries and query hooks are now exposed for custom usage
- Updated dependencies [183ad17]
  - @pantheon-systems/pcc-sdk-core@3.6.1

## 3.6.0

### Patch Changes

- 80ef092: Update preview bar copy and icons
- 4ed0c05: Don't export pantheon-context in server export.
- 61363af: Removes inline sourcemaps. Sourcemaps are still provided, just linked
  in separate files instead.
- 4ed0c05: Export pantheon-content from root entry point.
- 14a968b: Make preview bar sticky at the top by default
- Updated dependencies [61363af]
- Updated dependencies [3651708]
- Updated dependencies [61363af]
  - @pantheon-systems/pcc-sdk-core@3.6.0

## 3.6.0-beta.3

### Patch Changes

- Export pantheon-content from root entry point.
  - @pantheon-systems/pcc-sdk-core@3.6.0-beta.3

## 3.6.0-beta.2

### Patch Changes

- Don't export pantheon-context in server export.
  - @pantheon-systems/pcc-sdk-core@3.6.0-beta.2

## 3.6.0-beta.1

### Patch Changes

- Updated dependencies
  - @pantheon-systems/pcc-sdk-core@3.6.0-beta.1

## 3.6.0-beta.0

### Patch Changes

- 80ef092: Update preview bar copy and icons
- 14a968b: Make preview bar sticky at the top by default
  - @pantheon-systems/pcc-sdk-core@3.6.0-beta.0

## 3.5.3

### Patch Changes

- Updated dependencies
  - @pantheon-systems/pcc-sdk-core@3.5.3

## 3.5.3-beta.0

### Patch Changes

- Updated dependencies
  - @pantheon-systems/pcc-sdk-core@3.5.3-beta.0

## 3.5.2

### Patch Changes

- 289e05c: Add updateConfig function which will override the default PCC
  connection settings that PCCConvenienceFunctions will use.
- Updated dependencies [fcfa574]
- Updated dependencies [289e05c]
  - @pantheon-systems/pcc-sdk-core@3.5.2

## 3.5.2-beta.1

### Patch Changes

- Add updateConfig function which will override the default PCC connection
  settings that PCCConvenienceFunctions will use.
- Updated dependencies
  - @pantheon-systems/pcc-sdk-core@3.5.2-beta.1

## 3.5.2-beta.0

### Patch Changes

- Updated dependencies
  - @pantheon-systems/pcc-sdk-core@3.5.2-beta.0

## 3.5.1

### Patch Changes

- @pantheon-systems/pcc-sdk-core@3.5.1

## 3.5.0

### Minor Changes

- 8ff023b: disableAllStyles is no longer applied to functional component
  overrides given in componentMap to ArticleRenderer

### Patch Changes

- Updated dependencies [0e74720]
- Updated dependencies [4cab3e2]
  - @pantheon-systems/pcc-sdk-core@3.5.0

## 3.4.1

### Patch Changes

- 19f9ac8: Fix how preview JWT token is set from PantheonAPI
- c8800c8: Add preserveImageStyles experimental flag for article rendering.
- Updated dependencies [19f9ac8]
  - @pantheon-systems/pcc-sdk-core@3.4.1

## 3.4.0

### Minor Changes

- 37e1c39: PantheonAPI now supports app router.

### Patch Changes

- Updated dependencies [37e1c39]
- Updated dependencies [5124a8b]
  - @pantheon-systems/pcc-sdk-core@3.4.0

## 3.3.3

### Patch Changes

- @pantheon-systems/pcc-sdk-core@3.3.3

## 3.3.2

### Patch Changes

- @pantheon-systems/pcc-sdk-core@3.3.2

## 3.3.1

### Patch Changes

- 28e312e: New previewbar props added for finer control over where and how it
  renders.
- Updated dependencies [63537f7]
  - @pantheon-systems/pcc-sdk-core@3.3.1

## 3.3.0

### Minor Changes

- 24be191: Add experimental flag "useUnintrusiveTitleRendering" which will use
  the new way of rendering titles, where the document's content will not be
  affected. The old (and still default) way will forcibly move the detected
  title element to the top of the document when rendering.

### Patch Changes

- Updated dependencies
  - @pantheon-systems/pcc-sdk-core@3.3.0

## 3.2.1

### Patch Changes

- 8e880f2: Ability to retrieve gen AI summary results for a search query.
- Updated dependencies [8e880f2]
  - @pantheon-systems/pcc-sdk-core@3.2.1

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

### Patch Changes

- Updated dependencies
  - @pantheon-systems/pcc-sdk-core@3.2.0

## 3.1.2

### Patch Changes

- Updated dependencies
  - @pantheon-systems/pcc-sdk-core@3.1.2

## 3.1.1

### Patch Changes

- @pantheon-systems/pcc-sdk-core@3.1.1

## 3.1.0

### Minor Changes

- 282e854: Support paginated articles

### Patch Changes

- Updated dependencies [282e854]
  - @pantheon-systems/pcc-sdk-core@3.1.0

## 0.1.0

### Minor Changes

- Update React and Vue SDK to depend on core package

  Core package updated to export types and static helpers

  Vue package updated to support subscriptions

### Patch Changes

- Updated dependencies [8461c3d]
- Updated dependencies
  - @pantheon-systems/pcc-sdk-core@1.0.0
