const { spawnSync } = require('node:child_process');
const { writeFileSync } = require('node:fs');
const base = 'http://127.0.0.1:5000';
const credentials = 'username=ibm_demo_20260929&password=Disposable-course-test-42';
function capture(name, args, append = false) {
  const result = spawnSync('curl.exe', args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  const command = 'curl.exe ' + args.map(arg => /[\s&]/.test(arg) ? `"${arg}"` : arg).join(' ');
  const text = command + '\n' + result.stdout + '\n';
  writeFileSync(`evidence/${name}.txt`, text, { flag: append ? 'a' : 'w' });
  console.log(name + ': ' + result.stdout);
}
const opts = ['-sS', '-w', '\nHTTP status: %{http_code}\n'];
capture('getallbooks', [...opts, base + '/']);
capture('getbooksbyISBN', [...opts, base + '/isbn/1']);
capture('getbooksbyauthor', [...opts, base + '/author/Chinua%20Achebe']);
capture('getbooksbytitle', [...opts, base + '/title/Things%20Fall%20Apart']);
capture('getbookreview', [...opts, base + '/review/1']);
capture('register', [...opts, '-X', 'POST', base + '/register', '-H', 'Content-Type: application/x-www-form-urlencoded', '--data', credentials]);
capture('login', [...opts, '-X', 'POST', base + '/customer/login', '-c', 'evidence/session.cookies', '-H', 'Content-Type: application/x-www-form-urlencoded', '--data', credentials]);
capture('reviewadded', [...opts, '-X', 'PUT', '-b', 'evidence/session.cookies', base + '/customer/auth/review/1?review=A%20powerful%20novel.']);
capture('reviewadded', [...opts, '-X', 'PUT', '-b', 'evidence/session.cookies', base + '/customer/auth/review/1?review=A%20powerful%20and%20memorable%20novel.'], true);
capture('deletereview', [...opts, '-X', 'DELETE', '-b', 'evidence/session.cookies', base + '/customer/auth/review/1']);
capture('deletereview', [...opts, base + '/review/1'], true);
