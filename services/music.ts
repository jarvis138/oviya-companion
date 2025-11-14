import AsyncStorage from '@react-native-async-storage/async-storage';

export type SongRecommendation = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  spotifyUri?: string;
  youtubeUrl?: string;
  mood: string;
  reason: string;
  timestamp: number;
};

export type MusicMood = 
  | 'happy' 
  | 'sad' 
  | 'energetic' 
  | 'chill' 
  | 'romantic' 
  | 'motivational' 
  | 'nostalgic'
  | 'angry'
  | 'peaceful';

const CURATED_RECOMMENDATIONS: Record<MusicMood, SongRecommendation[]> = {
  happy: [
    {
      id: 'happy_1',
      title: 'Happy',
      artist: 'Pharrell Williams',
      youtubeUrl: 'https://www.youtube.com/watch?v=ZbZSe6N_BXs',
      mood: 'happy',
      reason: 'Because happiness is the truth! 🎵',
      timestamp: Date.now(),
    },
    {
      id: 'happy_2',
      title: 'Badtameez Dil',
      artist: 'Benny Dayal, Shefali Alvares',
      album: 'Yeh Jawaani Hai Deewani',
      youtubeUrl: 'https://www.youtube.com/watch?v=OJ_6p5yAUQM',
      mood: 'happy',
      reason: 'For that carefree, mischievous vibe! 💃',
      timestamp: Date.now(),
    },
  ],
  sad: [
    {
      id: 'sad_1',
      title: 'Someone Like You',
      artist: 'Adele',
      youtubeUrl: 'https://www.youtube.com/watch?v=hLQl3WQQoQ0',
      mood: 'sad',
      reason: 'Sometimes you need to feel your feelings 💙',
      timestamp: Date.now(),
    },
    {
      id: 'sad_2',
      title: 'Tum Hi Ho',
      artist: 'Arijit Singh',
      album: 'Aashiqui 2',
      youtubeUrl: 'https://www.youtube.com/watch?v=IJq0yyWug1k',
      mood: 'sad',
      reason: 'For when the heart needs a good cry 💔',
      timestamp: Date.now(),
    },
  ],
  energetic: [
    {
      id: 'energetic_1',
      title: 'Eye of the Tiger',
      artist: 'Survivor',
      youtubeUrl: 'https://www.youtube.com/watch?v=btPJPFnesV4',
      mood: 'energetic',
      reason: 'Time to conquer! 🔥💪',
      timestamp: Date.now(),
    },
    {
      id: 'energetic_2',
      title: 'Malhari',
      artist: 'Vishal Dadlani',
      album: 'Bajirao Mastani',
      youtubeUrl: 'https://www.youtube.com/watch?v=l_MyUGq7pgs',
      mood: 'energetic',
      reason: 'Unleash your inner warrior! ⚔️',
      timestamp: Date.now(),
    },
  ],
  chill: [
    {
      id: 'chill_1',
      title: 'Weightless',
      artist: 'Marconi Union',
      youtubeUrl: 'https://www.youtube.com/watch?v=UfcAVejslrU',
      mood: 'chill',
      reason: 'Science says this is the most relaxing song ever 🧘',
      timestamp: Date.now(),
    },
    {
      id: 'chill_2',
      title: 'Kabira',
      artist: 'Tochi Raina, Rekha Bhardwaj',
      album: 'Yeh Jawaani Hai Deewani',
      youtubeUrl: 'https://www.youtube.com/watch?v=jHNNMj5bNQw',
      mood: 'chill',
      reason: 'For peaceful vibes and deep thoughts 🌙',
      timestamp: Date.now(),
    },
  ],
  romantic: [
    {
      id: 'romantic_1',
      title: 'Perfect',
      artist: 'Ed Sheeran',
      youtubeUrl: 'https://www.youtube.com/watch?v=2Vv-BfVoq4g',
      mood: 'romantic',
      reason: 'When love is in the air 💕',
      timestamp: Date.now(),
    },
    {
      id: 'romantic_2',
      title: 'Raabta',
      artist: 'Arijit Singh',
      album: 'Agent Vinod',
      youtubeUrl: 'https://www.youtube.com/watch?v=cE0K2-_7StY',
      mood: 'romantic',
      reason: 'The ultimate connection song 💜',
      timestamp: Date.now(),
    },
  ],
  motivational: [
    {
      id: 'motivational_1',
      title: 'Lose Yourself',
      artist: 'Eminem',
      youtubeUrl: 'https://www.youtube.com/watch?v=_Yhyp-_hX2s',
      mood: 'motivational',
      reason: 'You only get one shot! Don\'t miss your chance! 🎯',
      timestamp: Date.now(),
    },
    {
      id: 'motivational_2',
      title: 'Zinda',
      artist: 'Siddharth Mahadevan',
      album: 'Bhaag Milkha Bhaag',
      youtubeUrl: 'https://www.youtube.com/watch?v=vUnZdKhttGc',
      mood: 'motivational',
      reason: 'Feel alive! Go chase your dreams! 🏃‍♂️',
      timestamp: Date.now(),
    },
  ],
  nostalgic: [
    {
      id: 'nostalgic_1',
      title: 'The Scientist',
      artist: 'Coldplay',
      youtubeUrl: 'https://www.youtube.com/watch?v=RB-RcX5DS5A',
      mood: 'nostalgic',
      reason: 'For when you\'re missing the past 🕰️',
      timestamp: Date.now(),
    },
    {
      id: 'nostalgic_2',
      title: 'Tujhe Dekha To',
      artist: 'Kumar Sanu',
      album: 'Dilwale Dulhania Le Jayenge',
      youtubeUrl: 'https://www.youtube.com/watch?v=rJKg2AXlLes',
      mood: 'nostalgic',
      reason: 'Classic Bollywood feels 🎬💚',
      timestamp: Date.now(),
    },
  ],
  angry: [
    {
      id: 'angry_1',
      title: 'Break Stuff',
      artist: 'Limp Bizkit',
      youtubeUrl: 'https://www.youtube.com/watch?v=ZpUYjpKg9KY',
      mood: 'angry',
      reason: 'Let it out! (Safely, of course) 😤',
      timestamp: Date.now(),
    },
    {
      id: 'angry_2',
      title: 'Apna Time Aayega',
      artist: 'Ranveer Singh, Divine',
      album: 'Gully Boy',
      youtubeUrl: 'https://www.youtube.com/watch?v=jFGUASusFYg',
      mood: 'angry',
      reason: 'Channel that fire into power! 🔥',
      timestamp: Date.now(),
    },
  ],
  peaceful: [
    {
      id: 'peaceful_1',
      title: 'Clair de Lune',
      artist: 'Claude Debussy',
      youtubeUrl: 'https://www.youtube.com/watch?v=CvFH_6DNRCY',
      mood: 'peaceful',
      reason: 'Pure serenity 🌙✨',
      timestamp: Date.now(),
    },
    {
      id: 'peaceful_2',
      title: 'Kun Faya Kun',
      artist: 'A.R. Rahman, Javed Ali',
      album: 'Rockstar',
      youtubeUrl: 'https://www.youtube.com/watch?v=T94PHkuydcw',
      mood: 'peaceful',
      reason: 'For spiritual peace and introspection 🙏',
      timestamp: Date.now(),
    },
  ],
};

