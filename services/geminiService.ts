// Service for processing exam data.
// Feature 1: Online (DeepSeek API)
// Feature 2 & 3: Offline (Local JS Logic)

export const extractQuestionsFromText = async (apiKey: string, content: string, formatReq: string): Promise<string> => {
  if (!apiKey) throw new Error("请输入 DeepSeek API Key");
  if (!content) throw new Error("请输入内容");

  const SYSTEM_PROMPT = `你是一个智能试卷处理助手，能够从试卷中提取题目并处理答案。你需要：
1. 根据用户提供的内容和格式要求，提取指定范围的题目
2. 如果用户提供了答案，根据答案格式要求处理并输出结果
3. 严格按照用户要求的格式输出，不要添加任何额外内容
4. 确保输出的内容准确无误，符合用户的预期`;

  const userPrompt = `${content}\n\n${formatReq}`;

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            stream: false
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API 请求失败: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
    } else {
        throw new Error("API 返回内容为空");
    }

  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const processAnswersText = async (answers: string, format: string): Promise<string> => {
  // Local processing
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    // Remove spaces
    const cleanAnswers = answers.replace(/\s+/g, '');
    let yamlOutput = "type: objective\nanswers:\n";
    
    // Check if input is just letters (e.g. "ABCD...")
    if (/^[A-Za-z]+$/.test(cleanAnswers)) {
        for (let i = 0; i < cleanAnswers.length; i++) {
            const char = cleanAnswers[i].toUpperCase();
            yamlOutput += `  '${i + 1}':\n`;
            yamlOutput += `  - ${char}\n`;
            yamlOutput += `  - 2\n`;
        }
        return yamlOutput;
    } 
    
    return "无法自动处理复杂格式。本地模式仅支持连续字母输入（如：ABCD...）。\n\n如果需要复杂处理，请检查输入格式。";

  } catch (error) {
    console.error("Error processing answers:", error);
    return "处理失败";
  }
};

export const generateDualTemplates = async (content: string): Promise<{ template1: string, template2: string }> => {
  // Local processing
  await new Promise(resolve => setTimeout(resolve, 300));

  let template1Lines: string[] = [];
  let template2Obj: any = { type: 'objective', answers: {} };
  let globalCounter = 1;

  // 1. Normalize input: Convert full-width brackets to half-width
  const normalized = content
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/：/g, ':');

  // 2. Split by lines for processing
  const lines = normalized.split('\n').filter(l => l.trim());

  // Regex to identify Question start: e.g., (1), (2)
  const questionStartRegex = /^(?:\d+)?\s*\((\d+)\)(.*)/;

  let currentQuestion = { id: '', text: '' };
  
  // Helper function to process a complete question block
  const processQuestionBlock = (id: string, text: string) => {
    let t1Line = `(${id})`;
    
    let hasCircles = text.match(/[①-⑳]/);

    if (hasCircles) {
        // Split text by circle numbers
        let parts = text.split(/([①-⑳])/);
        
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].match(/[①-⑳]/)) {
                const marker = parts[i];
                let content = parts[i+1] || "";
                i++; 
                
                // --- Logic for Open Questions ---
                const chineseCount = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
                
                if (chineseCount >= 10) {
                    t1Line += `${marker}不做`;
                } else {
                    t1Line += `${marker}{{ input(${globalCounter}) }}`;
                    
                    // --- Logic for Template 2 ---
                    const scoreMatch = content.match(/\((\d+)\s*分\)/);
                    const score = scoreMatch ? parseInt(scoreMatch[1]) : 2;
                    
                    const cleanContent = content.replace(/\(\d+\s*分\)/, '').trim();
                    const key = globalCounter.toString();
                    
                    let ansEntry: any = {};
                    
                    if (cleanContent.includes('或')) {
                        const options = cleanContent.split('或').map(s => s.trim());
                        options.forEach(opt => {
                            if(opt) ansEntry[opt] = score;
                        });
                    } 
                    else if (/^[A-Z]+$/.test(cleanContent) && cleanContent.length > 1 && cleanContent.length < 5) {
                        ansEntry[cleanContent] = score;
                        for (let char of cleanContent) {
                            ansEntry[char] = 1; 
                        }
                    } else {
                        if(cleanContent) ansEntry[cleanContent] = score;
                    }
                    
                    if (Object.keys(ansEntry).length > 0) {
                       template2Obj.answers[key] = ansEntry;
                    }
                    globalCounter++;
                }
            }
        }
    } else {
        const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        if (chineseCount >= 10) {
            t1Line += `不做`;
        } else {
            t1Line += `{{ input(${globalCounter}) }}`;
            
            const scoreMatch = text.match(/\((\d+)\s*分\)/);
            const score = scoreMatch ? parseInt(scoreMatch[1]) : 1;
            const cleanContent = text.replace(/\(\d+\s*分\)/, '').trim();
            const key = globalCounter.toString();
            
            let ansEntry: any = {};
            if (cleanContent.includes('或')) {
                cleanContent.split('或').forEach(opt => {
                    if(opt.trim()) ansEntry[opt.trim()] = score;
                });
            } else if (/^[A-Z]+$/.test(cleanContent) && cleanContent.length > 1 && cleanContent.length < 5) {
                ansEntry[cleanContent] = score;
                for (let char of cleanContent) {
                    ansEntry[char] = 1; 
                }
            } else {
                if(cleanContent) ansEntry[cleanContent] = score;
            }
            
            if (Object.keys(ansEntry).length > 0) {
                template2Obj.answers[key] = ansEntry;
            }
            globalCounter++;
        }
    }
    
    template1Lines.push(t1Line);
  };

  // 3. Parse loop
  for (let line of lines) {
    const match = line.match(questionStartRegex);
    if (match) {
        if (currentQuestion.id) {
            processQuestionBlock(currentQuestion.id, currentQuestion.text);
        }
        currentQuestion = { id: match[1], text: match[2] };
    } else {
        if (currentQuestion.id) {
            currentQuestion.text += " " + line;
        }
    }
  }
  if (currentQuestion.id) {
     processQuestionBlock(currentQuestion.id, currentQuestion.text);
  }

  // 4. Generate YAML String
  let yaml = "type: objective\nanswers:\n";
  for (let key in template2Obj.answers) {
      yaml += `  '${key}':\n`;
      const ans = template2Obj.answers[key];
      for (let subKey in ans) {
          yaml += `     '${subKey}': ${ans[subKey]}\n`;
      }
  }

  return {
    template1: template1Lines.join('\n\n'),
    template2: yaml
  };
};