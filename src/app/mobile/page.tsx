'use client';

import { useState, useRef } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  competency?: string;
}

interface BulletData {
  id: string;
  competency: string;
  content: string;
  isApplied: boolean;
  category: string;
}

export default function MobilePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState('Planning & Preparedness');
  const [rankCategory, setRankCategory] = useState('Officer');
  const [rank, setRank] = useState('O3');
  const [bullets, setBullets] = useState<BulletData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const router = useRouter();

  // Define competencies based on rank category
  const officerCompetencies = [
    'Planning & Preparedness',
    'Using Resources',
    'Results/Effectiveness',
    'Adaptability',
    'Professional Competence',
    'Speaking and Listening',
    'Writing',
    'Looking Out For Others',
    'Developing Others',
    'Directing Others',
    'Teamwork',
    'Workplace Climate',
    'Evaluations',
    'Initiative',
    'Judgment',
    'Responsibility',
    'Professional Presence',
    'Health and Well Being'
  ];

  const enlistedE4E6Competencies = [
    'Military Bearing',
    'Customs, Courtesies, and Traditions',
    'Quality of Work',
    'Technical Proficiency',
    'Initiative',
    'Decision Making and Problem Solving',
    'Military Readiness',
    'Self-Awareness and Learning',
    'Team Building',
    'Respect for Others',
    'Accountability and Responsibility',
    'Influencing Others',
    'Effective Communication'
  ];

  const enlistedE7E8Competencies = [
    'Military Bearing',
    'Customs, Courtesies, and Traditions',
    'Quality of Work',
    'Technical Proficiency',
    'Initiative',
    'Strategic Thinking',
    'Decision Making and Problem Solving',
    'Military Readiness',
    'Self-Awareness and Learning',
    'Partnering',
    'Respect for Others',
    'Accountability and Responsibility',
    'Workforce Management',
    'Effective Communication',
    'Chiefs Mess Leadership and Participation'
  ];

  // Get the appropriate competencies based on rank category and rank
  const getCompetencies = () => {
    if (rankCategory === 'Officer') {
      return officerCompetencies;
    } else if (rankCategory === 'Enlisted') {
      if (rank === 'E7' || rank === 'E8') {
        return enlistedE7E8Competencies;
      } else {
        return enlistedE4E6Competencies;
      }
    }
    return officerCompetencies; // Default fallback
  };

  const getCategoryFromCompetency = (competency: string): string => {
    if (rankCategory === 'Officer') {
      const performanceDuties = [
        'Planning & Preparedness', 'Using Resources', 'Results/Effectiveness', 
        'Adaptability', 'Professional Competence', 'Speaking and Listening', 'Writing'
      ];
      
      const leadershipSkills = [
        'Looking Out For Others', 'Developing Others', 'Directing Others', 
        'Teamwork', 'Workplace Climate', 'Evaluations'
      ];
      
      const personalQualities = [
        'Initiative', 'Judgment', 'Responsibility', 
        'Professional Presence', 'Health and Well Being'
      ];
      
      if (performanceDuties.includes(competency)) return 'Performance of Duties';
      if (leadershipSkills.includes(competency)) return 'Leadership Skills';
      if (personalQualities.includes(competency)) return 'Personal and Professional Qualities';
    } else if (rankCategory === 'Enlisted') {
      const military = [
        'Military Bearing', 'Customs, Courtesies, and Traditions'
      ];
      
      const performance = [
        'Quality of Work', 'Technical Proficiency', 'Initiative', 'Strategic Thinking'
      ];
      
      const professionalQualities = [
        'Decision Making and Problem Solving', 'Military Readiness', 
        'Self-Awareness and Learning', 'Team Building', 'Partnering'
      ];
      
      const leadership = [
        'Respect for Others', 'Accountability and Responsibility', 
        'Influencing Others', 'Effective Communication', 
        'Workforce Management', 'Chiefs Mess Leadership and Participation'
      ];
      
      if (military.includes(competency)) return 'Military';
      if (performance.includes(competency)) return 'Performance';
      if (professionalQualities.includes(competency)) return 'Professional Qualities';
      if (leadership.includes(competency)) return 'Leadership';
    }
    
    return 'Other';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedCompetency) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      competency: selectedCompetency
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call API to generate bullet
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          achievement: input,
          competency: selectedCompetency,
          rankCategory: rankCategory,
          rank: rank
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add assistant message with generated bullet
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.bullet,
          competency: selectedCompetency
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Add the generated bullet to bullets state
        const newBullet: BulletData = {
          id: Date.now().toString(),
          competency: selectedCompetency,
          content: data.bullet,
          isApplied: false,
          category: getCategoryFromCompetency(selectedCompetency)
        };
        setBullets(prev => [...prev, newBullet]);
      } else {
        // Handle error
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, I was unable to generate a bullet. Please try again.'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'An error occurred. Please try again later.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInput('');
      setTimeout(scrollToBottom, 100);
    }
  };

  const competencies = getCompetencies();

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">USCG Evaluation Generator</h1>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Select Rank</h2>
        <div className="mb-3">
          <label className="block text-sm mb-1">Rank Category:</label>
          <select 
            value={rankCategory}
            onChange={(e) => setRankCategory(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="Officer">Officer</option>
            <option value="Enlisted">Enlisted</option>
          </select>
        </div>
        
        <div className="mb-3">
          <label className="block text-sm mb-1">Specific Rank:</label>
          <select 
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {rankCategory === 'Officer' ? (
              <>
                <option value="O1">O1 - ENS</option>
                <option value="O2">O2 - LTJG</option>
                <option value="O3">O3 - LT</option>
                <option value="O4">O4 - LCDR</option>
                <option value="O5">O5 - CDR</option>
                <option value="O6">O6 - CAPT</option>
                <option value="W2">W2 - CWO2</option>
                <option value="W3">W3 - CWO3</option>
                <option value="W4">W4 - CWO4</option>
              </>
            ) : (
              <>
                <option value="E4">E4 - PO3</option>
                <option value="E5">E5 - PO2</option>
                <option value="E6">E6 - PO1</option>
                <option value="E7">E7 - CPO</option>
                <option value="E8">E8 - SCPO</option>
              </>
            )}
          </select>
        </div>
      </div>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Generate Bullets</h2>
        <div className="mb-3">
          <label className="block text-sm mb-1">Competency Area:</label>
          <select
            value={selectedCompetency}
            onChange={(e) => setSelectedCompetency(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {competencies.map((comp) => (
              <option key={comp} value={comp}>
                {comp}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-3">
          <label className="block text-sm mb-1">Your Achievement:</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your achievement..."
            className="w-full p-2 border rounded resize-none"
            rows={4}
          />
        </div>
        
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded disabled:bg-blue-300"
        >
          {isLoading ? 'Generating...' : 'Generate Bullet'}
        </button>
      </div>
  {/* Display Chat History */}
{messages.length > 0 && (
  <div className="mb-4 bg-gray-100 p-3 rounded-lg shadow-inner max-h-[200px] overflow-y-auto">
    <h3 className="text-md font-semibold mb-2">Conversation History</h3>
    <div className="space-y-2">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`p-2 rounded-lg text-sm ${
            msg.role === 'user' ? 'bg-blue-100 ml-auto max-w-[80%]' : 'bg-white border max-w-[80%]'
          }`}
        >
          {msg.role === 'assistant' && msg.competency && (
            <div className="text-xs text-gray-500 mb-1">{msg.competency}</div>
          )}
          <div>{msg.content}</div>
        </div>
      ))}
      <div ref={messagesEndRef} /> {/* Make sure messagesEndRef is still defined */}
    </div>
  </div>
)}

{/* Keep the Collected Bullets section as implemented previously */}
{bullets.length > 0 && (
  <div className="mb-6 bg-white p-4 rounded-lg shadow">
    {/* ... display bullets state here ... */}
  </div>
)}    
  
  {/* Display the collected bullets list if it's not empty */}
  {bullets.length > 0 && (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-3">Collected Bullets</h2>
      <div className="space-y-3">
        {/* Map over the 'bullets' state array */}
        {bullets.map((bullet) => (
          <div key={bullet.id} className="p-3 border rounded">
            {/* Display bullet details from the 'bullet' object */}
            <div className="text-xs text-gray-500 mb-1">
              {bullet.competency} ({bullet.category})
            </div>
            <div className="mb-2">{bullet.content}</div>
            {/* Optional: Add buttons here later for editing/deleting/applying */}
          </div>
        ))}
      </div>
    </div>
  )}
      
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>This is a simplified mobile version of the USCG Evaluation Report Generator.</p>
        <p className="mt-1">For full functionality, please use the desktop version.</p>
      </div>
      
      <div ref={messagesEndRef} />
    </div>
  );
}
