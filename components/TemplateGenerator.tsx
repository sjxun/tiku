import React, { useState } from 'react';
import { generateDualTemplates } from '../services/geminiService';
import { StatusType, StatusState } from '../types';
import { Button } from './ui/Button';
import { StatusDisplay } from './ui/StatusDisplay';

export const TemplateGenerator: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [template1, setTemplate1] = useState<string>('');
  const [template2, setTemplate2] = useState<string>('');
  const [status, setStatus] = useState<StatusState>({ type: StatusType.IDLE });

  const handleGenerate = async () => {
    if (!input.trim()) {
      alert('请输入答案内容！');
      return;
    }

    setStatus({ type: StatusType.LOADING, message: '正在分析答案并生成双模版...' });
    setTemplate1('');
    setTemplate2('');

    try {
      const result = await generateDualTemplates(input);
      setTemplate1(result.template1);
      setTemplate2(result.template2);
      setStatus({ type: StatusType.SUCCESS, message: '模版生成完成！' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setStatus({ type: StatusType.ERROR, message: errorMessage });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => alert(`${label} 已复制到剪贴板！`))
      .catch(() => alert('复制失败，请手动选择复制。'));
  };

  const EXAMPLE_INPUT = `13（1） ① range(1,3) 或 range(1,len(c)) 或 [1,2] （2 分）
② st=c[v-1] 或 st=100+70*(v-1) （2 分）
③ i<c[v] and flag[i]!=0 或 i<c[v] and flag[i]>0 或 i<c[2] and flag[i]>0
或 i<len(flag) and flag[i]>0 （2 分）
（2）C （1 分）`;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-1">功能说明</h3>
        <p className="text-sm text-blue-700">
          输入题目答案，系统将自动生成两种格式：
          <br/>1. 填空题模版（支持圈号 ①②③ 自动识别）
          <br/>2. 判分YAML模版（智能处理多选、或选逻辑）
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="templateInput" className="block font-semibold text-gray-700">答案输入：</label>
          <button 
            onClick={() => setInput(EXAMPLE_INPUT)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            填入示例数据
          </button>
        </div>
        <textarea 
          id="templateInput"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`请输入答案，例如：\n13（1） ① range(1,3)...\n（2）C (1 分)...`}
          className="w-full p-3 h-40 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm resize-y"
        />
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={handleGenerate} 
          isLoading={status.type === StatusType.LOADING}
        >
          生成双模版
        </Button>
      </div>

      <StatusDisplay status={status} />

      {(template1 || template2) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Template 1 Result */}
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-800">模版一 (填空格式)</h3>
              <Button 
                variant="success" 
                onClick={() => copyToClipboard(template1, '模版一')}
                disabled={!template1}
                className="py-1 px-3 text-xs"
              >
                复制
              </Button>
            </div>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 font-mono text-sm whitespace-pre-wrap shadow-inner text-gray-800 flex-grow h-64 overflow-y-auto">
              {template1}
            </div>
          </div>

          {/* Template 2 Result */}
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-800">模版二 (YAML格式)</h3>
              <Button 
                variant="success" 
                onClick={() => copyToClipboard(template2, '模版二')}
                disabled={!template2}
                className="py-1 px-3 text-xs"
              >
                复制
              </Button>
            </div>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 font-mono text-sm whitespace-pre-wrap shadow-inner text-gray-800 flex-grow h-64 overflow-y-auto">
              {template2}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};