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

The config file for **changy**.

```js
{
    // the timezone to calculate the date off of
    "timezone": "America/Chicago",
    // the change list heading
    "heading": "What's New?",
    // types of changes to be prompted for
    "changeTypes": [
        "feat",
        "fix"
    ]
}
```

## CLI Reference

```
Usage: changy [options] [command]

Generate user friendly changelogs.

Options:
  -h, --help              display help for command

Commands:
  init [options]          Initialize changy.
  add [options] [change]  Add a change to the CHANGELOG.
  latest [options]        Get the latest changelog entry.
  help [command]          display help for command
```

### Init

Initialize changy.

```
Usage: changy init [options]

Initialize changy.

Options:
  -c, --cwd <cwd>                   The current working directory.
  -tz, --timezone <timezone>        The timezone to date based off of. (choices: "America/Los_Angeles", "UTC" ...)
  --heading <heading>               The heading above the change list.
  --change-types [change-types...]  The types of changes.
  -y, --yes                         Skip all prompts and apply defaults.
  -h, --help                        display help for command
```

### Add

Add a change to the CHANGELOG.

```
Usage: changy add [options] [change]

Add a change to the CHANGELOG.

Arguments:
  change           Change to add to CHANGELOG.md.

Options:
  -c, --cwd <cwd>  The current working directory.
  -h, --help       display help for command
```

### Latest

Get the latest changelog entry.

```
Usage: changy latest [options]

Get the latest changelog entry.

Options:
  -c, --cwd <cwd>  The current working directory.
  --today          Only returns todays changelog. (default: false)
  --with-date      Includes the xxxx.xx.xx style date in the log. (default: false)
  -h, --help       display help for command
```
