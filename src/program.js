const { devices, maxPower, rates } = require("../data/input.json")


class Schedule {
    constructor({ devices, maxPower, rates }) {
        this.schedule = {};
        this.consumedEnergy = { value: 0, devices: {} };
        this.hourlyRates = this.getHourlyRates(rates);
        
        devices.forEach(device => {
            device.possibleStartTime = [];
            
            for (let hour = 0; hour <= 24 - device.duration; hour++) {
                if (this.isTimeUnsuitableForDevice(hour, device)) {
                    continue;
                }
                const price = this.getDeviceRunPrice(this.hourlyRates, device, hour);
                device.possibleStartTime.push({ starttime: hour, price })
            }

            device.possibleStartTime.sort((a, b) => a.price - b.price)
        });

        devices.sort((a, b) => a.possibleStartTime.length - b.possibleStartTime.length)
    }
    
    isTimeUnsuitableForDevice(time, device) {
        if (device.mode == "day" && (time < 7 || time >= 21)) {
            return true;
        }
    
        if (device.mode == "night" && time >= 7 && time < 21) {
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
