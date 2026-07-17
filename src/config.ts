export const BRATISLAVA_CENTER: google.maps.LatLngLiteral = {
    lat: 48.1486,
    lng: 17.1077
};

export const DEFAULT_ZOOM: number = 13;

export const MAP_STYLES: google.maps.MapTypeStyle[] = [
    {
        featureType: "all",
        elementType: "labels",
        stylers: [
            {
                visibility: "off"
            }
        ]
    }
];