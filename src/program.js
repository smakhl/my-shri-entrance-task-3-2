const { devices, maxPower, rates } = require("../data/input.json")
var Combinatorics = require('js-combinatorics');

class Schedule {
    constructor({ devices, maxPower, rates }) {
        this._hourlyRates = [];
        this._devices = [];
        this._maxPower = 0;

        this._setMaxPower(maxPower);
        rates.forEach(rate => this._setRate(rate));
        devices.forEach(device => this._setDevice(device));

        this._runAlgorithm();
    }

    addDevice(device) {
        this._setDevice(device);
        this._runAlgorithm();
    }

    addRate(rate) {
        this._setRate(rate);
        this._runAlgorithm();
    }

    _runAlgorithm() {
        for (let hour = 0; hour < 24; hour++) {
            if (!this._hourlyRates[hour]) {
                throw "The rates are missing or incomplete";
            }
        }

        this._devices.sort(this._byCountOfPossibleStartTimes);
        this._devices.forEach(device => device.possibleStartTimes.sort(this._byPriceThenByTime));

        const allPossibleStartTimes = this._devices.map(d => d.possibleStartTimes);
        const combinedStartTimesCheapestFirst = Combinatorics.cartesianProduct(...allPossibleStartTimes)

        while (true) {
            const nextBestStartTimesCandidate = combinedStartTimesCheapestFirst.next();
            if (!nextBestStartTimesCandidate) {
                throw "Failed to create the schedule"
            }

            const schedule = this._createSchedule(nextBestStartTimesCandidate);
            if (!schedule) {
                continue;
            }

            const consumedEnergy = this._calculateConsumedEnergy(nextBestStartTimesCandidate);
            
            this.schedule = schedule;
            this.consumedEnergy = consumedEnergy;
            return;
        }
    }

    _calculateConsumedEnergy(startTimeCandidate) {
        const consumedEnergy = { value: 0, devices: {} };
        for (const key in startTimeCandidate) {
            if (startTimeCandidate.hasOwnProperty(key)) {
                const deviceRun = startTimeCandidate[key];
                consumedEnergy.devices[deviceRun.device.id] = deviceRun.price;
                consumedEnergy.value += deviceRun.price;
            }
        }
        consumedEnergy.value = Math.round(consumedEnergy.value * 10000) / 10000;
        return consumedEnergy;
    }

    _createSchedule(scheduleCandidate) {
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

    _setRate(rate) {
        if (!rate.from || !rate.to || !rate.value) {
            throw "Failed to add rate. Mandatory parameter is missing. " + rate;
        }

        if (isNaN(rate.from) || isNaN(rate.to) || isNaN(rate.value)) {
            throw "Failed to add rate. Illegal paraeter. " + rate;
        }

        if (rate.from < 0 || rate.to > 23)
            throw "Failed to add rate. Illegal time. " + rate;

        let hour = rate.from;
        while (hour != rate.to) {
            this._hourlyRates[hour] = rate.value;
            hour = this._addHours(hour, 1);
        }
    }

    _setMaxPower(maxPower) {
        if (!maxPower || isNaN(maxPower)){
            throw "Failed to set maxPower " + maxPower;
        }

        this._maxPower = maxPower;
    }

    _setDevice(device) {
        if (!device.id || !device.power || !device.duration || !device.name) {
            throw "Could not add device. Mandatory parameter missing. " + device;
        }

        if (device.mode && (device.mode != "day" && device.mode != "night")) {
            throw "Could not add device. Illegal mode: " + device;
        }

        if (isNaN(device.power) || isNaN(device.duration) || device.duration > 24) {
            throw "Could not add device. Illegal parameter. " + device;
        }

        if (device.power > this._maxPower) {
            throw `Could not add device. The device ${device.name} exceeds the power limit of ${this._maxPower}`;
        }

        const existingDeviceIndex = this._devices.findIndex(d => d === device);
        if (existingDeviceIndex !== -1) {
            this._devices.splice(existingDeviceIndex, 1);
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
schedule.addDevice({ id: "id", power: 300, duration: 2, name: "test device", mode: "day" })
module.exports = Schedule;
