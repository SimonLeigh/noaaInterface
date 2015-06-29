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
 * byLatLonDate
 * Created by simon on 29/06/15.
 */
var byLatLonDate = function (doc, meta) {

    if (doc.LAT && doc.LON && doc.BEGIN && doc.END) {

        var latitude = parseFloat(doc.LAT);
        var longitude = parseFloat(doc.LON);

        if (!isNaN(latitude) && !isNaN(longitude)){
            /* Construct date by slicing out individual d/m/y */
            var begin = Date.UTC(doc.BEGIN.slice(0,4), doc.BEGIN.slice(4,6)-1, doc.BEGIN.slice(6,8))/1000
            var end = Date.UTC(doc.END.slice(0,4), doc.END.slice(4,6)-1, doc.END.slice(6,8))/1000
            emit([longitude, latitude,begin,end], doc["STATION NAME"]);
        }

    }
}