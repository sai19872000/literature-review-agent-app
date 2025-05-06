// Since PDF.js doesn't work well in Node.js environments without polyfills,
// let's use a simpler approach for our demo:
// Note: In a production app, we would integrate a proper Node.js PDF parser
// like pdf-parse, but we're keeping this simple for the demo.

// Mock the PDF extraction functionality
const mockText = `
# Literature Review on Climate Change Impact

## Introduction
Climate change represents one of the most significant challenges of our time, with wide-ranging impacts on natural ecosystems, human societies, and global economies. This literature review examines recent research on climate change impacts, adaptation strategies, and mitigation efforts.

## Impacts on Ecosystems
Recent studies have demonstrated that climate change is causing significant disruptions to terrestrial and marine ecosystems worldwide. Smith et al. (2021) observed that rising temperatures are altering species distributions, with many organisms shifting their ranges poleward or to higher elevations. Marine ecosystems face particular challenges, with ocean acidification threatening coral reefs and other calcifying organisms (Johnson & Lee, 2022).

## Economic Implications
The economic costs of climate change are substantial and growing. According to Zhang (2023), global GDP could decrease by up to 14% by 2050 if significant action is not taken. Infrastructure damage from extreme weather events represents one of the largest direct costs, with annual losses estimated at $300 billion worldwide (Garcia et al., 2021).

## Adaptation Strategies
Communities worldwide are implementing various adaptation strategies. Urban areas are increasingly adopting green infrastructure to mitigate heat island effects and manage stormwater runoff (Williams, 2022). In agricultural regions, farmers are shifting to drought-resistant crops and implementing water conservation practices (Anderson & Smith, 2023).

## References
Anderson, J., & Smith, T. (2023). Agricultural adaptation to climate change. Journal of Sustainable Agriculture, 45(2), 118-132.
Garcia, M., Lopez, J., & Chen, H. (2021). Infrastructure resilience in the face of climate change. Climate Risk Management, 12, 43-58.
Johnson, R., & Lee, S. (2022). Ocean acidification impacts on marine ecosystems. Marine Ecology Progress Series, 578, 1-15.
Smith, A., Brown, B., & Jones, C. (2021). Shifting species distributions under climate change. Ecology Letters, 24(3), 452-465.
Williams, P. (2022). Green infrastructure in urban climate adaptation. Urban Planning Review, 18(1), 76-89.
Zhang, L. (2023). Economic impacts of climate change: A global analysis. Journal of Environmental Economics, 36(4), 289-304.
`;

/**
 * Extract text content from a PDF file buffer
 * 
 * @param pdfBuffer The PDF file as a buffer
 * @returns The extracted text content as a string
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // For demo purposes, return the mock text
    // In a real application, we would actually parse the PDF here
    console.log("PDF received with size:", pdfBuffer.length, "bytes");
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}
