import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import { LANGUAGE_TO_TTS } from '../constants/languages';

// Azure Speech Service Configuration
// Keys are loaded from environment variables (.env file)
const AZURE_SPEECH_KEY = process.env.EXPO_PUBLIC_AZURE_SPEECH_KEY || '';
const AZURE_SPEECH_REGION = process.env.EXPO_PUBLIC_AZURE_SPEECH_REGION || 'westeurope';

// Backend URL for audio conversion (Android uses this for pronunciation assessment)
// For local development, use your computer's IP address
// For production, use your deployed backend URL
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.100:3001';

// Language code mapping for Azure Speech (use shared constants)
const languageToAzureCode = LANGUAGE_TO_TTS;

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

  console.log('Getting Azure token from:', tokenUrl);
  console.log('Using key:', AZURE_SPEECH_KEY ? `${AZURE_SPEECH_KEY.substring(0, 10)}...` : 'NO KEY');

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('Token response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token error response:', errorText);
      throw new Error(`Failed to get Azure access token: ${response.status} - ${errorText}`);
    }

    const token = await response.text();
    console.log('Token received, length:', token.length);
    return token;
  } catch (error) {
    console.error('Token fetch error:', error);
    throw error;
  }
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
 * Pronunciation Assessment using Backend (for Android) or Direct Azure (for iOS)
 * Android cannot produce WAV/PCM audio natively, so we use a backend to convert
 */
export const assessPronunciation = async (
  audioUri: string,
  referenceText: string,
  languageCode: string
): Promise<PronunciationResult> => {
  if (!isAzureConfigured()) {
    throw new Error('Azure Speech is not configured');
  }

  console.log('Pronunciation assessment language:', languageCode, 'Word:', referenceText);

  // Check if audio file exists
  const fileInfo = await FileSystem.getInfoAsync(audioUri);
  console.log('Audio file info:', JSON.stringify(fileInfo));

  if (!fileInfo.exists) {
    throw new Error('Audio file does not exist');
  }

  // On Android, use backend for audio conversion
  if (Platform.OS === 'android') {
    return assessPronunciationViaBackend(audioUri, referenceText, languageCode);
  }

  // On iOS, use direct Azure API (WAV/PCM is supported)
  return assessPronunciationDirect(audioUri, referenceText, languageCode);
};

/**
 * Assess pronunciation via backend (for Android)
 * Backend converts audio to WAV before sending to Azure
 */
const assessPronunciationViaBackend = async (
  audioUri: string,
  referenceText: string,
  languageCode: string
): Promise<PronunciationResult> => {
  try {
    console.log('Using backend for pronunciation assessment');
    console.log('Backend URL:', BACKEND_URL);

    const uploadResult = await FileSystem.uploadAsync(
      `${BACKEND_URL}/assess-pronunciation`,
      audioUri,
      {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'audio',
        parameters: {
          referenceText,
          languageCode,
        },
      }
    );

    console.log('Backend response status:', uploadResult.status);
    console.log('Backend response body:', uploadResult.body);

    if (uploadResult.status !== 200) {
      throw new Error(`Backend error: ${uploadResult.status} - ${uploadResult.body}`);
    }

    const result = JSON.parse(uploadResult.body);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      accuracyScore: result.accuracyScore ?? 0,
      fluencyScore: result.fluencyScore ?? 0,
      completenessScore: result.completenessScore ?? 0,
      pronunciationScore: result.pronunciationScore ?? 0,
      recognizedText: result.recognizedText ?? '',
      words: result.words ?? [],
    };
  } catch (error) {
    console.error('Backend pronunciation assessment error:', error);
    throw error;
  }
};

/**
 * Assess pronunciation directly via Azure (for iOS)
 */
const assessPronunciationDirect = async (
  audioUri: string,
  referenceText: string,
  languageCode: string
): Promise<PronunciationResult> => {
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

    console.log('Direct Azure pronunciation assessment');
    console.log('Audio URI:', audioUri);

    // Use FileSystem.uploadAsync for reliable file upload
    console.log('Uploading audio file to Azure...');

    const uploadResult = await FileSystem.uploadAsync(sttUrl, audioUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Pronunciation-Assessment': pronunciationAssessmentHeader,
        'Accept': 'application/json',
      },
    });

    console.log('Upload response status:', uploadResult.status);
    console.log('Upload response body:', uploadResult.body);

    if (uploadResult.status !== 200) {
      console.error('Pronunciation API error:', uploadResult.status, uploadResult.body);
      throw new Error(`Pronunciation assessment failed: ${uploadResult.status} - ${uploadResult.body}`);
    }

    const result = JSON.parse(uploadResult.body);
    console.log('Pronunciation result received');

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
    console.error('Direct pronunciation assessment error:', error);
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
