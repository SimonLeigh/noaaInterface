/**
 * byLatLon
 * Created by simon on 29/06/15.
 */
var byLatLon = function (doc, meta) {

    if (doc.LAT && doc.LON && doc.BEGIN && doc.END) {

        var latitude = parseFloat(doc.LAT);
        var longitude = parseFloat(doc.LON);

        if (!isNaN(latitude) && !isNaN(longitude)){
            /* Construct date by slicing out individual d/m/y */
            emit([longitude, latitude], doc["STATION NAME"]);
        }

    }
}

/**
 * designdoc: spatial
 * viewname: byLatLonDate
 * Created by simon on 29/06/15.
 */
function (doc, meta) {

    if (doc.LAT && doc.LON && doc.BEGIN && doc.END) {

        var latitude = parseFloat(doc.LAT);
        var longitude = parseFloat(doc.LON);

        if (!isNaN(latitude) && !isNaN(longitude)){
            /* Construct date by slicing out individual d/m/y */
            var begin = Date.UTC(doc.BEGIN.slice(0,4), doc.BEGIN.slice(4,6)-1, doc.BEGIN.slice(6,8))/1000
            var end = Date.UTC(doc.END.slice(0,4), doc.END.slice(4,6)-1, doc.END.slice(6,8))/1000
            emit([longitude, latitude, begin, end], {
                    "Station Name": doc["STATION NAME"],
                    "Longitude": doc["LON"],
                    "Latitude": doc["LAT"],
                    "Begin": doc["BEGIN"],
                    "End": doc["END"]
                }
            );
        }

    }
}


/**
 * designdoc: spatial
 * viewname: EXTRAFORTESTING
 * Created by simon on 29/06/15.
 */
function (doc, meta) {
    var arrayLength = doc.samples.length;
    for (var i = 0; i < arrayLength; i++) {
        if(doc.samples[i].TEMP & doc.samples[i].SPD){
            emit([parseFloat(doc.samples[i].TEMP), parseFloat(doc.samples[i].SPD)],null);
        }
    }
}