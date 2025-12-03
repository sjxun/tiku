import React, { useState, useRef } from 'react';
import { extractQuestionsFromText } from '../services/geminiService';
import { StatusType, StatusState } from '../types';
import { Button } from './ui/Button';
import { StatusDisplay } from './ui/StatusDisplay';

export const QuestionExtractor: React.FC = () => {
  // We use a ref for the content editable div to avoid re-rendering issues on every keystroke
  const editorRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<string>('');
  const [status, setStatus] = useState<StatusState>({ type: StatusType.IDLE });

  const handleExtract = async () => {
    const content = editorRef.current?.innerText.trim();
    
    if (!content) {
      alert('请手动输入或粘贴内容！');
      return;
    }

    setStatus({ type: StatusType.LOADING, message: '正在本地分析文本并提取题目...' });
    setResult('');

    try {
      const extractedText = await extractQuestionsFromText(content);
      setResult(extractedText);
      setStatus({ type: StatusType.SUCCESS, message: '提取完成！' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setStatus({ type: StatusType.ERROR, message: errorMessage });
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result)
      .then(() => alert('题目已复制到剪贴板！'))
      .catch(() => alert('复制失败，请手动选择复制。'));
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-1">操作说明</h3>
        <p className="text-sm text-blue-700">
          请在下方粘贴试卷内容。系统将在本地整理并尝试提取前1-12题。(离线模式仅支持标准格式提取)
        </p>
      </div>

      <div className="space-y-2">
        <label className="block font-semibold text-gray-700">内容输入（支持富文本粘贴）：</label>
        <div 
          ref={editorRef}
          contentEditable
          className="w-full min-h-[250px] p-4 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white outline-none overflow-y-auto max-h-[500px] font-mono whitespace-pre-wrap"
          data-placeholder="在此处粘贴试卷内容..."
        />
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={handleExtract} 
          isLoading={status.type === StatusType.LOADING}
        >
          提取 1-12 题
        </Button>
        <Button 
          variant="success" 
          onClick={handleCopy} 
          disabled={!result || status.type === StatusType.LOADING}
        >
          复制题目
        </Button>
      </div>

      <StatusDisplay status={status} />

      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">提取结果</h3>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 font-mono text-sm whitespace-pre-wrap max-h-[500px] overflow-y-auto shadow-inner text-gray-800">
            {result}
          </div>
        </div>
      )}
    </div>
  );
};