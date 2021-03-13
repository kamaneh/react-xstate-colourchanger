import { MachineConfig, send, Action, assign } from "xstate";
import { dmMkapp } from "./mkapp";



export function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

export function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

const grammar: { [index: string]: { person?: string, day?: string, time?: string } } = {
    //PERSON
    "John": { person: "John Appleseed" },
    "Olivia": { person: "Olivia Smith" },
    "Daniel": { person: "Daniel Jones" },
    "James": { person: "James Williams" },
    "Mia": { person: "Mia Wilson" },
    "Jack": { person: "Jack Evans" },
    "Emily": { person: "Emily Thomas" },
    
    //DAYS
    "on Monday": { day: "Monday" },
    "Monday": { day: "Monday" },
    "on Tuesday": { day: "Tuesda" },
    "Tuesday": { day: "Tuesda" },
    "on Wednesday": { day: "Wednesday" },
    "Wednesday": { day: "Wednesday" },
    "on Thursday": { day: "Thursday" },
    "Thursday": { day: "Thursday" },
    "on Friday": { day: "Friday" },
    "Friday": { day: "Friday" },
    "on Saturday": { day: "Saturday" },
    "Saturday": { day: "Saturday" },
    "on Sunday": { day: "Sunday" },
    "Sunday": { day: "Sunday" },

    //TIMES
    "at 1": { time: "01:00" },
    "1": { time: "01:00" },
    "at 2": { time: "02:00" },
    "2": { time: "02:00" },
    "at 3": { time: "03:00" },
    "t3": { time: "03:00" },
    "at 4": { time: "04:00" },
    "4": { time: "04:00" },
    "at 5": { time: "05:00" },
    "5": { time: "05:00" },
    "at 6": { time: "06:00" },
    "6": { time: "06:00" },
    "at 7": { time: "07:00" },
    "7": { time: "07:00" },
    "at 8": { time: "08:00" },
    "8": { time: "08:00" },
    "at 9": { time: "09:00" },
    "9": { time: "09:00" },
    "at 10": { time: "10:00" },
    "10": { time: "10:00" },
    "at 11": { time: "11:00" },
    "11": { time: "11:00" },
    "at 12": { time: "12:00" },
    "12": { time: "12:00" }
}

const BooleanGrammar: { [index: string]: { clarity?: boolean } } = {
    //TRUE
    "yes": { clarity: true },
    "of course": { clarity: true },
    "alright": { clarity: true },
    "very well": { clarity: true },
    "sure": { clarity: true },
    "agreed": { clarity: true },
    "absolutely": { clarity: true },
    "surely": { clarity: true },
    //FALSE
    "no": { clarity: false },
    "nope": { clarity: false },
    "nah": { clarity: false },
    "negative": { clarity: false },
    "no indeed": { clarity: false },
    "no thanks": { clarity: false },
    "not at all": { clarity: false }

}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'welcome',
    states: {
        init: {
            on: {
            }
        },
        welcome: {
            initial: "prompt",
            on: { ENDSPEECH: "who" },
            states: {
                prompt: { entry: say("Let's create an appointment") }
            }
        },
        who: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "person" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { person: grammar[context.recResult].person } }),
                    target: "day"

                },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: say("Who are you meeting with?"),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry I don't know them."),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },
        day: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "day" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { day: grammar[context.recResult].day } }),
                    target: "wholeday"

                },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.person}. On which day is your meeting?`
                    })),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry I don't know the day "),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },


        wholeday: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => BooleanGrammar[context.recResult].clarity === true,
                    actions: assign((context) => { return { clarity: BooleanGrammar[context.recResult].clarity } }),
                    target: "wholeday_is_confirmed"

                },
                {
                    cond: (context) => BooleanGrammar[context.recResult].clarity === false,
                    actions: assign((context) => { return { clarity: BooleanGrammar[context.recResult].clarity } }),
                    target: "Determination_time"

                },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.day}. Will it take the whole day?`
                    })),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry I didn't catch what you said "),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },


        wholeday_is_confirmed: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => BooleanGrammar[context.recResult].clarity === true,
                    actions: assign((context) => { return { clarity: BooleanGrammar[context.recResult].clarity } }),
                    target: "create_appointment"

                },
                {
                    cond: (context) => BooleanGrammar[context.recResult].clarity === false,
                    actions: assign((context) => { return { clarity: BooleanGrammar[context.recResult].clarity } }),
                    target: "who"

                },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. Do you want me to create an appointment with ${context.person} on ${context.day} for the whole day?`
                    })),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry I didn't catch what you said "),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },

        Determination_time: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "time" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { time: grammar[context.recResult].time } }),
                    target: "confirm_time"

                },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: say("Ok. The meeting is not the whole day.What time is your meeting?"),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry I don't underestand it "),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },

        confirm_time: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => BooleanGrammar[context.recResult].clarity === true,
                    actions: assign((context) => { return { clarity: BooleanGrammar[context.recResult].clarity } }),
                    target: "create_appointment"

                },
                {
                    cond: (context) => BooleanGrammar[context.recResult].clarity === false,
                    actions: assign((context) => { return { clarity: BooleanGrammar[context.recResult].clarity } }),
                    target: "who"

                },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. Do you want me to create an appointment with ${context.person} on ${context.day} at ${context.time} ?`
                    })),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry I didn't catch what you said "),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },

        create_appointment: {
            initial: "prompt",
            on: { 
                ENDSPEECH: "init" },
            states: {
                prompt: { entry: say("Your appointment has been created") }
            }
        },
    
    },
})
        








  
            

