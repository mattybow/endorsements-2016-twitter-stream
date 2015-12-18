import Twit from 'twit';
import mongojs from 'mongojs';

const connectionStr = connectionStrToDb('endorsements');

var db = mongojs(connectionStr, ['twStream'], {authMechanism: 'ScramSHA1'});
console.log(connectionStr);

// Test connection
db.twStream.findOne({},(err,doc) => {
  if(err) {
    throw new Error(`no db connection: ${err}`);
  }
  console.log(new Date(), 'STARTED STREAM MONITOR');
});

const { CONSUMER_KEY,
  CONSUMER_SECRET,
  ACCESS_TOKEN,
  ACCESS_TOKEN_SECRET } = process.env;

const twit = new Twit({
    consumer_key:         CONSUMER_KEY
  , consumer_secret:      CONSUMER_SECRET
  , access_token:         ACCESS_TOKEN
  , access_token_secret:  ACCESS_TOKEN_SECRET
});

const VERB = [
  'endorse'
];

const CANDIDATES = [
  'Hillary Clinton',
  'Chris Christie',
  'Bernie Sanders',
  'Martin OMalley',
  'Donald Trump',
  'Jeb Bush',
  'Ben Carson',
  'Ted Cruz',
  'Lindsey Graham',
  'Mike Huckabee',
  'John Kasich',
  'George Pataki',
  'Rand Paul',
  'Marco Rubio',
  'Rick Santorum',
  'Carly Fiorina',
  'Jim Gilmore'
];

const trackingStr = VERB.map(verb => {
  return CANDIDATES.reduce((acc, candidate) =>{
    const names = candidate.split(' ');
    return acc.concat(names.map(name=>{
      return `${verb} ${name}`;
    }));
  }, []);
});

const endStream = twit.stream('statuses/filter', {
  track: trackingStr
});

endStream.on('tweet', (t) => {
  const retweeted = t.retweeted_status ? true : false;
  const {created_at, user:{verified}} = t;
  if(process.env.NODE_ENV !== 'production'){
    console.log(verified, t.text);
  }
  if (verified){
    const link = `https://twitter.com/${t.user.screen_name}/status/${t.id_str}`;
    const created_time = new Date(created_at).valueOf().toString();
    const data = {
      text:t.text,
      _id:t.id_str,
      link:link,
      retweeted,
      created_at,
      created_time
    };
    db.twStream.insert(data,(err,doc) => {
      if(err) console.log(err, doc);
      console.log('inserted doc', data);
    });
  }
});

function connectionStrToDb(db){
  if(process.env.NODE_ENV === 'production'){
    const {DB_USER, DB_PASS, DB_HOST, DB_PORT} = process.env;
    const host = DB_HOST || 'experiment-data.mattbow.com';
    return `${DB_USER}:${DB_PASS}@${host}:${DB_PORT}/${db}?authMechanism=SCRAM-SHA-1`;
  }
  // connect to local db
  return db;
}
