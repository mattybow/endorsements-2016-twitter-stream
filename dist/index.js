'use strict';

var _twit = require('twit');

var _twit2 = _interopRequireDefault(_twit);

var _mongojs = require('mongojs');

var _mongojs2 = _interopRequireDefault(_mongojs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var connectionStr = connectionStrToDb('endorsements');

var db = (0, _mongojs2.default)(connectionStr, ['twStream'], { authMechanism: 'ScramSHA1' });
console.log(connectionStr);

// Test connection
db.twStream.findOne({}, function (err, doc) {
  if (err) {
    throw new Error('no db connection: ' + err);
  }
  console.log(new Date(), 'STARTED STREAM MONITOR');
});

var _process$env = process.env;
var CONSUMER_KEY = _process$env.CONSUMER_KEY;
var CONSUMER_SECRET = _process$env.CONSUMER_SECRET;
var ACCESS_TOKEN = _process$env.ACCESS_TOKEN;
var ACCESS_TOKEN_SECRET = _process$env.ACCESS_TOKEN_SECRET;

var twit = new _twit2.default({
  consumer_key: CONSUMER_KEY,
  consumer_secret: CONSUMER_SECRET,
  access_token: ACCESS_TOKEN,
  access_token_secret: ACCESS_TOKEN_SECRET
});

var VERB = ['endorse'];

var CANDIDATES = ['Hillary Clinton', 'Chris Christie', 'Bernie Sanders', 'Martin OMalley', 'Donald Trump', 'Jeb Bush', 'Ben Carson', 'Ted Cruz', 'Lindsey Graham', 'Mike Huckabee', 'John Kasich', 'George Pataki', 'Rand Paul', 'Marco Rubio', 'Rick Santorum', 'Carly Fiorina', 'Jim Gilmore'];

var trackingStr = VERB.map(function (verb) {
  return CANDIDATES.reduce(function (acc, candidate) {
    var names = candidate.split(' ');
    return acc.concat(names.map(function (name) {
      return verb + ' ' + name;
    }));
  }, []);
});

var endStream = twit.stream('statuses/filter', {
  track: trackingStr
});

endStream.on('tweet', function (t) {
  var retweeted = t.retweeted_status ? true : false;
  var created_at = t.created_at;
  var verified = t.user.verified;

  if (process.env.NODE_ENV !== 'production') {
    console.log(verified, t.text);
  }
  if (verified) {
    (function () {
      var link = 'https://twitter.com/' + t.user.screen_name + '/status/' + t.id_str;
      var data = {
        text: t.text,
        _id: t.id_str,
        link: link,
        retweeted: retweeted,
        created_at: created_at
      };
      db.twStream.insert(data, function (err, doc) {
        console.log('inserted doc', data);
      });
    })();
  }
});

function connectionStrToDb(db) {
  if (process.env.NODE_ENV === 'production') {
    var _process$env2 = process.env;
    var DB_USER = _process$env2.DB_USER;
    var DB_PASS = _process$env2.DB_PASS;
    var DB_HOST = _process$env2.DB_HOST;
    var DB_PORT = _process$env2.DB_PORT;

    var host = DB_HOST || 'experiment-data.mattbow.com';
    return DB_USER + ':' + DB_PASS + '@' + host + ':' + DB_PORT + '/' + db + '?authMechanism=SCRAM-SHA-1';
  }
  // connect to local db
  return db;
}
