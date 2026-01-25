import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { Buffer } from 'buffer';

// Azure Speech Service Configuration
// Keys are loaded from environment variables (.env file)
const AZURE_SPEECH_KEY = process.env.EXPO_PUBLIC_AZURE_SPEECH_KEY || '';
const AZURE_SPEECH_REGION = process.env.EXPO_PUBLIC_AZURE_SPEECH_REGION || 'westeurope';

// Language code mapping for Azure Speech
const languageToAzureCode: { [key: string]: string } = {
  en: 'en-US',
  tr: 'tr-TR',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-PT',
  ru: 'ru-RU',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ko: 'ko-KR',
  ar: 'ar-SA',
  az: 'az-AZ',  // Azure supports Azerbaijani natively!
  hr: 'hr-HR',
  cs: 'cs-CZ',
  da: 'da-DK',
  nl: 'nl-NL',
  fi: 'fi-FI',
  el: 'el-GR',
  hi: 'hi-IN',
  id: 'id-ID',
  no: 'nb-NO',
  pl: 'pl-PL',
  ro: 'ro-RO',
  sv: 'sv-SE',
  th: 'th-TH',
  uk: 'uk-UA',
  ur: 'ur-PK',
  vi: 'vi-VN',
};

// Voice names for each language (Neural voices for best quality)
const languageToVoice: { [key: string]: string } = {
  en: 'en-US-JennyNeural',
  tr: 'tr-TR-EmelNeural',
  de: 'de-DE-KatjaNeural',
  es: 'es-ES-ElviraNeural',
  fr: 'fr-FR-DeniseNeural',
  it: 'it-IT-ElsaNeural',
  pt: 'pt-PT-RaquelNeural',
  ru: 'ru-RU-SvetlanaNeural',
  ja: 'ja-JP-NanamiNeural',
  zh: 'zh-CN-XiaoxiaoNeural',
  ko: 'ko-KR-SunHiNeural',
  ar: 'ar-SA-ZariyahNeural',
  az: 'az-AZ-BabekNeural',
  hr: 'hr-HR-GabrijelaNeural',
  cs: 'cs-CZ-VlastaNeural',
  da: 'da-DK-ChristelNeural',
  nl: 'nl-NL-ColetteNeural',
  fi: 'fi-FI-NooraNeural',
  el: 'el-GR-AthinaNeural',
  hi: 'hi-IN-SwaraNeural',
  id: 'id-ID-GadisNeural',
  no: 'nb-NO-PernilleNeural',
  pl: 'pl-PL-AgnieszkaNeural',
  ro: 'ro-RO-AlinaNeural',
  sv: 'sv-SE-SofieNeural',
  th: 'th-TH-PremwadeeNeural',
  uk: 'uk-UA-PolinaNeural',
  ur: 'ur-PK-UzmaNeural',
  vi: 'vi-VN-HoaiMyNeural',
};

export interface PronunciationResult {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronunciationScore: number;
  recognizedText: string;
  words: {
    word: string;
    accuracyScore: number;
    errorType: string;
  }[];
}

/**
 * Check if Azure Speech is configured
 */
export const isAzureConfigured = (): boolean => {
  return AZURE_SPEECH_KEY.length > 0;
};

/**
 * Get access token for Azure Speech
 */
const getAccessToken = async (): Promise<string> => {
  const tokenUrl = `https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Azure access token: ${response.status}`);
  }

  return await response.text();
};

/**
 * Text-to-Speech using Azure Neural Voices
 */
