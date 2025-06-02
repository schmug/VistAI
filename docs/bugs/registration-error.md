# Registration Internal Error

## Summary
Registration attempts on the platform sometimes fail with the message:

```
Service temporarily unavailable. Please try again in a moment.
Technical details
{"message":"Internal Error"}
```

## Steps to Reproduce
1. Open the registration page.
2. Fill out the required fields.
3. Submit the form.

## Expected Behavior
The registration should succeed and the user should receive a confirmation email.

## Actual Behavior
The server responds with the service unavailable message above.

## Resolution
The failure occurred when trying to register an account with a username that
already existed in the database. The API now checks for duplicates and returns a
409 error with `"Username already exists"` instead of an internal error.

## Notes
- This started after recent infrastructure updates.
- Reloading the page does not resolve the issue.
