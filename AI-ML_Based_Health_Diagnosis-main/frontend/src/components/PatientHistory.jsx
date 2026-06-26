import { useState, useEffect } from 'react';

export default function PatientHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://rico24251-ai-ml-based-health-diagnosis.hf.space";
        
        const response = await fetch(`${backendUrl}/history`);
        const data = await response.json();

        if (data.status === "success") {
          setHistory(data.history);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600 font-medium">Loading medical records...</span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 font-medium text-lg">No past diagnoses found.</p>
        <p className="text-gray-400 text-sm mt-2">Run a scan to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-6">Patient History</h2>
      
      {history.map((record) => (
        <div key={record.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          
          
          <div className="bg-blue-50 border-b border-blue-100 p-5 flex justify-between items-center">
            <h3 className="text-xl font-bold text-blue-800">{record.scan_type}</h3>
            <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">{record.date}</span>
          </div>
          
         
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Diagnosis</p>
                <p className="font-semibold text-gray-800">{record.summary}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">AI Confidence</p>
                <p className="font-bold text-green-600 text-lg">{record.confidence}%</p>
              </div>
            </div>

           
            {record.chats && record.chats.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                  Consultation Notes
                </h4>
                
                <div className="space-y-4">
                  {record.chats.map((chat, idx) => (
                    <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${chat.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 border border-gray-200 rounded-tl-sm'}`}>
                        <span className="font-bold text-xs uppercase opacity-70 block mb-1">
                          {chat.role === 'user' ? 'Patient' : 'AI Doctor'}
                        </span>
                        {chat.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
