/*!
 * Searchable Map Template with Google Fusion Tables
 * http://derekeder.com/searchable_map_template/
 *
 * Copyright 2012, Derek Eder
 * Licensed under the MIT license.
 * https://github.com/derekeder/FusionTable-Map-Template/wiki/License
 *
 * Date: 12/10/2012
 *
 */

// Enable the visual refresh
google.maps.visualRefresh = true;

var MapsLib = MapsLib || {};
var MapsLib = {

  //Setup section - put your Fusion Table details here
  //Using the v1 Fusion Tables API. See https://developers.google.com/fusiontables/docs/v1/migration_guide for more info

  //the encrypted Table ID of your Fusion Table (found under File => About)
  //NOTE: numeric IDs will be deprecated soon
  fusionTableId:      "1xpYezineZWtL5qFwuzlYF43qazd1wgS8bXX3vIb3", // Point layer

  polygon1TableID:    "1jnsZImZGlgn23X0Duv1VmUl1M5uE1KoouEDKa2YY", //Daisies
  polygon2TableID:    "1jnsZImZGlgn23X0Duv1VmUl1M5uE1KoouEDKa2YY", //Brownies
  polygon3TableID:    "1jnsZImZGlgn23X0Duv1VmUl1M5uE1KoouEDKa2YY",  //Juniors
  polygon4TableID:    "1jnsZImZGlgn23X0Duv1VmUl1M5uE1KoouEDKa2YY",  //Cadettes
  polygon5TableID:    "1jnsZImZGlgn23X0Duv1VmUl1M5uE1KoouEDKa2YY",  //Seniors
  polygon6TableID:    "1jnsZImZGlgn23X0Duv1VmUl1M5uE1KoouEDKa2YY",  //Ambassadors
  polygon7TableID:    "1jnsZImZGlgn23X0Duv1VmUl1M5uE1KoouEDKa2YY",  //Total Girl Scouts

  //*New Fusion Tables Requirement* API key. found at https://code.google.com/apis/console/
  //*Important* this key is for demonstration purposes. please register your own.
  googleApiKey:       "AIzaSyDIevSvpV-ONb4Pf15VUtwyr_zZa7ccwq4",

  //name of the location column in your Fusion Table.
  //NOTE: if your location column name has spaces in it, surround it with single quotes
  //example: locationColumn:     "'my location'",
  locationColumn:     "Address",

  map_centroid:       new google.maps.LatLng(41.5682,-72.684), //center that your map defaults to
  locationScope:      "connecticut",      //geographical area appended to all address searches
  recordName:         "result",       //for showing number of results
  recordNamePlural:   "results",


  searchRadius:       805,            //in meters ~ 1/2 mile
  defaultZoom:        9,             //zoom level when map is loaded (bigger is more zoomed in)
  addrMarkerImage:    'images/blue-pushpin.png', // set to empty '' to hide searched address marker
  currentPinpoint:    null,

  initialize: function() {
    $( "#result_count" ).html("");

    geocoder = new google.maps.Geocoder();
    var myOptions = {
      zoom: MapsLib.defaultZoom,
      center: MapsLib.map_centroid,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          stylers: [
            { saturation: -100 }, // MODIFY Saturation and Lightness if needed
            { lightness: 40 }     // Current values make thematic polygon shading stand out over base map
          ]
        }
      ]
    };
    map = new google.maps.Map($("#map_canvas")[0],myOptions);

    // maintains map centerpoint for responsive design
    google.maps.event.addDomListener(map, 'idle', function() {
        MapsLib.calculateCenter();
    });

    google.maps.event.addDomListener(window, 'resize', function() {
        map.setCenter(MapsLib.map_centroid);
    });

    MapsLib.searchrecords = null;

    //MODIFY to match 3-bucket GFT values of pre-checked polygon1  - see also further below
    MapsLib.setDemographicsLabels("very low", "low", "moderate", "high", "very high");

    // MODIFY if needed: defines background polygon1 and polygon2 layers
    MapsLib.polygon1 = new google.maps.FusionTablesLayer({
      query: {
        from:   MapsLib.polygon1TableID,
        select: "geometry"
      },
      styleId: 2,
      templateId: 2
    });

    MapsLib.polygon2 = new google.maps.FusionTablesLayer({
      query: {
        from:   MapsLib.polygon2TableID,
        select: "geometry"
      },
      styleId: 3,
      templateId: 3
    });

    MapsLib.polygon3 = new google.maps.FusionTablesLayer({
      query: {
        from:   MapsLib.polygon2TableID,
        select: "geometry"
      },
      styleId: 4,
      templateId: 4
    });

    MapsLib.polygon4 = new google.maps.FusionTablesLayer({
      query: {
        from:   MapsLib.polygon2TableID,
        select: "geometry"
      },
      styleId: 5,
      templateId: 5
    });

    MapsLib.polygon5 = new google.maps.FusionTablesLayer({
      query: {
        from:   MapsLib.polygon2TableID,
        select: "geometry"
      },
      styleId: 6,
      templateId: 6
    });

    MapsLib.polygon6 = new google.maps.FusionTablesLayer({
      query: {
        from:   MapsLib.polygon2TableID,
        select: "geometry"
      },
      styleId: 7,
      templateId: 7
    });

    MapsLib.polygon7 = new google.maps.FusionTablesLayer({
      query: {
        from:   MapsLib.polygon2TableID,
        select: "geometry"
      },
      styleId: 8,
      templateId: 8
    });

    //reset filters
    $("#search_address").val(MapsLib.convertToPlainString($.address.parameter('address')));
    var loadRadius = MapsLib.convertToPlainString($.address.parameter('radius'));
    if (loadRadius != "") $("#search_radius").val(loadRadius);
    else $("#search_radius").val(MapsLib.searchRadius);
    // $(":checkbox").prop("checked", "checked");
    $("#result_box").hide();

    //-----custom initializers-------
      $("#rbPolygon1").attr("checked", "checked");
    //-----end of custom initializers-------

    //run the default search
    MapsLib.doSearch();
  },

  doSearch: function(location) {
    MapsLib.clearSearch();

    // MODIFY if needed: shows background polygon layer depending on which checkbox is selected
    if ($("#rbPolygon1").is(':checked')) {
      MapsLib.polygon1.setMap(map);
      MapsLib.setDemographicsLabels("0-3%", "3-6%", "6-9%", "9-12%", "12-15%");
      /* TO DO: Insert actual daisy colors */
      $("#legend-1").css({"border-top-color": "#404040"});
      $("#legend-2").css({"border-top-color": "#bababa"});
      $("#legend-3").css({"border-top-color": "#ffffff"});
      $("#legend-4").css({"border-top-color": "#92c5de"});
      $("#legend-5").css({"border-top-color": "#0571b0"});
    }
   if ($("#rbPolygon2").is(':checked')) {
      MapsLib.polygon2.setMap(map);
      MapsLib.setDemographicsLabels("0-5%", "5-10%", "10-15%", "15-20%", "20-25%");
      /* TO DO: Insert actual brownie colors */
      $("#legend-1").css({"border-top-color": "#404040"});
      $("#legend-2").css({"border-top-color": "#bababa"});
      $("#legend-3").css({"border-top-color": "#ffffff"});
      $("#legend-4").css({"border-top-color": "#dfc27d"});
      $("#legend-5").css({"border-top-color": "#a6611a"});
    }
   if ($("#rbPolygon3").is(':checked')) {
      MapsLib.polygon3.setMap(map);
      MapsLib.setDemographicsLabels("0-4%", "4-8%", "8-12%", "12-16%", "16-20%");
      /* TO DO: Insert actual daisy colors */
      $("#legend-1").css({"border-top-color": "#404040"});
      $("#legend-2").css({"border-top-color": "#bababa"});
      $("#legend-3").css({"border-top-color": "#ffffff"});
      $("#legend-4").css({"border-top-color": "#c27ba0"});
      $("#legend-5").css({"border-top-color": "#ab218e"});
    }
    if ($("#rbPolygon4").is(':checked')) {
      MapsLib.polygon4.setMap(map);
      MapsLib.setDemographicsLabels("0-2%", "2-4%", "4-6%", "6-8%", "8-10%");
      /* TO DO: Insert actual brownie colors */
      $("#legend-1").css({"border-top-color": "#404040"});
      $("#legend-2").css({"border-top-color": "#bababa"});
      $("#legend-3").css({"border-top-color": "#ffffff"});
      $("#legend-4").css({"border-top-color": "#e06666"});
      $("#legend-5").css({"border-top-color": "#dd3640"});
    }
    if ($("#rbPolygon5").is(':checked')) {
      MapsLib.polygon5.setMap(map);
      MapsLib.setDemographicsLabels("0-1%", "1-2%", "2-3%", "3-4%", "4-5%");
      /* TO DO: Insert actual brownie colors */
      $("#legend-1").css({"border-top-color": "#404040"});
      $("#legend-2").css({"border-top-color": "#bababa"});
      $("#legend-3").css({"border-top-color": "#ffffff"});
      $("#legend-4").css({"border-top-color": "#f6b26b"});
      $("#legend-5").css({"border-top-color": "#f27536"});
    }
    if ($("#rbPolygon6").is(':checked')) {
      MapsLib.polygon6.setMap(map);
      MapsLib.setDemographicsLabels("0-1%", "1-2%", "2-3%", "3-4%", "4-5%");
      /* TO DO: Insert actual brownie colors */
      $("#legend-1").css({"border-top-color": "#404040"});
      $("#legend-2").css({"border-top-color": "#bababa"});
      $("#legend-3").css({"border-top-color": "#ffffff"});
      $("#legend-4").css({"border-top-color": "#ffd966"});
      $("#legend-5").css({"border-top-color": "#faa61a"});
    }
    if ($("#rbPolygon7").is(':checked')) {
      MapsLib.polygon7.setMap(map);
      MapsLib.setDemographicsLabels("0-4%", "4-8%", "8-12%", "12-16%", "16-20%");
      /* TO DO: Insert actual brownie colors */
      $("#legend-1").css({"border-top-color": "#404040"});
      $("#legend-2").css({"border-top-color": "#bababa"});
      $("#legend-3").css({"border-top-color": "#ffffff"});
      $("#legend-4").css({"border-top-color": "#93c47d"});
      $("#legend-5").css({"border-top-color": "#00ae58"});
    }
    if ($("#rbPolygonOff").is(':checked')) {
      MapsLib.polygonOff.setMap(map);
      MapsLib.setDemographicsLabels("&ndash", "ndash", "ndash", "ndash", "ndash");
      /* TO DO: Insert actual brownie colors */
      $("#legend-1").css({"border-top-color": "#ffffff"});
      $("#legend-2").css({"border-top-color": "#ffffff"});
      $("#legend-3").css({"border-top-color": "#ffffff"});
      $("#legend-4").css({"border-top-color": "#ffffff"});
      $("#legend-5").css({"border-top-color": "#ffffff"});
    }

    var address = $("#search_address").val();
    MapsLib.searchRadius = $("#search_radius").val();

    var whereClause = MapsLib.locationColumn + " not equal to ''";

    //-----custom filters-------
 //---MODIFY column header and values below to match your Google Fusion Table AND index.html
    //-- NUMERICAL OPTION - to display and filter a column of numerical data in your table, use this instead

    var type_column = "'Age Group'";
    var searchType = type_column + " IN (-1,";
    if ( $("#cbType1").is(':checked')) searchType += "1,";
    if ( $("#cbType2").is(':checked')) searchType += "2,";
    if ( $("#cbType3").is(':checked')) searchType += "3,";
    if ( $("#cbType4").is(':checked')) searchType += "4,";
    if ( $("#cbType5").is(':checked')) searchType += "5,";
    if ( $("#cbType6").is(':checked')) searchType += "6,";
    whereClause += " AND " + searchType.slice(0, searchType.length - 1) + ")";
    //-------end of custom filters--------

    if (address != "") {
      if (address.toLowerCase().indexOf(MapsLib.locationScope) == -1)
        address = address + " " + MapsLib.locationScope;

      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          MapsLib.currentPinpoint = results[0].geometry.location;

          $.address.parameter('address', encodeURIComponent(address));
          $.address.parameter('radius', encodeURIComponent(MapsLib.searchRadius));
          map.setCenter(MapsLib.currentPinpoint);

          // set zoom level based on search radius
          if (MapsLib.searchRadius      >= 1610000) map.setZoom(4); // 1,000 miles
          else if (MapsLib.searchRadius >= 805000)  map.setZoom(5); // 500 miles
          else if (MapsLib.searchRadius >= 402500)  map.setZoom(6); // 250 miles
          else if (MapsLib.searchRadius >= 161000)  map.setZoom(7); // 100 miles
          else if (MapsLib.searchRadius >= 80500)   map.setZoom(8); // 50 miles
          else if (MapsLib.searchRadius >= 40250)   map.setZoom(9); // 25 miles
          else if (MapsLib.searchRadius >= 16100)   map.setZoom(11); // 10 miles
          else if (MapsLib.searchRadius >= 8050)    map.setZoom(12); // 5 miles
          else if (MapsLib.searchRadius >= 3220)    map.setZoom(13); // 2 miles
          else if (MapsLib.searchRadius >= 1610)    map.setZoom(14); // 1 mile
          else if (MapsLib.searchRadius >= 805)     map.setZoom(15); // 1/2 mile
          else if (MapsLib.searchRadius >= 400)     map.setZoom(16); // 1/4 mile
          else                                      map.setZoom(17);

          if (MapsLib.addrMarkerImage != '') {
            MapsLib.addrMarker = new google.maps.Marker({
              position: MapsLib.currentPinpoint,
              map: map,
              icon: MapsLib.addrMarkerImage,
              animation: google.maps.Animation.DROP,
              title:address
            });
          }

          whereClause += " AND ST_INTERSECTS(" + MapsLib.locationColumn + ", CIRCLE(LATLNG" + MapsLib.currentPinpoint.toString() + "," + MapsLib.searchRadius + "))";

          MapsLib.drawSearchRadiusCircle(MapsLib.currentPinpoint);
          MapsLib.submitSearch(whereClause, map, MapsLib.currentPinpoint);
        }
        else {
          alert("We could not find your address: " + status);
        }
      });
    }
    else { //search without geocoding callback
      MapsLib.submitSearch(whereClause, map);
    }
  },

  submitSearch: function(whereClause, map, location) {
    //get using all filters
    //NOTE: styleId and templateId are recently added attributes to load custom marker styles and info windows
    //you can find your Ids inside the link generated by the 'Publish' option in Fusion Tables
    //for more details, see https://developers.google.com/fusiontables/docs/v1/using#WorkingStyles

    MapsLib.searchrecords = new google.maps.FusionTablesLayer({
      query: {
        from:   MapsLib.fusionTableId,
        select: MapsLib.locationColumn,
        where:  whereClause
      },
      styleId: 2,
      templateId: 2
    });
    MapsLib.searchrecords.setMap(map);
    MapsLib.getCount(whereClause);
  },

  // MODIFY if you change the number of Polygon layers; TRY designated PolygonOFF layer
  clearSearch: function() {
    if (MapsLib.searchrecords != null)
      MapsLib.searchrecords.setMap(null);
    if (MapsLib.polygon1 != null)
      MapsLib.polygon1.setMap(null);
    if (MapsLib.polygon2 != null)
      MapsLib.polygon2.setMap(null);
    if (MapsLib.polygon3 != null)
      MapsLib.polygon3.setMap(null);
    if (MapsLib.polygon4 != null)
      MapsLib.polygon4.setMap(null);
    if (MapsLib.polygon5 != null)
      MapsLib.polygon5.setMap(null);
    if (MapsLib.polygon6 != null)
      MapsLib.polygon6.setMap(null);
    if (MapsLib.polygon7 != null)
      MapsLib.polygon7.setMap(null);
    if (MapsLib.polygonOFF !=null) 
      MapsLib.polygonOff.setMap(null);
    if (MapsLib.addrMarker != null)
      MapsLib.addrMarker.setMap(null);
    if (MapsLib.searchRadiusCircle != null)
      MapsLib.searchRadiusCircle.setMap(null);
  },

  setDemographicsLabels: function(one, two, three, four, five) {
    $('#legend-1').fadeOut('fast', function(){
      $("#legend-1").html(one);
    }).fadeIn('fast');
    $('#legend-2').fadeOut('fast', function(){
      $("#legend-2").html(two);
    }).fadeIn('fast');
    $('#legend-3').fadeOut('fast', function(){
      $("#legend-3").html(three);
    }).fadeIn('fast');
    $('#legend-4').fadeOut('fast', function(){
      $("#legend-4").html(four);
    }).fadeIn('fast');
    $('#legend-5').fadeOut('fast', function(){
      $("#legend-5").html(five);
    }).fadeIn('fast');
  },

  findMe: function() {
    // Try W3C Geolocation (Preferred)
    var foundLocation;

    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        foundLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
        MapsLib.addrFromLatLng(foundLocation);
      }, null);
    }
    else {
      alert("Sorry, we could not find your location.");
    }
  },

  addrFromLatLng: function(latLngPoint) {
    geocoder.geocode({'latLng': latLngPoint}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          $('#search_address').val(results[1].formatted_address);
          $('.hint').focus();
          MapsLib.doSearch();
        }
      } else {
        alert("Geocoder failed due to: " + status);
      }
    });
  },

  drawSearchRadiusCircle: function(point) {
      var circleOptions = {
        strokeColor: "#4b58a6",
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: "#4b58a6",
        fillOpacity: 0.05,
        map: map,
        center: point,
        clickable: false,
        zIndex: -1,
        radius: parseInt(MapsLib.searchRadius)
      };
      MapsLib.searchRadiusCircle = new google.maps.Circle(circleOptions);
  },

  query: function(query_opts, callback) {

    var queryStr = [];
    queryStr.push("SELECT " + query_opts.select);
    queryStr.push(" FROM " + MapsLib.fusionTableId);

    // where, group and order clauses are optional
    if (query_opts.where && query_opts.where != "") {
      queryStr.push(" WHERE " + query_opts.where);
    }

    if (query_opts.groupBy && query_opts.roupBy != "") {
      queryStr.push(" GROUP BY " + query_opts.groupBy);
    }

    if (query_opts.orderBy && query_opts.orderBy != "" ) {
      queryStr.push(" ORDER BY " + query_opts.orderBy);
    }

    if (query_opts.offset && query_opts.offset !== "") {
      queryStr.push(" OFFSET " + query_opts.offset);
    }

    if (query_opts.limit && query_opts.limit !== "") {
      queryStr.push(" LIMIT " + query_opts.limit);
    }



    var sql = encodeURIComponent(queryStr.join(" "));
    $.ajax({
      url: "https://www.googleapis.com/fusiontables/v1/query?sql="+sql+"&key="+MapsLib.googleApiKey,
      dataType: "json"
    }).done(function (response) {
      if (callback) callback(response);
    });

  },

  handleError: function(json) {
    if (json["error"] != undefined) {
      var error = json["error"]["errors"]
      console.log("Error in Fusion Table call!");
      for (var row in error) {
        console.log(" Domain: " + error[row]["domain"]);
        console.log(" Reason: " + error[row]["reason"]);
        console.log(" Message: " + error[row]["message"]);
      }
    }
  },

  getCount: function(whereClause) {
    var selectColumns = "Count()";
    MapsLib.query({
      select: selectColumns,
      where: whereClause
    }, function(response) {
      MapsLib.displaySearchCount(response);
    });
  },

  displaySearchCount: function(json) {
    MapsLib.handleError(json);
    var numRows = 0;
    if (json["rows"] != null)
      numRows = json["rows"][0];

    var name = MapsLib.recordNamePlural;
    if (numRows == 1)
    name = MapsLib.recordName;
    $( "#result_box" ).fadeOut(function() {
        $( "#result_count" ).html(MapsLib.addCommas(numRows) + " " + name + " found");
      });
    $( "#result_box" ).fadeIn();
  },

  addCommas: function(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  },

  // maintains map centerpoint for responsive design
  calculateCenter: function() {
    center = map.getCenter();
  },

  //converts a slug or query string in to readable text
  convertToPlainString: function(text) {
    if (text == undefined) return '';
  	return decodeURIComponent(text);
  }

  //-----custom functions-------
  // NOTE: if you add custom functions, make sure to append each one with a comma, except for the last one.
  // This also applies to the convertToPlainString function above

  //-----end of custom functions-------
}
