- [x] Decide between Unix timestamps and ISO 8601 UTC-anchored strings in the API.
  - We've decided on ISO 8601 timestamps.
- [ ] Do we want the fancy time types in our REST API/validators, or not? I can't see why we'd want to care about the fact that these ints are times on the server, so I guess its a readability vs shenanigans tradeoff more than a simplicity vs complex functionality tradeoff. And I don't see the readability argument when we can have type aliases.
- [ ] How exactly should the no-password experience work? In when2meet, all accounts are per-meeting. I'm certain we shouldn't replicate that with OAuth/our own passkeys, but I think people should be able to enter separate names for separate meetings, and maybe they should just get a new account for each new meeting?
- [ ] Should user IDs be unique to meetings? Kind of a big security question.

# Stretch Goals:
- [ ] Consider making the granularity of scheduling (here, 15 minutes) a parameter of the API on a per-meeting basis.
