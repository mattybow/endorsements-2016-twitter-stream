import Twit from 'twit';
import mongojs from 'mongojs';

const connectionStr = connectionStrToDb('endorsements');

var db = mongojs(connectionStr, ['twStream']);
console.log(connectionStr, db.twStream.findOne);

db.twStream.findOne({},(err,doc) => {
  console.log('hi');
  if(err) {
    throw new Error(`no db connection: ${err}`);
  } else {
    console.log(new Date(), 'STARTED STREAM MONITOR');
  }
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
  const {verified} = t.user;
  //console.log(verified, t.text);
  if (verified){
    const link = `https://twitter.com/${t.user.screen_name}/status/${t.id_str}`;
    const data = {
      text:t.text,
      id:t.id_str,
      link:link,
      retweeted
    };
    db.twStream.insert(data,(err,doc) => {
      console.log('inserted doc', data);
    });
  }
});

function connectionStrToDb(db){
  if(process.env.NODE_ENV === 'production'){
    const {DB_USER, DB_PASS} = process.env;
    return `${DB_USER}:${DB_PASS}@127.0.0.1/${db}`;
  }
  return db;
}
