const mcsd = require('./mcsd')();
const bundle = require('./sample.json');

mcsd.saveLocations(bundle, 'facilityregistry', (err, body) => {
  console.log(JSON.stringify(body,0,2));
});
