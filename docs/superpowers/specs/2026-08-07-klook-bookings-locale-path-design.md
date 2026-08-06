# Klook bookings locale-path support

## Goal

Allow the Klook booking-category bookmarklet to run on the standard Klook
bookings URL with or without a locale segment.

## Scope

- Accept `/bookings` and `/bookings/`.
- Accept one locale segment before `bookings`, such as `/zh-TW/bookings/` and
  `/en-US/bookings/`.
- Continue rejecting unrelated pages and paths with extra segments.
- Add automated coverage for the accepted and rejected pathname forms.

## Design

Extract the pathname check into a small predicate that has no DOM dependency.
The bookmarklet's existing host check remains unchanged. The predicate uses one
anchored expression that permits either no prefix or one locale-like path
segment, followed by `bookings` and an optional trailing slash.

The bookmarklet will call that predicate before doing any page work. A focused
Node test will import the predicate and verify the accepted URL forms plus
representative non-booking paths.

## Non-goals

- Changing the visual labels or category parsing.
- Supporting arbitrary nested paths before `bookings`.
- URL-encoding or minifying the bookmarklet installation payload.
