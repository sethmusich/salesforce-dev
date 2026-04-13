public with sharing class WeatherService {
    // Get your free API key at https://openweathermap.org/api
    private static final String API_KEY = '41c434991c664c892f22be7511c0d485';
    private static final String BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

    @AuraEnabled
    public static Map<String, Object> getWeather(String city) {
        if (String.isBlank(city)) {
            return null;
        }

        Http http = new Http();
        HttpRequest req = new HttpRequest();
        req.setEndpoint(
            BASE_URL +
                '?q=' +
                EncodingUtil.urlEncode(city, 'UTF-8') +
                '&appid=' +
                API_KEY +
                '&units=imperial'
        );
        req.setMethod('GET');
        req.setTimeout(10000);

        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        }

        throw new AuraHandledException('Weather data unavailable: ' + res.getStatus());
    }
}
