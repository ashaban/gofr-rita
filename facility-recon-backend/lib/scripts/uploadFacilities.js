require('../init');
const winston = require('winston');
const fs = require('fs');
const csv = require('fast-csv');
const async = require('async');
const path = require('path');
const uuid5 = require('uuid/v5');
const uuid4 = require('uuid/v4');
const mixin = require('../mixin')();
const mcsd = require('../mcsd')();
const config = require('../config');
const codesystem = require('../../terminologies/gofr-codesystem.json');

const mapping = {
  facility: 'facility',
  alt_name: 'alt_name',
  code: 'code',
  phone: 'phone',
  email: 'email',
  fax: 'fax',
  website: 'website',
  level1: 'level1',
  level2: 'level2',
  level3: 'level3',
  level4: null,
  level5: null,
  level6: null,
  level7: null,
};
if (!process.argv[2]) {
  winston.error('Please specify path to a CSV file');
  process.exit();
}
const csvFile = process.argv[2];

try {
  if (!fs.existsSync(csvFile)) {
    winston.error(`Cant find file ${csvFile}`);
    process.exit();
  }
} catch (err) {
  winston.error(err);
  process.exit();
}

const ext = path.extname(csvFile);
if (ext !== '.csv') {
  winston.error('File is not a CSV');
  process.exit();
}

function csvTomCSD(filePath) {
  const promises = [];
  const bundle = {
    id: uuid4(),
    resourceType: 'Bundle',
    type: 'batch',
    entry: [],
  };
  winston.info('Upload started ...');
  csv
    .fromPath(filePath, {
      headers: true,
    })
    .on('data', (data) => {
      promises.push(new Promise((resolve) => {
        const buld = {
          resourceType: 'Location',
          id: uuid5(`facility${data.id}`, '16b229bc-eba5-4e99-abec-aaa0d1462583'),
          name: data.rc_name,
          identifier: {
            system: 'https://digitalhealth.intrahealth.org/source1',
            value: data.id,
          },
          partOf: {
            reference: `Location/${uuid5(`ward${data.ward_id}`, '16b229bc-eba5-4e99-abec-aaa0d1462583')}`,
          },
        };
        bundle.entry.push({
          resource: buld,
          request: {
            method: 'PUT',
            url: `Location/${buld.id}`,
          },
        });
        if (bundle.entry.length > 250) {
          const tmpBundle = { ...bundle };
          mcsd.saveLocations(tmpBundle, 'Rita5dd2b3a0064c5303fe0bcb4c', (err, body) => {
            console.info(JSON.stringify(body, 0, 2));
            resolve();
          });
          bundle.entry = [];
        } else {
          resolve();
        }
      }));
    }).on('end', () => {
      Promise.all(promises).then(() => {
        if (bundle.entry.length > 0) {
          mcsd.saveLocations(bundle, 'Rita5dd2b3a0064c5303fe0bcb4c', (err, body) => {
            console.info(JSON.stringify(body, 0, 2));
            console.log('Done');
          });
        } else {
          console.log('Done');
        }
      });
    });
}


csvTomCSD(csvFile);
