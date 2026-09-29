# Express Book Reviews final project

Run `npm ci`, then `npm start` in this directory (Node.js 24 tested).
The server listens on http://127.0.0.1:5000. Run `npm test` for integration tests.

The original router/booksdb.js object is unchanged. general.js uses Axios with
async/await to retrieve the live supplied catalog through /_catalog, then handles
all-books, ISBN, author, title and review requests. Author/title matching is exact
and case-insensitive; searches return ISBN-keyed objects. Unknown ISBNs return 404.

Register via POST /register and log in via POST /customer/login with username and
password (JSON or URL-encoded form). Login creates an HTTP-only session cookie.
PUT /customer/auth/review/:isbn accepts review in JSON or a query parameter;
DELETE on that route removes only the logged-in user's review. Passwords are
salted and hashed. Users, sessions and reviews are in memory and reset on restart.
Set SESSION_SECRET for a stable session secret outside this local assignment.

## Submission evidence

The ten named .txt files under evidence contain commands and actual output.
Commands use Windows curl.exe and PowerShell syntax. The password is exclusively
a disposable course-test value, not a real credential. The cookie jar is ignored
by Git. githubrepo-api.json contains the complete public GitHub API response;
githubrepo.txt uses PowerShell to select the relevant API fields.

To recapture local evidence, start a fresh server, then run
`node capture-evidence.js` from this directory. The script performs real cURL
requests and preserves login cookies for add, update and delete requests.
The reviewadded evidence includes both creation and update; deletereview also
verifies that the public reviews endpoint returns an empty object afterwards.

Verified: npm test passes; npm audit reports zero vulnerabilities. The supplied
starter had only a failing placeholder test script, replaced by integration tests
covering retrieval, validation, duplicate registration, failed login, missing
books, unauthorized changes, review updates, and isolation between two users.
