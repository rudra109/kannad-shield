const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: 'f9ad918a-1a9b-46fd-954a-82476cc3e93e', role: 'user', phone: '+917777777777' },
  'change_me_to_a_long_random_string_min_32_chars',
  { expiresIn: '3650d' }
);
console.log(token);
