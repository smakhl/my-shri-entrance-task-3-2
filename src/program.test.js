const Schedule = require("./program")
const { devices, maxPower, rates } = require("../data/input.json")

const schedule = new Schedule({ devices, maxPower, rates })
const expectedConsumedEnergy = require("../data/output.json").consumedEnergy

const dummyDevice = { id: "123", power: 300, duration: 2, name: "Dummy" };

test("consumed energy value is correct", () => {
    expect(schedule.consumedEnergy.value).toBe(expectedConsumedEnergy.value);
});

test("consumed energy count for devices is correct", () => {
    expect(Object.keys(schedule.consumedEnergy.devices).length).toBe(5);
});

test("consumed energy value for each device is correct", () => {
    Object.keys(schedule.consumedEnergy.devices).forEach(d => {
        expect(schedule.consumedEnergy.devices[d]).toBe(expectedConsumedEnergy.devices[d]);
    })
});

test("addRate: throw on mandatory param missing", () => {
    expect(() => schedule.addRate({ from: 1, to: 20 })).toThrow();
});

test("schedule is created for all 24 h", () => {
    for (let index = 0; index < 24; index++) {
        expect(schedule.schedule[index]).toBeDefined();
    }
});

test("add new device to existing schedule", () => {
    const setDevice = jest.fn(() =>
        schedule.addDevice(dummyDevice)
    );
    setDevice();
    expect(setDevice).toReturn();
});

test("new device to be in schedule", () => {
    expect(Object.keys(schedule.consumedEnergy.devices).length).toBe(6);
});

test("consumed energy to grow because of new device", () => {
    expect(schedule.consumedEnergy.value > expectedConsumedEnergy.value).toBe(true);
});

test("remove new device from schedule", () => {
    const removeDevice = jest.fn(() =>
        schedule.removeDevice("123")
    );
    removeDevice();
    expect(removeDevice).toReturn();
});

test("device count to reduce", () => {
    expect(Object.keys(schedule.consumedEnergy.devices).length).toBe(5);
});

test("consumed energy to be back to previous value", () => {
    expect(schedule.consumedEnergy.value == expectedConsumedEnergy.value).toBe(true);
});
