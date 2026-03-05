import type { WeightRecord, WorkoutDay } from '../types/workout';

export const INITIAL_SCHEDA_DATA: WorkoutDay[] = [
  {
    "id": 1,
    "name": "Giorno 1",
    "focus": "Petto / Dorso / Gambe",
    "exercises": [
      {
        "name": "CHEST PRESS",
        "sets": 4,
        "reps": "15-12-10-8",
        "rest": "2'",
        "previous": {
          "weight": 45,
          "reps": "8",
          "date": "Settimana 1"
        },
        "trainerNote": "Sedile pos 5",
        "id": "1a"
      },
      {
        "name": "LAT MACHINE",
        "sets": 4,
        "reps": "12-10",
        "rest": "2'",
        "previous": {
          "weight": 35,
          "reps": "",
          "date": "Settimana 1"
        },
        "trainerNote": "Sedile 3 buchi visibili",
        "id": "1b"
      },
      {
        "name": "ALZATE LATERALI",
        "sets": 3,
        "reps": "10-10-10",
        "rest": "2'",
        "previous": {
          "weight": 9,
          "reps": "",
          "date": "Settimana 1"
        },
        "id": "1c"
      },
      {
        "name": "CURL AL CAVO BASSO",
        "sets": 3,
        "reps": "8-8-15",
        "rest": "2'",
        "previous": {
          "weight": 15,
          "reps": "15",
          "date": "Settimana 1"
        },
        "id": "1d"
      },
      {
        "name": "HACK SQUAT",
        "sets": 4,
        "reps": "15-12-10-8",
        "rest": "2'",
        "previous": {
          "weight": 10,
          "reps": "8",
          "date": "Settimana 1"
        },
        "id": "1e"
      },
      {
        "name": "LEG EXTENSION",
        "sets": 3,
        "reps": "10-10-10",
        "rest": "2'",
        "previous": {
          "weight": 60,
          "reps": "",
          "date": "Settimana 1"
        },
        "id": "1f"
      },
      {
        "name": "CRUNCH A TERRA GAMBE ALTE",
        "sets": 4,
        "reps": "10ISO2\"",
        "rest": "30\"",
        "id": "1g"
      }
    ]
  },
  {
    "id": 2,
    "name": "Giorno 2",
    "focus": "Dorso / Petto / Femorali",
    "exercises": [
      {
        "name": "ROW PRESA PRONA",
        "sets": 4,
        "reps": "15-12-10-8",
        "rest": "2'",
        "previous": {
          "weight": 15,
          "reps": "8",
          "date": "Settimana 1"
        },
        "id": "2a"
      },
      {
        "name": "PEC FLY",
        "sets": 4,
        "reps": "12-10",
        "rest": "2'",
        "previous": {
          "weight": 110,
          "reps": "12-10",
          "date": "Settimana 1"
        },
        "trainerNote": "Pos 3",
        "id": "2b"
      },
      {
        "name": "CURL ALTERNO",
        "sets": 3,
        "reps": "10",
        "rest": "2'",
        "previous": {
          "weight": 10,
          "reps": "10",
          "date": "Settimana 1"
        },
        "id": "2c"
      },
      {
        "name": "HAMMER CURL",
        "sets": 3,
        "reps": "8-8-15",
        "rest": "1'30\"",
        "previous": {
          "weight": 6,
          "reps": "15",
          "date": "Settimana 1"
        },
        "id": "2d"
      },
      {
        "name": "STACCO GAMBE SEMITESE BILANCIERE",
        "sets": 4,
        "reps": "15-12-10-8",
        "rest": "2'",
        "previous": {
          "weight": 15,
          "reps": "8",
          "date": "Settimana 1"
        },
        "trainerNote": "POS 17",
        "id": "2e"
      },
      {
        "name": "CALF LEG PRESS",
        "sets": 3,
        "reps": "15",
        "rest": "1'",
        "previous": {
          "weight": 50,
          "reps": "15",
          "date": "Settimana 1"
        },
        "id": "2f"
      },
      {
        "name": "PLANK TOCCO SPALLA",
        "sets": 2,
        "reps": "10-10",
        "rest": "30\"",
        "id": "2g"
      },
      {
        "name": "PLANK LATERALE",
        "sets": 3,
        "reps": "30\"-30\"",
        "rest": "30\"",
        "id": "2h"
      }
    ]
  },
  {
    "id": 3,
    "name": "Giorno 3",
    "focus": "Spalle / Braccia / Polpacci",
    "exercises": [
      {
        "name": "SHOULDER PRESS",
        "sets": 4,
        "reps": "15-12-10-8",
        "rest": "2'",
        "previous": {
          "weight": 25,
          "reps": "8",
          "date": "Settimana 1"
        },
        "trainerNote": "Sedile 10",
        "id": "3a"
      },
      {
        "name": "PULLEY TRIANGOLO",
        "sets": 4,
        "reps": "12-10",
        "rest": "2'",
        "previous": {
          "weight": 40,
          "reps": "12-10",
          "date": "Settimana 1"
        },
        "id": "3b"
      },
      {
        "name": "REAR DELT",
        "sets": 3,
        "reps": "10",
        "rest": "2'",
        "previous": {
          "weight": 70,
          "reps": "10",
          "date": "Settimana 1"
        },
        "trainerNote": "Metti spessore",
        "id": "3c"
      },
      {
        "name": "FRENCH PRESS MANUBRI",
        "sets": 3,
        "reps": "8-8-15",
        "rest": "1'30\"",
        "previous": {
          "weight": 5,
          "reps": "15",
          "date": "Settimana 1"
        },
        "id": "3d"
      },
      {
        "name": "AFFONDO MANUBRI INDIETRO",
        "sets": 3,
        "reps": "6-6",
        "rest": "2'",
        "previous": {
          "weight": 18,
          "reps": "",
          "date": "Settimana 1"
        },
        "id": "3e"
      },
      {
        "name": "CALF LEG PRESS",
        "sets": 3,
        "reps": "15",
        "rest": "1'",
        "previous": {
          "weight": 50,
          "reps": "15",
          "date": "Settimana 1"
        },
        "id": "3f"
      },
      {
        "name": "LEG RAISE A TERRA",
        "sets": 2,
        "reps": "10",
        "rest": "30\"",
        "id": "3g"
      },
      {
        "name": "LOMBARE HYPEREXTENSION",
        "sets": 2,
        "reps": "15",
        "rest": "30\"",
        "id": "3h"
      }
    ]
  },
  {
    "id": 4,
    "name": "Giorno 4",
    "focus": "Petto Alto / Braccia",
    "exercises": [
      {
        "name": "SPINTE MANUBRI PANCA NCLINATA 30°",
        "sets": 4,
        "reps": "15-12-10-8",
        "rest": "2'",
        "previous": {
          "weight": 14,
          "reps": "10",
          "date": "Settimana 1"
        },
        "id": "4a"
      },
      {
        "name": "LAT MACHINE TRIANGOLO",
        "sets": 4,
        "reps": "12-10",
        "rest": "2'",
        "previous": {
          "weight": 40,
          "reps": "12-10",
          "date": "Settimana 1"
        },
        "id": "4b"
      },
      {
        "name": "PULLEY BARRA LARGA",
        "sets": 3,
        "reps": "10",
        "rest": "2'",
        "previous": {
          "weight": 30,
          "reps": "10",
          "date": "Settimana 1"
        },
        "id": "4c"
      },
      {
        "name": "ALZATE LATERALI SINGOLE AL CAVO",
        "sets": 3,
        "reps": "10-10-15",
        "rest": "1'30\"",
        "previous": {
          "weight": 5,
          "reps": "15",
          "date": "Settimana 1"
        },
        "id": "4d"
      },
      {
        "name": "CURL AL CAVO BASSO",
        "sets": 4,
        "reps": "15-12-10-8",
        "rest": "2'",
        "previous": {
          "weight": 35,
          "reps": "8",
          "date": "Settimana 1"
        },
        "id": "4e"
      },
      {
        "name": "ESTENSIONE CORDA",
        "sets": 4,
        "reps": "15-12-10-8",
        "rest": "2'",
        "previous": {
          "weight": 35,
          "reps": "10",
          "date": "Settimana 1"
        },
        "id": "4f"
      },
      {
        "name": "SIT UP A TERRA",
        "sets": 4,
        "reps": "10-15",
        "rest": "30\"",
        "id": "4g"
      }
    ]
  }
];

export const WEIGHT_HISTORY: WeightRecord[] = [
  { id: 1, date: '1 Ott', weight: 84.5, fat: 19.2 },
  { id: 2, date: '15 Ott', weight: 83.2, fat: 18.5 },
  { id: 3, date: '1 Nov', weight: 82.0, fat: 17.8 },
  { id: 4, date: '15 Nov', weight: 81.1, fat: 17.1 },
  { id: 5, date: '1 Dic', weight: 80.5, fat: 16.5 },
];
