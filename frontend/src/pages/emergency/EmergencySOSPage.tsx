import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Camera, Upload, Keyboard, MapPin, AlertTriangle,
  Phone, CheckCircle2, Circle, Loader2, X, Edit3, Send,
  ChevronDown, Image as ImageIcon,
} from 'lucide-react';
import { api } from '@/services/api';
import { supabase } from '@/lib/supabase';
import type { AIAnalysisResult, EmergencyCategory, EmergencyPriority } from '@/types';

type Step = 'input' | 'processing' | 'review' | 'sent';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

const CATEGORIES: EmergencyCategory[] = [
  'MEDICAL', 'ROAD_ACCIDENT', 'FIRE', 'CRIME', 'WOMEN_SAFETY',
  'CHILD_SAFETY', 'MISSING_PERSON', 'FLOOD', 'DISASTER', 'OTHER',
];

const PRIORITIES: EmergencyPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export function EmergencySOSPage() {
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState<Step>('input');
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number; address?: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<Record<string, unknown> | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [error, setError] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  // Editable fields
  const [editCategory, setEditCategory] = useState<EmergencyCategory>('OTHER');
  const [editPriority, setEditPriority] = useState<EmergencyPriority>('UNKNOWN');
  const [editDescription, setEditDescription] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ─── Voice Recording ────────────────────────────────
  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN'; // Start with Hindi, AI will detect actual language

    let finalText = '';
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setRecordedText(finalText + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech error:', event.error);
      setIsRecording(false);
      if (event.error !== 'aborted') {
        setError(`Voice recognition error: ${event.error}. Try typing instead.`);
      }
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setError('');
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  // ─── Photo ──────────────────────────────────────────
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Use JPG, PNG, or WebP');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError('');
  };

  // ─── Location ───────────────────────────────────────
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        // Try reverse geocoding
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`);
          const data = await res.json();
          loc.address = data.display_name;
        } catch { /* ignore */ }
        setLocation({ ...loc });
        setLocationLoading(false);
      },
      (err) => {
        setError(`Location error: ${err.message}. You can enter location manually.`);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  // ─── Process Emergency ──────────────────────────────
  const processEmergency = async () => {
    const inputText = recordedText.trim() || textInput.trim();
    if (!inputText && !photoFile) {
      setError('Please provide at least a voice/text description or a photo');
      return;
    }

    setStep('processing');
    setError('');

    const steps: ProcessingStep[] = [
      { id: 'input', label: inputText ? 'Input received' : 'Photo received', status: 'done' },
      { id: 'location', label: 'Detecting location', status: location ? 'done' : 'active' },
      { id: 'language', label: 'Detecting language', status: 'pending' },
      { id: 'translate', label: 'Translating', status: 'pending' },
      { id: 'classify', label: 'Classifying emergency', status: 'pending' },
      { id: 'image', label: 'Analyzing photo', status: photoFile ? 'pending' : 'done' },
      { id: 'summary', label: 'Generating SOS', status: 'pending' },
    ];
    setProcessingSteps(steps);

    // Detect location if not done
    if (!location) {
      try {
        detectLocation();
        await new Promise(r => setTimeout(r, 2000));
      } catch { /* continue */ }
    }
    updateStep(steps, 'location', 'done');

    // AI Analysis
    if (inputText) {
      updateStep(steps, 'language', 'active');
      try {
        const result = await api.post<AIAnalysisResult>('/api/ai/analyze-text', { text: inputText });
        setAiResult(result);
        updateStep(steps, 'language', 'done');
        updateStep(steps, 'translate', 'done');
        updateStep(steps, 'classify', 'done');
        setEditCategory(result.category);
        setEditPriority(result.priority);
        setEditDescription(result.summary);
      } catch (err) {
        console.error('AI analysis failed:', err);
        updateStep(steps, 'language', 'error');
        updateStep(steps, 'translate', 'error');
        updateStep(steps, 'classify', 'error');
        // Fallback
        setEditCategory('OTHER');
        setEditPriority('UNKNOWN');
        setEditDescription(inputText);
      }
    }

    // Image analysis
    if (photoFile) {
      updateStep(steps, 'image', 'active');
      try {
        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('context', inputText);
        const imgResult = await api.postForm('/api/ai/analyze-image', formData);
        setImageAnalysis(imgResult as Record<string, unknown>);
        updateStep(steps, 'image', 'done');
      } catch {
        updateStep(steps, 'image', 'error');
      }
    }

    updateStep(steps, 'summary', 'done');
    setProcessingSteps([...steps]);

    await new Promise(r => setTimeout(r, 500));
    setStep('review');
  };

  const updateStep = (steps: ProcessingStep[], id: string, status: ProcessingStep['status']) => {
    const s = steps.find(s => s.id === id);
    if (s) s.status = status;
    setProcessingSteps([...steps]);
  };

  // ─── Submit Emergency ───────────────────────────────
  const submitEmergency = async () => {
    try {
      const inputText = recordedText.trim() || textInput.trim();

      // Upload photo if exists
      let mediaPath: string | undefined;
      if (photoFile) {
        const fileName = `emergency_${Date.now()}_${photoFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from('emergency-media')
          .upload(fileName, photoFile);
        if (!uploadErr) mediaPath = fileName;
      }

      const emergency = await api.post<{ id: string }>('/api/emergency', {
        category: editCategory,
        priority: editPriority,
        description: editDescription,
        transcript: recordedText || undefined,
        translation: aiResult?.translation || undefined,
        language: aiResult?.detected_language || 'en',
        latitude: location?.lat,
        longitude: location?.lng,
        location_accuracy: location?.accuracy,
        address_text: location?.address,
        ai_confidence: aiResult?.confidence,
        ai_raw_result: aiResult || undefined,
        required_services: aiResult?.required_services,
      });

      setStep('sent');

      // Navigate to detail after brief delay
      setTimeout(() => {
        navigate(`/emergency/${emergency.id}`);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit emergency');
      setStep('review');
    }
  };

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-emergency" />
            Emergency SOS
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Speak, type, or take a photo — in any language</p>
        </div>
        <a href="tel:112" className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emergency rounded-[var(--radius-md)] hover:bg-emergency-dark transition-colors">
          <Phone className="w-4 h-4" /> 112
        </a>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 p-3 mb-4 text-sm text-emergency bg-emergency-light border border-emergency/10 rounded-[var(--radius-md)]"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ INPUT STEP ═══ */}
      {step === 'input' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Voice */}
          <div className="p-6 bg-surface border border-border rounded-[var(--radius-xl)]">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Mic className="w-4 h-4 text-action" /> Voice Input
            </h3>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-emergency text-white emergency-pulse shadow-lg shadow-emergency/30'
                    : 'bg-action-light text-action hover:bg-action hover:text-white'
                }`}
              >
                {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>
              <p className="text-sm text-text-secondary">
                {isRecording ? 'Listening... Tap to stop' : 'Tap to speak in any language'}
              </p>
              {recordedText && (
                <div className="w-full p-3 bg-bg rounded-[var(--radius-md)] text-sm text-text-primary">
                  {recordedText}
                </div>
              )}
            </div>
          </div>

          {/* Photo */}
          <div className="p-6 bg-surface border border-border rounded-[var(--radius-xl)]">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Camera className="w-4 h-4 text-warning" /> Photo
            </h3>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Emergency" className="w-full h-48 object-cover rounded-[var(--radius-md)]" />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-[var(--radius-lg)] hover:border-action hover:bg-action-light/50 transition-all text-sm font-medium text-text-secondary"
                >
                  <Camera className="w-5 h-5" /> Take Photo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-[var(--radius-lg)] hover:border-action hover:bg-action-light/50 transition-all text-sm font-medium text-text-secondary"
                >
                  <Upload className="w-5 h-5" /> Upload
                </button>
              </div>
            )}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSelect} />
          </div>

          {/* Text input */}
          <div className="p-6 bg-surface border border-border rounded-[var(--radius-xl)]">
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className="flex items-center gap-2 text-sm font-semibold text-text-primary w-full"
            >
              <Keyboard className="w-4 h-4 text-text-secondary" />
              Type Description
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showTextInput ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showTextInput && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Describe the emergency in any language..."
                    rows={3}
                    className="w-full mt-3 p-3 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action resize-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Location */}
          <div className="p-6 bg-surface border border-border rounded-[var(--radius-xl)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <MapPin className="w-4 h-4 text-success" /> Location
              </h3>
              <button
                onClick={detectLocation}
                disabled={locationLoading}
                className="text-sm text-action hover:text-action-dark font-medium"
              >
                {locationLoading ? 'Detecting...' : location ? 'Update' : 'Detect Location'}
              </button>
            </div>
            {location && (
              <div className="mt-3 p-3 bg-success-light rounded-[var(--radius-md)]">
                <p className="text-sm text-success font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Location detected
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {location.address || `${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E`}
                </p>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={processEmergency}
            disabled={!(recordedText.trim() || textInput.trim() || photoFile)}
            className="w-full py-4 text-base font-bold text-white gradient-emergency rounded-[var(--radius-lg)] shadow-lg shadow-emergency/20 hover:shadow-xl disabled:opacity-40 disabled:shadow-none transition-all flex items-center justify-center gap-2 emergency-pulse"
          >
            <AlertTriangle className="w-5 h-5" />
            🚨 SEND EMERGENCY
          </button>

          <p className="text-center text-xs text-text-muted">
            This does not replace calling emergency services. Always call 112 for life-threatening emergencies.
          </p>
        </motion.div>
      )}

      {/* ═══ PROCESSING STEP ═══ */}
      {step === 'processing' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-8 bg-surface border border-border rounded-[var(--radius-xl)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="w-6 h-6 text-action animate-spin" />
            <h2 className="text-lg font-semibold text-text-primary">Analyzing Emergency...</h2>
          </div>
          <div className="space-y-3">
            {processingSteps.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                {s.status === 'done' && <CheckCircle2 className="w-5 h-5 text-success" />}
                {s.status === 'active' && <Loader2 className="w-5 h-5 text-action animate-spin" />}
                {s.status === 'pending' && <Circle className="w-5 h-5 text-text-muted" />}
                {s.status === 'error' && <X className="w-5 h-5 text-emergency" />}
                <span className={`text-sm ${s.status === 'done' ? 'text-text-primary' : s.status === 'active' ? 'text-action font-medium' : s.status === 'error' ? 'text-emergency' : 'text-text-muted'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══ REVIEW STEP ═══ */}
      {step === 'review' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* AI Result */}
          {aiResult && (
            <div className="p-5 bg-surface border border-border rounded-[var(--radius-xl)]">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" /> AI Analysis
                {aiResult.fallback && <span className="text-xs text-warning bg-warning-light px-2 py-0.5 rounded-full">Fallback</span>}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-text-muted">Language:</span> <span className="font-medium">{aiResult.detected_language_name}</span></div>
                <div><span className="text-text-muted">Confidence:</span> <span className="font-medium">{(aiResult.confidence * 100).toFixed(0)}%</span></div>
              </div>
              {aiResult.translation && aiResult.detected_language !== 'en' && (
                <div className="mt-3 p-3 bg-action-light rounded-[var(--radius-md)]">
                  <p className="text-xs text-text-muted mb-1">Translation:</p>
                  <p className="text-sm text-text-primary">{aiResult.translation}</p>
                </div>
              )}
            </div>
          )}

          {/* Editable fields */}
          <div className="p-5 bg-surface border border-border rounded-[var(--radius-xl)]">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-text-secondary" /> Review & Edit
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Category</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as EmergencyCategory)}
                  className="w-full p-2.5 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Priority</label>
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as EmergencyPriority)}
                  className="w-full p-2.5 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
                  className="w-full p-2.5 text-sm bg-bg border border-border rounded-[var(--radius-md)] focus:outline-none focus:border-action resize-none" />
              </div>
            </div>
          </div>

          {/* Photo preview */}
          {photoPreview && (
            <div className="p-5 bg-surface border border-border rounded-[var(--radius-xl)]">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Photo
              </h3>
              <img src={photoPreview} alt="Emergency" className="w-full h-40 object-cover rounded-[var(--radius-md)]" />
              {imageAnalysis && (
                <p className="mt-2 text-xs text-text-secondary">{(imageAnalysis as { scene_description?: string }).scene_description}</p>
              )}
            </div>
          )}

          {/* Location */}
          {location && (
            <div className="p-4 bg-success-light border border-success/10 rounded-[var(--radius-lg)] text-sm">
              <p className="font-medium text-success flex items-center gap-1"><MapPin className="w-4 h-4" /> Location</p>
              <p className="text-text-secondary text-xs mt-1">{location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => setStep('input')}
              className="flex-1 py-3 text-sm font-medium text-text-primary bg-bg border border-border rounded-[var(--radius-md)] hover:bg-surface transition-colors">
              ← Back to Edit
            </button>
            <button onClick={submitEmergency}
              className="flex-1 py-3 text-sm font-bold text-white gradient-emergency rounded-[var(--radius-md)] shadow-lg shadow-emergency/20 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> SUBMIT SOS
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══ SENT STEP ═══ */}
      {step === 'sent' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="p-8 bg-surface border border-success/20 rounded-[var(--radius-xl)] text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Emergency Submitted</h2>
          <p className="text-sm text-text-secondary mb-4">Responders have been notified. Stay safe.</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-success-light text-success text-sm font-medium rounded-full">
            <CheckCircle2 className="w-4 h-4" /> Responder notified ✓
          </div>
          <p className="mt-6 text-xs text-text-muted">Redirecting to emergency details...</p>
        </motion.div>
      )}
    </div>
  );
}
