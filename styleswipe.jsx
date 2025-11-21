import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Heart, X, ShoppingBag, User, Star, Zap, RotateCcw, 
  TrendingUp, ChevronRight, Loader2, Database, Search, 
  MessageCircle, Home, Menu, LogOut, Plus, Minus, Trash2, Send,
  Smartphone, Mail, Globe, Camera, Tag, DollarSign, Sparkles
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  updateDoc,
  increment,
  query,
  orderBy
} from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- GEMINI API KEY ---
const apiKey = ""; // Injected at runtime

// --- MOCK DATA & CONSTANTS ---
const TAGS = {
  CASUAL: 'Casual',
  FORMAL: 'Formal',
  SUMMER: 'Summer',
  WINTER: 'Winter',
  STREETWEAR: 'Streetwear',
  VINTAGE: 'Vintage',
  MINIMALIST: 'Minimalist',
  BOLD: 'Bold',
  ACCESSORY: 'Accessory',
};

const CATEGORIES = ['All', 'Maxi', 'Midi', 'Mini', 'Evening', 'Casual', 'Boho'];

const SEED_PRODUCTS = [
  { id: '1', name: "Sunset Maxi Dress", price: 85, category: 'Maxi', image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", tags: [TAGS.SUMMER, TAGS.CASUAL, TAGS.BOLD], description: "Flowing silhouette perfect for beach evenings." },
  { id: '2', name: "Velvet Evening Gown", price: 180, category: 'Evening', image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", tags: [TAGS.WINTER, TAGS.FORMAL, TAGS.BOLD], description: "Luxurious velvet for elegant winter nights." },
  { id: '3', name: "Chic Linen Wrap", price: 95, category: 'Casual', image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", tags: [TAGS.SUMMER, TAGS.MINIMALIST, TAGS.CASUAL], description: "Breathable linen for effortless style." },
  { id: '4', name: "Boho Floral Midi", price: 75, category: 'Boho', image: "https://images.unsplash.com/photo-1612336307429-8a898d10e223?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", tags: [TAGS.VINTAGE, TAGS.CASUAL, TAGS.SUMMER], description: "Vintage floral patterns with modern comfort." },
  { id: '5', name: "Silk Slip Dress", price: 110, category: 'Evening', image: "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", tags: [TAGS.FORMAL, TAGS.MINIMALIST, TAGS.SUMMER], description: "Effortless luxury for special nights." },
  { id: '6', name: "Knit Sweater Dress", price: 85, category: 'Casual', image: "https://images.unsplash.com/photo-1624421343487-0c674847a02a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", tags: [TAGS.WINTER, TAGS.CASUAL, TAGS.MINIMALIST], description: "Cozy knit fabric, perfect for layering." },
  { id: '7', name: "Sequin Party Mini", price: 120, category: 'Mini', image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", tags: [TAGS.BOLD, TAGS.STREETWEAR, TAGS.FORMAL], description: "Sparkle all night in this statement piece." },
  { id: '8', name: "Embroidered Tunic", price: 65, category: 'Boho', image: "https://images.unsplash.com/photo-1551163943-3f6a855d1153?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", tags: [TAGS.VINTAGE, TAGS.BOLD, TAGS.CASUAL], description: "Intricate details for a unique look." },
  { id: '9', name: "Little Black Dress", price: 150, category: 'Mini', image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", tags: [TAGS.MINIMALIST, TAGS.FORMAL, TAGS.BOLD], description: "The timeless classic every wardrobe needs." },
  { id: '10', name: "Cottagecore Midi", price: 90, category: 'Midi', image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", tags: [TAGS.SUMMER, TAGS.VINTAGE, TAGS.CASUAL], description: "Dreamy silhouette with puff sleeves." }
];

// --- HELPER COMPONENTS ---
const Badge = ({ text, color = "bg-gray-100 text-gray-800" }) => (
  <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${color} mr-1 mb-1 uppercase tracking-wider`}>
    {text}
  </span>
);
const formatPrice = (price) => `$${Number(price).toFixed(2)}`;

// --- AUTH SCREEN ---
const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (authMethod === 'email') {
        if (isLogin) await signInWithEmailAndPassword(auth, email, password);
        else await createUserWithEmailAndPassword(auth, email, password);
      } else {
        setError("Phone authentication requires additional verification setup.");
        setLoading(false);
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError("Google Sign-In not available in this preview.");
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try { await signInAnonymously(auth); } 
    catch (err) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">StyleSwipe.</h1>
          <p className="text-gray-500 text-lg">Fashion that finds you.</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl mb-8 shadow-inner">
          <button onClick={() => setAuthMethod('email')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${authMethod === 'email' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>Email</button>
          <button onClick={() => setAuthMethod('phone')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${authMethod === 'phone' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>Phone</button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {authMethod === 'email' ? (
            <>
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" required />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" required />
            </>
          ) : (
            <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" required />
          )}
          {error && <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 disabled:opacity-50 disabled:hover:scale-100">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 space-y-4">
           <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div><div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-400">Or continue with</span></div></div>
          <button onClick={handleGoogleSignIn} className="w-full border border-gray-200 font-bold py-4 rounded-2xl hover:bg-gray-50 text-gray-700 flex items-center justify-center transition-colors"><Globe size={20} className="mr-2 text-blue-600" /> Google</button>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full text-sm text-gray-600 font-bold hover:text-purple-600 text-center block mt-4 transition-colors">{isLogin ? "New here? Create Account" : "Welcome back! Sign In"}</button>
          <button onClick={handleGuest} className="w-full text-xs text-gray-400 hover:text-gray-600 text-center block font-medium">Try as Guest</button>
        </div>
      </div>
    </div>
  );
};

// --- CHATBOT TAB (USP: Context-Aware) ---
const ChatbotTab = ({ userProfile }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    // Wrap in try/catch or add error callback to prevent permission errors
    try {
      const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'chat_history'), orderBy('timestamp', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const history = snapshot.docs.map(doc => doc.data());
        if (history.length > 0) setMessages(history);
        else setMessages([{ role: 'system', text: "Hi! I'm your personal Style Assistant. I've been learning from your swipes! Ask me for outfit ideas.", timestamp: Date.now() }]);
      }, (error) => {
        console.warn("Chat history access denied:", error);
        setMessages([{ role: 'system', text: "I'm having trouble accessing your chat history, but I can still help you today!", timestamp: Date.now() }]);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Chat init error:", e);
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    setThinking(true);

    // Local update immediately
    setMessages(prev => [...prev, { role: 'user', text: userText }]);

    try {
      // Try to save to DB
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'chat_history'), {
        role: 'user', text: userText, timestamp: serverTimestamp()
      });
    } catch (e) { console.warn("Could not save chat to DB", e); }

    // USP Logic: Inject User Profile into System Prompt
    const topTags = Object.entries(userProfile).sort(([,a], [,b]) => b - a).slice(0, 3).map(([k]) => k).join(', ');
    const contextSystemPrompt = `
      You are a high-end fashion stylist AI for StyleSwipe. 
      This user loves: ${topTags || "exploring new styles"}.
      Tailor your advice to these preferences. 
      If they like 'Summer', suggest breezy fabrics. 
      Be concise, witty, and helpful. (Max 50 words).
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: contextSystemPrompt }] },
            ...messages.slice(-5).map(m => ({ role: m.role === 'system' ? 'model' : 'user', parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: userText }] }
          ]
        })
      });
      
      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm consulting the fashion gods... ask again?";
      
      setMessages(prev => [...prev, { role: 'system', text: reply }]);
      
      try {
         await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'chat_history'), {
           role: 'system', text: reply, timestamp: serverTimestamp()
         });
      } catch (e) { /* ignore save error */ }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'system', text: "My connection is a bit spotty. Try again?" }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-6 py-4 shadow-sm z-10 flex items-center border-b border-gray-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mr-3">
          <Sparkles size={20} fill="white" />
        </div>
        <div>
           <h2 className="font-bold text-lg leading-tight">Ask AI</h2>
           <p className="text-xs text-purple-600 font-medium">Powered by your unique taste</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-black text-white rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {thinking && <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100"><Loader2 size={16} className="animate-spin text-purple-600" /></div></div>}
      </div>
      <div className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask for outfit ideas..." className="flex-1 bg-gray-100 rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
        <button onClick={handleSend} className="bg-black text-white p-3 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"><Send size={20} /></button>
      </div>
    </div>
  );
};

