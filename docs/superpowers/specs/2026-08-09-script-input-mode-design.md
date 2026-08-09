# Script Input Mode Design

## Goal

Let users explicitly choose whether the script editor saves raw JavaScript or
decodes a URL-encoded `javascript:` bookmarklet, without misinterpreting
literal percent signs in raw code.

## Editor interaction

The script form presents a required two-option radio group immediately before
the code field:

- **Raw JavaScript** (default): store the entered source unchanged except for
  existing surrounding-whitespace trimming.
- **URL-encoded bookmarklet**: remove a leading `javascript:` prefix and URL
  decode the remaining source before storage.

The selected input mode applies on both create and update. When a saved script
is opened for editing, the editor selects Raw JavaScript because stored data is
always canonical raw source. Switching modes is an explicit user decision;
the form does not auto-detect encoding.

## Data and error handling

`chrome.storage.local` continues to store only `name`, raw executable `code`,
and existing metadata. No migration is needed. If URL decoding fails, show the
existing malformed-encoding error and do not alter saved data. Empty code is
rejected in either mode.

## Testing

Unit tests cover the mode-aware normalization helper: raw input preserves
literal `%`, encoded input is decoded, and malformed encoded input fails.
An extension UI contract test verifies the radio controls and Raw default.

## Non-goals

Do not retain the original encoded text, automatically infer input mode, alter
runtime script execution, or add new permissions.
