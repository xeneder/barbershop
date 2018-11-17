const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)


for (var j = 26; j <= 30; j++) {
    //timetable for which we're generating time slots
    timetable = {
        date: {
            year: 2018,
            month: 11,
            day: j
        },
        timeslots: []
    };

    //generating time slots from 12:00 to 18:00
    for (i=12; i <= 18; i++) {
        timetable.timeslots.push({
            "hours": i,
            "minutes": 0,
            "booking": {
                "isBooked": false,
                "service": "",
                "name": "",
                "phone": "",
                "email": ""
            }
        });
    }

    db.get('timetables')
        .push(timetable)
        .write();
}