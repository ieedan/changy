# changy

## 0.2.5

### Patch Changes

- 3528a8a: Fixed issue where the `add` command would add a change for every heading.

## 0.2.4

### Patch Changes

- 15a5dd0: Still trying to fix build issues

## 0.2.3

### Patch Changes

- c2fb233: Fixes issue with building that would cause issues when installing or using.

## 0.2.2

### Patch Changes

- d2547f0: Changed the punctuation and coloring in some messages.

## 0.2.1

### Patch Changes

- ffc017d: fix: Changes would be added multiple times

## 0.2.0

### Minor Changes

- 546b40e: **breaking**: Removed the --with-date flag from `latest` command and now date is always included in the output
- 546b40e: **feat:** You can now provide the `--json` flag to the `latest` command to get the latest changelog in json form
- 7fbaf2d: **deprecated:** The path of the changelog file is now configurable through the settings file past versions will get a warning telling them to provide `"path"` in their `.changyrc` file.

### Patch Changes

- 546b40e: **chore:** Added tests for `add`, and `latest` commands
- 546b40e: **fix:** There is no longer a significant new line when adding changes to the last category of the only entry

## 0.1.0

### Minor Changes

- 3fcf0b6: **feat:** init command now initializes with default settings without prompts.
