const { devices, maxPower, rates } = require("../data/input.json")
var Combinatorics = require('js-combinatorics');

class Schedule {
    constructor({ devices, maxPower, rates }) {
        this._hourlyRates = [];
        this._devices = [];
        this._maxPower = maxPower;
        
        rates.forEach(rate => this.setRate(rate));
        devices.forEach(device => this.setDevice(device));
        
        const result = this._makeSchedule();
        this.schedule = result.schedule;
        this.consumedEnergy = result.consumedEnergy;
        
    }

    _makeSchedule() {
        for (let hour = 0; hour < 24; hour++) {
            if (!this._hourlyRates[hour]) {
                throw "The rates are missing or incomplete";
            }
        }

        this._devices.sort(this._byCountOfPossibleStartTimes);
        this._devices.forEach(device => device.possibleStartTimes.sort(this._byPriceThenByTime));

        let allPossibleStartTimes = this._devices.map(d => d.possibleStartTimes);
        let combinedStartTimesCheapestFirst = Combinatorics.cartesianProduct(...allPossibleStartTimes)

        while (true) {
            const bestStartTimesCandidate = combinedStartTimesCheapestFirst.next();
            if (!bestStartTimesCandidate) {
                throw "Failed to create the schedule"
            }

            const schedule = this.createSchedule(bestStartTimesCandidate);
            if (!schedule) {
                continue;
            }

            const consumedEnergy = { value: 0, devices: {} };
            for (const key in bestStartTimesCandidate) {
                if (bestStartTimesCandidate.hasOwnProperty(key)) {
                    const deviceRun = bestStartTimesCandidate[key];
                    consumedEnergy.devices[deviceRun.device.id] = deviceRun.price;
                    consumedEnergy.value += deviceRun.price;
                }
            }
            consumedEnergy.value = Math.round(consumedEnergy.value * 10000) / 10000

            return { schedule, consumedEnergy };
        }
    }

    createSchedule(scheduleCandidate) {
        const schedule = {};
        for (let hour = 0; hour < 24; hour++) {
            schedule[hour] = [];
            let sumPowerByAllDevicesForTheHour = 0;
            for (const key in scheduleCandidate) {
                if (!scheduleCandidate.hasOwnProperty(key)) {
                    continue;
                }

                const deviceRun = scheduleCandidate[key];
                if (hour >= deviceRun.startTime && hour <= deviceRun.startTime + deviceRun.device.duration) {
                    schedule[hour].push(deviceRun.device.id);
                    sumPowerByAllDevicesForTheHour += deviceRun.device.power;
                }
            }

            if (sumPowerByAllDevicesForTheHour > this._maxPower) {
                return undefined;
            }
        }

        return schedule;
    }

    setRate(rate) {
        if (!rate.from || !rate.to || !rate.value) {
            throw "Failed to add rate. Mandatory parameter is missing. " + rate;
        }

        if (rate.from < 0 || rate.to > 23)
            throw "Failed to add rate. Illegal time. " + rate;

        let hour = rate.from;
        while (hour != rate.to) {
            this._hourlyRates[hour] = rate.value;
            hour = this._addHours(hour, 1);
        }
    }

    setDevice(device) {
        if (this._devices.findIndex(d => d === device) !== -1) {
            throw `The device is already added: ${device.name}`;
        }

        if (device.power > this._maxPower) {
            throw `The device ${device.name} exceeds the power limit of ${this._maxPower}`;
        }

        device.possibleStartTimes = [];
        for (let hour = 0; hour <= 24 - device.duration; hour++) {
            if (!this._isItProperHourForThisDeviceMode(hour, device.mode)) {
                continue;
            }

            const price = this._getDeviceRunPrice(device, hour);
            device.possibleStartTimes.push({ startTime: hour, price, device });
        }

        if (device.possibleStartTimes.length == 0) {
            throw "The device could not be added to the schedule";
        }

        this._devices.push(device);
    }

    _isItProperHourForThisDeviceMode(time, mode) {
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

        return Math.round(price * 10000) / 10000;
    }

    _subtractHours(x, y) {
        let difference = x - y;
        if (difference < 0) {
            return difference + 24;
        } else {
            return difference;
        }
    }

    _addHours(x, y) {
        let sum = x + y;
        if (sum > 23) {
            return sum - 24;
        } else {
            return sum;
        }
    }

    _byPriceThenByTime(a, b) {
        const byPrice = a.price - b.price;
        const byTime = a.startTime - b.startTime;
        if (byPrice == 0) {
            return byTime;
        }
        return byPrice;
    }

    _byCountOfPossibleStartTimes(a, b) {
        a.possibleStartTimes.length - b.possibleStartTimes.length;
    }
}


const schedule = new Schedule({ devices, maxPower, rates })

module.exports = Schedule;
