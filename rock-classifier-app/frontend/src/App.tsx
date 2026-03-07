import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Navigation, Page } from './components/Navigation'
import { UploadZone } from './components/UploadZone'
import { ClassificationResult } from './components/ClassificationResult'
import { LoadingSpinner } from './components/LoadingSpinner'
import { RockCatalog } from './components/RockCatalog'
import { AboutPage } from './components/AboutPage'
import { classifyRock } from './api/client'
import { ClassificationResult as IClassificationResult } from './types'
import './styles/globals.css'

function App() {
  const [page, setPage] = useState<Page>('classifier')
  const [image, setImage] = useState<File | null>(null)
  const [result, setResult] = useState<IClassificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageSelected = (file: File) => {
    setImage(file)
    setError(null)
    setResult(null)
  }

  const handleClassify = async () => {
    if (!image) return
    setLoading(true)
    setError(null)
    try {
      const classificationResult = await classifyRock(image)
      setResult(classificationResult)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Classification failed. Check that the backend is running.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={page} onPageChange={setPage} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {/* ============== CLASSIFIER PAGE ============== */}
          {page === 'classifier' && (
            <motion.div
              key="classifier"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* Hero */}
              <div className="text-center mb-10">
                <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-3">
                  Rock Identifier
                </h1>
                <p className="text-lg text-gray-500 max-w-xl mx-auto">
                  Upload a photo and our AI will classify it among our catalog of <span className="font-semibold text-gray-700">25 rock types</span> in seconds.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left: Upload */}
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <UploadZone onImageSelected={handleImageSelected} isLoading={loading} />

                    {image && (
                      <button
                        onClick={handleClassify}
                        disabled={loading}
                        className={`w-full mt-5 py-3.5 rounded-xl font-bold text-base transition-all duration-300 shadow-md hover:shadow-lg ${
                          loading
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white'
                        }`}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            Classifying...
                          </span>
                        ) : 'Classify Rock'}
                      </button>
                    )}
                  </div>

                  {/* Quick Stats - only show when no result */}
                  {!result && !loading && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                        <p className="text-2xl font-black text-amber-600">25</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Rock Types</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                        <p className="text-2xl font-black text-amber-600">&lt;2s</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Response</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                        <p className="text-2xl font-black text-amber-600">Top 5</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Matches</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Results / Loading / Info */}
                <div className="lg:col-span-3">
                  {loading && (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                      <LoadingSpinner />
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-red-800 text-sm">Classification Error</p>
                        <p className="text-red-700 text-sm mt-0.5">{error}</p>
                      </div>
                    </div>
                  )}

                  {result && !loading && (
                    <ClassificationResult result={result} />
                  )}

                  {!result && !loading && !error && (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                      <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto">
                          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.414-1.414a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Classify</h3>
                          <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                            Upload a rock photo to get started. You'll receive a detailed classification with geological information.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-md mx-auto">
                          {[
                            { icon: '🎯', text: 'Classification with confidence percentage' },
                            { icon: '🪨', text: 'Geological type and formation info' },
                            { icon: '🔬', text: 'Mineral composition details' },
                            { icon: '📊', text: 'Top 5 alternative matches' },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                              <span className="text-base">{item.icon}</span>
                              <span>{item.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ============== CATALOG PAGE ============== */}
          {page === 'catalog' && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <RockCatalog />
            </motion.div>
          )}

          {/* ============== ABOUT PAGE ============== */}
          {page === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <AboutPage onGoToClassifier={() => setPage('classifier')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span>RockClassifier.ai — Powered by ResNet50 + PyTorch</span>
          <span>React + FastAPI + Deep Learning</span>
        </div>
      </footer>
    </div>
  )
}

export default App
