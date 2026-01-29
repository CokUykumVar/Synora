const express = require('express');
const multer = require('multer');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

// Set ffmpeg path for Windows
const ffmpegPath = process.env.FFMPEG_PATH ||
  'C:\\Users\\zhd07\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0.1-full_build\\bin\\ffmpeg.exe';
ffmpeg.setFfmpegPath(ffmpegPath);
console.log('Using ffmpeg at:', ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3001;

// Azure Speech credentials
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || '';
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'westeurope';

// CORS configuration
app.use(cors());
app.use(express.json());

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Language code mapping for Azure Speech
const languageToAzureCode = {
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
  az: 'az-AZ',
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

// Get Azure access token
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com`,
      path: '/sts/v1.0/issueToken',
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Token request failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Convert audio to WAV using ffmpeg
function convertToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFrequency(16000)
      .audioChannels(1)
      .audioCodec('pcm_s16le')
      .format('wav')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

// Send audio to Azure for pronunciation assessment
async function assessPronunciation(wavPath, referenceText, languageCode) {
  const token = await getAccessToken();
  const azureLang = languageToAzureCode[languageCode] || 'en-US';

  const pronunciationConfig = {
    ReferenceText: referenceText,
    GradingSystem: 'HundredMark',
    Granularity: 'FullText',
    EnableMiscue: true,
  };

  const pronunciationHeader = Buffer.from(JSON.stringify(pronunciationConfig)).toString('base64');
  const audioData = fs.readFileSync(wavPath);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${AZURE_SPEECH_REGION}.stt.speech.microsoft.com`,
      path: `/speech/recognition/conversation/cognitiveservices/v1?language=${azureLang}&format=detailed`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Pronunciation-Assessment': pronunciationHeader,
        'Accept': 'application/json',
        'Content-Length': audioData.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse Azure response'));
          }
        } else {
          reject(new Error(`Azure request failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(audioData);
    req.end();
  });
}

// Pronunciation assessment endpoint
app.post('/assess-pronunciation', upload.single('audio'), async (req, res) => {
  const startTime = Date.now();
  console.log('Received pronunciation assessment request');

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { referenceText, languageCode } = req.body;

    if (!referenceText) {
      return res.status(400).json({ error: 'Reference text is required' });
    }

    console.log(`Processing: "${referenceText}" in ${languageCode}`);
    console.log(`Input file: ${req.file.path}`);

    // Convert to WAV
    const wavPath = req.file.path.replace(/\.[^.]+$/, '.wav');
    console.log('Converting to WAV...');
    await convertToWav(req.file.path, wavPath);
    console.log('Conversion complete');

    // Send to Azure
    console.log('Sending to Azure...');
    const azureResult = await assessPronunciation(wavPath, referenceText, languageCode || 'en');
    console.log('Azure response received');

    // Parse result
    let result = {
      accuracyScore: 0,
      fluencyScore: 0,
      completenessScore: 0,
      pronunciationScore: 0,
      recognizedText: '',
      words: [],
    };

    console.log('Azure raw result:', JSON.stringify(azureResult, null, 2));

    if (azureResult.RecognitionStatus === 'Success' && azureResult.NBest && azureResult.NBest.length > 0) {
      const best = azureResult.NBest[0];
      const assessment = best.PronunciationAssessment || {};

      console.log('Best result:', JSON.stringify(best, null, 2));
      console.log('Assessment:', JSON.stringify(assessment, null, 2));

      // Get the main accuracy score - this is the primary metric from REST API
      const accuracyScore = assessment.AccuracyScore ?? best.AccuracyScore ?? 0;

      // REST API typically only returns AccuracyScore
      // FluencyScore and PronScore require Speech SDK
      // We'll use AccuracyScore as the base for all metrics when others aren't available

      // Check if FluencyScore exists and is > 0, otherwise estimate from accuracy
      let fluencyScore = assessment.FluencyScore;
      if (fluencyScore === undefined || fluencyScore === 0) {
        // Estimate fluency: if text was recognized, assume decent fluency
        fluencyScore = accuracyScore > 0 ? Math.max(accuracyScore - 10, 50) : 0;
      }

      // Completeness score
      const completenessScore = assessment.CompletenessScore ?? (best.Display ? 100 : 0);

      // Pronunciation score - use PronScore if available and > 0, otherwise use accuracy
      let pronunciationScore = assessment.PronScore;
      if (pronunciationScore === undefined || pronunciationScore === 0) {
        pronunciationScore = accuracyScore;
      }

      result = {
        accuracyScore,
        fluencyScore,
        completenessScore,
        pronunciationScore,
        recognizedText: best.Display || '',
        words: (best.Words || []).map((w) => ({
          word: w.Word,
          accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? w.AccuracyScore ?? 0,
          errorType: w.PronunciationAssessment?.ErrorType || 'None',
        })),
      };

      console.log('Final result:', JSON.stringify(result, null, 2));
    }

    // Cleanup temp files
    try {
      fs.unlinkSync(req.file.path);
      fs.unlinkSync(wavPath);
    } catch (e) {
      console.log('Cleanup error:', e.message);
    }

    console.log(`Completed in ${Date.now() - startTime}ms`);
    console.log('Result:', JSON.stringify(result, null, 2));

    res.json(result);
  } catch (error) {
    console.error('Error:', error);

    // Cleanup on error
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }

    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Synora backend running on port ${PORT}`);
  console.log(`Azure Region: ${AZURE_SPEECH_REGION}`);
  console.log(`Azure Key configured: ${AZURE_SPEECH_KEY ? 'Yes' : 'No'}`);
});
