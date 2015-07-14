/**
 *
 * @type {exports}
 */
var config = require('./../config');
var couchbase = require('couchbase');
var endPoint = config.couchbase.endPoint;
var bucket = config.couchbase.bucket;
var queryEndPoint = config.couchbase.queryEndPoint;
var queryBucket = config.couchbase.queryBucket;
var myCluster = new couchbase.Cluster(endPoint);
var myQueryCluster = new couchbase.Cluster(queryEndPoint);
//var myBucket = myCluster.openBucket(bucket);
var db;
var queryDB;
var http=require('http');
var request=require('request');
var status="offline";  //offline,pending,online

/**
 *
 */
function init(done) {
    console.log({init: "check data service"});
    request.get({
        url: "http://" + endPoint + "/pools/default/buckets/" + bucket,
        auth: {
            'user': config.couchbase.user,
            'pass': config.couchbase.password,
            'sendImmediately': true
        }
    }, function (err, responseB, bodyB) {
        if (err) {
            console.log({init: "data service not ready"});
            if (config.application.verbose) {
                console.log("VERBOSE:", err);
            }
            done(false);
            return;
        }
        else {
            var myBucket = myCluster.openBucket(bucket);
            db = myBucket;
            status = "online";
            console.log({init: "data service ready"});
            done(true);
            return;
        }
    });

    console.log({init: "check query service"});
    request.get({
        url: "http://" + config.couchbase.n1qlService + "/query?statement=SELECT+name+FROM+system%3Akeyspaces",
        auth: {
            'user': config.couchbase.user,
            'pass': config.couchbase.password,
            'sendImmediately': true
        }
    }, function (err, response, body) {
        if (err) {
            console.log({init: "query service not ready"});
            if (config.application.verbose) {
                console.log("VERBOSE:", err);
            }
            done(false);
            return;
        }
        if (response.statusCode == 200) {
            request.get({
                url: "http://" + queryEndPoint + "/pools/default/buckets/" + queryBucket,
                auth: {
                    'user': config.couchbase.queryUser,
                    'pass': config.couchbase.queryPassword,
                    'sendImmediately': true
                }
            }, function (err, responseB, bodyB) {
                if (err) {
                    console.log({init: "query service not ready"});
                    if (config.application.verbose) {
                        console.log("VERBOSE:", err);
                    }
                    done(false);
                    return;
                }
                else {
                    var myQueryBucket = myQueryCluster.openBucket(queryBucket);
                    queryDB = myQueryBucket;
                    status = "online";
                    console.log({init: "query service ready"});
                    done(true);
                    return;
                }
            });
        }
    });
}
function enableN1QL(done){
    db.enableN1ql(config.couchbase.n1qlService);
    done({n1ql:"enabled"});
}

init(function(){});

/**
 *
 * @param key
 * @param val
 * @param done
 */
function upsert(key, val, done) {
    db.upsert(key, val, function (err, res) {
        if (err) {
            console.log("DB.UPSERT:",key,":", err);
            done(err, null);
            return;
        }
        done(null, res);
    });
}

/**
 *
 * @param key
 * @param done
 */
function read(key, done) {
    db.get(key, function (err, result) {
        if (err) {
            console.log("DB.READ:", err);
            done(err, null);
            return;
        }
        done(null, result);
    });
}

/**
 *
 * @param keys
 * @param done
 */
function multiRead(keys, done) {
        db.getMulti(keys, function (err, result) {
            if (err) {
                console.log("DB.MULTIREAD:", err);
                done(err, result);
                return;
            }
            done(null, result);
        });
}


/**
 *
 * @param key
 * @param done
 */
function docDelete(key, done) {
    db.delete(key, function (err, result) {
        if (err) {
            console.log("DB.DELETE:", err);
            done(err, null);
            return;
        }
        done(null, true);
    });
}

/**
 *
 * @param done
 */

/**
 *
 * @param sql
 * @param done
 */
function query(sql,done){
    var N1qlQuery = couchbase.N1qlQuery;
    if(config.couchbase.showQuery){
        console.log("QUERY:",sql);
    }
    var query = N1qlQuery.fromString(sql);
    queryDB.query(query,function(err,result){
        if (err) {
            console.log("ERR:",err);
            done(err,null);
            return;
        }
        done(null,result);
        return;
    });
}

