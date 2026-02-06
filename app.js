// Google Gemini API Key
const GEMINI_API_KEY = 'AIzaSyAdwYW32hienS0DTpqoJym7Rb4VImX9YKk';

const { useState, useRef, useEffect } = React;

// Icon components (simplified versions)
const Icon = ({ name, size = 20, ...props }) => {
  const icons = {
    send: '→',
    settings: '⚙',
    message: '💬',
    x: '✕',
    bold: 'B',
    italic: 'I',
    underline: 'U',
    alignLeft: '≡',
    alignCenter: '≣',
    alignRight: '≡',
    list: '•',
    listOrdered: '1.',
    save: '💾',
    folder: '📁',
    logout: '🚪',
    user: '👤',
    plus: '+',
  };
  return <span style={{ fontSize: size, fontWeight: 'bold' }} {...props}>{icons[name]}</span>;
};

const WritingAssistant = () => {
  const [essay, setEssay] = useState('');
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // User and document management
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [showDocuments, setShowDocuments] = useState(false);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('Untitled Document');
  
  // Settings
  const [style, setStyle] = useState('formal');
  const [gradeLevel, setGradeLevel] = useState('high-school');
  
  // Formatting states
  const [fontSize, setFontSize] = useState('16');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  
  const editorRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-save document
  useEffect(() => {
    if (user && currentDocId && essay) {
      const timer = setTimeout(() => {
        saveDocument();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [essay, user, currentDocId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAuth = () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    const userKey = `user_${email}`;
    
    if (isSignUp) {
      const existing = localStorage.getItem(userKey);
      if (existing) {
        alert('User already exists! Please log in.');
        return;
      }
      const newUser = { email, createdAt: new Date().toISOString() };
      localStorage.setItem(userKey, JSON.stringify(newUser));
      setUser(newUser);
      setShowLogin(false);
      loadUserDocuments(email);
    } else {
      const userData = localStorage.getItem(userKey);
      if (!userData) {
        alert('User not found. Please sign up first.');
        return;
      }
      const user = JSON.parse(userData);
      setUser(user);
      setShowLogin(false);
      loadUserDocuments(email);
    }
  };

  const loadUserDocuments = (userEmail) => {
    const docsKey = `docs_${userEmail}`;
    const docsData = localStorage.getItem(docsKey);
    if (docsData) {
      setDocuments(JSON.parse(docsData));
    }
  };

  const createNewDocument = () => {
    const newDoc = {
      id: Date.now().toString(),
      title: 'Untitled Document',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      style,
      gradeLevel
    };
    
    setCurrentDocId(newDoc.id);
    setDocumentTitle(newDoc.title);
    setEssay('');
    setComments([]);
    setChatMessages([]);
    setShowDocuments(false);
  };

  const saveDocument = () => {
    if (!user || !currentDocId) return;

    const docsKey = `docs_${user.email}`;
    let allDocs = [...documents];
    
    const docIndex = allDocs.findIndex(d => d.id === currentDocId);
    const docData = {
      id: currentDocId,
      title: documentTitle,
      content: essay,
      updatedAt: new Date().toISOString(),
      style,
      gradeLevel
    };

    if (docIndex >= 0) {
      allDocs[docIndex] = { ...allDocs[docIndex], ...docData };
    } else {
      docData.createdAt = new Date().toISOString();
      allDocs.push(docData);
    }

    localStorage.setItem(docsKey, JSON.stringify(allDocs));
    setDocuments(allDocs);
    localStorage.setItem(`doc_${currentDocId}`, JSON.stringify(docData));
  };

  const openDocument = (docId) => {
    const docData = localStorage.getItem(`doc_${docId}`);
    if (docData) {
      const doc = JSON.parse(docData);
      setCurrentDocId(doc.id);
      setDocumentTitle(doc.title);
      setEssay(doc.content);
      setStyle(doc.style || 'formal');
      setGradeLevel(doc.gradeLevel || 'high-school');
      setComments([]);
      setChatMessages([]);
      setShowDocuments(false);
    }
  };

  const deleteDocument = (docId) => {
    if (!confirm('Delete this document?')) return;

    const docsKey = `docs_${user.email}`;
    const updatedDocs = documents.filter(d => d.id !== docId);
    localStorage.setItem(docsKey, JSON.stringify(updatedDocs));
    localStorage.removeItem(`doc_${docId}`);
    setDocuments(updatedDocs);
    
    if (currentDocId === docId) {
      setCurrentDocId(null);
      setEssay('');
      setDocumentTitle('Untitled Document');
    }
  };

  const logout = () => {
    setUser(null);
    setShowLogin(true);
    setEssay('');
    setDocuments([]);
    setCurrentDocId(null);
    setComments([]);
    setChatMessages([]);
  };

  const applyFormat = (command) => {
    // Note: Formatting doesn't work with textarea, but we'll keep buttons for future enhancement
    alert('Text formatting is not available in this version. Focus on writing great content!');
  };

  // Simple text handling - no complex formatting
  const handleEditorChange = (e) => {
    setEssay(e.target.value);
  };

  const analyzeWriting = async () => {
    if (!essay.trim()) {
      alert('Please write something first!');
      return;
    }

    setIsLoading(true);
    
    // Test API connection first
    console.log('Testing API with key:', GEMINI_API_KEY.substring(0, 10) + '...');
    
    // First, let's list available models
    try {
      console.log('Checking available models...');
      const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`);
      const modelsData = await modelsResponse.json();
      console.log('Available models:', modelsData);
    } catch (err) {
      console.log('Could not list models:', err);
    }
    
    const styleName = style === 'formal' ? 'Formal/Academic' : style === 'creative' ? 'Creative' : 'Casual';
    const gradeName = gradeLevel === 'elementary' ? 'Elementary School (Grades 3-5)' : 
                      gradeLevel === 'middle-school' ? 'Middle School (Grades 6-8)' :
                      gradeLevel === 'high-school' ? 'High School (Grades 9-12)' : 'College';

    // Get plain text for analysis
    const plainText = essay;

    const prompt = `You are a writing tutor helping a student improve their essay. You MUST NOT write the essay for them or provide complete rewrites. Instead, provide 3-5 specific, constructive suggestions as brief comments.

Writing Style: ${styleName}
Grade Level: ${gradeName}

Focus on:
- Sentence structure and clarity issues
- Paragraph organization suggestions
- Word choice improvements (suggest they consider alternatives, don't provide full rewrites)
- Grammar and punctuation errors
- Thesis strength and argument coherence

Format each suggestion as a SHORT comment (1-2 sentences max) in this exact JSON format:
[
  {"location": "beginning/middle/end", "comment": "Your specific suggestion here"},
  {"location": "beginning/middle/end", "comment": "Another suggestion"}
]

Essay text:
${plainText}

Return ONLY the JSON array, no other text.`;

    try {
      console.log('Making API request...');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        console.error('API Error Details:', data);
        alert(`API Error: ${data.error?.message || JSON.stringify(data)}. 

SOLUTION: Go to https://aistudio.google.com/apikey and make sure:
1. Your API key is created in AI Studio (not just Cloud Console)
2. The Generative Language API is enabled
3. Try creating a NEW API key if this one doesn't work`);
        setIsLoading(false);
        return;
      }
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const text = data.candidates[0].content.parts[0].text.trim();
        console.log('AI Response:', text);
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          setComments(suggestions);
          console.log('Parsed suggestions:', suggestions);
        } else {
          alert('Could not parse AI response. Please try again.');
        }
      } else {
        console.error('Unexpected response format:', data);
        alert('Unexpected response from AI. Check console for details.');
      }
    } catch (error) {
      console.error('Full error object:', error);
      alert(`Error: ${error.message}. Check browser console (F12) for full details.`);
    }

    setIsLoading(false);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    const plainText = essay;

    const prompt = `You are a helpful writing tutor. The student is working on this essay:

"${plainText}"

They have a question: ${chatInput}

Provide helpful guidance but DO NOT write the essay for them. If they ask for synonyms, give options. If they ask about paragraph breaks, suggest where breaks might help. If they ask you to rewrite something, instead explain how THEY could improve it. Keep responses concise and educational.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const aiMessage = { role: 'assistant', content: data.candidates[0].content.parts[0].text };
        setChatMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { role: 'assistant', content: 'Sorry, there was an error. Please check your API key and try again.' };
      setChatMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  // Login Screen
  if (showLogin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', width: '400px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px', color: '#667eea' }}>
            AI Writing Assistant
          </h1>
          <p style={{ textAlign: 'center', color: '#718096', fontSize: '14px', marginBottom: '30px' }}>
            Powered by Google Gemini 🚀
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
            />
            <button
              onClick={handleAuth}
              style={{ width: '100%', background: '#667eea', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isSignUp ? 'Sign Up' : 'Log In'}
            </button>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ width: '100%', color: '#667eea', background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer' }}
            >
              {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f7fafc' }}>
      {/* Documents Sidebar */}
      {showDocuments && (
        <div style={{ width: '320px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>My Documents</h2>
            <button onClick={() => setShowDocuments(false)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>
              <Icon name="x" />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <button
              onClick={createNewDocument}
              style={{ width: '100%', marginBottom: '20px', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
            >
              <Icon name="plus" />
              New Document
            </button>
            {documents.map(doc => (
              <div key={doc.id} style={{ marginBottom: '10px', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', background: '#f7fafc' }}>
                <div onClick={() => openDocument(doc.id)}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '5px' }}>{doc.title}</h3>
                  <p style={{ fontSize: '12px', color: '#718096' }}>
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDocument(doc.id);
                  }}
                  style={{ marginTop: '10px', color: '#e53e3e', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{ background: '#667eea', color: 'white', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => setShowDocuments(true)} style={{ padding: '8px', background: '#5568d3', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white' }}>
              <Icon name="folder" />
            </button>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              style={{ background: '#5568d3', padding: '8px 12px', borderRadius: '6px', color: 'white', border: 'none', outline: 'none', fontSize: '16px' }}
              placeholder="Document title"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '14px' }}>{user?.email}</span>
            <button onClick={saveDocument} style={{ padding: '8px', background: '#5568d3', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white' }}>
              <Icon name="save" />
            </button>
            <button onClick={logout} style={{ padding: '8px', background: '#5568d3', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white' }}>
              <Icon name="logout" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '10px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select 
            value={fontFamily} 
            onChange={(e) => setFontFamily(e.target.value)}
            style={{ border: '1px solid #cbd5e0', borderRadius: '4px', padding: '6px' }}
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
          
          <select 
            value={fontSize} 
            onChange={(e) => setFontSize(e.target.value)}
            style={{ border: '1px solid #cbd5e0', borderRadius: '4px', padding: '6px', width: '70px' }}
          >
            {[12, 14, 16, 18, 20, 24, 28, 32].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>

          <div style={{ borderLeft: '1px solid #cbd5e0', height: '24px', margin: '0 5px' }}></div>

          <button onClick={() => applyFormat('bold')} style={{ padding: '6px 10px', border: '1px solid #cbd5e0', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>
            <Icon name="bold" size={16} />
          </button>
          <button onClick={() => applyFormat('italic')} style={{ padding: '6px 10px', border: '1px solid #cbd5e0', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>
            <Icon name="italic" size={16} />
          </button>
          <button onClick={() => applyFormat('underline')} style={{ padding: '6px 10px', border: '1px solid #cbd5e0', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>
            <Icon name="underline" size={16} />
          </button>

          <div style={{ borderLeft: '1px solid #cbd5e0', height: '24px', margin: '0 5px' }}></div>

          <button onClick={() => applyFormat('justifyLeft')} style={{ padding: '6px 10px', border: '1px solid #cbd5e0', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>
            <Icon name="alignLeft" size={16} />
          </button>
          <button onClick={() => applyFormat('justifyCenter')} style={{ padding: '6px 10px', border: '1px solid #cbd5e0', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>
            <Icon name="alignCenter" size={16} />
          </button>
          <button onClick={() => applyFormat('justifyRight')} style={{ padding: '6px 10px', border: '1px solid #cbd5e0', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>
            <Icon name="alignRight" size={16} />
          </button>

          <div style={{ borderLeft: '1px solid #cbd5e0', height: '24px', margin: '0 5px' }}></div>

          <button onClick={() => applyFormat('insertUnorderedList')} style={{ padding: '6px 10px', border: '1px solid #cbd5e0', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>
            <Icon name="list" size={16} />
          </button>
          <button onClick={() => applyFormat('insertOrderedList')} style={{ padding: '6px 10px', border: '1px solid #cbd5e0', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>
            <Icon name="listOrdered" size={16} />
          </button>

          <div style={{ borderLeft: '1px solid #cbd5e0', height: '24px', margin: '0 5px' }}></div>

          <input
            type="color"
            value={textColor}
            onChange={(e) => {
              setTextColor(e.target.value);
              applyFormat('foreColor', e.target.value);
            }}
            style={{ width: '32px', height: '32px', cursor: 'pointer', border: '1px solid #cbd5e0', borderRadius: '4px' }}
            title="Text Color"
          />
          <input
            type="color"
            value={highlightColor}
            onChange={(e) => {
              setHighlightColor(e.target.value);
              applyFormat('hiliteColor', e.target.value);
            }}
            style={{ width: '32px', height: '32px', cursor: 'pointer', border: '1px solid #cbd5e0', borderRadius: '4px' }}
            title="Highlight"
          />

          <div style={{ flex: 1 }}></div>

          <button
            onClick={() => setShowSettings(true)}
            style={{ padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '4px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="settings" size={16} />
            Settings
          </button>
        </div>

        {/* Editor Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Writing Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: '#f7fafc' }}>
            <textarea
              ref={editorRef}
              value={essay}
              onChange={handleEditorChange}
              placeholder="Start writing your essay here..."
              style={{
                width: '100%',
                maxWidth: '800px',
                margin: '0 auto',
                display: 'block',
                minHeight: 'calc(100vh - 280px)',
                padding: '40px',
                background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                outline: 'none',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontFamily: fontFamily,
                fontSize: `${fontSize}px`,
                lineHeight: '1.6',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Comments Panel */}
          {showComments && (
            <div style={{ width: '320px', background: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontWeight: 'bold' }}>AI Suggestions</h3>
                <button onClick={() => setShowComments(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>
                  <Icon name="x" />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <button
                  onClick={analyzeWriting}
                  disabled={isLoading}
                  style={{ width: '100%', marginBottom: '20px', padding: '12px', background: isLoading ? '#cbd5e0' : '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Writing'}
                </button>
                {comments.length === 0 && !isLoading && (
                  <p style={{ textAlign: 'center', color: '#718096', fontSize: '14px' }}>
                    Click "Analyze Writing" to get AI suggestions!
                  </p>
                )}
                {comments.map((comment, i) => (
                  <div key={i} style={{ marginBottom: '15px', padding: '15px', background: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: '6px' }}>
                    <p style={{ fontSize: '11px', color: '#92400e', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>{comment.location}</p>
                    <p style={{ fontSize: '14px', color: '#78350f' }}>{comment.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div style={{ background: 'white', borderTop: '1px solid #e2e8f0', padding: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => setShowChat(!showChat)}
            style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            <Icon name="message" size={16} />
            {showChat ? 'Hide' : 'Show'} AI Chat
          </button>
          {!showComments && (
            <button
              onClick={() => setShowComments(true)}
              style={{ padding: '10px 20px', background: '#4a5568', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Show Comments
            </button>
          )}
          <div style={{ flex: 1 }}></div>
          <span style={{ fontSize: '12px', color: '#718096' }}>
            ⚡ Powered by Google Gemini (Free!)
          </span>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div style={{ width: '380px', background: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontWeight: 'bold' }}>Ask AI</h3>
            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>
              <Icon name="x" />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chatMessages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#718096', padding: '20px' }}>
                <p style={{ marginBottom: '10px' }}>💬 Ask me anything about your writing!</p>
                <p style={{ fontSize: '12px' }}>Examples:</p>
                <p style={{ fontSize: '12px' }}>• "What are synonyms for 'important'?"</p>
                <p style={{ fontSize: '12px' }}>• "Where should I add paragraph breaks?"</p>
                <p style={{ fontSize: '12px' }}>• "How can I improve this sentence?"</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: msg.role === 'user' ? '#667eea' : '#e2e8f0',
                  color: msg.role === 'user' ? 'white' : 'black'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: '#e2e8f0', padding: '12px', borderRadius: '12px' }}>Thinking...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask for help..."
                style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '14px' }}
              />
              <button
                onClick={sendChatMessage}
                disabled={isLoading}
                style={{ padding: '10px', background: isLoading ? '#cbd5e0' : '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                <Icon name="send" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '30px', width: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Settings</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>
                <Icon name="x" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Writing Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="formal">Formal/Academic</option>
                  <option value="creative">Creative</option>
                  <option value="casual">Casual</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Grade Level</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="elementary">Elementary (3-5)</option>
                  <option value="middle-school">Middle School (6-8)</option>
                  <option value="high-school">High School (9-12)</option>
                  <option value="college">College</option>
                </select>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                style={{ width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Render the app
ReactDOM.render(<WritingAssistant />, document.getElementById('root'));
