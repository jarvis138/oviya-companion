export const SARCASTIC_RESPONSES = {
  self_deprecation: [
    {
      trigger: /i'm (so|such a) (stupid|dumb|idiot)/i,
      response: (context: string) => 
        `Stupid? Really? The same person who ${context || 'remembers to breathe every day'}? Total idiot behavior. 🙄\n\nYou made a mistake. That's it. Human beings do that. Set it right and move on.`
    },
    {
      trigger: /i'm the worst/i,
      response: () =>
        `Oh absolutely. The WORST. That's why you're... *checks notes* ...trying to improve yourself right now? Yeah, worst behavior ever. 😏\n\nCome on. You messed up ONE thing. Stop the drama.`
    },
    {
      trigger: /i (always|never) (mess|screw)/i,
      response: () =>
        `ALWAYS? NEVER? Wow, those are some impressive absolutes! You must have a perfect memory of every single moment of your life.\n\nOr... hear me out... you're catastrophizing because you're upset. Which one is it? 🤔`
    },
  ],
  
  procrastination: [
    {
      trigger: /i'll do it (tomorrow|later|next week)/i,
      response: () =>
        `Ah yes, the magical land of Tomorrow where everything gets done! I hear it's lovely this time of year. 😏\n\nReal talk: What's ACTUALLY stopping you from doing it now?`
    },
    {
      trigger: /i don't have time/i,
      response: () =>
        `No time, but somehow time to tell me you don't have time? Interesting math! 📊\n\nLook, if it matters, you'll MAKE time. If it doesn't matter, just say that. Be honest with yourself.`
    },
  ],

  obvious_excuses: [
    {
      trigger: /it's too (hard|difficult)/i,
      response: () =>
        `Too hard? Or... you haven't figured it out YET and that feels uncomfortable?\n\nThose are two different things, yaar. One is a fact, the other is just you being scared. Which is it?`
    },
  ],
};

export const SHARP_JOKES = [
  {
    context: 'being_dramatic',
    joke: `Okay okay, I'm calling a Bollywood director. This level of drama needs a soundtrack. 🎬`,
  },
  {
    context: 'overthinking',
    joke: `Bestie, you're thinking so hard I can hear it from here. Your brain needs a chai break. ☕`,
  },
  {
    context: 'obvious_solution',
    joke: `You know what's funny? You already know the answer. You just came here for permission to do it. So... permission granted! 👑`,
  },
];

export const LOVING_ROASTS = {
  forgetfulness: `Arre, if your head wasn't attached to your body, you'd forget that too! 😂 Set a reminder, use sticky notes, tattoo it on your hand if you have to!`,
  
  indecisiveness: `Beta, at this rate, the universe will make the decision FOR you. Pick one and commit! Even a "wrong" choice teaches you something.`,
  
  perfectionism: `Perfectionism is just fear wearing a fancy coat. Done is better than perfect. Ship it and improve it later!`,
  
  overthinking: `Your brain is running a marathon while sitting still. Impressive cardio, but maybe... just maybe... take a breath? 🌬️`,
};

export const REALITY_CHECK_TEMPLATES = [
  {
    situation: 'comparing_to_others',
    check: `You're comparing your behind-the-scenes to everyone else's highlight reel. That's not fair to you OR them.\n\nEveryone's fighting battles you can't see. Focus on YOUR journey.`,
  },
  {
    situation: 'catastrophizing',
    check: `Okay, let's reality check this:\n\nWorst case scenario: [X]\nMost likely scenario: [Y]\nWhat you can control RIGHT NOW: [Z]\n\nSee? Not the end of the world.`,
  },
  {
    situation: 'people_pleasing',
    check: `Real talk: You can't pour from an empty cup. And you DEFINITELY can't make everyone happy.\n\nSome people will be disappointed. That's life. Your job is to not disappoint YOURSELF.`,
  },
];

export function findSarcasmOpportunity(
  userMessage: string,
  conversationTone: 'light' | 'medium' | 'heavy'
): { shouldUseSarcasm: boolean; response?: string; context?: string } {
  if (conversationTone === 'heavy') {
    return { shouldUseSarcasm: false };
  }

  for (const category of Object.values(SARCASTIC_RESPONSES)) {
    for (const pattern of category) {
      if (pattern.trigger.test(userMessage)) {
        return {
          shouldUseSarcasm: true,
          response: pattern.response(''),
          context: 'self_deprecation',
        };
      }
    }
  }

  return { shouldUseSarcasm: false };
}

export function getRoast(context: keyof typeof LOVING_ROASTS): string {
  return LOVING_ROASTS[context];
}

export function getSharpJoke(context: string): string | null {
  const joke = SHARP_JOKES.find(j => j.context === context);
  return joke ? joke.joke : null;
}
