const baseUrl = '../dist';
const assetUrl = '../dist/assets';
const mapsKey = 'AIzaSyDA9w9HOxuTsR8bVmnvQVDE6CJacA0uEQ0';


$(document).ready(function() {
    if (document.getElementById('store-locator')) {
        new StoreLocator($('#store-locator'));
    }
});


class StoreLocator {
    constructor($storeLocator) {
        this.$storeLocator = $storeLocator;
        this.$results = this.$storeLocator.find('.results');
        this.storesJsonEndpoint = assetUrl + '/data/PharmacyJson.json';
        this.map = new StoreMap(this);
        this.stores;
        this.shownStores;
        this.selected;
        this.currentLocation;
        this.filters = {
            open_saterday: false,
            has_atm: false,
            open_in_evening: false,
            has_pick_up_point: false,
            query: ''
        }

        this.fetchStores();
        this.bindings();
    }

    bindings() {
        this.$storeLocator.on('click touchstart', '.btn-locate', () => {
            this.onGeoLocate();
        });
        this.$storeLocator.on('click touchstart', '.btn-search', () => {
            this.onSearch();
        });
        this.$storeLocator.on('keyup', '.search-field', (event) => {
            // enter key
            if (event.keyCode === 13) {
                this.onSearch();
            }
            else {
                this.onQueryChanged(event);
            }
        });
        this.$storeLocator.on('keydown', '.search-field', () => {
            this.clearSearchKeyUpTimeout();
        });
        this.$storeLocator.on('change', 'input.open-saterday', (event) => {
            this.onOpenSaterdayChanged(event);
        });
        this.$storeLocator.on('change', 'input.has-atm', (event) => {
            this.onHasAtmChanged(event);
        });
        this.$storeLocator.on('change', 'input.open-in-evening', (event) => {
            this.onOpenInEveningChanged(event);
        });
        this.$storeLocator.on('change', 'input.has-pick-up-point', (event) => {
            this.onHasPickUpPointChanged(event);
        });
        this.$storeLocator.on('click', '.result', (event) => {
            this.onSelected(event);
        });

    }

    fetchStores() {
        $.get(this.storesJsonEndpoint, (json) => {
            this.onStoresFetched(json);
        });
    }

    renderRows() {
        let $template = this.$results.find('.template');
        let today = moment().format('dddd').toLowerCase();
        let fico = parseInt(this.getParameterByName('fico'));

        this.stores.each((store) => {
            let $row = $template.clone().removeClass('hidden').removeClass('template');

            let closedAt = store.opening_hours[today].afternoon_close;

            $row.attr('id', 'id-' + store.id);
            $row.find('.name').text(store.name);
            $row.find('.city').html(store.location.city + ' <small class="distance"></small>');

            if (store.id === fico) {
                $row.filter('#id-' + fico).addClass('active');
            }
            if (closedAt === null) {
                $row.find('.opening-hrs').text('Vandaag gesloten');
            } else {
                $row.find('.opening-hrs').text('Vandaag open tot ' + closedAt);
            }
            $row.find('.link-apotheek').attr('href', store.url);
            if (!store.has_skin_care) {
                $row.find('.has-skin-care').remove();
            }
            if (!store.has_atm) {
                $row.find('.has-atm').remove();
            }
            if (!store.has_pick_up_point) {
                $row.find('.has-pick-up-point').remove();
            }

            this.$results.append($row);
        });

        this.$storeLocator.find('.has-tooltip').tooltip();

        if (this.$results.find('.active').length) {
            let $activeRow = this.$results.find('.active');
            $activeRow.trigger("click");
            let scrollTo = $activeRow.offset().top - this.$results.offset().top + this.$results.scrollTop();

            this.$results[0].scrollTop = scrollTo;
        }

    }

    renderReOrder() {
        this.stores.each((store) => {
            let $row = $('#id-' + store.id);
            $row.find('.distance').text('(+' + Math.round(store.distance * 10) / 10 + ' km)');
            this.$results.append($row);
        });
    }

