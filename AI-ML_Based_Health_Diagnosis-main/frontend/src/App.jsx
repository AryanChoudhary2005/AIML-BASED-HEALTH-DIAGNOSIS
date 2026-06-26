import { useState } from 'react'
import DiseaseGrid from './components/DiseaseGrid'
import DiagnosticModal from './components/DiagnosticModal'
import PatientHistory from './components/PatientHistory' 
import { LayoutDashboard, History } from 'lucide-react'

function App() {
  const [activeDisease, setActiveDisease] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      
     
      <nav className="w-full bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-black text-xl tracking-tighter">AI</span>
          </div>
          <span className="font-extrabold text-2xl text-slate-800 tracking-tight">HealthAssistant</span>
        </div>

        
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
          <button
            onClick={() => { setActiveTab('dashboard'); setActiveDisease(null); }}
            className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
              activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            New Scan
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
              activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-4 h-4 mr-2" />
            Patient History
          </button>
        </div>
      </nav>

      
      <main className="w-full max-w-7xl flex-grow py-12 px-4 flex flex-col items-center">
        
        
        {activeTab === 'history' ? (
          <PatientHistory />
        ) : (
          <>
            
            {!activeDisease && (
              <div className="text-center mb-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Diagnostic Modules</h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                  Select a module below to begin analyzing patient data, X-rays, or audio samples using our advanced machine learning models.
                </p>
              </div>
            )}

            
            {activeDisease ? (
              <DiagnosticModal 
                disease={activeDisease} 
                onClose={() => setActiveDisease(null)} 
              />
            ) : (
              <DiseaseGrid onSelectDisease={setActiveDisease} />
            )}
          </>
        )}
      </main>

    </div>
  )
}

export default App
