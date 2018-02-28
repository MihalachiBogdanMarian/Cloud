// pentru o locatie date se foloseste primul api care furnizeaza latitudinea si longitudinea la care se gaseste locatia
// pentru latitudinea si longitudinea gasite se afla ora la care rasare si ora la care apune soarele pentru ziua de azi folosind al doilea api
// al treilea api populeaza harta cu locurile de tipul selectat, pe o raza selectata si care sunt deschise la rasarit/apus

var map; // harta
var markers = []; // markerele de pe harta

function initMap() { // initializarea hartiis
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 47.161494, lng: 27.58405},
        zoom: 15
    }); // harta
}

function run() {
    let location = document.getElementById("location").value; // valoarea din text field cu locatia
    let type_of_place = document.getElementById("places").value; // tipul de loc cautat
    let radius = document.getElementById("radius").value; // raza pe care sa caute
    let suntise_sunset = document.getElementById("sunrise").checked; // disponibilitatea locului la rasarit/asfintit; true - sunrise, false - sunset
    console.log(location);
    console.log(type_of_place);
    console.log(radius);
    console.log(suntise_sunset);
    let url1 = "http://www.mapquestapi.com/geocoding/v1/address?key=Ha6gu1GnAiaHUZB9GJ7hVsiwtFj3f1mf&location=" + location + "&format=json"; // raspunsul furnizat de primul api
    //console.log(url1);

    fetch(url1) // preluare date primul api
        .then((response) => response.json()) // raspunsul primit sub forma de json
        .then(function (data) {
            let lat = data.results[0].locations[0].latLng["lat"]; // latitudinea la care se gaseste locatia
            console.log(lat);
            let lng = data.results[0].locations[0].latLng["lng"]; // longitudinea la care se gaseste locatia
            console.log(lng);

            let date = new Date(); // data de astazi
            let day = date.getDay(); // ziua de astazi; numar intre 0 - Sunday si 6 - Saturday

            let url2 = "https://api.sunrise-sunset.org/json?lat=" + lat + "&lng=" + lng + "&date=today"; // raspunsul furnizat de al doilea api

            fetch(url2) // preluare date al doilea api
                .then((response) => response.json())
                .then(function (data) {
                    let sunrise = data.results["sunrise"].split(" ")[0].split(":")[0] +
                        ":" + data.results["sunrise"].split(" ")[0].split(":")[1] + " " + data.results["sunrise"].split(" ")[1]; // ora la care rasare soarele fara secunde
                    console.log(sunrise);
                    let sunset = data.results["sunset"].split(" ")[0].split(":")[0] +
                        ":" + data.results["sunset"].split(" ")[0].split(":")[1] + " " + data.results["sunset"].split(" ")[1]; // ora asfintitului fara secunde
                    console.log(sunset);

                    // afisam cand rasare si cand apune soarele
                    document.getElementById("sunrise_text").innerHTML = sunrise;
                    document.getElementById("sunset_text").innerHTML = sunset;

                    let location = {lat: lat, lng: lng}; // obiect locatie pentru construirea hartii

                    // eliminare fostii markeri
                    for (var i = 0; i < markers.length; i++) {
                        markers[i].setMap(null);
                    }
                    markers = [];

                    let center = new google.maps.LatLng(lat, lng);
                    map.panTo(center); // centrare mapa pe noua locatie

                    let request = {
                        location: location, // locatia/orasul in jurul carui se cauta locurile
                        radius: radius, // raza in care se cauta
                        type: type_of_place // tipul locurilor cautate
                    }; // criteriile pe baza carora se identifica locurile cautate

                    infowindow = new google.maps.InfoWindow(); // ferestre cu detalii suplimentare despre locuri
                    service = new google.maps.places.PlacesService(map); // api-ul google places
                    service.nearbySearch(request, callback); // cautare dupa apropiere

                    function callback(results, status) {
                        if (status === google.maps.places.PlacesServiceStatus.OK) {
                            places_open_at_sunrise = []; // locurile deschise in momentul rasaritului
                            for (let i = 0; i < results.length; i++) {
                                let place = results[i];

                                service.getDetails({
                                    placeId: place.place_id // parcurgem detaliile fiecarui loc identificat prin id unic
                                }, function (place, status) {
                                    if (place !== null) {
                                        if (status === google.maps.places.PlacesServiceStatus.OK) {
                                            if (place.opening_hours) {
                                                let interval = place.opening_hours.weekday_text[day === 0 ? 6 : day - 1]; // intervalul de timp in care locatia este deschisa in cadrul zilei de azi
                                                console.log(interval);

                                                let ok = 0; // 1 - locatie available la momentul rasaritului, 0 - altfel
                                                if (interval.indexOf("Open 24 hours") !== -1) {
                                                    ok = 1;
                                                }
                                                else if (interval.indexOf("Closed") !== -1) {
                                                    ok = 0;
                                                }
                                                else {
                                                    let begin_hour = interval.split(": ")[1].split(" – ")[0]; // ora la care se deschide
                                                    let end_hour = interval.split(": ")[1].split(" – ")[1]; // ora la care se inchide
                                                    // formatare ore
                                                    if (begin_hour.indexOf("AM") === -1 && begin_hour.indexOf("PM") === -1) {
                                                        begin_hour = begin_hour + " " + end_hour.split(" ")[1];
                                                    }
                                                    if (begin_hour.indexOf(",") !== -1) {
                                                        begin_hour = begin_hour.split(",")[0];
                                                    }
                                                    if (end_hour.indexOf(",") !== -1) {
                                                        end_hour = end_hour.split(",")[0];
                                                    }
                                                    console.log(begin_hour);
                                                    console.log(end_hour);

                                                    // verificare daca ora rasaritului se afla intre ora deschiderii locatiei si ora inchiderii locatiei
                                                    let sunrise24 = convert12To24(sunrise); // conversie in ora format 24
                                                    let sunset24 = convert12To24(sunset);
                                                    let begin_hour24 = convert12To24(begin_hour); // conversie in ora format 24
                                                    let end_hour24 = convert12To24(end_hour); // conversie in ora format 24
                                                    console.log(begin_hour24);
                                                    console.log(end_hour24);
                                                    if (suntise_sunset === true) {
                                                        if (sunrise24 >= begin_hour24 && sunrise24 <= end_hour24) { // in format 24 datele se pot compara direct pe string-uri
                                                            ok = 1;
                                                        }
                                                    }
                                                    else {
                                                        if (sunset24 >= begin_hour24 && sunset24 <= end_hour24) {
                                                            ok = 1;
                                                        }
                                                    }
                                                }
                                                console.log(place.opening_hours.weekday_text);

                                                if (ok === 1) { // locatie available la momentul rasaritului
                                                    places_open_at_sunrise.push(place.name);
                                                    let marker = new google.maps.Marker({
                                                        map: map,
                                                        position: place.geometry.location,
                                                        icon: "marker.png"
                                                    }); // creare marker de pus pe harta
                                                    markers.push(marker);
                                                    google.maps.event.addListener(marker, 'click', function () {
                                                        infowindow.setContent("<div><strong>" + place.name + "</strong><br>" +
                                                            "Opening hours: " + place.opening_hours.weekday_text[day === 0 ? 6 : day - 1] + "<br>" +
                                                            place.formatted_address + "</div>");
                                                        infowindow.open(map, this);
                                                    }); // atasare ferestra cu informatii la marker
                                                }
                                            }
                                        }
                                    }
                                });
                            }

                            for (let j = 0; j < places_open_at_sunrise.length; j++) {
                                console.log(places_open_at_sunrise[j]);
                            }
                        }
                    }
                })
                .catch(function (error) { // in caz de a aparut o eroare, afisare mesaj de eroare
                    console.log(error);
                });
        })
        .catch(function (error) { // eroare
            console.log(error);
        });
}

function convert12To24(hour12_string) { // converteste data din format 12 ore in format 24 ore
    let re1 = /^(\d+)/; // ora
    let re2 = /:(\d+)/; // minutul
    let re3 = /\s(.*)$/; // am/pm
    let hour12 = Number(hour12_string.match(re1)[1]); // convertire string -> int pentru ora
    let minute12 = Number(hour12_string.match(re2)[1]); // convertire string -> int pentru minut
    let ampm = hour12_string.match(re3)[1]; // am/pm
    if (ampm === "AM" && hour12 === 12) {
        hour12 = 0;
    }
    if (ampm === "PM" && hour12 !== 12) {
        hour12 = hour12 + 12;
    }
    let hour24 = hour12.toString();
    let minute24 = minute12.toString();
    if (hour12 < 10) {
        hour24 = "0" + hour24;
    }
    if (minute12 < 10) {
        minute24 = "0" + minute24;
    }
    return hour24 + ":" + minute24;
}