    filter() {
        this.stores.each((store) => {
            store.is_shown = true;

            if ((this.filters.open_saterday && !store.open_saterday) ||
                (this.filters.has_atm && !store.has_atm) ||
                (this.filters.open_in_evening && !store.open_in_evening) ||
                (this.filters.has_pick_up_point && !store.has_pick_up_point)
            ) {
                store.is_shown = false;
            }
        });
    }

    displayResults() {
        this.shownStores = this.stores.filter((store) => {
            let $row = $('#id-' + store.id);
            $row.toggleClass('hidden', !store.is_shown);
            if (this.selected) {
                $row.toggleClass('active', this.selected.id === store.id);
            }

            return store.is_shown;
        });
    }

    showAll(is_shown) {
        is_shown = typeof is_shown != "undefined" ? is_shown : true;
        this.stores.each((store) => {
            store.is_shown = is_shown;
        });
    }

    hideAll() {
        this.showAll(false);
    }

    select(id) {
        this.selected = this.stores.firstWhere('id', id);
        this.selected.is_shown = true;

        this.$storeLocator.find('.selected-store-id').val(id).trigger('change');
        this.$storeLocator.find('.selected-store-name').val(this.selected.name).trigger('change');
        this.$storeLocator.find('.selected-store-linscriptum').val(this.selected.linscriptum).trigger('change');

        this.map.select(id);
    }

    scrollTo(id) {
        let $row = $('#id-' + id);
        let scrollTo = $row.offset().top - this.$results.offset().top + this.$results.scrollTop();

        this.$results[0].scrollTop = scrollTo;
    }

    setSearchKeyUpTimeout() {
        this.searchTimeout = setTimeout(() => {
            this.onSearch();
        }, 500);
    }

    clearSearchKeyUpTimeout() {
        clearTimeout(this.searchTimeout);
    }

    calculateDistances(location) {
        this.stores.each(function(store) {
            store.setDistance(location);
        });
    }

    sortByDistance() {
        this.stores = this.stores.sortBy('distance');
        this.renderReOrder();
    }

    /** Listeners */

    onStoresFetched(json) {
        this.stores = collect(json).transform(function(properties) {
            return new Store(properties);
        });
        this.map.setMarkers(this.stores);
        this.renderRows();
        this.displayResults();

        if (this.currentLocation) {
            this.onGeoLocationChanged(this.currentLocation);
        }
    }

    onQueryChanged(event) {
        this.filters.query = $(event.target).val().toLowerCase();
        this.$storeLocator.find('.search-field').val(this.filters.query);
        this.setSearchKeyUpTimeout();
    }

    onSearch() {
        this.clearSearchKeyUpTimeout();
        this.filter();
        this.displayResults();
        this.map.showMarkers(this.shownStores.pluck('id'));

        if (this.filters.query.length > 3) {
            this.map.onSearch(this.filters.query);
        }
    }

    onOpenSaterdayChanged(event) {
        this.filters.open_saterday = $(event.target).prop('checked');
        this.onSearch();
    }

    onHasAtmChanged(event) {
        this.filters.has_atm = $(event.target).prop('checked');
        this.onSearch();
    }

    onOpenInEveningChanged(event) {
        this.filters.open_in_evening = $(event.target).prop('checked');
        this.onSearch();
    }

    onHasPickUpPointChanged(event) {
        this.filters.has_pick_up_point = $(event.target).prop('checked');
        this.$storeLocator.find('input.has-pick-up-point').prop('checked', this.filters.has_pick_up_point);
        this.onSearch();
    }

    onSelected(event) {
        let $row = $(event.target).hasClass('result') ? $(event.target) : $(event.target).parents('.result');
        let id = parseInt($row.attr('id').replace('id-', ''));

        this.select(id);
        this.displayResults();

    }

    onSelectedById(id) {
        this.select(id);
        this.displayResults();
        this.scrollTo(id);
    }

    onSelectedByIds(ids) {
        this.stores.whereIn('id', ids.toArray()).each(function(store) {
            store.is_shown = true;
        });
        this.scrollTo(ids.first());
        this.displayResults();
    }

    onGeoLocate() {
        this.map.goToGeoCenter();
    }

