const { devices, maxPower, rates } = require("../data/input.json")


class Schedule {
    constructor({ devices, maxPower, rates }) {
        this.schedule = {};
        this.consumedEnergy = { value: 0, devices: {} };
        this._hourlyRates = [];
        this._devices = [];
        this.maxPower = maxPower;
        this.modes = {
            day: {
                from: 7,
                to: 20
            },
            night: {
                from: 21,
                to: 6
            }
        }
        rates.forEach(rate => this.addRate(rate));
        devices.forEach(device => this.addDevice(device));

        this._makeSchedule();
    }

    _makeSchedule() {
        this._devices.sort((a, b) => a.possibleStartTimes.length - b.possibleStartTimes.length);
        this._devices.forEach(device => {
            device.possibleStartTimes.sort((a, b) => {
                const byPrice = a.price - b.price;
                const byTime = a.startTime - b.startTime;
                if (byPrice == 0) {
                    return byTime;
                }
                return byPrice;
            });

            // const startTime = device.possibleStartTimes[0].startTime;

            // for (let hour = startTime; hour < device.duration + startTime; hour++) {
            //     if (hour in this.schedule) {
            //         this.schedule[hour].push(device.id);
            //     } else {
            //         this.schedule[hour] = [device.id];
            //     }
            // }

            device.possibleStartTimes.forEach(startTime => {

            });
        });
    }

    addRate(rate) {
        if (!rate.from || !rate.to || !rate.value) {
            throw "Mandatory parameter is missing";
        }

        if (rate.from < 0 || rate.to > 23)
            throw "Illegal time";

        for (let hour = rate.from; hour !== rate.to; hour == 23 ? hour = 0 : hour++) {
            this._hourlyRates[hour] = rate.value;
        }
    }

    addDevice(device) {
        if (this._devices.findIndex(d => d === device) !== -1) {
            throw "The device is already added";
        }

        device.possibleStartTimes = [];

        for (let hour = 0; hour <= 24 - device.duration; hour++) {
            if (this._isTimeOkForDeviceMode(hour, device.mode)) {
                const price = this._getDeviceRunPrice(device, hour);
                device.possibleStartTimes.push({ startTime: hour, price });
            }
        }

        if (device.possibleStartTimes.length == 0){
            throw "The device could not be added to the schedule";
        }
        
        this._devices.push(device);
    }

    _isTimeOkForDeviceMode(time, mode) {
        if (mode == "day" && (time < 7 || time >= 21)) {
            return false;
        }

        if (mode == "night" && time >= 7 && time < 21) {
            return false;
        }

        return true;
    }

    _getDeviceRunPrice(device, startTime) {
        let price = 0;
        for (let hour = startTime; hour < device.duration + startTime; hour++) {
            price += (device.power / 1000) * this._hourlyRates[hour];
        }
        return price;
    }

}

const schedule = new Schedule({ devices, maxPower, rates })

module.exports = Schedule;