const STORAGE_KEY = 'oviya_music_recommendations';

export async function getRecommendationHistory(): Promise<SongRecommendation[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load music recommendations:', error);
    return [];
  }
}

export async function saveRecommendation(recommendation: SongRecommendation): Promise<void> {
  try {
    const history = await getRecommendationHistory();
    const updated = [recommendation, ...history].slice(0, 50);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save music recommendation:', error);
  }
}

export function getMusicRecommendation(
  mood: MusicMood,
  context?: string
): SongRecommendation {
  const songs = CURATED_RECOMMENDATIONS[mood] || CURATED_RECOMMENDATIONS.chill;
  const randomSong = songs[Math.floor(Math.random() * songs.length)];
  
  const recommendation: SongRecommendation = {
    ...randomSong,
    id: `${randomSong.id}_${Date.now()}`,
    timestamp: Date.now(),
  };

  saveRecommendation(recommendation);
  return recommendation;
}

export function detectMoodFromMessage(message: string): MusicMood {
  const lower = message.toLowerCase();

  if (
    /happy|excited|joy|celebrate|great|amazing|wonderful|awesome/.test(lower)
  ) {
    return 'happy';
  }

  if (
    /sad|depressed|down|blue|lonely|heartbroken|miss/.test(lower)
  ) {
    return 'sad';
  }

  if (
    /energy|pump|motivated|go|workout|exercise|run/.test(lower)
  ) {
    return 'energetic';
  }

  if (
    /chill|relax|calm|peace|quiet|zen/.test(lower)
  ) {
    return 'chill';
  }

  if (
    /love|romantic|date|crush|heart|feelings/.test(lower)
  ) {
    return 'romantic';
  }

  if (
    /motivation|inspire|dream|goal|achieve|push/.test(lower)
  ) {
    return 'motivational';
  }

  if (
    /remember|past|old times|nostalg|memories|miss/.test(lower)
  ) {
    return 'nostalgic';
  }

  if (
    /angry|mad|furious|pissed|rage|frustrated/.test(lower)
  ) {
    return 'angry';
  }

  if (
    /meditat|spiritual|peaceful|tranquil|serene/.test(lower)
  ) {
    return 'peaceful';
  }

  return 'chill';
}

export function getMoodEmoji(mood: MusicMood): string {
  const emojis: Record<MusicMood, string> = {
    happy: '😊',
    sad: '😢',
    energetic: '⚡',
    chill: '😌',
    romantic: '💕',
    motivational: '🔥',
    nostalgic: '🕰️',
    angry: '😤',
    peaceful: '🧘',
  };
  return emojis[mood] || '🎵';
}