export const speakWithAzure = async (
  text: string,
  languageCode: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> => {
  if (!isAzureConfigured()) {
    throw new Error('Azure Speech is not configured');
  }

  const azureLang = languageToAzureCode[languageCode] || 'en-US';
  const voiceName = languageToVoice[languageCode] || 'en-US-JennyNeural';

  try {
    onStart?.();

    const token = await getAccessToken();

    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${azureLang}'><voice name='${voiceName}'><prosody rate='0.9' pitch='0%'>${text}</prosody></voice></speak>`;

    const ttsUrl = `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

    // Use XMLHttpRequest for better binary data handling
    const audioBase64 = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', ttsUrl, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', 'application/ssml+xml');
      xhr.setRequestHeader('X-Microsoft-OutputFormat', 'audio-16khz-32kbitrate-mono-mp3');
      xhr.responseType = 'arraybuffer';

      xhr.onload = function () {
        if (xhr.status === 200) {
          const bytes = new Uint8Array(xhr.response);
          // Use Buffer for reliable base64 encoding in React Native
          const base64 = Buffer.from(bytes).toString('base64');
          resolve(base64);
        } else {
          console.error('Azure TTS error:', xhr.status, xhr.responseText);
          reject(new Error(`TTS request failed: ${xhr.status}`));
        }
      };

      xhr.onerror = function () {
        reject(new Error('TTS network error'));
      };

      xhr.send(ssml);
    });

    // Create a data URI and play
    const dataUri = `data:audio/mp3;base64,${audioBase64}`;
    const { sound } = await Audio.Sound.createAsync({ uri: dataUri });

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        onEnd?.();
        sound.unloadAsync();
      }
    });

    await sound.playAsync();
  } catch (error) {
    console.error('Azure TTS error:', error);
    onEnd?.();
    throw error;
  }
};

/**
 * Pronunciation Assessment using Azure Speech
 */
export const assessPronunciation = async (
  audioUri: string,
  referenceText: string,
  languageCode: string
): Promise<PronunciationResult> => {
  if (!isAzureConfigured()) {
    throw new Error('Azure Speech is not configured');
  }

  const azureLang = languageToAzureCode[languageCode] || 'en-US';

  try {
    const token = await getAccessToken();

    // Pronunciation assessment config
    const pronunciationAssessmentConfig = {
      ReferenceText: referenceText,
      GradingSystem: 'HundredMark',
      Granularity: 'FullText',
      EnableMiscue: true,
    };

    const pronunciationAssessmentHeader = Buffer.from(
      JSON.stringify(pronunciationAssessmentConfig)
    ).toString('base64');

    const sttUrl = `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${azureLang}&format=detailed`;

    // Read audio file and send using XMLHttpRequest for better binary handling
    const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: 'base64',
    });

    const result = await new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', sttUrl, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', 'audio/wav; codecs=audio/pcm; samplerate=16000');
      xhr.setRequestHeader('Pronunciation-Assessment', pronunciationAssessmentHeader);
      xhr.setRequestHeader('Accept', 'application/json');

      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          console.error('Pronunciation assessment API error:', xhr.status, xhr.responseText);
          reject(new Error(`Pronunciation assessment failed: ${xhr.status} - ${xhr.responseText}`));
        }
      };

      xhr.onerror = function () {
        reject(new Error('Network error during pronunciation assessment'));
      };

      // Convert base64 to binary and send
      const bytes = Buffer.from(audioBase64, 'base64');
      xhr.send(bytes);
    });

    // Parse the pronunciation assessment result
    if (result.RecognitionStatus === 'Success' && result.NBest && result.NBest.length > 0) {
      const best = result.NBest[0];
      const assessment = best.PronunciationAssessment;

      // Get accuracy score (main score from REST API)
      const accuracyScore = assessment?.AccuracyScore ?? best.AccuracyScore ?? 0;

      // REST API only returns AccuracyScore, use it as the main pronunciation score
      // Fluency and Completeness require Speech SDK, so we estimate based on confidence
      const confidence = best.Confidence ?? 1;
      const fluencyScore = assessment?.FluencyScore ?? Math.round(accuracyScore * confidence);
      const completenessScore = assessment?.CompletenessScore ?? (best.Display ? 100 : 0);
      const pronunciationScore = assessment?.PronScore ?? accuracyScore;

      return {
        accuracyScore,
        fluencyScore,
        completenessScore,
        pronunciationScore,
        recognizedText: best.Display || '',
        words: (best.Words || []).map((w: any) => ({
          word: w.Word,
          accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? w.AccuracyScore ?? 0,
          errorType: w.PronunciationAssessment?.ErrorType || 'None',
        })),
      };
    }

    // No speech recognized - return empty result
    return {
      accuracyScore: 0,
      fluencyScore: 0,
      completenessScore: 0,
      pronunciationScore: 0,
      recognizedText: '',
      words: [],
    };
  } catch (error) {
    console.error('Pronunciation assessment error:', error);
    throw error;
  }
};

/**
 * Get pronunciation feedback message based on score
 */
export const getPronunciationFeedback = (score: number): {
  level: 'excellent' | 'great' | 'good' | 'needsWork' | 'tryAgain';
  color: string;
} => {
  if (score >= 90) {
    return { level: 'excellent', color: '#4CAF50' };
  } else if (score >= 75) {
    return { level: 'great', color: '#8BC34A' };
  } else if (score >= 60) {
    return { level: 'good', color: '#FFC107' };
  } else if (score >= 40) {
    return { level: 'needsWork', color: '#FF9800' };
  } else {
    return { level: 'tryAgain', color: '#F44336' };
  }
};
