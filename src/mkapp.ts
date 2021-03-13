import { MachineConfig, send, Action, assign } from "xstate";
import { dmMachine, say, listen } from "./dmAppointmentPlus";

function promptAndAsk(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
	initial: 'prompt',
	states: {
            prompt: {
		entry: say(prompt),
		on: { ENDSPEECH: 'ask' }
            },
            ask: {
		entry: send('LISTEN'),
            },
	}})
};

const proxyUrl = "https://cors-anywhere.herokuapp.com/";
const rasaurl = 'https://mkappointment.herokuapp.com/model/parse'

export const nluRequest = (text: string) =>
    fetch(new Request(proxyUrl+ rasaurl, {
        method: 'POST',
        headers: { 'Origin': 'http://maraev.me' }, // only required with proxy
        body: `{"text": "${text}"}`
    }))
        .then(data => data.json());

export const dmMkapp: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            on: {
                CLICK: 'welcome'
            }    
        },
	welcome: {
	    on: {
		RECOGNISED: {
		    target: 'invok_guery',
		    actions: assign((context) => { return { statement: context.recResult } }),
            },
        },
	    ...promptAndAsk("What would you prefer to do now?")
	},

	invok_guery: {
	    invoke: {
		id: 'decide',
                src: (context, event) => nluRequest(context.statement),
                onDone: {
                    target: 'select',
                    actions: [assign((context, event) => { return {rasa_finder: event.data.intent.name }}),
			      (context:SDSContext, event:any) => console.log(event.data)]
                },
		onError: {
                    target: 'welcome',
		    actions: (context,event) => console.log(event.data)
                }
            }
	},
    select: {
	    entry: send('RECOGNISED'),
	    on: {
            RECOGNISED: [
                { target: 'appointment', cond: (context) => context.rasa_finder === "appointment" },
                { target: 'timer', cond: (context) => context.rasa_finder === "timer"},
                { target: 'TODO_item', cond: (context) => context.rasa_finder === "TODO_item"},               
            ]   
        },
	},
    appointment: {
        ...dmMachine
    },
    TODO_item: {
        initial: "prompt",
        states: {
            prompt: { entry: say("let's add the item to todo list.") }
        }
    },
    timer: {
        initial: "prompt",
        states: {
            prompt: {entry: say("So you need a timer,let me update it for you.") }
        }} 
    }})
