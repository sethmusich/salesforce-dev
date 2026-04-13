import { LightningElement, api, wire } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import BILLING_CITY from "@salesforce/schema/Account.BillingCity";
import getWeather from "@salesforce/apex/WeatherService.getWeather";

export default class AccountWeather extends LightningElement {
    @api recordId;

    weather;
    error;
    loading = false;
    _city;

    @wire(getRecord, { recordId: "$recordId", fields: [BILLING_CITY] })
    wiredAccount({ data, error }) {
        if (data) {
            const city = getFieldValue(data, BILLING_CITY);
            if (city && city !== this._city) {
                this._city = city;
                this.fetchWeather(city);
            } else if (!city) {
                this._city = null;
                this.loading = false;
            }
        } else if (error) {
            this.error = error;
        }
    }

    async fetchWeather(city) {
        this.loading = true;
        this.error = undefined;
        this.weather = undefined;
        try {
            this.weather = await getWeather({ city });
        } catch (err) {
            this.error = err;
        } finally {
            this.loading = false;
        }
    }

    get noCity() {
        return !this._city && !this.loading && !this.error;
    }

    get hasError() {
        return !!this.error && !this.loading;
    }

    get temperature() {
        return Math.round(this.weather?.main?.temp);
    }

    get feelsLike() {
        return Math.round(this.weather?.main?.feels_like);
    }

    get humidity() {
        return this.weather?.main?.humidity;
    }

    get windSpeed() {
        return Math.round(this.weather?.wind?.speed);
    }

    get description() {
        const conditions = this.weather?.weather;
        return conditions?.length > 0 ? conditions[0].description : "";
    }

    get iconUrl() {
        const conditions = this.weather?.weather;
        const icon = conditions?.length > 0 ? conditions[0].icon : "";
        return `https://openweathermap.org/img/wn/${icon}@2x.png`;
    }

    get cityDisplay() {
        const name = this.weather?.name;
        const country = this.weather?.sys?.country;
        return country ? `${name}, ${country}` : name;
    }

    get errorMessage() {
        if (this.error?.body?.message) return this.error.body.message;
        return "Unable to load weather data.";
    }
}