function spatialQuery(coordinates, done){

    // Set the query up to query the view with (designdoc, viewname)
    var sQuery = couchbase.SpatialQuery.from("spatial","byLatLon");
    if(config.couchbase.showQuery){
        console.log("SPATIAL QUERY COORDS:", coordinates);
    }
    // Set the bounding box on the query to be the coordinates fed in.
    // The coords needs to be array of size 4 with the following layout:
    // (SW_LON, SW_LAT, NE_LON, NE_LAT)
    // NOTICE WE INVERT THE TEST HERE TO RETURN IF ERR
    if( !( coordinates.length == 4 &&
        parseFloat(coordinates[0]) < parseFloat(coordinates[2]) &&
        parseFloat(coordinates[1]) < parseFloat(coordinates[3]))){
        console.log("ERROR:","Invalid Bounding Box Coordinates Given");
        done(new Error("Invalid Bounding Box Coordinates Given"),null);
        return;
    }
    else {
        // Set the query with BBOX coordinates and limit of 30 results for testing
        sQuery.bbox(coordinates).limit(50);
        queryDB.query(sQuery,function(err,result){
            if (err) {
                console.log("ERR:",err);
                done(err,null);
                return;
            }
            done(null,result);
            console.log("Results from query: " + result.length);
            return;
        });
    }
}

/*********
 * @param done
 * @param coordinates
 * Coordinates in 4-array
 * @param dates
 * Date range in 2-array
 *
***********/
function spatialQueryWithDates(coordinates, date, done){

    // Set the query up to query the view with (designdoc, viewname)
    var sQuery = couchbase.SpatialQuery.from("spatial","byLatLonDate");
    if(config.couchbase.showQuery){
        console.log("SPATIAL QUERY COORDS:", coordinates);
        console.log("SPATIAL QUERY DATE:", date);
    }
    // Set the bounding box on the query to be the coordinates fed in.
    // The coords needs to be array of size 4 with the following layout:
    // (SW_LON, SW_LAT, NE_LON, NE_LAT)
    // NOTICE WE INVERT THE TEST HERE TO RETURN IF ERR
    if( !( coordinates.length == 4 &&
        parseFloat(coordinates[0]) < parseFloat(coordinates[2]) &&
        parseFloat(coordinates[1]) < parseFloat(coordinates[3]))){
        console.log("ERROR:","Invalid Bounding Box Coordinates Given");
        done(new Error("Invalid Bounding Box Coordinates Given"),null);
        return;
    }
    else {

        //TODO: HANDLE OPEN RANGE (TEST NULLS ETC, CONVERT DATE FORMAT WHEN IT GETS HERE)
        // Create start array by slicing coordinates and pushing first date on
        console.log(coordinates.toString());
        var s_range = coordinates.slice(0,2);
        var e_range = coordinates.slice(2,4);

        // Push null and date onto start range (this order means get places with
        // data that start before our desired day
        s_range.push("null");
        s_range.push(date/1000);

        // Push date and null onto end range (this order means get data which end AFTER/ON
        // our desired day.
        e_range.push(date/1000);
        e_range.push("null");

        var query_params = {
            start_range: "[" + s_range.toString() + "]",
            end_range: "[" + e_range.toString() + "]",
            inclusive_end: true
        };

        console.log("QUERY CUSTOM PARAMS: " + JSON.stringify(query_params) );
        // Set the query with BBOX coordinates and limit of 30 results for testing
        sQuery.custom(query_params).limit(50).stale(couchbase.SpatialQuery.Update.BEFORE).i;
        queryDB.query(sQuery,function(err,result){
            if (err) {
                console.log("ERR:",err);
                done(err,null);
                return;
            }
            done(null,result);
            console.log("Results from query: " + result.length);
            return;
        });
    }
}

/**
 *
 * @param done
 */
function ops(done) {
    http.get("http://" + endPoint + "/pools/default/buckets/" + bucket, function (result) {
        var data = "";
        result.setEncoding('utf8');
        result.on('data', function (chunk) {
            data += chunk;
        });
        result.on('end', function () {
            var parsed = JSON.parse(data);
            done(null,Math.round(parsed.basicStats.opsPerSec));
            return;
        });
    });
}

/**
 *
 * @param done
 */


module.exports.endPoint=endPoint;
module.exports.bucket=bucket;
module.exports.queryBucket=queryBucket;
module.exports.queryEndPoint=queryEndPoint;
module.exports.init=init;
module.exports.query=query;
module.exports.spatialQuery = spatialQuery;
module.exports.spatialQueryWithDates = spatialQueryWithDates;
module.exports.ops=ops;
module.exports.read=read;
module.exports.upsert=upsert;
module.exports.multiRead=multiRead;
