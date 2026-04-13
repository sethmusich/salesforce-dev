@isTest
public class WeatherServiceTest {
    private static final String MOCK_BODY =
        '{"name":"San Francisco","sys":{"country":"US"},' +
        '"main":{"temp":65.3,"feels_like":63.1,"humidity":72},' +
        '"weather":[{"description":"partly cloudy","icon":"02d"}],' +
        '"wind":{"speed":8.2}}';

    @isTest
    static void testGetWeatherSuccess() {
        Test.setMock(HttpCalloutMock.class, new WeatherMock(200, MOCK_BODY));
        Test.startTest();
        Map<String, Object> result = WeatherService.getWeather('San Francisco');
        Test.stopTest();

        System.assertNotEquals(null, result, 'Expected weather data to be returned');
        System.assertEquals('San Francisco', result.get('name'), 'Expected city name in response');
    }

    @isTest
    static void testGetWeatherBlankCity() {
        Test.startTest();
        Map<String, Object> result = WeatherService.getWeather('');
        Test.stopTest();

        System.assertEquals(null, result, 'Expected null for blank city');
    }

    @isTest
    static void testGetWeatherNullCity() {
        Test.startTest();
        Map<String, Object> result = WeatherService.getWeather(null);
        Test.stopTest();

        System.assertEquals(null, result, 'Expected null for null city');
    }

    @isTest
    static void testGetWeatherError() {
        Test.setMock(HttpCalloutMock.class, new WeatherMock(404, '{"message":"city not found"}'));
        Test.startTest();
        try {
            WeatherService.getWeather('ZZZNotACity');
            System.assert(false, 'Expected AuraHandledException to be thrown');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage() != null, 'Expected error message');
        }
        Test.stopTest();
    }

    private class WeatherMock implements HttpCalloutMock {
        private Integer statusCode;
        private String body;

        WeatherMock(Integer statusCode, String body) {
            this.statusCode = statusCode;
            this.body = body;
        }

        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(statusCode);
            res.setStatus(statusCode == 200 ? 'OK' : 'Not Found');
            res.setBody(body);
            return res;
        }
    }
}
