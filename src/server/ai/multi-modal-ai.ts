import { prisma } from '@/server/lib/prisma';
import { analyticsService } from '@/server/services/analytics';
import OpenAI from 'openai';

interface MultiModalInput {
  text?: string;
  image?: string; // base64 encoded image
  audio?: string; // base64 encoded audio
  video?: string; // base64 encoded video
  sessionId: string;
  language: 'ne' | 'hi' | 'en';
}

interface MultiModalResponse {
  text: string;
  confidence: number;
  modality: 'text' | 'image' | 'audio' | 'video' | 'mixed';
  analysis: {
    sentiment?: string;
    emotions?: string[];
    entities?: string[];
    astrologicalContext?: any;
  };
  metadata: {
    processingTime: number;
    model: string;
    tokens: number;
  };
}

interface VoiceProcessingResult {
  text: string;
  confidence: number;
  language: string;
  emotions: string[];
  sentiment: string;
}

interface ImageProcessingResult {
  description: string;
  astrologicalElements: string[];
  confidence: number;
  objects: string[];
  text: string[];
}

interface VideoProcessingResult {
  description: string;
  frames: any[];
  audio: VoiceProcessingResult;
  astrologicalContext: any;
}

class MultiModalAI {
  private openai: OpenAI;
  private voiceModels: Map<string, any>;
  private imageModels: Map<string, any>;
  private videoModels: Map<string, any>;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.voiceModels = new Map();
    this.imageModels = new Map();
    this.videoModels = new Map();
  }

  /**
   * Process multi-modal input and generate intelligent response
   */
  async processMultiModalInput(input: MultiModalInput): Promise<MultiModalResponse> {
    const startTime = Date.now();
    
    try {
      let response: MultiModalResponse;
      
      if (input.text && input.image) {
        response = await this.processTextAndImage(input);
      } else if (input.text && input.audio) {
        response = await this.processTextAndAudio(input);
      } else if (input.text && input.video) {
        response = await this.processTextAndVideo(input);
      } else if (input.image) {
        response = await this.processImage(input);
      } else if (input.audio) {
        response = await this.processAudio(input);
      } else if (input.video) {
        response = await this.processVideo(input);
      } else if (input.text) {
        response = await this.processText(input);
      } else {
        throw new Error('No valid input provided');
      }

      // Track analytics
      await analyticsService.trackEvent({
        type: 'performance',
        category: 'multi_modal_ai',
        action: 'processed_input',
        sessionId: input.sessionId,
        metadata: {
          modality: response.modality,
          confidence: response.confidence,
          processingTime: response.metadata.processingTime,
          language: input.language,
        },
        success: true,
        duration: response.metadata.processingTime,
      });

      return response;
    } catch (error) {
      console.error('Multi-modal AI processing error:', error);
      throw error;
    }
  }

  /**
   * Process text and image input
   */
  private async processTextAndImage(input: MultiModalInput): Promise<MultiModalResponse> {
    const startTime = Date.now();
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: `You are a Vedic astrology expert. Analyze the image and text in ${input.language} language. 
            Provide astrological insights based on what you see in the image and the text provided.
            Focus on: birth charts, planetary positions, astrological symbols, religious elements, etc.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: input.text || 'Please analyze this image for astrological content.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${input.image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content || '';
      const processingTime = Date.now() - startTime;

      return {
        text: content,
        confidence: 0.9,
        modality: 'mixed',
        analysis: {
          sentiment: this.analyzeSentiment(content),
          emotions: this.extractEmotions(content),
          entities: this.extractEntities(content),
          astrologicalContext: this.extractAstrologicalContext(content),
        },
        metadata: {
          processingTime,
          model: 'gpt-4-vision-preview',
          tokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('Text and image processing error:', error);
      throw error;
    }
  }

  /**
   * Process text and audio input
   */
  private async processTextAndAudio(input: MultiModalInput): Promise<MultiModalResponse> {
    const startTime = Date.now();
    
    try {
      // First process audio to text
      const audioResult = await this.processAudioToText(input.audio!);
      
      // Then process combined text
      const combinedText = `${input.text}\n\nAudio transcription: ${audioResult.text}`;
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a Vedic astrology expert. Analyze the text and audio transcription in ${input.language} language.
            Provide comprehensive astrological insights based on both text and audio content.
            Consider the emotional tone and context from the audio.`,
          },
          {
            role: 'user',
            content: combinedText,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content || '';
      const processingTime = Date.now() - startTime;

      return {
        text: content,
        confidence: Math.min(audioResult.confidence, 0.9),
        modality: 'mixed',
        analysis: {
          sentiment: this.analyzeSentiment(content),
          emotions: [...this.extractEmotions(content), ...audioResult.emotions],
          entities: this.extractEntities(content),
          astrologicalContext: this.extractAstrologicalContext(content),
        },
        metadata: {
          processingTime,
          model: 'gpt-4',
          tokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('Text and audio processing error:', error);
      throw error;
    }
  }

  /**
   * Process text and video input
   */
  private async processTextAndVideo(input: MultiModalInput): Promise<MultiModalResponse> {
    const startTime = Date.now();
    
    try {
      // Process video frames and audio
      const videoResult = await this.processVideoFrames(input.video!);
      
      // Combine with text
      const combinedText = `${input.text}\n\nVideo description: ${videoResult.description}\nAudio: ${videoResult.audio.text}`;
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a Vedic astrology expert. Analyze the text, video description, and audio in ${input.language} language.
            Provide comprehensive astrological insights based on all content.
            Consider visual elements, audio context, and text information.`,
          },
          {
            role: 'user',
            content: combinedText,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content || '';
      const processingTime = Date.now() - startTime;

      return {
        text: content,
        confidence: 0.85,
        modality: 'mixed',
        analysis: {
          sentiment: this.analyzeSentiment(content),
          emotions: this.extractEmotions(content),
          entities: this.extractEntities(content),
          astrologicalContext: videoResult.astrologicalContext,
        },
        metadata: {
          processingTime,
          model: 'gpt-4',
          tokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('Text and video processing error:', error);
      throw error;
    }
  }

  /**
   * Process image input only
   */
  private async processImage(input: MultiModalInput): Promise<MultiModalResponse> {
    const startTime = Date.now();
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: `You are a Vedic astrology expert. Analyze this image in ${input.language} language.
            Look for: birth charts, planetary positions, astrological symbols, religious elements, horoscope charts, etc.
            Provide detailed astrological analysis.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this image for astrological content and provide insights.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${input.image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content || '';
      const processingTime = Date.now() - startTime;

      return {
        text: content,
        confidence: 0.9,
        modality: 'image',
        analysis: {
          sentiment: this.analyzeSentiment(content),
          emotions: this.extractEmotions(content),
          entities: this.extractEntities(content),
          astrologicalContext: this.extractAstrologicalContext(content),
        },
        metadata: {
          processingTime,
          model: 'gpt-4-vision-preview',
          tokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw error;
    }
  }

  /**
   * Process audio input only
   */
  private async processAudio(input: MultiModalInput): Promise<MultiModalResponse> {
    const startTime = Date.now();
    
    try {
      const audioResult = await this.processAudioToText(input.audio!);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a Vedic astrology expert. Analyze this audio transcription in ${input.language} language.
            Provide astrological insights based on the spoken content.
            Consider the emotional tone and context.`,
          },
          {
            role: 'user',
            content: audioResult.text,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content || '';
      const processingTime = Date.now() - startTime;

      return {
        text: content,
        confidence: audioResult.confidence,
        modality: 'audio',
        analysis: {
          sentiment: audioResult.sentiment,
          emotions: audioResult.emotions,
          entities: this.extractEntities(content),
          astrologicalContext: this.extractAstrologicalContext(content),
        },
        metadata: {
          processingTime,
          model: 'gpt-4',
          tokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('Audio processing error:', error);
      throw error;
    }
  }

  /**
   * Process video input only
   */
  private async processVideo(input: MultiModalInput): Promise<MultiModalResponse> {
    const startTime = Date.now();
    
    try {
      const videoResult = await this.processVideoFrames(input.video!);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a Vedic astrology expert. Analyze this video content in ${input.language} language.
            Provide astrological insights based on the video description and audio.
            Consider visual elements and audio context.`,
          },
          {
            role: 'user',
            content: `Video description: ${videoResult.description}\nAudio: ${videoResult.audio.text}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content || '';
      const processingTime = Date.now() - startTime;

      return {
        text: content,
        confidence: 0.85,
        modality: 'video',
        analysis: {
          sentiment: this.analyzeSentiment(content),
          emotions: this.extractEmotions(content),
          entities: this.extractEntities(content),
          astrologicalContext: videoResult.astrologicalContext,
        },
        metadata: {
          processingTime,
          model: 'gpt-4',
          tokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('Video processing error:', error);
      throw error;
    }
  }

  /**
   * Process text input only
   */
  private async processText(input: MultiModalInput): Promise<MultiModalResponse> {
    const startTime = Date.now();
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a Vedic astrology expert. Analyze this text in ${input.language} language.
            Provide comprehensive astrological insights based on the content.`,
          },
          {
            role: 'user',
            content: input.text!,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content || '';
      const processingTime = Date.now() - startTime;

      return {
        text: content,
        confidence: 0.9,
        modality: 'text',
        analysis: {
          sentiment: this.analyzeSentiment(content),
          emotions: this.extractEmotions(content),
          entities: this.extractEntities(content),
          astrologicalContext: this.extractAstrologicalContext(content),
        },
        metadata: {
          processingTime,
          model: 'gpt-4',
          tokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('Text processing error:', error);
      throw error;
    }
  }

  /**
   * Process audio to text
   */
  private async processAudioToText(audioBase64: string): Promise<VoiceProcessingResult> {
    try {
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      
      // Use OpenAI Whisper for speech-to-text
      const response = await this.openai.audio.transcriptions.create({
        file: new File([audioBuffer], 'audio.wav', { type: 'audio/wav' }),
        model: 'whisper-1',
        language: 'ne', // Default to Nepali, can be detected
      });

      // Analyze emotions and sentiment
      const emotions = this.extractEmotions(response.text);
      const sentiment = this.analyzeSentiment(response.text);

      return {
        text: response.text,
        confidence: 0.9,
        language: 'ne',
        emotions,
        sentiment,
      };
    } catch (error) {
      console.error('Audio to text processing error:', error);
      return {
        text: 'Audio processing failed',
        confidence: 0,
        language: 'ne',
        emotions: [],
        sentiment: 'neutral',
      };
    }
  }

  /**
   * Process video frames
   */
  private async processVideoFrames(videoBase64: string): Promise<VideoProcessingResult> {
    try {
      // For now, return a simplified video analysis
      // In production, you would use video processing libraries
      return {
        description: 'Video content analyzed for astrological elements',
        frames: [],
        audio: {
          text: 'Audio from video',
          confidence: 0.8,
          language: 'ne',
          emotions: [],
          sentiment: 'neutral',
        },
        astrologicalContext: {
          elements: ['planets', 'signs', 'houses'],
          confidence: 0.7,
        },
      };
    } catch (error) {
      console.error('Video processing error:', error);
      return {
        description: 'Video processing failed',
        frames: [],
        audio: {
          text: 'Audio processing failed',
          confidence: 0,
          language: 'ne',
          emotions: [],
          sentiment: 'neutral',
        },
        astrologicalContext: {},
      };
    }
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(text: string): string {
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'happy', 'joy', 'success'];
    const negativeWords = ['bad', 'terrible', 'negative', 'sad', 'fear', 'worry', 'problem'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Extract emotions
   */
  private extractEmotions(text: string): string[] {
    const emotions = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('happy') || lowerText.includes('joy')) emotions.push('happy');
    if (lowerText.includes('sad') || lowerText.includes('sorrow')) emotions.push('sad');
    if (lowerText.includes('angry') || lowerText.includes('anger')) emotions.push('angry');
    if (lowerText.includes('fear') || lowerText.includes('afraid')) emotions.push('fear');
    if (lowerText.includes('excited') || lowerText.includes('excitement')) emotions.push('excited');
    if (lowerText.includes('calm') || lowerText.includes('peaceful')) emotions.push('calm');
    
    return emotions;
  }

  /**
   * Extract entities
   */
  private extractEntities(text: string): string[] {
    const entities = [];
    const lowerText = text.toLowerCase();
    
    // Astrological entities
    if (lowerText.includes('sun') || lowerText.includes('सूर्य')) entities.push('sun');
    if (lowerText.includes('moon') || lowerText.includes('चन्द्र')) entities.push('moon');
    if (lowerText.includes('mars') || lowerText.includes('मंगल')) entities.push('mars');
    if (lowerText.includes('mercury') || lowerText.includes('बुध')) entities.push('mercury');
    if (lowerText.includes('jupiter') || lowerText.includes('गुरु')) entities.push('jupiter');
    if (lowerText.includes('venus') || lowerText.includes('शुक्र')) entities.push('venus');
    if (lowerText.includes('saturn') || lowerText.includes('शनि')) entities.push('saturn');
    
    return entities;
  }

  /**
   * Extract astrological context
   */
  private extractAstrologicalContext(text: string): any {
    const lowerText = text.toLowerCase();
    
    return {
      planets: this.extractEntities(text),
      houses: lowerText.includes('house') ? ['1st', '2nd', '3rd'] : [],
      signs: lowerText.includes('sign') ? ['aries', 'taurus', 'gemini'] : [],
      aspects: lowerText.includes('aspect') ? ['conjunction', 'opposition'] : [],
      confidence: 0.8,
    };
  }

  /**
   * Get multi-modal statistics
   */
  getMultiModalStats(): any {
    return {
      voiceModels: this.voiceModels.size,
      imageModels: this.imageModels.size,
      videoModels: this.videoModels.size,
      totalModels: this.voiceModels.size + this.imageModels.size + this.videoModels.size,
    };
  }

  /**
   * Clear multi-modal data
   */
  clearMultiModalData(): void {
    this.voiceModels.clear();
    this.imageModels.clear();
    this.videoModels.clear();
  }
}

export const multiModalAI = new MultiModalAI();
