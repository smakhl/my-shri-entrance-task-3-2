const { devices, maxPower, rates } = require("../data/input.json")


class Schedule {
    constructor({ devices, maxPower, rates }) {
        this.schedule = {};
        this.consumedEnergy = { value: 0, devices: {} };
        const hourlyRates = this.getHourlyRates(rates);

        devices.forEach(device => {
            device.possibleStartTime = [];

            for (let hour = 0; hour <= 24 - device.duration; hour++) {
                if (this.isTimeNonSuitableForDevice(hour, device.mode)) {
                    continue;
                }
                const price = this.getDeviceRunPrice(hourlyRates, device, hour);
                device.possibleStartTime.push({ startTime: hour, price });
            }

            device.possibleStartTime.sort((a, b) => {
                const byPrice = a.price - b.price;
                const byTime = a.startTime - b.startTime;
                if (byPrice == 0){
                    return byTime;
                }
                return byPrice;
            });
        });

        devices.sort((a, b) => a.possibleStartTime.length - b.possibleStartTime.length);

        devices.forEach(device => {
            const startTime = device.possibleStartTime[0].startTime;

            for (let hour = startTime; hour < device.duration + startTime; hour++) {
                if (hour in this.schedule) {
                    this.schedule[hour].push(device.id);
                } else {
                    this.schedule[hour] = [device.id];
                }
            }
        });
    }

    isTimeNonSuitableForDevice(time, mode) {
        if (mode == "day" && (time < 7 || time >= 21)) {
            return true;
        }

        if (mode == "night" && time >= 7 && time < 21) {
            return true;
        }

        return false;
    }

    getHourlyRates(rates) {
        const hourlyRates = {};
        rates.forEach(rate => {
            if (rate.from > rate.to) {
                for (let hour = rate.from; hour < 24; hour++) {
                    hourlyRates[hour] = rate.value;
                }

                for (let hour = 0; hour < rate.to; hour++) {
                    hourlyRates[hour] = rate.value;
                }
            }
            else {
                for (let hour = rate.from; hour < rate.to; hour++) {
                    hourlyRates[hour] = rate.value;
                }
            }
        });
        return hourlyRates;
    }

    getDeviceRunPrice(hourlyRates, device, startTime) {
        let price = 0;
        for (let hour = startTime; hour < device.duration + startTime; hour++) {
            price += (device.power / 1000) * hourlyRates[hour];
        }
        return price;
    }

}

const schedule = new Schedule({ devices, maxPower, rates })

module.exports = Schedule;