    onGeoLocationChanged(location) {
        this.currentLocation = location;

        if (this.stores) {
            this.calculateDistances(location);
            this.sortByDistance();
        }
    }

    getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
}

class StoreMap {
    constructor(delegate) {
        this.center = {lat: 52.076544, lng: 4.186362};
        this.geoCenter = this.center;
        this.markers = collect();
        this.shownMarkers = collect();
        this.shownIds = collect();
        this.delegate = delegate;
        this.selected;
        this.currentLocationMarker;
        this.searchMarker;
        this.map;
        this.mapOptions;
        this.autocomplete;
        this.markerCluster;

        this.initMap();
    }

    initMap() {

        if (window.isMobile) {
            this.mapOptions = {
                center: this.center,
                zoom: 9,
                scrollwheel: false,
                navigationControl: false,
                mapTypeControl: false,
                scaleControl: false,
                draggable: false,
                disableDefaultUI: true
            }
        } else {
            this.mapOptions = {
                center: this.center,
                zoom: 9,
            }
        }

        this.map = new google.maps.Map(document.getElementById('store-locator-map'), this.mapOptions);

        this.selected = new google.maps.Marker({
            position: null,
            map: this.map,
            icon: assetUrl + '/svg/marker-highlighted.svg',
            id: null
        });

        this.searchMarker = new google.maps.Marker({
            position: null,
            map: this.map,
            icon: assetUrl + '/svg/marker-highlighted-small.svg'
        });

        let self = this;
        this.selected.addListener('click', function() {
            self.delegate.onSelectedById(this.id);
        });

        this.initMarkerCluster();
        this.initAutocomplete();
        this.findGeoLocation();
    }

    initMarkerCluster() {
        this.markerCluster = new MarkerClusterer(this.map, [], {
            styles: Array(5).fill({
                textColor: "#fff",
                url: assetUrl + "/svg/marker-cluster.svg",
                textSize: 14,
                height: 37,
                width: 30
            })
        });

        google.maps.event.addListener(this.markerCluster, 'clusterclick', (cluster) => {
            let ids = collect(cluster.getMarkers()).pluck('id');
            this.delegate.onSelectedByIds(ids);
        });
    }

    initAutocomplete() {
        let field = window.isMobile
            ? document.getElementById('location-search-mobile')
            : document.getElementById('location-search');

        this.autocomplete = new google.maps.places.Autocomplete(field, {
            types: ['geocode'],
            componentRestrictions: {
                country: "nl"
            }
        });

        this.autocomplete.addListener('place_changed', () => {
            this.foundPlace();
        });
    }

    setMarkers(stores) {
        stores.each((store) => {
            let marker = new google.maps.Marker({
                position: {lat: store.location.latitude, lng: store.location.longitude},
                map: this.map,
                icon: assetUrl + '/svg/marker.svg',
                id: store.id
            });

            let self = this;
            marker.addListener('click', function() {
                self.delegate.onSelectedById(this.id);
            });

            this.markers.push(marker);
        });

        this.shownMarkers = this.markers;
        this.shownIds = this.shownMarkers.pluck('id');
        this.clusterMarkers();
    }

    onSearch(query) {
        if (this.query == query || this.geocodeSearch) {
            return;
        }

        this.query = query;

        let url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURI(query) + '%20Nederland&key=' + mapsKey;

        this.geocodeSearch = $.get(url)
            .then((response) => {
                if (response.status == 'OK' && response.results.length) {
                    let place = response.results[0];
                    if (!place.geometry) {
                        return;
                    }

                    this.center = place.geometry.location;
                    this.searchMarker.setPosition(this.center);

                    this.goToCenter();

                    if (typeof place.geometry.bounds != 'undefined') {
                        this.goToBounds(place.geometry.bounds);
                    }
                }

                this.geocodeSearch = null;
            });
    }

    foundPlace() {
        var place = this.autocomplete.getPlace();
        if (!place.geometry) {
            return;
        }

        this.center = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        }

        this.searchMarker.setPosition(this.center);

