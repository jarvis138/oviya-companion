export type BollywoodMoment = {
  dialogue: string;
  movie: string;
  context: string;
  delivery: string;
};

export const BOLLYWOOD_MOMENTS: Record<string, BollywoodMoment> = {
  encouragement_before_challenge: {
    dialogue: "All izz well!",
    movie: "3 Idiots",
    context: "challenges, exams, stress, fear",
    delivery: "All izz well! [3 Idiots]\n\nI know it doesn't magically fix things, but sometimes we need to remind ourselves... panic doesn't help. You've prepared. Now trust yourself. 💜"
  },
  moving_on_from_failure: {
    dialogue: "Picture abhi baaki hai mere dost",
    movie: "Om Shanti Om",
    context: "failure, setback, disappointment, starting over",
    delivery: "Picture abhi baaki hai mere dost! [Om Shanti Om]\n\nThat chapter? Closed. But your story? Still being written. And I have a feeling the next part is gonna be good. 📖✨"
  },
  standing_up_for_self: {
    dialogue: "Pushpa, I hate tears",
    movie: "Amar Prem",
    context: "being treated badly, need strength, standing up",
    delivery: "Okay okay... 'Pushpa, I hate tears' moment. [Amar Prem]\n\nNot saying don't cry—cry if you need to. But after? We dust off and show them what you're made of. Deal?"
  },
  believing_in_dreams: {
    dialogue: "Kuch kuch hota hai, tum nahi samjhoge",
    movie: "Kuch Kuch Hota Hai",
    context: "intuition, following heart, unexplainable feelings",
    delivery: "You know what? Kuch kuch hota hai... [KKHH]\n\nSometimes you just KNOW something is right, even if you can't explain it. Trust that feeling."
  },
  perseverance: {
    dialogue: "Haar ke jeetne wale ko baazigar kehte hai",
    movie: "Baazigar",
    context: "bouncing back, resilience, determination",
    delivery: "Haar ke jeetne wale ko baazigar kehte hai! [Baazigar]\n\nYou've been knocked down. So what? The comeback is always more epic than the setback. Let's go."
  },
  celebrating_win: {
    dialogue: "Bade bade deshon mein aisi choti choti baatein hoti rehti hai",
    movie: "Dilwale Dulhania Le Jayenge",
    context: "small victories, overcoming obstacles, celebrations",
    delivery: "Arre! Bade bade deshon mein aisi choti choti baatein hoti rehti hai! [DDLJ]\n\nYou DID it! This deserves a celebration. Tell me everything! 🎉"
  },
  facing_reality: {
    dialogue: "Zindagi mein kuch bhi kabhi bhi ho sakta hai",
    movie: "Hera Pheri",
    context: "unexpected situations, life surprises, uncertainty",
    delivery: "Zindagi mein kuch bhi kabhi bhi ho sakta hai... [Hera Pheri]\n\nLife threw you a curveball. Didn't see it coming. But hey, you're still here, still standing. That counts."
  },
  friendship: {
    dialogue: "Dosti ka ek usool hai madam, no sorry, no thank you",
    movie: "Maine Pyar Kiya",
    context: "friendship, gratitude, being there",
    delivery: "Arre! Dosti ka ek usool hai... no sorry, no thank you. [Maine Pyar Kiya]\n\nYou don't need to thank me. That's what I'm here for. Always. 💜"
  },
};

export function matchBollywoodMoment(userEmotion: string, situation: string): BollywoodMoment | null {
  const emotions = userEmotion.toLowerCase();
  const context = situation.toLowerCase();
  
  for (const moment of Object.values(BOLLYWOOD_MOMENTS)) {
    const momentContext = moment.context.toLowerCase();
    if (
      momentContext.split(',').some(keyword => 
        emotions.includes(keyword.trim()) || context.includes(keyword.trim())
      )
    ) {
      return moment;
    }
  }
  
  return null;
}
