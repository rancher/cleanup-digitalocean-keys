#!/usr/bin/env node

var request = require('request');
var async = require('async');

var key = process.argv[2];
if ( !key ) {
  console.log('Usage: ', process.argv[1], '<API key>');
  process.exit(1);
}

let toDelete = [];

find(null, batchDelete);

function batchDelete() {
  async.eachLimit(toDelete, 10, remove, function(err) {
    if ( err ) {
      console.log("Error: ", err);
      process.exit(2);
    }
  });
}

function req(method, url, cb) {
  console.log('  > Request', method, url);
  var opt = {
    method: method,
    url: url,
    headers: {
      'Authorization': 'Bearer ' + key,
    }
  };

  request(opt, cb);
}

function find(url, cb) {
  if ( !url ) {
    url = 'https://api.digitalocean.com/v2/account/keys?per_page=100';
  }

  console.log('Loading Page');

  req('GET', url, function(err, response, body) {
    if ( err || response.statusCode !== 200 ) {
      console.log("Error: ", err);
      process.exit(1);
    }

    var json = JSON.parse(body);
    if ( !json.ssh_keys ) {
      console.log("SSH keys not found: ", body);
      process.exit(1);
    }

    console.log('Got', json.ssh_keys.length, 'keys');

    for ( let i = 0 ; i < json.ssh_keys.length ; i++ ) {
      decide(json.ssh_keys[i]);
    }

    if ( json.links && json.links.pages && json.links.pages.next ) {
      loop(json.links.pages.next, cb);
    } else {
      cb();
    }
  })
}

function decide(key, cb) {
  if ( key.name.indexOf('@') === -1 ) {
    console.log('To Remove', key.name);
    toDelete.push(key);
  } else {
    console.log('Keep ', key.name);
  }
}

function remove(key, cb) {
  console.log('Removing', key.name);
  req('DELETE', 'https://api.digitalocean.com/v2/account/keys/' + key.id, cb);
}
