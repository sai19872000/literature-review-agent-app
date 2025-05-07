// Test Claude formatting step independently
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY environment variable");
  process.exit(1);
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Sample data for testing
const originalQuery = "research organoids in cancer modeling";
const perplexityContent = `Organoids have emerged as a promising tool in cancer modeling, offering several advantages over traditional models. Here's a detailed overview of their applications, advantages, limitations, and comparisons with traditional cancer models, including their potential in personalized medicine, genetic manipulation, high-throughput screening, and clinical translation.

### Applications in Cancer Modeling

1. **Tumor Microenvironment Simulation**:
   - Organoids can accurately mimic the physiological tumor microenvironment, including cell-cell interactions and extracellular matrix components.
   - This allows for more realistic modeling of cancer progression and metastasis.

2. **Patient-Derived Organoids (PDOs)**:
   - PDOs are developed from patient tumor samples, preserving the genetic and phenotypic characteristics of the original tumor.
   - They enable personalized cancer modeling and drug testing.

3. **Drug Screening and Therapeutic Development**:
   - Organoids serve as effective platforms for screening potential anti-cancer drugs.
   - They can predict patient-specific drug responses more accurately than traditional cell line models.

### Advantages Over Traditional Cancer Models

1. **Preservation of Tumor Heterogeneity**:
   - Organoids maintain the cellular heterogeneity of the original tumor, unlike conventional 2D cell cultures.
   - This heterogeneity is crucial for understanding cancer progression and treatment resistance.

2. **Three-Dimensional Structure**:
   - The 3D architecture of organoids better recapitulates in vivo tumor conditions compared to 2D monolayer cultures.
   - This structural organization influences drug penetration, cellular differentiation, and gene expression patterns.

3. **Long-Term Culture Viability**:
   - Organoids can be maintained in culture for extended periods, allowing for longitudinal studies of cancer evolution and drug resistance development.`;

const perplexityCitations = [
  "https://pmc.ncbi.nlm.nih.gov/articles/PMC10413981/",
  "https://pmc.ncbi.nlm.nih.gov/articles/PMC10491878/",
  "https://pmc.ncbi.nlm.nih.gov/articles/PMC11842244/",
  "https://pubmed.ncbi.nlm.nih.gov/38977414/",
  "https://pmc.ncbi.nlm.nih.gov/articles/PMC8968694/"
];

async function testClaudeFormatting() {
  console.log('Testing Claude Content Structuring...');
  
  try {
    // Prepare citation information for Claude
    const citationsText = perplexityCitations.map((citation, index) => 
      `[${index + 1}] ${citation}`
    ).join('\n');
    
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 3500,
      temperature: 0.2,
      system: `You are an expert academic editor that structures research content into proper academic format.
      Your task is to take raw research content and organize it into a well-structured paper introduction with:
      1. A clear, informative title related to the research topic
      2. Well-organized paragraphs with logical flow
      3. Proper integration of citations using the format [n] where n is the citation number
      4. Academic tone and language
      
      Structure the output as a cohesive paper introduction that explains the topic thoroughly.
      Use the citations provided by properly referencing them as [1], [2], etc. at appropriate places.
      Do not add any citations that are not in the provided list.
      Format the content cleanly with proper paragraphs and spacing.`,
      messages: [
        { 
          role: "user", 
          content: `Please structure the following research content into a proper academic paper introduction.
          
Original topic: "${originalQuery}"

CONTENT FROM RESEARCH:
${perplexityContent}

AVAILABLE CITATIONS:
${citationsText}

Please format this as a professional academic paper introduction with proper citation integration.` 
        }
      ],
    });
    
    // Parse Claude's response
    let fullText = "";
    if (response.content[0].type === 'text') {
      fullText = response.content[0].text.trim();
    } else {
      fullText = String(response.content[0]).trim();
    }
    
    // Extract title and content
    const titleMatch = fullText.match(/^#\s+(.+?)(?:\n|$)/m);
    const title = titleMatch ? titleMatch[1].trim() : "Research on " + originalQuery;
    
    // Remove the title from the content if it exists
    let content = titleMatch ? fullText.replace(titleMatch[0], '').trim() : fullText;
    
    console.log('\nStructured Output:');
    console.log(`Title: ${title}`);
    console.log('\nContent (first 500 chars):');
    console.log(content.substring(0, 500) + '...');
    console.log('\nFull content length:', content.length, 'characters');
    
    // Save the result to a file
    const result = {
      title,
      content,
      citationsCount: perplexityCitations.length,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(__dirname, '../claude-formatting-result.json'), 
      JSON.stringify(result, null, 2)
    );
    
    console.log('\nResults saved to claude-formatting-result.json');
    
  } catch (error) {
    console.error('Error in Claude structuring:', error);
  }
}

// Run the test
testClaudeFormatting();