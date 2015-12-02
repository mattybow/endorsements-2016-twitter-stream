'use strict';

var _twit = require('twit');

var _twit2 = _interopRequireDefault(_twit);

var _mongojs = require('mongojs');

var _mongojs2 = _interopRequireDefault(_mongojs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var db = (0, _mongojs2.default)('endorsements', ['twStream']);

db.twStream.findOne({}, function (err, doc) {
  if (err) {
    throw new Error('no db connection: ' + err);
  } else {
    console.log(new Date(), 'STARTED STREAM MONITOR');
  }
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
  var verified = t.user.verified;

  if (verified) {
    (function () {
      var link = 'https://twitter.com/' + t.user.screen_name + '/status/' + t.id_str;
      var data = {
        text: t.text,
        id: t.id_str,
        link: link,
        retweeted: retweeted
      };
      db.twStream.insert(data, function (err, doc) {
        console.log('inserted doc', data);
      });
    })();
  }
});