// --- HOME TAB ---
const HomeTab = ({ products, addToCart, categories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="h-full overflow-y-auto bg-gray-50 pb-24">
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-6 pt-6 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-gray-100 flex items-center px-4 py-3 rounded-2xl transition-all focus-within:ring-2 focus-within:ring-black/5 focus-within:bg-white">
            <Search size={20} className="text-gray-400 mr-3" />
            <input className="bg-transparent w-full text-sm focus:outline-none font-medium" placeholder="Search brands, items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button className="p-3 bg-black text-white rounded-2xl shadow-lg hover:scale-105 transition-transform"><Menu size={20} /></button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Promo Banner */}
        <div className="w-full h-48 bg-black rounded-3xl flex items-center p-8 text-white shadow-xl shadow-black/20 mb-8 relative overflow-hidden group cursor-pointer">
           <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full -mr-20 -mt-20 blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
           <div className="relative z-10">
             <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold mb-3 inline-block uppercase tracking-wider">Limited Time</span>
             <h2 className="text-3xl font-black mb-2 leading-tight">Winter <br/>Collection</h2>
             <p className="text-sm opacity-80 mb-4">Premium comfort.</p>
           </div>
           <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" className="absolute right-0 bottom-0 w-40 h-full object-cover mask-linear" />
        </div>

        <div className="flex justify-between items-end mb-4">
          <h3 className="font-black text-xl">New Arrivals</h3>
          <span className="text-xs font-bold text-purple-600">View All</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map(item => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="h-48 relative overflow-hidden">
                <img src={item.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.name} />
                <button onClick={() => addToCart(item)} className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center text-black hover:bg-black hover:text-white transition-all transform translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100"><Plus size={20} /></button>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-sm truncate mb-1">{item.name}</h4>
                <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                <div className="flex justify-between items-center">
                   <p className="font-black text-sm">{formatPrice(item.price)}</p>
                   <div className="flex gap-1">
                     {/* Mini tags for visual density */}
                     {item.tags.slice(0,1).map(t => <div key={t} className="w-2 h-2 rounded-full bg-purple-400"></div>)}
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- CART TAB ---
const CartTab = ({ cart, updateQuantity, removeFromCart }) => {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="px-6 py-6 bg-white shadow-sm border-b border-gray-100">
        <h2 className="text-2xl font-black">My Bag</h2>
        <p className="text-sm text-gray-500 font-medium">{cart.length} items</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
            <ShoppingBag size={64} strokeWidth={1} className="mb-4" />
            <p className="font-medium">Your bag is empty.</p>
          </div>
        ) : cart.map(item => (
          <div key={item.id} className="flex bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
            <img src={item.image} className="w-24 h-24 rounded-xl object-cover bg-gray-100" alt={item.name} />
            <div className="ml-4 flex-1 flex flex-col justify-between py-1">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
                <p className="text-xs text-gray-500 font-medium">{item.category}</p>
              </div>
              <div className="flex justify-between items-end">
                <p className="font-black">{formatPrice(item.price)}</p>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1 gap-3">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-black"><Minus size={12} /></button>
                  <span className="text-xs font-bold w-3 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-black"><Plus size={12} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 bg-white border-t border-gray-100">
        <div className="flex justify-between mb-4 text-sm">
          <span className="text-gray-500 font-medium">Subtotal</span>
          <span className="font-black text-lg">{formatPrice(total)}</span>
        </div>
        <button className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
          Checkout
        </button>
      </div>
    </div>
  );
};

// --- FOR YOU TAB (USP: Recommendation Engine) ---
const ForYouTab = ({ products, interactions, onSwipe, userProfile }) => {
  const [queue, setQueue] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // USP Logic: Sorting Algorithm
  useEffect(() => {
    if (products.length === 0) return;
    const seenIds = new Set(interactions.map(i => i.productId));
    
    // Score each product based on user profile
    const scoredProducts = products
      .filter(p => !seenIds.has(p.id))
      .map(p => {
        let score = 0;
        p.tags.forEach(tag => {
          if (userProfile[tag]) score += userProfile[tag];
        });
        return { ...p, score };
      })
      // Sort: High score first, random noise for discovery
      .sort((a, b) => (b.score + Math.random() * 2) - (a.score + Math.random() * 2));

    setQueue(scoredProducts);
  }, [products, interactions.length]); // Re-run when interaction count changes (live learning)

  const handleSwipe = (dir) => {
    if (!queue[activeIndex] || isAnimating) return;
    setIsAnimating(true);
    setDragOffset(dir === 'right' ? 1000 : -1000);
    onSwipe(queue[activeIndex].id, dir);
    setTimeout(() => { setActiveIndex(prev => prev + 1); setDragOffset(0); setIsAnimating(false); }, 300);
  };

  const currentItem = queue[activeIndex];

  if (!currentItem) return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50">
      <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 animate-bounce-slow">
        <Zap size={32} className="text-yellow-400 fill-yellow-400" />
      </div>
      <h3 className="font-black text-2xl mb-2">All Caught Up!</h3>
      <p className="text-gray-500 max-w-xs mx-auto">Our AI is scouring the fashion world for more matches. Check back soon.</p>
    </div>
  );

  // Dynamic "Match %" visual based on score
  const matchPercent = Math.min(99, Math.round(70 + (currentItem.score * 5) + (Math.random() * 10)));

  return (
    <div className="h-full overflow-hidden relative p-4 bg-gray-100">
      <div className="absolute top-6 left-0 right-0 z-10 text-center">
        <div className="inline-flex items-center bg-black/80 backdrop-blur-md text-white px-4 py-1.5 rounded-full shadow-lg">
           <Zap size={12} className="text-yellow-400 fill-yellow-400 mr-2" />
           <span className="text-xs font-bold tracking-wider uppercase">For You</span>
        </div>
      </div>
      
      <div 
        className="relative w-full h-full bg-white rounded-[32px] shadow-2xl overflow-hidden"
        style={{ 
          transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`, 
          transition: isAnimating ? 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none' 
        }}
        onPointerDown={e => !isAnimating && setDragStart(e.clientX)}
        onPointerMove={e => dragStart && !isAnimating && setDragOffset(e.clientX - dragStart)}
        onPointerUp={() => { 
          if(isAnimating) return; 
          if(Math.abs(dragOffset) > 100) handleSwipe(dragOffset > 0 ? 'right' : 'left'); 
          else setDragOffset(0); 
          setDragStart(null); 
        }}
      >
        {/* Overlays */}
        <div className="absolute top-12 left-8 border-4 border-green-400 text-green-400 px-4 py-2 rounded-xl -rotate-12 font-black text-5xl z-20 tracking-widest opacity-0 transition-opacity" style={{ opacity: dragOffset > 50 ? 1 : 0 }}>LIKE</div>
        <div className="absolute top-12 right-8 border-4 border-red-500 text-red-500 px-4 py-2 rounded-xl rotate-12 font-black text-5xl z-20 tracking-widest opacity-0 transition-opacity" style={{ opacity: dragOffset < -50 ? 1 : 0 }}>NOPE</div>

        <img src={currentItem.image} className="w-full h-[75%] object-cover pointer-events-none" />
        
        {/* Match Score Badge */}
        <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center shadow-sm">
          <span className="text-xs font-bold text-green-600">{matchPercent}% Match</span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-white via-white to-transparent pt-20 px-6 pb-6 flex flex-col justify-end">
           <div className="mb-20">
             <div className="flex justify-between items-start mb-2">
                <h2 className="text-3xl font-black leading-none">{currentItem.name}</h2>
                <span className="text-xl font-bold text-gray-900">{formatPrice(currentItem.price)}</span>
             </div>
             <p className="text-gray-500 text-sm font-medium mb-3">{currentItem.category}</p>
             <div className="flex flex-wrap">
               {currentItem.tags.map(t => <Badge key={t} text={t} />)}
             </div>
           </div>
        </div>
        
        {/* Action Buttons */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 z-30">
          <button onClick={() => handleSwipe('left')} className="w-16 h-16 bg-white shadow-xl shadow-red-100 rounded-full flex items-center justify-center text-red-500 hover:scale-110 active:scale-95 transition-all border border-red-50">
            <X size={32} strokeWidth={3} />
          </button>
          <button onClick={() => handleSwipe('right')} className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 shadow-xl shadow-purple-200 rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all">
            <Heart size={32} strokeWidth={3} fill="currentColor" className="opacity-90" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function StyleSwipe() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [interactions, setInteractions] = useState([]);

  // 1. Auth & Profile Sync
  useEffect(() => {
    const init = async () => { 
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
          await signInWithCustomToken(auth, __initial_auth_token); 
        } catch (e) {
          console.warn("Custom token auth failed, falling back");
        }
      }
    };
    init();
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'main');
          await setDoc(userRef, {
            uid: u.uid,
            email: u.email || 'anonymous',
            lastLogin: serverTimestamp(),
            authProvider: u.providerData[0]?.providerId || 'anonymous'
          }, { merge: true });
        } catch (e) { console.warn("Profile sync failed:", e); }
      }
      setLoading(false);
    });
  }, []);

  // 2. Data Fetching
  useEffect(() => {
    if (!user) return;
    
    // Safe Product Fetching (Fallback to Seed)
    const prodRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const unsubProd = onSnapshot(prodRef, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (items.length === 0) {
         setProducts(SEED_PRODUCTS); // Use local seeds silently
      } else {
         setProducts(items);
      }
    }, (error) => {
      console.warn("Fetch products failed (using seeds):", error);
      setProducts(SEED_PRODUCTS);
    });

    // Safe User Data Fetching
    const cartRef = collection(db, 'artifacts', appId, 'users', user.uid, 'cart');
    const unsubCart = onSnapshot(cartRef, 
      (snap) => setCart(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.warn("Cart fetch failed", err)
    );

    const intRef = collection(db, 'artifacts', appId, 'users', user.uid, 'interactions');
    const unsubInt = onSnapshot(intRef, 
      (snap) => setInteractions(snap.docs.map(d => d.data())),
      (err) => console.warn("Interactions fetch failed", err)
    );

    return () => { unsubProd(); unsubCart(); unsubInt(); };
  }, [user]);

  // 3. Compute Profile for AI Context (USP Core)
  const userPreferenceProfile = useMemo(() => {
    const profile = {};
    interactions.forEach(i => {
      const p = products.find(prod => prod.id === i.productId);
      if (p && p.tags) {
        p.tags.forEach(tag => {
          if (i.type === 'like') profile[tag] = (profile[tag] || 0) + 1;
        });
      }
    });
    return profile;
  }, [interactions, products]);

  // Actions
  const handleAddToCart = async (p) => {
    try {
      const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'cart', p.id);
      const existing = cart.find(c => c.id === p.id);
      if (existing) await updateDoc(ref, { quantity: increment(1) });
      else await setDoc(ref, { ...p, quantity: 1 });
    } catch (e) { console.warn("Add to cart failed", e); }
  };
  const handleUpdateCart = async (id, d) => {
    try {
      const item = cart.find(c => c.id === id);
      if (item.quantity + d <= 0) await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'cart', id));
      else await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'cart', id), { quantity: increment(d) });
    } catch (e) { console.warn("Update cart failed", e); }
  };
  const handleSwipeAction = async (productId, dir) => {
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'interactions'), { productId, type: dir === 'right' ? 'like' : 'dislike', timestamp: serverTimestamp() });
    } catch (e) { console.warn("Swipe action save failed", e); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-purple-600" size={48} /></div>;
  if (!user) return <AuthScreen />;

  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto border-x border-gray-100 shadow-2xl overflow-hidden font-sans">
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && <HomeTab products={products} categories={CATEGORIES} addToCart={handleAddToCart} />}
        {activeTab === 'foryou' && <ForYouTab products={products} interactions={interactions} onSwipe={handleSwipeAction} userProfile={userPreferenceProfile} />}
        {activeTab === 'chatbot' && <ChatbotTab userProfile={userPreferenceProfile} />}
        {activeTab === 'cart' && <CartTab cart={cart} updateQuantity={handleUpdateCart} removeFromCart={(id) => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'cart', id))} />}
        {activeTab === 'profile' && (
          <div className="p-6 overflow-y-auto h-full bg-gray-50">
            <div className="bg-white p-6 rounded-3xl shadow-sm mb-6">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-purple-600 text-3xl font-black border-4 border-white shadow-sm">
                    {user.email ? user.email[0].toUpperCase() : 'G'}
                 </div>
                 <div className="flex-1 min-w-0">
                   <h2 className="text-xl font-bold truncate text-gray-900">{user.email || 'Guest User'}</h2>
                   <div className="flex items-center mt-1">
                     <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                     <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Member</span>
                   </div>
                 </div>
              </div>
              <button onClick={() => signOut(auth)} className="w-full py-3 rounded-xl border border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                <LogOut size={16} /> Sign Out
              </button>
            </div>

            <div className="space-y-3">
              {['My Orders', 'Saved Addresses', 'Payment Methods', 'Settings'].map(item => (
                <div key={item} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm hover:bg-gray-50 cursor-pointer transition-colors">
                  <span className="font-bold text-gray-700">{item}</span>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-center">
               <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">StyleSwipe Version 1.0</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white border-t border-gray-50 px-6 py-4 flex justify-between items-center z-50">
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'foryou', icon: Zap, label: 'For You', color: 'text-pink-600', activeBg: 'bg-pink-50' },
          { id: 'chatbot', icon: MessageCircle, label: 'Ask AI', color: 'text-purple-600', activeBg: 'bg-purple-50' },
          { id: 'cart', icon: ShoppingBag, label: 'Bag', badge: cart.length },
          { id: 'profile', icon: User, label: 'Profile' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`relative flex flex-col items-center space-y-1 transition-all duration-300 ${activeTab === tab.id ? (tab.color || 'text-black') : 'text-gray-300 hover:text-gray-400'}`}
          >
            <div className={`p-2 rounded-2xl transition-all ${activeTab === tab.id && tab.activeBg ? tab.activeBg : ''} ${activeTab === tab.id && !tab.activeBg ? 'bg-gray-50' : ''}`}>
              <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? 'fill-current opacity-20' : ''} />
              {/* Overlay the stroke icon again for clarity */}
              <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={`absolute top-2 left-2 ${activeTab === tab.id ? 'fill-none' : ''}`} />
            </div>
            {tab.badge > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[8px] font-bold text-white flex items-center justify-center">{tab.badge}</span>}
            <span className="text-[10px] font-bold">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
