![changy](https://github.com/user-attachments/assets/9f5b7e4f-083e-4d4c-b6e6-a1d3c5d2c61e)

# changy (change-e)

A simple CLI for maintaining user facing changelogs.

```
npm install -g changy
```

## Why?

Changesets are awesome but our users don't care about versioning. changy makes it easy to generate
date-based changelogs that can show your applications development progress.

## .changyrc

The config file for **changy**. This allows you to configure your time zone as well as they change
categories that will be listed in the changelog.

```js
{
    "timezone": "UTC",
    "changeCategories": [
        "Added",
        "Changed",
        "Fixed"
    ]
}
```

### `changeCategories`

These are what determines the categories of your changes and the order they will show up in your
changelog.

For example take this configuration:

```json
"changeCategories": [
  "Added",
  "Changed",
  "Fixed"
]
```

Resulting CHANGELOG.md format:

```md
# 2024.11.11

## Added

<!-- Your additions here -->

## Changed

<!-- Your changes here -->

## Fixed

<!-- Your fixes here -->
```

> [!NOTE] These will only appear in your changelog if they have changes associated with them.

## CLI Reference

To see the most recent information for the CLI run:

```
npx changy@latest --help
```
