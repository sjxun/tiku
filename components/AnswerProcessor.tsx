import React, { useState } from 'react';
import { processAnswersText } from '../services/geminiService';
import { StatusType, StatusState } from '../types';
import { Button } from './ui/Button';
import { StatusDisplay } from './ui/StatusDisplay';

const DEFAULT_FORMAT = `(离线模式下，仅支持连续字母输入，如：ABCD...)`;

export const AnswerProcessor: React.FC = () => {
  const [answers, setAnswers] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [status, setStatus] = useState<StatusState>({ type: StatusType.IDLE });

  const handleProcess = async () => {
    if (!answers.trim()) {
      alert('请输入答案内容！');
      return;
    }

    setStatus({ type: StatusType.LOADING, message: '正在本地处理答案...' });
    setResult('');

    try {
      const processedText = await processAnswersText(answers, '');
      setResult(processedText);
      setStatus({ type: StatusType.SUCCESS, message: '答案处理完成！' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setStatus({ type: StatusType.ERROR, message: errorMessage });
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result)
      .then(() => alert('答案已复制到剪贴板！'))
      .catch(() => alert('复制失败，请手动选择复制。'));
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-1">操作说明</h3>
        <p className="text-sm text-blue-700">
          离线模式：请输入连续的答案字母（如 ABCD...），系统将自动生成 YAML 格式。
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="answers" className="block font-semibold text-gray-700">答案输入：</label>
        <input 
          type="text" 
          id="answers"
          value={answers}
          onChange={(e) => setAnswers(e.target.value)}
          placeholder="例如：ABCDDDDSSDDD"
          className="w-full p-3 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
        />
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={handleProcess} 
          isLoading={status.type === StatusType.LOADING}
        >
          处理答案
        </Button>
        <Button 
          variant="success" 
          onClick={handleCopy} 
          disabled={!result || status.type === StatusType.LOADING}
        >
          复制答案
        </Button>
      </div>

      <StatusDisplay status={status} />

      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">处理结果</h3>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 font-mono text-sm whitespace-pre-wrap shadow-inner text-gray-800">
            {result}
          </div>
        </div>
      )}
    </div>
  );
};