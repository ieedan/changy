```

 ______     __  __     ______     __   __     ______     __  __
/\  ___\   /\ \_\ \   /\  __ \   /\ "-.\ \   /\  ___\   /\ \_\ \
\ \ \____  \ \  __ \  \ \  __ \  \ \ \-.  \  \ \ \__ \  \ \____ \
 \ \_____\  \ \_\ \_\  \ \_\ \_\  \ \_\\"\_\  \ \_____\  \/\_____\
  \/_____/   \/_/\/_/   \/_/\/_/   \/_/ \/_/   \/_____/   \/_____/


```

# changy (change-e)

A simple changelog CLI for user facing changelogs.

```
npm install -g changy
```

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

> [!NOTE]
> These will only appear in your changelog if they have changes associated with them.

## CLI Reference

To see the most recent information for the CLI run:

```
npx changy@latest --help
```