        this.goToCenter();
    }

    goToGeoCenter() {
        this.center = this.geoCenter;
        this.goToCenter();
    }

    goToCenter() {
        this.map.setCenter(this.center);
        this.delegate.onGeoLocationChanged(this.center);
    }

    goToBounds(bounds) {
        var latLngBounds = new google.maps.LatLngBounds();

        latLngBounds.extend(bounds.northeast);
        latLngBounds.extend(bounds.southwest);

        this.map.fitBounds(latLngBounds);
    }

    select(id) {
        let selected = this.markers.firstWhere('id', id);
        this.selected.id = selected.id;
        this.selected.setPosition(selected.position);
        this.map.setCenter(selected.position);

        this.showMarkers(this.shownIds);
    }

    showMarkers(ids) {
        this.shownIds = ids;
        this.shownMarkers = this.markers.filter((marker) => {
            let map = (ids.search(marker.id) === false) ? null : this.map;

            if (this.selected !== null && this.selected.id === marker.id) {
                map = null;
            }

            marker.setMap(map);

            return map != null;
        });

        this.clusterMarkers();
    }

    clusterMarkers() {
        this.markerCluster.clearMarkers();
        this.markerCluster.addMarkers(this.shownMarkers.toArray());
    }

    findGeoLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                this.geoLocationAvailable(position);
            }, () => {
                this.geoLocationNotAvailable();
            });
        }
    }

    geoLocationAvailable(position) {
        this.geoCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        if (this.locatedInTheNetherlands(this.geoCenter)) {
            this.center = this.geoCenter;

            this.currentLocationMarker = new GeolocationMarker(this.map);
            this.currentLocationMarker.setCircleOptions({
                fillColor: '#ddd',
                strokeColor: '#aaa',
                strokeWeight: 1
            });

            this.goToCenter();
        }

        this.biasAutocomplete()
    }

    geoLocationNotAvailable() {
        $('.btn-locate').prop('disabled', true);
    }

    biasAutocomplete() {
        var circle = new google.maps.Circle({
            center: this.center,
            radius: 900 // position.coords.accuracy
        });

        this.autocomplete.setBounds(circle.getBounds());
    }

    locatedInTheNetherlands(location) {
        let min = {lat: 50.8869709, lng: 2.8961311};
        let max = {lat: 53.5953873, lng: 7.1915611};

        return (location.lat > min.lat &&
            location.lng > min.lng &&
            location.lat < max.lat &&
            location.lng < max.lng);
    }

    selectFirstOnEnter(input) {
        // store the original event binding function
        var _addEventListener = input.addEventListener;

        function addEventListenerWrapper(type, listener) { // Simulate a 'down arrow' keypress on hitting 'return' when no pac suggestion is selected, and then trigger the original listener.
            if (type == "keydown") {
                var orig_listener = listener;
                listener = function(event) {
                    var suggestion_selected = $(".pac-item-selected").length > 0;
                    if (event.which == 13 && !suggestion_selected) {
                        var simulated_downarrow = $.Event("keydown", {keyCode: 40, which: 40});
                        orig_listener.apply(input, [simulated_downarrow]);
                    }
                    orig_listener.apply(input, [event]);
                };
            }
            _addEventListener.apply(input, [type, listener]); // add the modified listener
        }

        input.addEventListener = addEventListenerWrapper;
    }

}

class Store {
    constructor(properties) {
        this.id;
        this.name;
        this.linscriptum;
        this.open_saterday;
        this.open_in_evening;
        this.has_atm;
        this.has_pick_up_point;
        this.has_skin_care;
        this.url;
        this.location;
        this.opening_hours;
        this.distance;
        this.is_shown = true;

        for (var property in properties) {
            this[property] = properties[property];
        }
    }

    setDistance(location) {
        let p = 0.017453292519943295; // Math.PI / 180
        let c = Math.cos;
        let a = 0.5 - c((this.location.latitude - location.lat) * p) / 2 +
            c(location.lat * p) * c(this.location.latitude * p) *
            (1 - c((this.location.longitude - location.lng) * p)) / 2;

        this.distance = 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }
}
