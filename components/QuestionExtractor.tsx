import React, { useState, useRef } from 'react';
import { extractQuestionsFromText } from '../services/geminiService';
import { StatusType, StatusState } from '../types';
import { Button } from './ui/Button';
import { StatusDisplay } from './ui/StatusDisplay';

const DEFAULT_API_KEY = "sk-ff625da5693c4fbe852f9c10deea29f8";
const DEFAULT_FORMAT = `请将1-12题按照下列格式重新整理：1.题目中代码部分要按markdown格式整理。2.删除选项中ABCD。3.题目前有情景文字的，要加上。具体格式如下：

（可能包含的情景文字）
1.下列关于数据和信息的说法，正确的是
{{ select(1) }}
- 选项1
- 选项2
- 选项3
- 选项4

2.下列关于人工智能的说法，不正确的是
{{ select(2) }}
- 选项1
- 选项2
- 选项3
- 选项4`;

export const QuestionExtractor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [apiKey, setApiKey] = useState<string>(DEFAULT_API_KEY);
  const [formatReq, setFormatReq] = useState<string>(DEFAULT_FORMAT);
  const [result, setResult] = useState<string>('');
  const [status, setStatus] = useState<StatusState>({ type: StatusType.IDLE });

  const handleExtract = async () => {
    const content = editorRef.current?.innerText.trim();
    
    if (!content) {
      alert('请手动输入或粘贴内容！');
      return;
    }
    if (!apiKey.trim()) {
      alert('请输入 DeepSeek API Key！');
      return;
    }

    setStatus({ type: StatusType.LOADING, message: '正在联网请求 DeepSeek API...' });
    setResult('');

    try {
      const extractedText = await extractQuestionsFromText(apiKey, content, formatReq);
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
          上传内容将发送至 DeepSeek 模型，整理、纠错并提取1-12题。
        </p>
      </div>

      <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="space-y-2">
            <label className="block font-semibold text-gray-700 text-sm">DeepSeek API Key:</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm"
            />
        </div>
        <div className="space-y-2">
            <label className="block font-semibold text-gray-700 text-sm">题目格式要求:</label>
            <textarea 
              value={formatReq}
              onChange={(e) => setFormatReq(e.target.value)}
              className="w-full p-2 h-32 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-xs resize-y"
            />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-semibold text-gray-700">内容输入（支持富文本粘贴）：</label>
        <div 
          ref={editorRef}
          contentEditable
          className="w-full min-h-[150px] p-4 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white outline-none overflow-y-auto max-h-[500px] font-mono whitespace-pre-wrap"
          data-placeholder="在此处粘贴试卷内容..."
        />
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={handleExtract} 
          isLoading={status.type === StatusType.LOADING}
        >
          提取 1-12 题 (联网)
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