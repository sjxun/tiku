// This service now runs entirely locally using JavaScript logic instead of calling an API.

export const extractQuestionsFromText = async (content: string): Promise<string> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // 1. Basic cleanup
    let cleanContent = content.trim();

    // 2. Try to find the start of Question 1 and end of Question 12
    // Regex heuristics: Look for "1." or "1、" or "(1)" at the start of a line
    // Look for "13." or "13、" to end.
    
    // Note: This is a heuristic parser. Without AI, it relies on standard formatting.
    const startRegex = /(?:^|\n)\s*1[.,、]([\s\S]*)/;
    const endRegex = /(?:^|\n)\s*13[.,、]/;

    const startMatch = cleanContent.match(startRegex);
    
    let extracted = cleanContent;
    
    if (startMatch) {
       extracted = "1." + startMatch[1];
       // Cut off at 13
       const endMatch = extracted.match(endRegex);
       if (endMatch) {
           extracted = extracted.substring(0, endMatch.index);
       }
    }

    return extracted.trim();
  } catch (error) {
    console.error("Error extracting questions:", error);
    return content; // Fallback to original
  }
};

export const processAnswersText = async (answers: string, format: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Basic implementation for standard answer string "ABCDE..."
    // Maps each character to a question number 1..N
    
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
  // Ignoring big question numbers like "13" at the start
  const questionStartRegex = /^(?:\d+)?\s*\((\d+)\)(.*)/;

  let currentQuestion = { id: '', text: '' };
  
  // Helper function to process a complete question block
  const processQuestionBlock = (id: string, text: string) => {
    let t1Line = `(${id})`;
    
    // Unicode range for circle numbers ① to ⑳ is \u2460-\u2473
    // We also want to capture the content following the circle number
    let hasCircles = text.match(/[①-⑳]/);

    if (hasCircles) {
        // Split text by circle numbers, capturing the delimiter
        // Example: "Text ① content1 ② content2" -> ["Text ", "①", " content1 ", "②", " content2"]
        let parts = text.split(/([①-⑳])/);
        
        // Iterate through parts
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].match(/[①-⑳]/)) {
                const marker = parts[i];
                // The content is the next part. 
                // We need to be careful: the split might leave empty strings if circles are adjacent (unlikely)
                // We grab everything until the next marker (which is handled by the split logic naturally)
                let content = parts[i+1] || "";
                
                // Advance loop since we consumed the content
                i++; 
                
                // --- Logic for Open Questions ---
                // Count Chinese characters
                const chineseCount = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
                
                if (chineseCount >= 6) {
                    t1Line += `${marker}不做`;
                    // Do not increment globalCounter, do not add to Template 2
                } else {
                    t1Line += `${marker}{{ input(${globalCounter}) }}`;
                    
                    // --- Logic for Template 2 ---
                    // Extract score: (2 分) or (1 分)
                    const scoreMatch = content.match(/\((\d+)\s*分\)/);
                    const score = scoreMatch ? parseInt(scoreMatch[1]) : 2; // Default to 2 if not found, based on context
                    
                    // Clean content: remove score and trim
                    const cleanContent = content.replace(/\(\d+\s*分\)/, '').trim();
                    const key = globalCounter.toString();
                    
                    let ansEntry: any = {};
                    
                    // Logic: "或" means multiple valid answers
                    if (cleanContent.includes('或')) {
                        const options = cleanContent.split('或').map(s => s.trim());
                        options.forEach(opt => {
                            if(opt) ansEntry[opt] = score;
                        });
                    } 
                    // Logic: Multi-select "BD" (heuristic: Uppercase only, len > 1, len < 5)
                    else if (/^[A-Z]+$/.test(cleanContent) && cleanContent.length > 1 && cleanContent.length < 5) {
                        // Add full combination
                        ansEntry[cleanContent] = score;
                        // Add individual letters as partial score (1 point per letter logic from prompt)
                        for (let char of cleanContent) {
                            ansEntry[char] = 1; 
                        }
                    } else {
                        // Single answer
                        if(cleanContent) ansEntry[cleanContent] = score;
                    }
                    
                    template2Obj.answers[key] = ansEntry;
                    globalCounter++;
                }
            }
        }
    } else {
        // No circle numbers, treat the whole text as one input
        const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        if (chineseCount >= 6) {
            t1Line += `不做`;
        } else {
            t1Line += `{{ input(${globalCounter}) }}`;
            
            // T2 Logic
            const scoreMatch = text.match(/\((\d+)\s*分\)/);
            const score = scoreMatch ? parseInt(scoreMatch[1]) : 1; // Default 1 for single letters usually
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
            
            template2Obj.answers[key] = ansEntry;
            globalCounter++;
        }
    }
    
    template1Lines.push(t1Line);
  };

  // 3. Parse loop
  for (let line of lines) {
    const match = line.match(questionStartRegex);
    if (match) {
        // If we were processing a question, finish it
        if (currentQuestion.id) {
            processQuestionBlock(currentQuestion.id, currentQuestion.text);
        }
        // Start new question
        currentQuestion = { id: match[1], text: match[2] };
    } else {
        // Continuation of previous line (e.g. content wrapped)
        if (currentQuestion.id) {
            currentQuestion.text += " " + line;
        }
    }
  }
  // Process the very last question
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
    template1: template1Lines.join('\n\n'), // Empty line between sections
    template2: yaml
  };
};