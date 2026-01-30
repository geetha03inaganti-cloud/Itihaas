
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

  const handlePlaceSelect = async (name: string) => {
    setLoading(true);
    setView('explore');
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

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    
    try {
      const response = await GeminiService.chat(chatInput, chatMessages, lang);
      setChatMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to history right now. Please try again." }]);
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
      alert("Reconstruction failed. Ensure the image is clear and try again.");
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
              इ
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heritage tracking-wider text-amber-900 leading-none">ITIHAASA</h1>
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
            {/* Hero Section */}
            <div className="relative h-[80vh] flex items-center justify-center text-center overflow-hidden bg-stone-900">
              <img 
                src="https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=2000" 
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                alt="Andhra Heritage"
              />
              <div className="relative z-10 max-w-4xl px-4">
                <h2 className="text-5xl md:text-7xl font-bold font-heritage text-white mb-6 animate-fade-in">
                  Discover the Soul of Andhra Pradesh
                </h2>
                <p className="text-xl text-stone-200 mb-8 leading-relaxed max-w-2xl mx-auto">
                  Journey through thousands of years of history, architecture, and literature. ITIHAASA uses cutting-edge AI to bring forgotten monuments back to life.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={() => setView('explore')}
                    className="w-full sm:w-auto px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-bold text-lg transition shadow-xl flex items-center justify-center gap-2"
                  >
                    <Compass size={24} /> Explore Heritage
                  </button>
                  <button 
                    onClick={() => setView('reconstruct')}
                    className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-full font-bold text-lg transition backdrop-blur-md flex items-center justify-center gap-2"
                  >
                    <History size={24} /> AI Reconstruction
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Access Search */}
            <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
              <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-grow w-full">
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-2">Search Places</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                    <input 
                      type="text"
                      placeholder="Enter a place (e.g., Lepakshi, Amravati)..."
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
                    {['Lepakshi', 'Amravati', 'Tirupati', 'Srisailam'].map(site => (
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
                <p className="text-stone-500 mb-8">Discover monuments, culture, and literature of Andhra Pradesh</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
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
                <p className="text-xl font-heritage italic">Retrieving chronicles from the archives...</p>
              </div>
            ) : selectedPlace && (
              <div className="animate-fade-in">
                {/* Header for Selected Place */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <button onClick={() => setSelectedPlace(null)} className="text-stone-500 hover:text-stone-800 text-sm mb-2 flex items-center gap-1">
                      <ChevronRight className="rotate-180" size={16} /> Back to explore
                    </button>
                    <h2 className="text-5xl font-bold font-heritage text-stone-900">{selectedPlace.name}</h2>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setView('reconstruct')}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <History size={16} /> Reconstruct Local Artifacts
                    </button>
                  </div>
                </div>

                {/* Images Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                  {selectedPlace.images.length > 0 ? (
                    selectedPlace.images.slice(0, 3).map((img, i) => (
                      <div key={i} className={`relative overflow-hidden rounded-2xl h-64 ${i === 0 ? 'md:col-span-2' : ''}`}>
                        <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <p className="text-white text-xs opacity-90">{img.caption}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full h-64 bg-stone-200 rounded-2xl flex items-center justify-center italic text-stone-500">
                      No images found in archives
                    </div>
                  )}
                </div>

                {/* Detailed Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8">
                    <Section title="Historical Overview" icon={<Info size={24} className="text-amber-700" />}>
                      <p>{selectedPlace.content?.overview}</p>
                    </Section>

                    <Section title="Architecture & Sculptures" icon={<ImageIcon size={24} className="text-amber-700" />}>
                      <p>{selectedPlace.content?.architecture}</p>
                    </Section>

                    <Section title="Traditions & Cuisine" icon={<Compass size={24} className="text-amber-700" />}>
                      <div className="space-y-4">
                        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                          <h4 className="font-bold text-amber-900 mb-2">Local Flavors</h4>
                          <p className="text-stone-700 italic">{selectedPlace.content?.cuisine}</p>
                        </div>
                        <p>{selectedPlace.content?.traditions}</p>
                      </div>
                    </Section>

                    <Section title="Lifestyle & Agriculture" icon={<MapPin size={24} className="text-amber-700" />}>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-4 bg-stone-100 rounded-xl">
                          <h4 className="font-bold mb-2">Local Produce</h4>
                          <p className="text-sm">{selectedPlace.content?.agriculture}</p>
                        </div>
                        <div className="p-4 bg-stone-100 rounded-xl">
                          <h4 className="font-bold mb-2">Culture & Life</h4>
                          <p className="text-sm">{selectedPlace.content?.lifestyle}</p>
                        </div>
                      </div>
                    </Section>
                  </div>

                  <div className="lg:col-span-4">
                    <div className="sticky top-24 space-y-8">
                      {/* Poets Section */}
                      <div className="bg-stone-900 text-stone-100 p-8 rounded-2xl shadow-xl">
                        <div className="flex items-center gap-2 mb-6 text-amber-400">
                          <BookOpen size={24} />
                          <h3 className="text-xl font-bold uppercase tracking-widest text-sm">Literary Heritage</h3>
                        </div>
                        <div className="space-y-8">
                          {selectedPlace.content?.poets.map((poet, i) => (
                            <div key={i} className="border-l-2 border-amber-600/30 pl-4">
                              <h4 className="text-xl font-heritage font-bold text-amber-500">{poet.name}</h4>
                              <p className="text-xs text-stone-400 mb-2 uppercase tracking-tight">{poet.period} • {poet.language}</p>
                              <p className="text-sm mb-4 leading-relaxed opacity-80">{poet.contribution}</p>
                              <div className="italic text-stone-300 bg-white/5 p-4 rounded-lg font-heritage text-lg leading-tight relative">
                                <span className="absolute -top-2 left-2 text-4xl text-amber-600/20">"</span>
                                {poet.famousVerse}
                              </div>
                              <p className="mt-2 text-[10px] text-stone-500">Source: {poet.source}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Map Simulation */}
                      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                        <h4 className="font-bold mb-4 flex items-center gap-2">
                          <MapPin size={18} className="text-amber-700" /> Regional Map
                        </h4>
                        <div className="aspect-square bg-stone-100 rounded-xl overflow-hidden relative">
                          <div className="absolute inset-0 flex items-center justify-center opacity-30">
                            <MapPin size={48} className="text-amber-800" />
                          </div>
                          <img 
                            src={`https://picsum.photos/seed/${selectedPlace.id}/400/400?grayscale`} 
                            className="w-full h-full object-cover opacity-50"
                            alt="Map Placeholder"
                          />
                          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg border border-stone-200 text-xs font-bold text-stone-800">
                            Coordinate data for {selectedPlace.name} verified by Wiki.
                          </div>
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
          <div className="max-w-5xl mx-auto px-4 py-16 animate-fade-in">
            <div className="text-center mb-12">
              <History size={48} className="mx-auto text-amber-600 mb-4" />
              <h2 className="text-4xl font-heritage font-bold mb-4">Monument Reconstruction</h2>
              <p className="text-stone-500 max-w-2xl mx-auto">
                Upload a photo of a damaged sculpture, inscription, or temple wall from Andhra Pradesh. Our AI will analyze historical architectural patterns to visualize its original state.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Upload Box */}
              <div className="flex flex-col gap-4">
                <div 
                  className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition cursor-pointer h-[400px] bg-white
                    ${originalImage ? 'border-amber-500' : 'border-stone-300 hover:border-amber-400'}`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {originalImage ? (
                    <img src={originalImage} className="w-full h-full object-contain rounded-xl" alt="Original" />
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
                        <Upload size={32} />
                      </div>
                      <p className="font-bold text-stone-800">Drop your image here</p>
                      <p className="text-sm text-stone-500">or click to browse</p>
                    </>
                  )}
                  <input id="file-upload" type="file" hidden accept="image/*" onChange={handleFileUpload} />
                </div>
                {originalImage && (
                  <button 
                    onClick={startReconstruction}
                    disabled={reconLoading}
                    className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {reconLoading ? <Loader2 size={24} className="animate-spin" /> : <History size={24} />}
                    {reconLoading ? 'Analyzing Patterns...' : 'Visualize Original State'}
                  </button>
                )}
              </div>

              {/* Reconstruction Result */}
              <div className="bg-stone-100 rounded-3xl border border-stone-200 h-[400px] flex items-center justify-center relative overflow-hidden">
                {reconstructedImage ? (
                  <img src={reconstructedImage} className="w-full h-full object-contain rounded-xl" alt="Reconstructed" />
                ) : (
                  <div className="text-center px-8">
                    {reconLoading ? (
                      <div className="space-y-4">
                        <Loader2 size={48} className="animate-spin text-amber-600 mx-auto" />
                        <p className="text-lg font-heritage text-stone-600 italic">Consulting architectural treatises...</p>
                      </div>
                    ) : (
                      <p className="text-stone-400 italic">Reconstructed visualization will appear here</p>
                    )}
                  </div>
                )}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <div className="bg-amber-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">AI Reconstructed</div>
                </div>
              </div>
            </div>

            {reconstructedImage && (
              <div className="mt-8 bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-start gap-4">
                <Info size={24} className="text-amber-700 flex-shrink-0 mt-1" />
                <p className="text-sm text-amber-900 leading-relaxed italic">
                  <strong>Historical Disclaimer:</strong> This is an AI-assisted historical reconstruction based on available references from Andhra Pradesh's architectural styles (Dravidian/Chalukyan). It is intended for educational visualization and may not represent 100% historical accuracy.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition transform hover:scale-110 active:scale-95 ${
            isChatOpen ? 'bg-stone-800 text-white' : 'bg-amber-600 text-white'
          }`}
        >
          {isChatOpen ? <X size={28} /> : <MessageSquare size={28} />}
        </button>

        {isChatOpen && (
          <div className="absolute bottom-20 right-0 w-[350px] md:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-slide-up">
            <div className="p-4 bg-amber-700 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold">Ask ITIHAASA</h4>
                <p className="text-[10px] opacity-80">Heritage AI Assistant</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="flex-grow p-4 overflow-y-auto space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={32} className="text-stone-300" />
                  </div>
                  <p className="text-stone-500 text-sm">Ask me about Andhra's temples, kings, or poets!</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-amber-600 text-white rounded-br-none' 
                      : 'bg-stone-100 text-stone-800 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef}></div>
            </div>

            <div className="p-4 border-t border-stone-100">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                  placeholder="Type your message..."
                  className="flex-grow text-sm bg-stone-100 border-none rounded-xl focus:ring-2 focus:ring-amber-500"
                />
                <button 
                  onClick={handleChatSend}
                  className="p-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-stone-900 text-stone-500 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h1 className="text-2xl font-bold font-heritage tracking-wider text-white">ITIHAASA</h1>
            <p className="text-xs max-w-xs mt-2">Connecting history, architecture, and literature through artificial intelligence for Andhra Pradesh heritage preservation.</p>
          </div>
          <div className="flex gap-12 text-sm">
            <div>
              <h5 className="text-stone-100 font-bold mb-4 uppercase tracking-widest text-[10px]">Projects</h5>
              <ul className="space-y-2">
                <li>Explore</li>
                <li>Reconstruct</li>
                <li>Archive</li>
              </ul>
            </div>
            <div>
              <h5 className="text-stone-100 font-bold mb-4 uppercase tracking-widest text-[10px]">Region</h5>
              <ul className="space-y-2">
                <li>Andhra Pradesh</li>
                <li>Rayalaseema</li>
                <li>Coastal Andhra</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-stone-800 text-center text-[10px] uppercase tracking-widest">
          © 2024 ITIHAASA AI • Cultural Heritage Preservation Framework
        </div>
      </footer>

      {/* Tailwind Utility for Animations */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
