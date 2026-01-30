
import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  MapPin, 
  Image as ImageIcon, 
  BookOpen, 
  MessageSquare, 
  ChevronRight, 
  Languages,
  Upload,
  Search,
  Loader2,
  X,
  History,
  Info
} from 'lucide-react';
import { WikipediaService } from './wikipediaService';
import { GeminiService } from './geminiService';
import { Language, HeritageContent, Poet, WikiImage, PlaceDetails, ChatMessage } from './types';

// Components
const LanguageSelector: React.FC<{ current: Language, onChange: (l: Language) => void }> = ({ current, onChange }) => (
  <div className="flex gap-2">
    {(['en', 'te', 'hi'] as Language[]).map(lang => (
      <button
        key={lang}
        onClick={() => onChange(lang)}
        className={`px-3 py-1 rounded-full text-sm font-medium transition ${
          current === lang ? 'bg-amber-600 text-white shadow-md' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
        }`}
      >
        {lang === 'en' ? 'English' : lang === 'te' ? 'తెలుగు' : 'हिंदी'}
      </button>
    ))}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ title, children, icon }) => (
  <div className="mb-12">
    <div className="flex items-center gap-3 mb-4 border-b border-stone-200 pb-2">
      {icon}
      <h3 className="text-2xl font-bold font-heritage text-stone-800">{title}</h3>
    </div>
    <div className="text-stone-700 leading-relaxed text-lg">
      {children}
    </div>
  </div>
);

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [view, setView] = useState<'home' | 'explore' | 'reconstruct'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [placesList, setPlacesList] = useState<string[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Reconstruction state
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [reconstructedImage, setReconstructedImage] = useState<string | null>(null);
  const [reconLoading, setReconLoading] = useState(false);

  useEffect(() => {
    // Initial fetch of famous places
    WikipediaService.searchHeritagePlaces().then(setPlacesList);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // IMPORTANT: Re-fetch content when language changes to translate existing view
  useEffect(() => {
    if (selectedPlace && view === 'explore') {
      fetchPlaceContent(selectedPlace.name, false); // false to avoid jumping back to top unnecessarily
    }
  }, [lang]);

  const fetchPlaceContent = async (name: string, shouldSwitchView: boolean = true) => {
    setLoading(true);
    if (shouldSwitchView) setView('explore');
    try {
      const summary = await WikipediaService.getSummary(name);
      const images = await WikipediaService.getPlaceImages(name);
      const content = await GeminiService.getStructuredContent(name, summary, lang);
      setSelectedPlace({ id: name, name, content, images });
    } catch (error) {
      console.error(error);
      alert("Error fetching heritage data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceSelect = (name: string) => {
    fetchPlaceContent(name);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    
    try {
      const response = await GeminiService.chat(chatInput, chatMessages, lang);
      setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Connection issues. Please try again." }]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setOriginalImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startReconstruction = async () => {
    if (!originalImage) return;
    setReconLoading(true);
    try {
      const res = await GeminiService.reconstructMonument(originalImage, selectedPlace?.name || "Andhra Heritage");
      setReconstructedImage(res);
    } catch (e) {
      alert("Reconstruction failed. Ensure the image is clear.");
    } finally {
      setReconLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setView('home')}
          >
            <div className="w-10 h-10 bg-amber-700 rounded-lg flex items-center justify-center text-white font-bold text-xl font-heritage">
              ఇ
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heritage tracking-wider text-amber-900 leading-none">ఇతిహాస</h1>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Heritage Reimagined</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-600">
            <button onClick={() => setView('home')} className={`hover:text-amber-700 transition ${view === 'home' ? 'text-amber-700' : ''}`}>Home</button>
            <button onClick={() => setView('explore')} className={`hover:text-amber-700 transition ${view === 'explore' ? 'text-amber-700' : ''}`}>Explore</button>
            <button onClick={() => setView('reconstruct')} className={`hover:text-amber-700 transition ${view === 'reconstruct' ? 'text-amber-700' : ''}`}>Reconstruct</button>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector current={lang} onChange={setLang} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {view === 'home' && (
          <div className="relative">
            <div className="relative h-[80vh] flex items-center justify-center text-center overflow-hidden bg-stone-900">
              <img 
                src="https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=2000" 
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                alt="Andhra Heritage"
              />
              <div className="relative z-10 max-w-4xl px-4">
                <h2 className="text-5xl md:text-7xl font-bold font-heritage text-white mb-6 animate-fade-in">
                  {lang === 'en' ? 'Discover the Soul of Andhra Pradesh' : lang === 'te' ? 'ఆంధ్రప్రదేశ్ ఆత్మను అన్వేషించండి' : 'आंध्र प्रदेश की आत्मा को जानें'}
                </h2>
                <p className="text-xl text-stone-200 mb-8 leading-relaxed max-w-2xl mx-auto">
                  {lang === 'en' 
                    ? 'Journey through thousands of years of history, architecture, and literature. ITIHAASA uses cutting-edge AI to bring forgotten monuments back to life.'
                    : lang === 'te'
                    ? 'వేల సంవత్సరాల చరిత్ర, వాస్తుశిల్పం మరియు సాహిత్యం ద్వారా ప్రయాణం చేయండి. ఇతిహాస అత్యాధునిక AIని ఉపయోగించి మరచిపోయిన స్మారక చిహ్నాలకు జీవం పోస్తుంది.'
                    : 'हजारों वर्षों के इतिहास, वास्तुकला और साहित्य की यात्रा करें। इतिहास आधुनिक एआई का उपयोग करके भूले हुए स्मारकों को फिर से जीवित करता है।'}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={() => setView('explore')}
                    className="w-full sm:w-auto px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-bold text-lg transition shadow-xl flex items-center justify-center gap-2"
                  >
                    <Compass size={24} /> {lang === 'en' ? 'Explore Heritage' : lang === 'te' ? 'వారసత్వాన్ని అన్వేషించండి' : 'विरासत का अन्वेषण करें'}
                  </button>
                  <button 
                    onClick={() => setView('reconstruct')}
                    className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-full font-bold text-lg transition backdrop-blur-md flex items-center justify-center gap-2"
                  >
                    <History size={24} /> {lang === 'en' ? 'AI Reconstruction' : lang === 'te' ? 'AI పునర్నిర్మాణం' : 'एआई पुनर्निर्माण'}
                  </button>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
              <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-grow w-full">
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-2">Search Places</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                    <input 
                      type="text"
                      placeholder={lang === 'en' ? "Search for a heritage site..." : lang === 'te' ? "వారసత్వ ప్రదేశం కోసం వెతకండి..." : "विरासत स्थल की खोज करें..."}
                      className="w-full pl-12 pr-4 py-3 bg-stone-100 border-none rounded-xl focus:ring-2 focus:ring-amber-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePlaceSelect(searchQuery)}
                    />
                  </div>
                </div>
                <div className="w-px h-12 bg-stone-200 hidden md:block"></div>
                <div className="w-full md:w-auto">
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-2">Popular Sites</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {['Lepakshi', 'Amaravati', 'Tirupati', 'Srisailam'].map(site => (
                      <button 
                        key={site}
                        onClick={() => handlePlaceSelect(site)}
                        className="px-4 py-2 bg-stone-100 hover:bg-amber-50 rounded-lg text-sm font-medium whitespace-nowrap transition"
                      >
                        {site}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'explore' && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            {!selectedPlace && !loading ? (
              <div className="text-center py-20">
                <Compass size={64} className="mx-auto text-stone-300 mb-4" />
                <h2 className="text-3xl font-heritage font-bold mb-2">Select a Destination</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
                  {placesList.map(place => (
                    <button 
                      key={place}
                      onClick={() => handlePlaceSelect(place)}
                      className="p-6 bg-white border border-stone-200 rounded-2xl hover:border-amber-500 hover:shadow-lg transition text-left group"
                    >
                      <MapPin size={24} className="text-amber-600 mb-3 group-hover:scale-110 transition" />
                      <span className="font-bold text-stone-800">{place}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 size={48} className="animate-spin text-amber-600 mb-4" />
                <p className="text-xl font-heritage italic">Consulting the archives in {lang === 'en' ? 'English' : lang === 'te' ? 'తెలుగు' : 'हिंदी'}...</p>
              </div>
            ) : selectedPlace && (
              <div className="animate-fade-in">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <button onClick={() => setSelectedPlace(null)} className="text-stone-500 hover:text-stone-800 text-sm mb-2 flex items-center gap-1">
                      <ChevronRight className="rotate-180" size={16} /> {lang === 'en' ? 'Back' : lang === 'te' ? 'వెనుకకు' : 'पीछे'}
                    </button>
                    <h2 className="text-5xl font-bold font-heritage text-stone-900">{selectedPlace.name}</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                  {selectedPlace.images.slice(0, 3).map((img, i) => (
                    <div key={i} className={`relative overflow-hidden rounded-2xl h-64 ${i === 0 ? 'md:col-span-2' : ''}`}>
                      <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8">
                    <Section title={lang === 'en' ? 'Historical Overview' : lang === 'te' ? 'చారిత్రక అవలోకనం' : 'ऐतिहासिक अवलोकन'} icon={<Info size={24} className="text-amber-700" />}>
                      <p>{selectedPlace.content?.overview}</p>
                    </Section>
                    <Section title={lang === 'en' ? 'Architecture' : lang === 'te' ? 'వాస్తుశిల్పం' : 'वास्तुकला'} icon={<ImageIcon size={24} className="text-amber-700" />}>
                      <p>{selectedPlace.content?.architecture}</p>
                    </Section>
                    <Section title={lang === 'en' ? 'Local Traditions' : lang === 'te' ? 'స్థానిక సంప్రదాయాలు' : 'स्थानीय परंपराएं'} icon={<Compass size={24} className="text-amber-700" />}>
                      <p>{selectedPlace.content?.traditions}</p>
                      <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 mt-4">
                        <h4 className="font-bold text-amber-900 mb-2">{lang === 'en' ? 'Regional Cuisine' : lang === 'te' ? 'ప్రాంతీయ వంటకాలు' : 'क्षेत्रीय व्यंजन'}</h4>
                        <p className="text-stone-700">{selectedPlace.content?.cuisine}</p>
                      </div>
                    </Section>
                  </div>

                  <div className="lg:col-span-4">
                    <div className="sticky top-24 space-y-8">
                      <div className="bg-stone-900 text-stone-100 p-8 rounded-2xl shadow-xl">
                        <h3 className="text-xl font-bold uppercase tracking-widest text-amber-400 mb-6 flex items-center gap-2 text-sm">
                          <BookOpen size={20} /> {lang === 'en' ? 'Literary Figures' : lang === 'te' ? 'సాహిత్య వ్యక్తులు' : 'साहित्यिक हस्तियां'}
                        </h3>
                        <div className="space-y-8">
                          {selectedPlace.content?.poets.map((poet, i) => (
                            <div key={i} className="border-l-2 border-amber-600/30 pl-4">
                              <h4 className="text-xl font-heritage font-bold text-amber-500">{poet.name}</h4>
                              <p className="text-xs text-stone-400 mb-2">{poet.period}</p>
                              <div className="italic text-stone-300 bg-white/5 p-4 rounded-lg font-heritage text-lg leading-tight">
                                {poet.famousVerse}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'reconstruct' && (
          <div className="max-w-5xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <History size={48} className="mx-auto text-amber-600 mb-4" />
              <h2 className="text-4xl font-heritage font-bold mb-4">{lang === 'en' ? 'Monument Reconstruction' : lang === 'te' ? 'స్మారక చిహ్నాల పునర్నిర్మాణం' : 'स्मारक पुनर्निर्माण'}</h2>
              <p className="text-stone-500 max-w-2xl mx-auto">{lang === 'en' ? 'Visualize original grandeur through AI.' : lang === 'te' ? 'AI ద్వారా అసలు వైభవాన్ని ఊహించుకోండి.' : 'एआई के माध्यम से मूल भव्यता की कल्पना करें।'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <div 
                  className="border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition cursor-pointer h-[400px] bg-white border-stone-300 hover:border-amber-400"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {originalImage ? (
                    <img src={originalImage} className="w-full h-full object-contain rounded-xl" alt="Original" />
                  ) : (
                    <div className="text-center">
                      <Upload size={32} className="mx-auto text-amber-600 mb-2" />
                      <p className="font-bold">{lang === 'en' ? 'Upload Image' : lang === 'te' ? 'చిత్రాన్ని అప్‌లోడ్ చేయండి' : 'छवि अपलोड करें'}</p>
                    </div>
                  )}
                  <input id="file-upload" type="file" hidden accept="image/*" onChange={handleFileUpload} />
                </div>
                {originalImage && (
                  <button 
                    onClick={startReconstruction}
                    disabled={reconLoading}
                    className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
                  >
                    {reconLoading ? <Loader2 className="animate-spin" /> : <History />} {lang === 'en' ? 'Reconstruct' : lang === 'te' ? 'పునర్నిర్మించు' : 'पुनर्निर्माण करें'}
                  </button>
                )}
              </div>
              
              <div className="bg-stone-100 rounded-3xl border border-stone-200 h-[400px] flex items-center justify-center">
                {reconstructedImage ? (
                  <img src={reconstructedImage} className="w-full h-full object-contain rounded-xl" alt="Reconstructed" />
                ) : (
                  <p className="text-stone-400 italic">{reconLoading ? 'Processing...' : 'Result will appear here'}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition ${isChatOpen ? 'bg-stone-800' : 'bg-amber-600'} text-white`}
        >
          {isChatOpen ? <X size={28} /> : <MessageSquare size={28} />}
        </button>

        {isChatOpen && (
          <div className="absolute bottom-20 right-0 w-[350px] md:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
            <div className="p-4 bg-amber-700 text-white font-bold">{lang === 'en' ? 'Ask ITIHAASA' : lang === 'te' ? 'ఇతిహాసను అడగండి' : 'इतिहास से पूछें'}</div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-800'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef}></div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                className="flex-grow bg-stone-100 border-none rounded-xl"
                placeholder="..."
              />
              <button onClick={handleChatSend} className="p-2 bg-amber-600 text-white rounded-xl"><ChevronRight /></button>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-stone-900 text-stone-500 py-12 px-4 text-center">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold font-heritage tracking-wider text-white">ఇతిహాస</h1>
          <p className="mt-8 text-[10px] uppercase tracking-widest">© 2024 ITIHAASA AI • Cultural Heritage Preservation Framework</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
