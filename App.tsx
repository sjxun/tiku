import React, { useState } from 'react';
import { ActiveTab } from './types';
import { QuestionExtractor } from './components/QuestionExtractor';
import { AnswerProcessor } from './components/AnswerProcessor';
import { TemplateGenerator } from './components/TemplateGenerator';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.EXTRACTOR);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl tracking-tight mb-2">
          PDF 试卷题目提取器 (本地版)
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          本地智能识别试卷内容，无需联网即可提取题目与格式化答案
        </p>
      </header>

      <main className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-gray-200 bg-gray-50/50">
          <button
            onClick={() => setActiveTab(ActiveTab.EXTRACTOR)}
            className={`flex-1 min-w-[140px] py-4 px-2 sm:px-6 text-center font-medium text-sm sm:text-base transition-colors duration-200 focus:outline-none ${
              activeTab === ActiveTab.EXTRACTOR
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            功能1：提取 1-12 题
          </button>
          <button
            onClick={() => setActiveTab(ActiveTab.ANSWERS)}
            className={`flex-1 min-w-[140px] py-4 px-2 sm:px-6 text-center font-medium text-sm sm:text-base transition-colors duration-200 focus:outline-none ${
              activeTab === ActiveTab.ANSWERS
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            功能2：答案处理
          </button>
          <button
            onClick={() => setActiveTab(ActiveTab.TEMPLATE_GENERATOR)}
            className={`flex-1 min-w-[140px] py-4 px-2 sm:px-6 text-center font-medium text-sm sm:text-base transition-colors duration-200 focus:outline-none ${
              activeTab === ActiveTab.TEMPLATE_GENERATOR
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            功能3：双模版生成
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8">
          <div className={`transition-opacity duration-300 ${activeTab === ActiveTab.EXTRACTOR ? 'block' : 'hidden'}`}>
            <div className={activeTab === ActiveTab.EXTRACTOR ? '' : 'hidden'}>
               <QuestionExtractor />
            </div>
          </div>
          <div className={`transition-opacity duration-300 ${activeTab === ActiveTab.ANSWERS ? 'block' : 'hidden'}`}>
            <div className={activeTab === ActiveTab.ANSWERS ? '' : 'hidden'}>
               <AnswerProcessor />
            </div>
          </div>
          <div className={`transition-opacity duration-300 ${activeTab === ActiveTab.TEMPLATE_GENERATOR ? 'block' : 'hidden'}`}>
             <div className={activeTab === ActiveTab.TEMPLATE_GENERATOR ? '' : 'hidden'}>
               <TemplateGenerator />
             </div>
          </div>
        </div>
      </main>

      <footer className="mt-10 text-center text-gray-400 text-sm">
        <p>Offline Mode - No Data Sent to Server</p>
      </footer>
    </div>
  );
};

export default App;